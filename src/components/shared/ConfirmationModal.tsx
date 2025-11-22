import React from 'react';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
  children,
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    } else if (e.key === 'Enter' && !isLoading) {
      handleConfirm();
    }
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconBgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          buttonDisabled: 'bg-red-400',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBgColor: 'bg-orange-100',
          iconColor: 'text-orange-600',
          borderColor: 'border-orange-200',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-800',
          buttonBg: 'bg-orange-600 hover:bg-orange-700',
          buttonDisabled: 'bg-orange-400',
        };
      case 'info':
        return {
          icon: Info,
          iconBgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          buttonDisabled: 'bg-blue-400',
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBgColor: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          buttonBg: 'bg-green-600 hover:bg-green-700',
          buttonDisabled: 'bg-green-400',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-12 h-12 ${config.iconBgColor} rounded-full`}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 mb-4`}>
            <p className={`${config.textColor} text-sm leading-relaxed`}>
              {message}
            </p>
          </div>

          {children && (
            <div className="mb-4">
              {children}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 text-sm font-medium text-white ${config.buttonBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type}-500 disabled:${config.buttonDisabled} disabled:cursor-not-allowed transition-colors inline-flex items-center`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
