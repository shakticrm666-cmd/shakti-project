import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Modal } from '../../shared/Modal';

interface ClearAllDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ClearAllDataModal: React.FC<ClearAllDataModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clear All Column Data"
      size="md"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Warning Message */}
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  This action cannot be undone
                </h4>
                <p className="text-sm text-red-700">
                  This will permanently delete ALL column configurations for your tenant, including:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                  <li>All products and their column configurations</li>
                  <li>All custom columns you've created</li>
                  <li>All column settings and preferences</li>
                  <li>All saved column configurations</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-4">
            <strong>Are you sure you want to proceed?</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Clear All Data
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};