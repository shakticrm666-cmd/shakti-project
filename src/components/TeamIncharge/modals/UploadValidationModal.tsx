import React from 'react';
import { CheckCircle, AlertCircle, X, Download, FileText } from 'lucide-react';
import { ColumnConfiguration } from '../../../services/columnConfigService';
import * as XLSX from 'xlsx';

interface ValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
}

interface ValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  duplicateLoanIds: Array<{ loanId: string; rows: number[] }>;
  warnings: Array<{ row: number; column: string; message: string }>;
}

interface UploadValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (uploadOnlyValid: boolean) => void;
  validationResult: ValidationResult | null;
  previewData: Array<Record<string, unknown>>;
  columnConfigs: ColumnConfiguration[];
}

export const UploadValidationModal: React.FC<UploadValidationModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  validationResult,
  previewData,
  columnConfigs
}) => {
  if (!isOpen || !validationResult) return null;

  const hasErrors = validationResult.invalidRows > 0;
  const canProceed = validationResult.validRows > 0;

  const handleDownloadErrorReport = () => {
    if (!validationResult || validationResult.errors.length === 0) return;

    const errorData = validationResult.errors.map(err => ({
      'Row Number': err.row,
      'Column': err.column,
      'Current Value': err.value,
      'Error': err.error
    }));

    const ws = XLSX.utils.json_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `validation_errors_${timestamp}.xlsx`);
  };

  const groupedErrors = validationResult.errors.reduce((acc, error) => {
    const key = error.error;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Upload Validation Results
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Rows</p>
                  <p className="text-3xl font-bold text-blue-900">{validationResult.totalRows}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Valid Rows</p>
                  <p className="text-3xl font-bold text-green-900">{validationResult.validRows}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">Invalid Rows</p>
                  <p className="text-3xl font-bold text-red-900">{validationResult.invalidRows}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-600 opacity-50" />
              </div>
            </div>
          </div>

          {/* Duplicate Loan IDs */}
          {validationResult.duplicateLoanIds.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Duplicate Loan IDs Found ({validationResult.duplicateLoanIds.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {validationResult.duplicateLoanIds.map((dup, index) => (
                  <div key={index} className="text-sm text-orange-800 bg-white rounded px-3 py-2">
                    Loan ID: <span className="font-semibold">{dup.loanId}</span> appears in rows: {dup.rows.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {hasErrors && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-red-900 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Validation Errors ({validationResult.errors.length})
                </h4>
                <button
                  onClick={handleDownloadErrorReport}
                  className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Report
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(groupedErrors).map(([errorMsg, errors]) => (
                  <div key={errorMsg} className="bg-white rounded-lg p-3 border border-red-100">
                    <p className="font-medium text-red-800 mb-2">
                      {errorMsg} ({errors.length} occurrences)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {errors.slice(0, 4).map((err, idx) => (
                        <div key={idx} className="text-sm text-red-700 bg-red-50 rounded px-2 py-1">
                          Row {err.row}: {err.column} = "{err.value}"
                        </div>
                      ))}
                      {errors.length > 4 && (
                        <div className="text-sm text-red-600 px-2 py-1">
                          +{errors.length - 4} more rows with this error
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Warnings ({validationResult.warnings.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {validationResult.warnings.slice(0, 10).map((warning, index) => (
                  <div key={index} className="text-sm text-yellow-800 bg-white rounded px-3 py-2">
                    Row {warning.row}, {warning.column}: {warning.message}
                  </div>
                ))}
                {validationResult.warnings.length > 10 && (
                  <div className="text-sm text-yellow-700">
                    +{validationResult.warnings.length - 10} more warnings
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Data Preview (First 5 Rows)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Row</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">EMPID</th>
                    {columnConfigs.slice(0, 6).map((col) => (
                      <th key={col.id} className="px-3 py-2 text-left font-medium text-gray-700">
                        {col.display_name}
                      </th>
                    ))}
                    {columnConfigs.length > 6 && (
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        +{columnConfigs.length - 6} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                      <td className="px-3 py-2 text-gray-900">{String(row.EMPID || 'N/A')}</td>
                      {columnConfigs.slice(0, 6).map((col) => (
                        <td key={col.id} className="px-3 py-2 text-gray-900">
                          {String(row[col.column_name] || 'N/A')}
                        </td>
                      ))}
                      {columnConfigs.length > 6 && (
                        <td className="px-3 py-2 text-gray-500 italic">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          {hasErrors ? (
            <div className="flex flex-col space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Some rows contain errors. You can either fix the errors and re-upload, or proceed to upload only the valid rows.
                </p>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel & Fix Errors
                </button>
                {canProceed && (
                  <button
                    onClick={() => onProceed(true)}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Upload {validationResult.validRows} Valid Rows
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  All rows passed validation! You can proceed with the upload.
                </p>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onProceed(false)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Proceed to Upload ({validationResult.validRows} rows)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
