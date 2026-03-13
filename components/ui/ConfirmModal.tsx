import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'warning'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertCircle className="text-rose-600" size={32} />;
      case 'warning': return <AlertCircle className="text-amber-600" size={32} />;
      default: return <HelpCircle className="text-indigo-600" size={32} />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white';
      default: return 'bg-indigo-600 hover:bg-indigo-700 text-white';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className={`p-4 rounded-full ${type === 'danger' ? 'bg-rose-50' : type === 'warning' ? 'bg-amber-50' : 'bg-indigo-50'}`}>
          {getIcon()}
        </div>
        <div className="space-y-2">
          <p className="text-slate-600 text-sm leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-3 w-full pt-4">
          <Button 
            variant="outline" 
            className="flex-1 rounded-2xl py-3" 
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button 
            className={`flex-1 rounded-2xl py-3 ${getButtonClass()}`} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
