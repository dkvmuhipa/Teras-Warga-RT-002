import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  stickyHeader?: React.ReactNode;
  zIndex?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-md', 
  stickyHeader,
  zIndex = 'z-[200]'
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

  return (
    <AnimatePresence>
      {isOpen && (
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
                  <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight truncate pr-2">{title}</h3>
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
      )}
    </AnimatePresence>
  );
};
