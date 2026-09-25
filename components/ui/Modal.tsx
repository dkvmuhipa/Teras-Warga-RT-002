import React from 'react';
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
          />
          <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4 pointer-events-none`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 w-full ${maxWidth} max-h-[92vh] overflow-hidden pointer-events-auto flex flex-col`}
            >
              <div className="flex flex-col border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between px-6 py-5">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
                  <button 
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                {stickyHeader && (
                  <div className="px-6 pb-4">
                    {stickyHeader}
                  </div>
                )}
              </div>
              <div className="p-6 pb-8 overflow-y-auto custom-scrollbar">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
