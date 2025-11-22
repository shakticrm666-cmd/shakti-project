import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { CustomerCase } from './types';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CustomerCase | null;
  onSave: (status: string) => void;
}

const statusOptions = [
  { value: 'new', label: 'New', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'yellow' },
  { value: 'follow_up', label: 'Follow Up', color: 'orange' },
  { value: 'ptp', label: 'PTP', color: 'purple' },
  { value: 'settled', label: 'Settled', color: 'green' },
  { value: 'closed', label: 'Closed', color: 'gray' }
];

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({ isOpen, onClose, caseData, onSave }) => {
  const [selectedStatus, setSelectedStatus] = useState('');

  if (!isOpen || !caseData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus) {
      onSave(selectedStatus);
      setSelectedStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-white mr-3" />
            <div>
              <h3 className="text-xl font-bold text-white">Update Case Status</h3>
              <p className="text-sm text-blue-100">{caseData.customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Current Status: <span className="font-semibold text-gray-900">{caseData.caseStatus || 'Not Set'}</span>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Status
            </label>
            <div className="space-y-2">
              {statusOptions.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedStatus === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3 flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-gray-900">{option.label}</span>
                    {selectedStatus === option.value && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedStatus}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
