import React, { useState } from 'react';
import { X, Phone, Clock, Calendar, MessageSquare } from 'lucide-react';
import { CustomerCase } from './types';
import { callStatusOptions } from './utils';

interface CallLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CustomerCase | null;
  onSave: (logData: CallLogData) => void;
}

export interface CallLogData {
  callStatus: string;
  contactedPerson: string;
  callDuration: string;
  remarks: string;
  ptpDate?: string;
  ptpAmount?: string;
}

export const CallLogModal: React.FC<CallLogModalProps> = ({ isOpen, onClose, caseData, onSave }) => {
  const [formData, setFormData] = useState<CallLogData>({
    callStatus: '',
    contactedPerson: '',
    callDuration: '',
    remarks: '',
    ptpDate: '',
    ptpAmount: ''
  });

  if (!isOpen || !caseData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      callStatus: '',
      contactedPerson: '',
      callDuration: '',
      remarks: '',
      ptpDate: '',
      ptpAmount: ''
    });
  };

  const showPTPFields = formData.callStatus === 'PTP' || formData.callStatus === 'FUTURE_PTP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Phone className="w-6 h-6 text-white mr-3" />
            <div>
              <h3 className="text-xl font-bold text-white">Log Call</h3>
              <p className="text-sm text-green-100">{caseData.customerName} - {caseData.loanId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call Status <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.callStatus}
                onChange={(e) => setFormData({ ...formData, callStatus: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Status</option>
                {callStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacted Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactedPerson}
                  onChange={(e) => setFormData({ ...formData, contactedPerson: e.target.value })}
                  placeholder="e.g., Self, Spouse, Relative"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Call Duration (seconds)
                </label>
                <input
                  type="number"
                  value={formData.callDuration}
                  onChange={(e) => setFormData({ ...formData, callDuration: e.target.value })}
                  placeholder="e.g., 120"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {showPTPFields && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold text-blue-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Promise to Pay (PTP) Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PTP Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required={showPTPFields}
                      value={formData.ptpDate}
                      onChange={(e) => setFormData({ ...formData, ptpDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PTP Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required={showPTPFields}
                      value={formData.ptpAmount}
                      onChange={(e) => setFormData({ ...formData, ptpAmount: e.target.value })}
                      placeholder="Amount in ₹"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MessageSquare className="w-4 h-4 mr-1" />
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={4}
                placeholder="Enter call details, customer response, and any important notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Call Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
