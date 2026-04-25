import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PromptDialog } from '../components/ui/PromptDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

interface PromptOptions extends ConfirmOptions {
  placeholder?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions>({ title: '', message: '' });
  const [promptOptions, setPromptOptions] = useState<PromptOptions>({ title: '', message: '' });
  
  const [resolveConfirm, setResolveConfirm] = useState<{ resolve: (value: boolean) => void } | null>(null);
  const [resolvePrompt, setResolvePrompt] = useState<{ resolve: (value: string | null) => void } | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    setConfirmOptions(options);
    setConfirmOpen(true);
    return new Promise((resolve) => {
      setResolveConfirm({ resolve });
    });
  };

  const prompt = (options: PromptOptions): Promise<string | null> => {
    setPromptOptions(options);
    setPromptOpen(true);
    return new Promise((resolve) => {
      setResolvePrompt({ resolve });
    });
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    if (resolveConfirm) {
      resolveConfirm.resolve(false);
      setResolveConfirm(null);
    }
  };

  const handleConfirmAction = () => {
    setConfirmOpen(false);
    if (resolveConfirm) {
      resolveConfirm.resolve(true);
      setResolveConfirm(null);
    }
  };

  const handlePromptClose = () => {
    setPromptOpen(false);
    if (resolvePrompt) {
      resolvePrompt.resolve(null);
      setResolvePrompt(null);
    }
  };

  const handlePromptAction = (value: string) => {
    setPromptOpen(false);
    if (resolvePrompt) {
      resolvePrompt.resolve(value);
      setResolvePrompt(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmAction}
        title={confirmOptions.title}
        message={confirmOptions.message}
        confirmLabel={confirmOptions.confirmLabel}
        cancelLabel={confirmOptions.cancelLabel}
        isDanger={confirmOptions.isDanger}
      />
      <PromptDialog
        isOpen={promptOpen}
        onClose={handlePromptClose}
        onConfirm={handlePromptAction}
        title={promptOptions.title}
        message={promptOptions.message}
        placeholder={promptOptions.placeholder}
        confirmLabel={promptOptions.confirmLabel}
        cancelLabel={promptOptions.cancelLabel}
        isDanger={promptOptions.isDanger}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

export const usePrompt = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('usePrompt must be used within a ConfirmProvider');
  }
  return context.prompt;
};
