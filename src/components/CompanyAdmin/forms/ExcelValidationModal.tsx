import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileSpreadsheet, RefreshCw, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ColumnConfiguration } from '../../../services/columnConfigService';
import { columnConfigService } from '../../../services/columnConfigService';
import { useNotification, notificationHelpers } from '../../shared/Notification';

interface ExcelValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { tenantId: string; id: string };
  selectedProduct: string;
  onConfigurationUpdated: () => void;
}

interface ValidationResult {
  excelHeaders: string[];
  matchedColumns: Array<{
    header: string;
    config: ColumnConfiguration;
  }>;
  unmatchedHeaders: string[];
  missingRequired: string[];
}

export const ExcelValidationModal: React.FC<ExcelValidationModalProps> = ({
  isOpen,
  onClose,
  user,
  selectedProduct,
  onConfigurationUpdated
}) => {
  const { showNotification } = useNotification();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setUploadedFile(null);
      setValidationResult(null);
      setIsAnalyzing(false);
      setIsUpdating(false);
    }
  }, [isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      showNotification(notificationHelpers.error(
        'Invalid File',
        'Please select a valid Excel file (.xlsx or .xls)'
      ));
      return;
    }

    setUploadedFile(file);
    await analyzeExcelFile(file);
  };

  const analyzeExcelFile = async (file: File) => {
    if (!selectedProduct || !user?.tenantId) {
      showNotification(notificationHelpers.error(
        'Configuration Error',
        'Please select a product first'
      ));
      return;
    }

    try {
      setIsAnalyzing(true);

      // Get current column configurations
      const configs = await columnConfigService.getColumnConfigurations(user.tenantId, selectedProduct);

      // Parse Excel headers
      const headers = await getExcelHeaders(file);

      // Analyze matches
      const matchedColumns: ValidationResult['matchedColumns'] = [];
      const unmatchedHeaders: string[] = [];

      headers.forEach(header => {
        if (header.toLowerCase() === 'empid') return; // Skip EMPID

        const config = configs.find(c =>
          c.display_name.toLowerCase().trim() === header.toLowerCase().trim()
        );

        if (config) {
          matchedColumns.push({ header, config });
        } else {
          unmatchedHeaders.push(header);
        }
      });

      // Check for required columns
      const requiredColumns = ['customerName', 'loanId'];
      const missingRequired = requiredColumns.filter(reqCol =>
        !configs.some(c => c.column_name === reqCol)
      );

      setValidationResult({
        excelHeaders: headers,
        matchedColumns,
        unmatchedHeaders,
        missingRequired
      });

      showNotification(notificationHelpers.success(
        'Analysis Complete',
        `Found ${headers.length} headers, ${matchedColumns.length} matched, ${unmatchedHeaders.length} unmatched`
      ));

    } catch (error) {
      console.error('Analysis error:', error);
      showNotification(notificationHelpers.error(
        'Analysis Failed',
        error instanceof Error ? error.message : 'Failed to analyze Excel file'
      ));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getExcelHeaders = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

          if (jsonData.length < 1) {
            reject(new Error('Excel file appears to be empty'));
            return;
          }

          const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h);
          resolve(headers);

        } catch {
          reject(new Error('Failed to read Excel headers'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleAutoConfigure = async () => {
    if (!validationResult || !selectedProduct || !user?.tenantId) return;

    try {
      setIsUpdating(true);

      const updates: Array<{ column_name: string; display_name: string; is_active: boolean; is_custom: boolean; column_order: number; data_type: string }> = [];

      // Create configurations for unmatched headers
      validationResult.unmatchedHeaders.forEach((header, index) => {
        // Generate column name from display name
        const columnName = header
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') // Remove special chars
          .replace(/^(\d)/, 'col$1'); // Prefix with 'col' if starts with number

        updates.push({
          column_name: columnName,
          display_name: header,
          is_active: true,
          is_custom: true,
          column_order: 100 + index, // High order to place after defaults
          data_type: 'text'
        });
      });

      if (updates.length > 0) {
        await columnConfigService.saveColumnConfigurations(user.tenantId, selectedProduct, updates);

        showNotification(notificationHelpers.success(
          'Configuration Updated',
          `Added ${updates.length} new column configurations for unmatched headers`
        ));

        // Reset and close
        setValidationResult(null);
        setUploadedFile(null);
        onConfigurationUpdated();
        onClose();
      }

    } catch (error) {
      console.error('Auto-configuration error:', error);
      showNotification(notificationHelpers.error(
        'Configuration Failed',
        error instanceof Error ? error.message : 'Failed to update column configurations'
      ));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <FileSpreadsheet className="w-6 h-6 text-white mr-3" />
            <div>
              <h3 className="text-xl font-bold text-white">Excel Column Validation</h3>
              <p className="text-sm text-green-100">Validate and auto-configure columns for {selectedProduct}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!uploadedFile ? (
            /* File Upload Section */
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileSpreadsheet className="w-10 h-10 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Upload Excel File for Validation</h4>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Upload an Excel file to analyze its column headers and automatically configure missing column mappings.
              </p>

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="validation-file-upload"
              />
              <label
                htmlFor="validation-file-upload"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Choose Excel File
              </label>
            </div>
          ) : (
            /* Analysis Results */
            <div className="space-y-6">
              {/* File Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center text-green-800">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">File uploaded: {uploadedFile.name}</span>
                </div>
              </div>

              {isAnalyzing ? (
                /* Loading State */
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing Excel headers...</p>
                </div>
              ) : validationResult ? (
                /* Results Display */
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{validationResult.excelHeaders.length}</div>
                      <div className="text-sm text-blue-700">Total Headers</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{validationResult.matchedColumns.length}</div>
                      <div className="text-sm text-green-700">Matched</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{validationResult.unmatchedHeaders.length}</div>
                      <div className="text-sm text-orange-700">Unmatched</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{validationResult.missingRequired.length}</div>
                      <div className="text-sm text-red-700">Missing Required</div>
                    </div>
                  </div>

                  {/* Matched Columns */}
                  {validationResult.matchedColumns.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h5 className="font-semibold text-green-800 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Matched Columns ({validationResult.matchedColumns.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {validationResult.matchedColumns.map((match, index) => (
                          <div key={index} className="text-sm text-green-700 bg-white rounded px-3 py-2 border border-green-200">
                            <span className="font-medium">{match.header}</span>
                            <span className="text-gray-500 ml-2">→ {match.config.column_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unmatched Headers */}
                  {validationResult.unmatchedHeaders.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h5 className="font-semibold text-orange-800 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Unmatched Headers ({validationResult.unmatchedHeaders.length})
                      </h5>
                      <p className="text-orange-700 text-sm mb-3">
                        These headers don't have matching column configurations and will be ignored during import.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {validationResult.unmatchedHeaders.map((header, index) => (
                          <div key={index} className="text-sm text-orange-700 bg-white rounded px-3 py-2 border border-orange-200">
                            {header}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Required */}
                  {validationResult.missingRequired.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-semibold text-red-800 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Missing Required Columns
                      </h5>
                      <p className="text-red-700 text-sm mb-3">
                        These required columns are missing from your configuration:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.missingRequired.map((col, index) => (
                          <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setValidationResult(null);
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Upload Different File
                    </button>

                    {validationResult.unmatchedHeaders.length > 0 && (
                      <button
                        onClick={handleAutoConfigure}
                        disabled={isUpdating}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                      >
                        {isUpdating ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Configuring...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Auto-Configure Columns ({validationResult.unmatchedHeaders.length})
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};