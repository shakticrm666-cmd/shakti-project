import React from 'react';
import { X, FileText, Database } from 'lucide-react';
import { CustomerCase } from './types';

interface CustomColumn {
  column_name: string;
  display_name: string;
  data_type: string;
  column_order: number;
}

interface CustomColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CustomerCase | null;
  customColumns: CustomColumn[];
}

export const CustomColumnsModal: React.FC<CustomColumnsModalProps> = ({
  isOpen,
  onClose,
  caseData,
  customColumns
}) => {
  if (!isOpen || !caseData) return null;

  const getValue = (columnName: string) => {
    if (!caseData) return '';

    const data = caseData as unknown as Record<string, unknown>;
    const snakeCaseField = columnName.replace(/([A-Z])/g, '_$1').toLowerCase();

    const directValue = data[columnName];
    if (directValue !== undefined && directValue !== null && directValue !== '') return directValue;

    const snakeDirectValue = data[snakeCaseField];
    if (snakeDirectValue !== undefined && snakeDirectValue !== null && snakeDirectValue !== '') return snakeDirectValue;

    const nestedCaseData = data.case_data as Record<string, unknown> | undefined;
    const caseDataField = nestedCaseData?.[columnName] || nestedCaseData?.[snakeCaseField];
    if (caseDataField !== undefined && caseDataField !== null && caseDataField !== '') return caseDataField;

    const nestedCustomFields = data.custom_fields as Record<string, unknown> | undefined;
    const customField = nestedCustomFields?.[columnName] || nestedCustomFields?.[snakeCaseField];
    if (customField !== undefined && customField !== null && customField !== '') return customField;

    return '';
  };

  const formatValue = (value: unknown, dataType: string): string => {
    if (value === null || value === undefined || value === '') {
      return 'Not provided';
    }

    const stringValue = String(value);

    switch (dataType.toLowerCase()) {
      case 'currency':
      case 'number':
        const numValue = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
        if (!isNaN(numValue)) {
          return dataType.toLowerCase() === 'currency'
            ? `₹${numValue.toLocaleString('en-IN')}`
            : numValue.toLocaleString('en-IN');
        }
        return stringValue;

      case 'date':
        try {
          const date = new Date(stringValue);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          }
        } catch {
          return stringValue;
        }
        return stringValue;

      case 'boolean':
        return stringValue.toLowerCase() === 'true' || stringValue === '1' ? 'Yes' : 'No';

      default:
        return stringValue;
    }
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case 'currency':
      case 'number':
        return '🔢';
      case 'date':
        return '📅';
      case 'boolean':
        return '✓';
      case 'email':
        return '📧';
      case 'phone':
        return '📱';
      default:
        return '📝';
    }
  };

  const customerName = getValue('customerName') || getValue('customer_name') || 'Customer';
  const loanId = getValue('loanId') || getValue('loan_id') || 'N/A';

  const columnsWithValues = customColumns
    .map(col => ({
      ...col,
      value: getValue(col.column_name)
    }))
    .sort((a, b) => a.column_order - b.column_order);

  const hasAnyValues = columnsWithValues.some(col => col.value && col.value !== '');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Database className="w-6 h-6 text-white mr-3" />
            <div>
              <h3 className="text-xl font-bold text-white">Custom Fields</h3>
              <p className="text-sm text-teal-100">{customerName} - {loanId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {customColumns.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No Custom Fields Configured</h4>
              <p className="text-sm text-gray-500">
                No custom fields have been configured for this product.
              </p>
            </div>
          ) : !hasAnyValues ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No Custom Field Data</h4>
              <p className="text-sm text-gray-500">
                Custom fields are configured but no data is available for this case.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 text-teal-700">
                  <Database className="w-4 h-4" />
                  <p className="text-sm font-medium">
                    Showing {columnsWithValues.filter(col => col.value && col.value !== '').length} custom field(s) with data
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {columnsWithValues.map((column) => {
                  const value = column.value;
                  const hasValue = value && value !== '';

                  return (
                    <div
                      key={column.column_name}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        hasValue
                          ? 'bg-white border-teal-200 shadow-sm hover:shadow-md'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl" title={column.data_type}>
                          {getDataTypeIcon(column.data_type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              {column.display_name}
                            </div>
                            <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">
                              Custom
                            </span>
                          </div>
                          <div className={`text-sm font-medium break-words ${
                            hasValue ? 'text-gray-900' : 'text-gray-400 italic'
                          }`}>
                            {hasValue ? formatValue(value, column.data_type) : 'Not provided'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Type: {column.data_type}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
