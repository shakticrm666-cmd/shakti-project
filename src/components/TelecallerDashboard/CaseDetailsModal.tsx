import React from 'react';
import { X, User, Phone, MapPin, Calendar, DollarSign, FileText, CheckCircle, MessageSquare } from 'lucide-react';
import { CustomerCase } from './types';
import { customerCaseService } from '../../services/customerCaseService';

interface CaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CustomerCase | null;
}

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({ isOpen, onClose, caseData }) => {
  const [showLogCallModal, setShowLogCallModal] = React.useState(false);
  const [selectedCallStatus, setSelectedCallStatus] = React.useState('');

  const handleStatusUpdate = () => {
    setShowLogCallModal(true);
  };

  // Helper function to get value from either direct property or case_data/custom_fields
  const getValue = (field: string) => {
    if (!caseData) return '';

    const data = caseData as unknown as Record<string, unknown>;

    // Convert camelCase to snake_case for database field lookup
    const snakeCaseField = field.replace(/([A-Z])/g, '_$1').toLowerCase();

    // First check direct properties (for database fields like last_paid_date, sanction_date, etc.)
    const directValue = data[field];
    if (directValue !== undefined && directValue !== null && directValue !== '') return directValue;

    // Check direct property (snake_case)
    const snakeDirectValue = data[snakeCaseField];
    if (snakeDirectValue !== undefined && snakeDirectValue !== null && snakeDirectValue !== '') return snakeDirectValue;

    // Then check case_data if it exists (this is where Excel upload data is stored)
    const nestedCaseData = data.case_data as Record<string, unknown> | undefined;
    const caseDataField = nestedCaseData?.[field] || nestedCaseData?.[snakeCaseField];
    if (caseDataField !== undefined && caseDataField !== null && caseDataField !== '') return caseDataField;

    // Finally check custom_fields if it exists
    const nestedCustomFields = data.custom_fields as Record<string, unknown> | undefined;
    const customField = nestedCustomFields?.[field] || nestedCustomFields?.[snakeCaseField];
    if (customField !== undefined && customField !== null && customField !== '') return customField;

    return '';
  };

  const handlePaymentReceived = async () => {
    if (!caseData) return;

    try {
      // Update case status to 'closed' or 'paid'
      await customerCaseService.updateCase(caseData.id, {
        case_status: 'closed',
        status: 'closed'
      });

      // Log the payment received
      await customerCaseService.addCallLog({
        case_id: caseData.id,
        employee_id: 'system', // Or get from auth context
        call_status: 'PAYMENT_RECEIVED',
        call_notes: 'Payment received - case closed',
        amount_collected: String(getValue('outstandingAmount'))
      });

      // Close the modal and show success
      onClose();
      // You might want to add a notification here
    } catch (error) {
      console.error('Error updating payment status:', error);
      // Handle error - maybe show notification
    }
  };

  if (!isOpen || !caseData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-white mr-3" />
            <h3 className="text-xl font-bold text-white">Case Details</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Box 1: Customer Information */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg min-h-[300px]">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-xl">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <User className="w-5 h-5 mr-3" />
                  Customer Information
                </h4>
              </div>
              <div className="p-6 rounded-b-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                  {(() => {
                    const customerFields = [
                      { key: 'customerName', label: 'Customer Name', icon: User },
                      { key: 'loanId', label: 'Loan ID', icon: FileText },
                      { key: 'mobileNo', label: 'Mobile Number', icon: Phone },
                      { key: 'employmentType', label: 'Employment Type', icon: FileText },
                      { key: 'loanAmount', label: 'Loan Amount', icon: DollarSign }
                    ];

                    return customerFields.map(({ key, label, icon: Icon }) => {
                      const value = getValue(key);

                      return (
                        <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              {label}
                            </div>
                            <div className="text-sm text-gray-900 break-words">
                              {String(value)}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}


                  {/* Address Section - Always Show */}
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg md:col-span-2 lg:col-span-3">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Address
                      </div>
                      <div className="text-sm text-gray-900 space-y-1">
                        {(getValue('address') || getValue('city') || getValue('state') || getValue('pincode')) ? (
                          <>
                            {getValue('address') && <div>{String(getValue('address'))}</div>}
                            {(getValue('city') || getValue('state') || getValue('pincode')) && (
                              <div className="text-gray-600">
                                {[getValue('city'), getValue('state'), getValue('pincode')].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500 italic">No address information available</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="md:col-span-2 lg:col-span-3 flex justify-center space-x-3 pt-2">
                    <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Add Mobile</span>
                    </button>
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Add Address</span>
                    </button>
                    <button
                      onClick={handleStatusUpdate}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Status Update</span>
                    </button>
                    {getValue('outstandingAmount') && parseFloat(String(getValue('outstandingAmount')).replace(/[^\d.-]/g, '')) > 0 && (
                      <button
                        onClick={handlePaymentReceived}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Payment Received</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Loan Details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg min-h-[300px]">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-xl">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <DollarSign className="w-5 h-5 mr-3" />
                  Loan Details
                </h4>
              </div>
              <div className="p-6 rounded-b-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                  {(() => {
                    const loanFields = [
                      { key: 'totalOutstanding', label: 'Outstanding Amount', icon: DollarSign },
                      { key: 'emi', label: 'EMI Amount', icon: DollarSign },
                      { key: 'pos', label: 'POS Amount', icon: DollarSign },
                      { key: 'caseStatus', label: 'Case Status', icon: FileText },
                      { key: 'dpd', label: 'DPD', icon: Calendar },
                      { key: 'paymentLink', label: 'Payment Link', icon: FileText, copyable: true },
                      { key: 'lastPaidDate', label: 'Last Payment Date', icon: Calendar },
                      { key: 'lastPaidAmount', label: 'Last Payment Amount', icon: DollarSign },
                      { key: 'sanctionDate', label: 'Loan Created At', icon: Calendar }
                    ];

                    return loanFields.map(({ key, label, icon: Icon, copyable }) => {
                      const value = getValue(key);

                      return (
                        <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Icon className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              {label}
                            </div>
                            <div className="text-sm text-gray-900 break-words flex items-center">
                              <span className="flex-1">{value ? String(value) : <span className="text-gray-400 italic">Not provided</span>}</span>
                              {copyable && value && (
                                <button
                                  onClick={() => navigator.clipboard.writeText(String(value))}
                                  className="ml-2 text-green-600 hover:text-green-800 p-1 rounded"
                                  title="Copy to clipboard"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Box 3: Additional Details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg min-h-[300px]">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 rounded-t-xl">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <FileText className="w-5 h-5 mr-3" />
                  Additional Details
                </h4>
              </div>
              <div className="p-6 rounded-b-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                  {Object.entries(caseData as unknown as Record<string, unknown>)
                    .filter(([key, value]) => {
                      if (!key || value === null || value === undefined || value === '' ||
                          key === 'case_data' || key === 'custom_fields' ||
                          key === 'telecaller' || key === 'team' ||
                          typeof value === 'object') {
                        return false;
                      }

                      const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s_]+/g, '');
                      const knownKeys = [
                        'customerName', 'loanId', 'mobileNo', 'employmentType', 'loanAmount', 'address', 'city', 'state', 'pincode',
                        'dpd', 'pos', 'emi', 'totalOutstanding', 'paymentLink', 'lastPaymentDate', 'lastPaymentAmount', 'loanCreatedAt',
                        'empId', 'id', 'remarks', 'outstandingAmount', 'emiAmount', 'posAmount', 'caseStatus'
                      ].map(normalizeKey);

                      return !knownKeys.includes(normalizeKey(key));
                    })
                    .map(([key, value]) => {
                      const displayName = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/_/g, ' ')
                        .replace(/^./, str => str.toUpperCase())
                        .trim();

                      return (
                        <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              {displayName}
                            </div>
                            <div className="text-sm text-gray-900 break-words">
                              {String(value)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Log Call Modal */}
      {showLogCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <Phone className="w-6 h-6 text-white mr-3" />
                <div>
                  <h3 className="text-xl font-bold text-white">Status Update</h3>
                  <p className="text-sm text-green-100">{String(getValue('customerName'))} - {String(getValue('loanId'))}</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogCallModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Call Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedCallStatus}
                    onChange={(e) => setSelectedCallStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    <option value="WN">WN (Wrong Number)</option>
                    <option value="SW">SW (Switched Off)</option>
                    <option value="RNR">RNR (Ringing No Response)</option>
                    <option value="BUSY">BUSY</option>
                    <option value="CALL_BACK">CALL BACK</option>
                    <option value="PTP">PTP (Promise to Pay)</option>
                    <option value="FUTURE_PTP">Future PTP (Future Promise to Pay)</option>
                    <option value="BPTP">BPTP (Broken Promise to Pay)</option>
                    <option value="RTP">RTP (Refuse to Pay)</option>
                    <option value="NC">NC (No Contact)</option>
                    <option value="CD">CD (Call Disconnected)</option>
                    <option value="INC">INC (Incoming Call)</option>
                  </select>
                </div>

                {/* PTP Date and Time - Show only when PTP is selected */}
                {selectedCallStatus === 'PTP' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PTP Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PTP Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
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
                    rows={4}
                    placeholder="Enter call details, customer response, and any important notes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLogCallModal(false)}
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
      )}
    </div>
  );
};
