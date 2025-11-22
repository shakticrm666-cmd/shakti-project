import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { Employee } from '../../../types/employee';

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmployees: Employee[];
  onConfirmDelete: () => Promise<void>;
  isDeleting?: boolean;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  onClose,
  selectedEmployees,
  onConfirmDelete,
  isDeleting = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirmDelete();
      onClose();
    } catch {
      // Error handling is done in the parent component
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Confirm Bulk Delete
          </h3>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-red-800 text-sm">
              Are you sure you want to delete <strong>{selectedEmployees.length}</strong> employee{selectedEmployees.length !== 1 ? 's' : ''}?
            </p>
            <p className="text-red-700 text-sm mt-2">
              This action cannot be undone.
            </p>
          </div>

          {selectedEmployees.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Employees to be deleted:</p>
              <div className="space-y-1">
                {selectedEmployees.map(employee => (
                  <div key={employee.id} className="text-sm text-gray-600">
                    • {employee.name} ({employee.empId})
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium inline-flex items-center"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};