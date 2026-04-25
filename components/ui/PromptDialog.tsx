import React, { useState } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { Modal } from './Modal';

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  placeholder = '',
  confirmLabel = 'Ya', 
  cancelLabel = 'Batal',
  isDanger = false
}) => {
  const [inputValue, setInputValue] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center">
        <div className={`p-4 rounded-full mb-6 ${isDanger ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
          <AlertCircle size={40} />
        </div>
        
        <p className="text-slate-600 font-medium mb-4 text-center leading-relaxed">
          {message}
        </p>

        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-8 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          autoFocus
        />

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
          >
            <X size={18} /> {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm(inputValue);
              onClose();
              setInputValue('');
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
