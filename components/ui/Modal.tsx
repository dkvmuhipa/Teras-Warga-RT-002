import React, { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  stickyHeader?: React.ReactNode;
  zIndex?: string;
  variant?: 'auto' | 'full' | 'popup';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-md', 
  stickyHeader,
  zIndex = 'z-[200]',
  variant = 'auto'
}) => {
  // Keyboard Accessibility: Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isAdminRoute = typeof window !== 'undefined' && (
    window.location.hash.startsWith('#/admin') ||
    window.location.pathname.startsWith('/admin')
  );

  const useFullPage = variant === 'full' || (variant === 'auto' && isAdminRoute);

  return (
    <AnimatePresence>
      {isOpen && (
        useFullPage ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Detail Panel'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed inset-0 ${zIndex} bg-[#F8FAFC] flex flex-col overflow-hidden focus:outline-none`}
          >
            {/* Full-Page Sticky Top Bar */}
            <div className="bg-white border-b border-slate-200/80 shadow-2xs shrink-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <ArrowLeft size={15} />
                    <span>Kembali</span>
                  </button>
                  <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                      Lembar Kerja Penuh • Admin RT 02
                    </span>
                    <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                      {title || 'Rincian Data & Formulir'}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden md:inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-mono font-semibold border border-slate-200/60">
                    ESC
                  </span>
                  <button 
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup tampilan penuh"
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {stickyHeader && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3.5">
                  {stickyHeader}
                </div>
              )}
            </div>

            {/* Full-Page Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
              <div className="max-w-6xl mx-auto w-full bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-8">
                {children}
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs ${zIndex}`}
              onClick={onClose}
              aria-hidden="true"
            />
            <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-2 sm:p-4 pointer-events-none`}>
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 w-full ${maxWidth} max-h-[95vh] sm:max-h-[92vh] overflow-hidden pointer-events-auto flex flex-col focus:outline-none`}
              >
                <div className="flex flex-col border-b border-slate-100 shrink-0">
                  <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight truncate pr-2">{title}</h3>
                    <button 
                      onClick={onClose}
                      aria-label="Tutup modal"
                      className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {stickyHeader && (
                    <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                      {stickyHeader}
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-6 pb-6 sm:pb-8 overflow-y-auto custom-scrollbar">
                  {children}
                </div>
              </motion.div>
            </div>
          </>
        )
      )}
    </AnimatePresence>
  );
};
