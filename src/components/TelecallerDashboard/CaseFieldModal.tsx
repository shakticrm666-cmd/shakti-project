import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Edit3, Save, Phone, DollarSign, Calendar } from 'lucide-react';
import { CustomerCase } from './types';
import { useNotification, notificationHelpers } from '../shared/Notification';

interface CaseFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CustomerCase | null;
  onSave: (updatedCase: Partial<CustomerCase>) => void;
}

export const CaseFieldModal: React.FC<CaseFieldModalProps> = ({
  isOpen,
  onClose,
  caseData,
  onSave
}) => {
  const { showNotification } = useNotification();
  const [editedFields, setEditedFields] = useState<Partial<CustomerCase>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (caseData) {
      setEditedFields({});
      setIsEditing(false);
    }
  }, [caseData]);

  if (!isOpen || !caseData) return null;

  const criticalFields = [
    { key: 'mobileNo', label: 'Mobile Number', icon: Phone, required: true },
    { key: 'outstandingAmount', label: 'Outstanding Amount', icon: DollarSign, required: true },
    { key: 'emiAmount', label: 'EMI Amount', icon: DollarSign, required: true },
    { key: 'lastPaidDate', label: 'Last Paid Date', icon: Calendar, required: false },
    { key: 'lastPaidAmount', label: 'Last Paid Amount', icon: DollarSign, required: false },
    { key: 'alternateNumber', label: 'Alternate Number', icon: Phone, required: false },
    { key: 'email', label: 'Email', icon: null, required: false },
    { key: 'address', label: 'Address', icon: null, required: false },
  ];

  const getFieldValue = (fieldKey: string) => {
    return editedFields[fieldKey as keyof CustomerCase] ?? caseData[fieldKey as keyof CustomerCase];
  };

  const isFieldEmpty = (fieldKey: string) => {
    const value = getFieldValue(fieldKey);
    return !value || value === '' || value === null || value === undefined;
  };

  const getFieldStatus = (field: typeof criticalFields[0]) => {
    const isEmpty = isFieldEmpty(field.key);
    if (field.required && isEmpty) return 'missing';
    if (!field.required && isEmpty) return 'optional-empty';
    return 'filled';
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setEditedFields(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const handleSave = () => {
    if (Object.keys(editedFields).length === 0) {
      showNotification(notificationHelpers.info(
        'No Changes',
        'No fields were modified.'
      ));
      return;
    }

    onSave(editedFields);
    setEditedFields({});
    setIsEditing(false);
    showNotification(notificationHelpers.success(
      'Fields Updated',
      'Case fields have been updated successfully.'
    ));
    onClose();
  };

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return '-';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'missing':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Missing</span>;
      case 'optional-empty':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Empty</span>;
      case 'filled':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Filled</span>;
      default:
        return null;
    }
  };

  const missingRequiredFields = criticalFields.filter(field =>
    field.required && isFieldEmpty(field.key)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Case Field Management</h3>
              <p className="text-sm text-gray-600">{caseData.customerName} - {caseData.loanId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Alert for missing required fields */}
          {missingRequiredFields.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="text-lg font-semibold text-red-900">Required Fields Missing</h4>
              </div>
              <p className="text-red-700 mb-3">
                The following required fields are empty and need to be filled:
              </p>
              <div className="flex flex-wrap gap-2">
                {missingRequiredFields.map(field => (
                  <span key={field.key} className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    {field.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Field Status Overview */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Field Status Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criticalFields.map(field => {
                const status = getFieldStatus(field);
                const IconComponent = field.icon;
                return (
                  <div key={field.key} className={`p-4 rounded-lg border-2 ${status === 'missing' ? 'border-red-200 bg-red-50' :
                    status === 'optional-empty' ? 'border-yellow-200 bg-yellow-50' :
                      'border-green-200 bg-green-50'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {IconComponent && <IconComponent className="w-4 h-4 mr-2 text-gray-600" />}
                        <span className="font-medium text-gray-900">{field.label}</span>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {field.key.includes('amount') ? formatCurrency(String(getFieldValue(field.key) || '')) :
                        field.key.includes('date') ? (getFieldValue(field.key) ? String(getFieldValue(field.key)) : 'Not set') :
                          (getFieldValue(field.key) ? String(getFieldValue(field.key)) : 'Not set')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit Fields Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Edit Fields</h4>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isEditing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel Edit' : 'Edit Fields'}
              </button>
            </div>

            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {criticalFields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type={field.key.includes('date') ? 'date' :
                        field.key.includes('email') ? 'email' :
                          field.key.includes('amount') || field.key.includes('number') ? 'number' : 'text'}
                      value={String(getFieldValue(field.key) || '')}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${field.key.includes('amount') || field.key.includes('number')
                        ? 'text-right'
                        : ''
                        } ${isFieldEmpty(field.key) && field.required
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Case Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Case Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Customer:</span>
                <p className="text-gray-900">{caseData.customerName || '-'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Loan ID:</span>
                <p className="text-gray-900">{caseData.loanId || '-'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">DPD:</span>
                <p className="text-gray-900">{caseData.dpd || 0} days</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Status:</span>
                <p className="text-gray-900">{caseData.caseStatus || 'pending'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={missingRequiredFields.length > 0 && Object.keys(editedFields).length === 0}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};