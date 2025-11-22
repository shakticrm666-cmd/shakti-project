import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import { columnConfigService, ColumnConfiguration } from '../../../services/columnConfigService';
import { customerCaseService } from '../../../services/customerCaseService';
import { excelUtils } from '../../../utils/excelUtils';
import { useNotification, notificationHelpers } from '../../shared/Notification';
import { useAuth } from '../../../contexts/AuthContext';
import { TeamService } from '../../../services/teamService';
import { ColumnValidationModal } from '../forms/ColumnValidationModal';
import { UploadValidationModal } from './UploadValidationModal';

interface UploadCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadCasesModal: React.FC<UploadCasesModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Step states
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Product and Team selection
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [products, setProducts] = useState<string[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; team_incharge_id: string; status: string; telecallers?: Array<{ id: string; name: string; emp_id: string }> }>>([]);
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfiguration[]>([]);

  // Step 2: File upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{ totalUploaded: number; errors: Array<{ row: number; error: string }>; autoAssigned?: number; unassigned?: number } | null>(null);


  // Column validation modal
  const [showColumnValidationModal, setShowColumnValidationModal] = useState(false);

  // Upload validation modal
  const [showUploadValidationModal, setShowUploadValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: Array<{ row: number; column: string; value: string; error: string }>;
    duplicateLoanIds: Array<{ loanId: string; rows: number[] }>;
    warnings: Array<{ row: number; column: string; message: string }>;
  } | null>(null);
  const [parsedData, setParsedData] = useState<Array<Record<string, unknown>>>([]);
  const [uploadOnlyValid, setUploadOnlyValid] = useState(false);

  // Load products and teams
  const loadProductsAndTeams = useCallback(async () => {
    if (!user?.tenantId || !user?.id) {
      console.warn('User or tenant ID not available');
      return;
    }

    try {
      setIsLoading(true);

      // Get unique products from column configurations
      const configs = await columnConfigService.getColumnConfigurations(user.tenantId);
      const uniqueProducts = [...new Set(configs.map(c => c.product_name))];
      setProducts(uniqueProducts);

      // Get teams for this team incharge
      const teamData = await TeamService.getTeams(user.tenantId);
      const userTeams = teamData.filter((team) =>
        team.team_incharge_id === user.id && team.status === 'active'
      );
      setTeams(userTeams);
    } catch (error) {
      console.error('Error loading products and teams:', error);
      showNotification(notificationHelpers.error(
        'Error',
        'Failed to load products and teams'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId, user?.id, showNotification]);

  useEffect(() => {
    if (isOpen && user?.tenantId && user?.id) {
      loadProductsAndTeams();
    }
  }, [isOpen, user?.tenantId, user?.id, loadProductsAndTeams]);

  const handleProductSelect = async (product: string) => {
    setSelectedProduct(product);
    setSelectedTeam('');

    if (!user?.tenantId) {
      console.error('Tenant ID not available');
      showNotification(notificationHelpers.error(
        'Error',
        'Unable to load column configurations'
      ));
      return;
    }

    try {
      console.log('Loading column configs for tenant:', user.tenantId, 'product:', product);

      // First, ensure default columns are initialized for this product
      await columnConfigService.initializeDefaultColumns(user.tenantId, product);

      const configs = await columnConfigService.getActiveColumnConfigurations(user.tenantId, product);
      console.log('Loaded column configs:', configs.length);
      console.log('Column details:', configs.map(c => `${c.column_name} (${c.is_active ? 'active' : 'inactive'})`));
      setColumnConfigs(configs);

      if (configs.length === 0) {
        showNotification(notificationHelpers.warning(
          'No Configuration',
          'No column configuration found for this product. Please contact your admin.'
        ));
      }
    } catch (error) {
      console.error('Error loading column configurations:', error);
      showNotification(notificationHelpers.error(
        'Error',
        'Failed to load column configurations'
      ));
    }
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
  };

  const handleDownloadTemplate = () => {
    if (!selectedProduct) {
      showNotification(notificationHelpers.error(
        'Product Not Selected',
        'Please select a product first'
      ));
      return;
    }

    if (columnConfigs.length === 0) {
      showNotification(notificationHelpers.error(
        'No Configuration',
        `No column configuration found for "${selectedProduct}". Please contact your admin to set up columns for this product.`
      ));
      return;
    }

    // Validate that we have required columns
    const hasCustomerName = columnConfigs.some(col => col.column_name === 'customerName');
    const hasLoanId = columnConfigs.some(col => col.column_name === 'loanId');

    if (!hasCustomerName || !hasLoanId) {
      // Show column validation modal instead of just warning
      console.log('🔍 UploadCasesModal: Required columns missing, opening validation modal');
      console.log('🔍 UploadCasesModal: tenantId:', user?.tenantId, 'productName:', selectedProduct);
      console.log('🔍 UploadCasesModal: hasCustomerName:', hasCustomerName, 'hasLoanId:', hasLoanId);
      console.log('🔍 UploadCasesModal: columnConfigs:', columnConfigs.map(c => `${c.column_name} (${c.is_active ? 'active' : 'inactive'})`));
      setShowColumnValidationModal(true);
      return;
    }

    try {
      console.log('Generating template for product:', selectedProduct);
      console.log('Column configurations:', columnConfigs.map(c => `${c.column_name} -> ${c.display_name}`));
      excelUtils.generateTemplate(columnConfigs);
      showNotification(notificationHelpers.success(
        'Template Downloaded',
        `Excel template for "${selectedProduct}" has been downloaded successfully. It includes ${columnConfigs.length} columns.`
      ));
    } catch (error) {
      console.error('Error generating template:', error);
      showNotification(notificationHelpers.error(
        'Download Failed',
        'Failed to generate Excel template. Please try again.'
      ));
    }
  };

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

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showNotification(notificationHelpers.error(
        'File Too Large',
        'File size should not exceed 10MB'
      ));
      return;
    }

    setUploadedFile(file);
  };

  const handleValidateFile = async () => {
    if (!uploadedFile || !user?.tenantId) {
      showNotification(notificationHelpers.error(
        'Missing Data',
        'File or tenant information is missing'
      ));
      return;
    }

    try {
      setIsLoading(true);

      // Validate Excel file headers first
      const headerValidation = await excelUtils.validateExcelHeaders(uploadedFile, columnConfigs);
      if (!headerValidation.valid) {
        showNotification(notificationHelpers.error(
          'Header Mismatch',
          headerValidation.message
        ));
        return;
      }

      // Parse Excel file
      const excelData = await excelUtils.parseExcelFile(uploadedFile, columnConfigs);

      if (excelData.length === 0) {
        showNotification(notificationHelpers.error(
          'No Data',
          'No valid data found in Excel file'
        ));
        return;
      }

      if (excelData.length > 1000) {
        showNotification(notificationHelpers.error(
          'Too Many Rows',
          'Maximum 1000 cases allowed per upload. Please split your file.'
        ));
        return;
      }

      // Run comprehensive validation
      const validation = await excelUtils.comprehensiveValidation(excelData, columnConfigs);

      setValidationResult(validation);
      setParsedData(excelData);
      setShowUploadValidationModal(true);

    } catch (error) {
      console.error('Validation error:', error);
      showNotification(notificationHelpers.error(
        'Validation Failed',
        error instanceof Error ? error.message : 'Failed to validate Excel file'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadCases = async (onlyValid: boolean) => {
    if (!selectedTeam || !selectedProduct || !user?.tenantId || !user?.id) {
      showNotification(notificationHelpers.error(
        'Missing Data',
        'Please complete all required fields'
      ));
      return;
    }

    const tenantId = user.tenantId;
    setShowUploadValidationModal(false);

    try {
      setIsLoading(true);
      setUploadProgress(0);

      let dataToUpload = parsedData;

      // If uploading only valid rows, filter out invalid ones
      if (onlyValid && validationResult) {
        const invalidRowNumbers = new Set(
          validationResult.errors.map(e => e.row - 1)
        );
        dataToUpload = parsedData.filter((_, index) => !invalidRowNumbers.has(index));
      }

      // Prepare cases for bulk insert
      const cases = dataToUpload.map(row => {
        const loanId = row['loanId'] || '';
        const customerName = row['customerName'] || '';

        return {
          tenant_id: tenantId,
          team_id: selectedTeam,
          product_name: selectedProduct,
          loan_id: String(loanId),
          customer_name: String(customerName),
          case_data: row,
          status: 'new' as const,
          uploaded_by: user.id,
          assigned_employee_id: null
        };
      });

      // Upload cases
      setUploadProgress(50);
      const result = await customerCaseService.createBulkCases(cases);
      setUploadProgress(100);
      setUploadResult(result);

      if (result.errors.length === 0) {
        showNotification(notificationHelpers.success(
          'Upload Successful',
          `Successfully uploaded ${result.totalUploaded} cases`
        ));
        onSuccess();
        handleClose();
      } else {
        showNotification(notificationHelpers.warning(
          'Upload Completed with Errors',
          `Uploaded ${result.totalUploaded} cases, ${result.errors.length} failed`
        ));
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification(notificationHelpers.error(
        'Upload Failed',
        error instanceof Error ? error.message : 'Failed to upload cases'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setSelectedProduct('');
    setSelectedTeam('');
    setColumnConfigs([]);
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadResult(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleConfigurationFixed = () => {
    // Reload column configurations after fixing
    if (user?.tenantId && selectedProduct) {
      columnConfigService.getActiveColumnConfigurations(user.tenantId, selectedProduct)
        .then(configs => {
          setColumnConfigs(configs);
          showNotification(notificationHelpers.success(
            'Configuration Fixed',
            'Required columns have been added/activated. You can now download the template.'
          ));
        })
        .catch(error => {
          console.error('Error reloading column configurations:', error);
          showNotification(notificationHelpers.error(
            'Error',
            'Configuration was fixed but failed to reload. Please refresh the page.'
          ));
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-600" />
            Upload Cases
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps - Modern Card Design */}
        <div className="px-6 py-6 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((step, index) => {
              const stepData = [
                { title: 'Upload Cases', subtitle: 'Select Product & Team', icon: Upload },
                { title: 'Download & Upload', subtitle: 'Template', icon: Download },
                { title: 'Review & Submit', subtitle: 'Final Step', icon: CheckCircle }
              ][step - 1];

              const IconComponent = stepData.icon;
              const isCompleted = step < currentStep;
              const isCurrent = step === currentStep;

              return (
                <div key={step} className="relative">
                  {/* Connection Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gray-300 -translate-y-1/2 z-0">
                      <div
                        className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        style={{
                          width: isCompleted ? '100%' : '0%'
                        }}
                      />
                    </div>
                  )}

                  {/* Step Card */}
                  <div className={`relative z-10 p-4 rounded-xl border-2 transition-all duration-300 ${isCompleted
                    ? 'bg-green-50 border-green-300 shadow-md'
                    : isCurrent
                      ? 'bg-blue-50 border-blue-400 shadow-lg ring-2 ring-blue-200'
                      : 'bg-white border-gray-200'
                    }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                        }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm ${isCompleted
                          ? 'text-green-800'
                          : isCurrent
                            ? 'text-blue-800'
                            : 'text-gray-500'
                          }`}>
                          {stepData.title}
                        </h4>
                        <p className={`text-xs mt-0.5 ${isCompleted
                          ? 'text-green-600'
                          : isCurrent
                            ? 'text-blue-600'
                            : 'text-gray-400'
                          }`}>
                          {stepData.subtitle}
                        </p>
                      </div>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-500'
                        }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          step
                        )}
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    {isCurrent && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">

              {/* Product and Team Selection - Modern Horizontal Layout */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="text-center">
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        Product Selection
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedProduct}
                          onChange={(e) => handleProductSelect(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 appearance-none text-gray-700 font-medium shadow-lg hover:shadow-xl hover:border-blue-300"
                          disabled={isLoading}
                        >
                          <option value="" className="text-gray-500">Select Product</option>
                          {products.map((product) => (
                            <option key={product} value={product} className="text-gray-800 font-medium py-2">
                              {product}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 transform rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${selectedProduct
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gray-300'
                        }`}>
                        <CheckCircle className={`w-5 h-5 text-white transition-all duration-300 ${selectedProduct ? 'scale-100' : 'scale-75 opacity-50'
                          }`} />
                      </div>
                    </div>
                    <div className="text-center">
                      <label className={`block text-sm font-bold mb-2 transition-all duration-300 ${selectedProduct ? 'text-gray-800' : 'text-gray-400'
                        }`}>
                        Team Selection
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedTeam}
                          onChange={(e) => handleTeamSelect(e.target.value)}
                          className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-4 transition-all duration-200 appearance-none font-medium shadow-lg hover:shadow-xl ${selectedProduct
                            ? 'border-gray-200 focus:ring-green-100 focus:border-green-400 hover:border-green-300 text-gray-700'
                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                          disabled={isLoading || !selectedProduct}
                        >
                          <option value="" className="text-gray-500">
                            {selectedProduct ? 'Select Team' : 'Select Product First'}
                          </option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id} className="text-gray-800 font-medium py-2">
                              {team.name} ({team.telecallers?.length || 0} telecallers)
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 transform rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection Status Indicators */}
                <div className="mt-6 flex justify-center space-x-4">
                  <div className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedProduct
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${selectedProduct ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    Product {selectedProduct ? 'Selected' : 'Pending'}
                  </div>
                  <div className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedTeam
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${selectedTeam ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></div>
                    Team {selectedTeam ? 'Selected' : 'Pending'}
                  </div>
                </div>
              </div>

              {/* Column Configuration Preview */}
              {selectedProduct && columnConfigs.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Column Configuration</h5>
                  <p className="text-blue-700 text-sm mb-3">
                    Template will include {columnConfigs.length} columns based on product configuration
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {columnConfigs.slice(0, 6).map((config) => (
                      <div key={config.id} className="text-xs bg-white rounded px-2 py-1">
                        {config.display_name}
                      </div>
                    ))}
                    {columnConfigs.length > 6 && (
                      <div className="text-xs text-blue-600 px-2 py-1">
                        +{columnConfigs.length - 6} more columns
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Next Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedProduct || !selectedTeam || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Next: Download Template
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">

              {/* Download & Upload Template - Unified Box */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 rounded-2xl p-8 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Download Section */}
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <Download className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h5 className="text-lg font-bold text-gray-900 mb-2">Download Template</h5>
                      <p className="text-gray-600 text-sm mb-4">
                        Get the Excel template for {selectedProduct}
                      </p>
                      <button
                        onClick={handleDownloadTemplate}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-medium"
                      >
                        <Download className="w-5 h-5 inline mr-2" />
                        Download Template
                      </button>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h5 className="text-lg font-bold text-gray-900 mb-2">Upload Filled Template</h5>
                      <p className="text-gray-600 text-sm mb-4">
                        Select your completed Excel file
                      </p>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className={`px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-medium cursor-pointer inline-block ${uploadedFile
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                          }`}
                      >
                        <Upload className="w-5 h-5 inline mr-2" />
                        {uploadedFile ? uploadedFile.name : 'Choose File'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* File Status */}
                {uploadedFile && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center justify-center text-green-800">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">File selected: {uploadedFile.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleValidateFile}
                  disabled={!uploadedFile || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  {isLoading ? 'Validating...' : 'Validate & Continue'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Review & Submit</h4>
                <p className="text-gray-600">Review your upload details and submit</p>
              </div>

              {/* Review Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h5 className="font-medium text-gray-900 mb-4">Upload Summary</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product</label>
                    <p className="text-gray-900">{selectedProduct}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Team</label>
                    <p className="text-gray-900">{teams.find(t => t.id === selectedTeam)?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File</label>
                    <p className="text-gray-900">{uploadedFile?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Columns</label>
                    <p className="text-gray-900">{columnConfigs.length} columns</p>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {isLoading && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-blue-900 font-medium">Uploading cases...</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">{uploadProgress}% complete</p>
                </div>
              )}

              {/* Upload Results */}
              {uploadResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Upload Complete
                  </h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{uploadResult.totalUploaded}</div>
                      <div className="text-sm text-green-700">Total Uploaded</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{uploadResult.autoAssigned}</div>
                      <div className="text-sm text-blue-700">Auto-Assigned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{uploadResult.unassigned}</div>
                      <div className="text-sm text-orange-700">Unassigned</div>
                    </div>
                  </div>

                  {uploadResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h6 className="font-medium text-red-900 mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Errors ({uploadResult.errors.length})
                      </h6>
                      <div className="max-h-32 overflow-y-auto">
                        {uploadResult.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-sm text-red-700 mb-1">
                            Row {error.row}: {error.error}
                          </div>
                        ))}
                        {uploadResult.errors.length > 5 && (
                          <div className="text-sm text-red-600">
                            ...and {uploadResult.errors.length - 5} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={isLoading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleUploadCases(false)}
                  disabled={isLoading || !!uploadResult}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadResult ? 'Upload Complete' : isLoading ? 'Uploading...' : 'Upload Cases'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Column Validation Modal */}
      <ColumnValidationModal
        isOpen={showColumnValidationModal}
        onClose={() => setShowColumnValidationModal(false)}
        tenantId={user?.tenantId || ''}
        productName={selectedProduct}
        onConfigurationFixed={handleConfigurationFixed}
      />

      {/* Upload Validation Modal */}
      <UploadValidationModal
        isOpen={showUploadValidationModal}
        onClose={() => setShowUploadValidationModal(false)}
        onProceed={handleUploadCases}
        validationResult={validationResult}
        previewData={parsedData}
        columnConfigs={columnConfigs}
      />
    </div>
  );
};