import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmationModal, ConfirmationType } from '../components/shared/ConfirmationModal';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  onConfirm: () => void | Promise<void>;
  children?: React.ReactNode;
}

interface ConfirmationContextType {
  showConfirmation: (options: ConfirmationOptions) => void;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showConfirmation = useCallback((opts: ConfirmationOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const confirm = useCallback((opts: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setIsOpen(true);
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setIsOpen(false);
    setIsLoading(false);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [isLoading, resolvePromise]);

  const handleConfirm = useCallback(async () => {
    if (!options) return;

    try {
      setIsLoading(true);
      await options.onConfirm();
      setIsOpen(false);
      if (resolvePromise) {
        resolvePromise(true);
        setResolvePromise(null);
      }
    } catch (error: unknown) {
      console.error('Confirmation action failed:', error);
      if (resolvePromise) {
        resolvePromise(false);
        setResolvePromise(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [options, resolvePromise]);

  return (
    <ConfirmationContext.Provider value={{ showConfirmation, confirm }}>
      {children}
      {options && (
        <ConfirmationModal
          isOpen={isOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={options.title}
          message={options.message}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          type={options.type}
          isLoading={isLoading}
        >
          {options.children}
        </ConfirmationModal>
      )}
    </ConfirmationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};
