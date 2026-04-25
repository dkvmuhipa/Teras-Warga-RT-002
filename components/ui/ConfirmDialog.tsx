import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Ya', 
  cancelLabel = 'Batal',
  isDanger = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className={`p-4 rounded-full mb-6 ${isDanger ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
          <AlertCircle size={40} />
        </div>
        
        <p className="text-slate-600 font-medium mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
          >
            <X size={18} /> {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-6 py-4 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
              isDanger 
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            <Check size={18} /> {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
