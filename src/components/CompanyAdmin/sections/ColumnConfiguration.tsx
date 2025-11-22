import React, { useState, useEffect } from 'react';
import { Columns, Plus, Save, Eye, EyeOff, Trash2, Building2, UserPlus, UserMinus, Eye as ViewIcon, RotateCcw, Upload, FileSpreadsheet } from 'lucide-react';
import { useProducts } from '../../../hooks/useProducts';
import { columnConfigService } from '../../../services/columnConfigService';
import { useNotification, notificationHelpers } from '../../shared/Notification';
import { PromptModal } from '../../shared/PromptModal';
import { ClearAllDataModal } from '../forms/ClearAllDataModal';
import { useConfirmation } from '../../../contexts/ConfirmationContext';
import { ExcelValidationModal } from '../forms/ExcelValidationModal';
import type { CompanyAdmin } from '../../../types/admin';

interface LocalColumn {
  id: string | number;
  columnName: string;
  displayName: string;
  isActive: boolean;
  isCustom?: boolean;
}

interface ColumnConfigurationProps {
  user: CompanyAdmin;
}

export const ColumnConfiguration: React.FC<ColumnConfigurationProps> = ({ user }) => {
  const { products, selectedProduct, setSelectedProduct, addProduct, deleteProduct } = useProducts(user?.tenantId);
  const { showNotification } = useNotification();
  const { showConfirmation } = useConfirmation();

  const [showPreview, setShowPreview] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showExcelValidationModal, setShowExcelValidationModal] = useState(false);
  const [bulkColumnText, setBulkColumnText] = useState('');
  const [customColumns, setCustomColumns] = useState<LocalColumn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCustomColumn, setNewCustomColumn] = useState({
    columnName: '',
    displayName: '',
    isActive: true
  });

  // Load all columns when product changes
  useEffect(() => {
    if (selectedProduct && user?.tenantId) {
      const loadProductColumns = async () => {
        try {
          setIsLoading(true);
          const configs = await columnConfigService.getColumnConfigurations(user?.tenantId, selectedProduct);

          // Load all columns (both default and custom)
          const allColumns = configs.map((c, idx) => ({
            id: idx + 1,
            columnName: c.column_name,
            displayName: c.display_name,
            isActive: c.is_active,
            isCustom: c.is_custom || false
          }));

          setCustomColumns(allColumns);
        } catch (error) {
          console.error('Error loading columns:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadProductColumns();
    }
  }, [selectedProduct, user?.tenantId]);

  const handleColumnToggle = async (columnId: string | number, isActive: boolean) => {
    try {
      setIsLoading(true);

      // Update local state immediately
      setCustomColumns(prev => prev.map(col =>
        col.id === columnId ? { ...col, isActive } : col
      ));

      // Auto-save to database
      const allColumns = customColumns.map((col, index) => ({
        column_name: col.id === columnId ? col.columnName : col.columnName,
        display_name: col.id === columnId ? col.displayName : col.displayName,
        is_active: col.id === columnId ? isActive : col.isActive,
        is_custom: true,
        column_order: index + 1,
        data_type: 'text'
      }));

      await columnConfigService.saveColumnConfigurations(user?.tenantId, selectedProduct, allColumns);

      const column = customColumns.find(col => col.id === columnId);
      showNotification(notificationHelpers.success(
        'Column Updated',
        `Column "${column?.displayName}" ${isActive ? 'activated' : 'deactivated'} and saved successfully!`
      ));
    } catch (error) {
      // Revert local state on error
      setCustomColumns(prev => prev.map(col =>
        col.id === columnId ? { ...col, isActive: !isActive } : col
      ));
      console.error('Error updating column:', error);
      showNotification(notificationHelpers.error(
        'Update Failed',
        'Column status was changed locally but failed to save. Please try again.'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomColumn = async () => {
    if (!selectedProduct) {
      showNotification(notificationHelpers.error(
        'Product Required',
        'Please select a product before adding columns.'
      ));
      return;
    }

    if (newCustomColumn.columnName && newCustomColumn.displayName) {
      // Check for duplicate columnName in custom columns only
      const existingColumnNames = customColumns.map(col => col.columnName);
      if (existingColumnNames.includes(newCustomColumn.columnName)) {
        showNotification(notificationHelpers.error(
          'Duplicate Column',
          `Column name "${newCustomColumn.columnName}" already exists for this product. Please choose a unique name.`
        ));
        return;
      }

      const newColumn: LocalColumn = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        columnName: newCustomColumn.columnName,
        displayName: newCustomColumn.displayName,
        isActive: newCustomColumn.isActive,
        isCustom: true
      };

      try {
        setIsLoading(true);

        // Add to local state immediately for UI feedback
        setCustomColumns(prev => [...prev, newColumn]);

        // Auto-save to database
        const allColumns = [...customColumns, newColumn].map((col, index) => ({
          column_name: col.columnName,
          display_name: col.displayName,
          is_active: col.isActive,
          is_custom: true,
          column_order: index + 1,
          data_type: 'text'
        }));

        await columnConfigService.saveColumnConfigurations(user?.tenantId, selectedProduct, allColumns);

        setNewCustomColumn({ columnName: '', displayName: '', isActive: true });
        showNotification(notificationHelpers.success(
          'Column Added & Saved',
          `Custom column "${newColumn.displayName}" added and saved successfully!`
        ));
      } catch (error) {
        // Revert local state on error
        setCustomColumns(prev => prev.filter(col => col.id !== newColumn.id));
        console.error('Error saving column:', error);
        showNotification(notificationHelpers.error(
          'Save Failed',
          'Column was added locally but failed to save. Please try again.'
        ));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBulkAddColumns = async () => {
    if (!selectedProduct) {
      showNotification(notificationHelpers.error(
        'Product Required',
        'Please select a product before adding columns.'
      ));
      return;
    }

    if (!bulkColumnText.trim()) {
      showNotification(notificationHelpers.error(
        'No Data',
        'Please enter column data to add.'
      ));
      return;
    }

    const lines = bulkColumnText.trim().split('\n').filter(line => line.trim());
    const newColumns: LocalColumn[] = [];
    const errors: string[] = [];
    const existingColumnNames = customColumns.map(col => col.columnName);

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Support multiple formats:
      // 1. columnName: Display Name
      // 2. columnName, Display Name
      // 3. columnName - Display Name
      let columnName = '';
      let displayName = '';

      if (trimmedLine.includes(':')) {
        [columnName, displayName] = trimmedLine.split(':').map(s => s.trim());
      } else if (trimmedLine.includes(',')) {
        [columnName, displayName] = trimmedLine.split(',').map(s => s.trim());
      } else if (trimmedLine.includes('-')) {
        [columnName, displayName] = trimmedLine.split('-').map(s => s.trim());
      } else {
        // Single value - use as both column name and display name
        columnName = trimmedLine;
        displayName = trimmedLine;
      }

      if (!columnName || !displayName) {
        errors.push(`Line ${index + 1}: Invalid format. Use "columnName: Display Name" or just "columnName"`);
        return;
      }

      // Validate column name format (no spaces, special chars)
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(columnName)) {
        errors.push(`Line ${index + 1}: Invalid column name "${columnName}". Use only letters, numbers, and underscores, starting with a letter.`);
        return;
      }

      // Check for duplicates
      if (existingColumnNames.includes(columnName) || newColumns.some(col => col.columnName === columnName)) {
        errors.push(`Line ${index + 1}: Column name "${columnName}" already exists.`);
        return;
      }

      newColumns.push({
        id: `custom_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
        columnName,
        displayName,
        isActive: true,
        isCustom: true
      });
    });

    if (errors.length > 0) {
      showNotification(notificationHelpers.error(
        'Validation Errors',
        errors.join('\n')
      ));
      return;
    }

    if (newColumns.length === 0) {
      showNotification(notificationHelpers.error(
        'No Valid Columns',
        'No valid columns could be parsed from the input.'
      ));
      return;
    }

    try {
      setIsLoading(true);

      // Add to local state immediately for UI feedback
      setCustomColumns(prev => [...prev, ...newColumns]);

      // Auto-save to database
      const allColumns = [...customColumns, ...newColumns].map((col, index) => ({
        column_name: col.columnName,
        display_name: col.displayName,
        is_active: col.isActive,
        is_custom: true,
        column_order: index + 1,
        data_type: 'text'
      }));

      await columnConfigService.saveColumnConfigurations(user?.tenantId, selectedProduct, allColumns);

      setBulkColumnText('');
      setShowBulkModal(false);

      showNotification(notificationHelpers.success(
        'Bulk Columns Added & Saved',
        `${newColumns.length} custom column${newColumns.length > 1 ? 's' : ''} added and saved successfully!`
      ));
    } catch (error) {
      // Revert local state on error
      setCustomColumns(prev => prev.filter(col => !newColumns.some(newCol => newCol.id === col.id)));
      console.error('Error saving bulk columns:', error);
      showNotification(notificationHelpers.error(
        'Save Failed',
        'Columns were added locally but failed to save. Please try again.'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCustomColumn = (columnId: string | number) => {
    const column = customColumns.find(col => col.id === columnId);
    if (!column) return;

    // Only allow deletion of custom columns, not default ones
    if (!column.isCustom) {
      showNotification(notificationHelpers.error(
        'Cannot Delete Default Column',
        'Default system columns cannot be deleted. You can only deactivate them.'
      ));
      return;
    }

    showConfirmation({
      title: 'Delete Custom Column',
      message: `Are you sure you want to delete the custom column "${column.displayName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          setIsLoading(true);

          // Remove from local state immediately
          setCustomColumns(prev => prev.filter(col => col.id !== columnId));

          // Auto-save to database (only remaining columns)
          const remainingColumns = customColumns
            .filter(col => col.id !== columnId)
            .map((col, index) => ({
              column_name: col.columnName,
              display_name: col.displayName,
              is_active: col.isActive,
              is_custom: col.isCustom || false,
              column_order: index + 1,
              data_type: 'text'
            }));

          await columnConfigService.saveColumnConfigurations(user?.tenantId, selectedProduct, remainingColumns);

          showNotification(notificationHelpers.success(
            'Column Deleted & Saved',
            `Custom column "${column.displayName}" has been deleted and changes saved successfully!`
          ));
        } catch (error) {
          // Revert local state on error
          setCustomColumns(prev => [...prev, column]);
          console.error('Error deleting column:', error);
          showNotification(notificationHelpers.error(
            'Delete Failed',
            'Column was removed locally but failed to save. Please try again.'
          ));
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleSaveConfiguration = async () => {
    if (!selectedProduct || !user?.tenantId) return;

    try {
      setIsLoading(true);
      // Only save custom columns since default columns are handled automatically
      const allColumns = customColumns.map((col, index) => ({
        column_name: col.columnName,
        display_name: col.displayName,
        is_active: col.isActive,
        is_custom: true,
        column_order: index + 1,
        data_type: 'text'
      }));

      await columnConfigService.saveColumnConfigurations(user?.tenantId, selectedProduct, allColumns);
      showNotification(notificationHelpers.success(
        'Configuration Saved',
        'Custom column configuration saved successfully!'
      ));
    } catch (error) {
      console.error('Error saving column configuration:', error);
      showNotification(notificationHelpers.error(
        'Save Failed',
        'Failed to save column configuration'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompany = async (companyName: string) => {
    if (!user?.tenantId) {
      showNotification(notificationHelpers.error(
        'Error',
        'Tenant not found. Please refresh the page.'
      ));
      return;
    }

    if (companyName && companyName.trim()) {
      try {
        await addProduct(companyName.trim(), user?.tenantId);
        showNotification(notificationHelpers.success(
          'Company Added',
          `Company "${companyName}" added successfully!`
        ));
      } catch (error) {
        showNotification(notificationHelpers.error(
          'Failed to Add Company',
          (error instanceof Error ? error.message : 'Unknown error') || 'Failed to add company'
        ));
      }
    }
  };

  const getActiveColumns = () => {
    // Return only active custom columns for the selected product
    return customColumns.filter(col => col.isActive);
  };

  const executeClearAllColumnData = async () => {
    if (!user?.tenantId) {
      showNotification(notificationHelpers.error(
        'Error',
        'Tenant not found. Please refresh the page.'
      ));
      return;
    }

    try {
      setIsLoading(true);
      await columnConfigService.clearAllColumnConfigurations(user?.tenantId);

      // Reset local state - only custom columns since default columns are handled automatically
      setCustomColumns([]);

      // Clear selected product
      setSelectedProduct('');

      showNotification(notificationHelpers.success(
        'All Custom Column Data Cleared',
        'All custom column configurations have been successfully cleared!'
      ));
    } catch (error) {
      console.error('Error clearing column data:', error);
      showNotification(notificationHelpers.error(
        'Clear Failed',
        'Failed to clear column data. Please try again.'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllColumnData = async () => {
    if (!user?.tenantId) {
      showNotification(notificationHelpers.error(
        'Error',
        'Tenant not found. Please refresh the page.'
      ));
      return;
    }

    setShowClearModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Column Management</h2>
          <p className="text-sm text-gray-600 mt-1">Add and manage custom columns for each product</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowExcelValidationModal(true)}
            disabled={!selectedProduct}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            title={!selectedProduct ? "Select a product first" : "Validate Excel columns and auto-configure"}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Validation
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleClearAllColumnData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-300"
            title="Clear all column data for this tenant"
          >
            <RotateCcw className="w-4 h-4" />
            {isLoading ? 'Clearing...' : 'Clear All Data'}
          </button>
          <button
            onClick={handleSaveConfiguration}
            disabled={isLoading || !selectedProduct}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
            title={!selectedProduct ? "Select a product first" : "All changes are auto-saved, but you can manually save if needed"}
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : 'Save Configuration (Auto-saved)'}
          </button>
        </div>
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-end space-x-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <div className="relative">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {products.length > 0 ? (
                  products.map((product) => (
                    <option key={product} value={product}>{product}</option>
                  ))
                ) : (
                  <option disabled>Loading products...</option>
                )}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Building2 className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddCompanyModal(true)}
              className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Add Product"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              onClick={async () => {
                if (!user?.tenantId) {
                  showNotification(notificationHelpers.error(
                    'Error',
                    'Tenant not found. Please refresh the page.'
                  ));
                  return;
                }

                showConfirmation({
                  title: 'Delete Product',
                  message: `Are you sure you want to delete product "${selectedProduct}"? This will remove all associated configurations.`,
                  confirmText: 'Delete',
                  cancelText: 'Cancel',
                  type: 'danger',
                  onConfirm: async () => {
                    try {
                      await deleteProduct(selectedProduct, user?.tenantId);
                      showNotification(notificationHelpers.success(
                        'Product Deleted',
                        `Product "${selectedProduct}" deleted successfully!`
                      ));
                    } catch (error) {
                      showNotification(notificationHelpers.error(
                        'Failed to Delete Product',
                        (error instanceof Error ? error.message : 'Unknown error') || 'Failed to delete product'
                      ));
                    }
                  }
                });
              }}
              className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Delete Product"
              disabled={!selectedProduct}
            >
              <UserMinus className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                showNotification(notificationHelpers.info(
                  'Product Details',
                  `Product: ${selectedProduct}\nStatus: Active\nLocation: N/A\nEmployees: N/A`
                ));
                console.log('View product details:', selectedProduct);
              }}
              className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="View Product"
              disabled={!selectedProduct}
            >
              <ViewIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Columns Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-purple-600" />
            Custom Columns for {selectedProduct || 'Selected Product'}
          </h4>
          <p className="text-gray-600 mt-1">Add and manage custom columns specific to this product</p>
        </div>
        <div className="p-6">
          {/* Add Custom Column Form */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Column Name</label>
                <input
                  type="text"
                  value={newCustomColumn.columnName}
                  onChange={(e) => setNewCustomColumn({ ...newCustomColumn, columnName: e.target.value })}
                  placeholder="e.g., branchCode"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  value={newCustomColumn.displayName}
                  onChange={(e) => setNewCustomColumn({ ...newCustomColumn, displayName: e.target.value })}
                  placeholder="e.g., Branch Code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleAddCustomColumn}
                  disabled={!selectedProduct || !newCustomColumn.columnName || !newCustomColumn.displayName}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title={!selectedProduct ? "Select a product first" : ""}
                >
                  Add Column
                </button>
                <button
                  onClick={() => setShowBulkModal(true)}
                  disabled={!selectedProduct}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                  title={!selectedProduct ? "Select a product first" : "Bulk add multiple columns"}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Bulk Add
                </button>
              </div>
            </div>
          </div>

          {/* All Columns List */}
          {customColumns.length > 0 ? (
            <div className="space-y-4">
              {/* Default Columns */}
              {customColumns.filter(col => !col.isCustom).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Columns className="w-4 h-4 mr-2 text-green-600" />
                    Default Columns
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customColumns.filter(col => !col.isCustom).map((column, index) => (
                      <div key={column.id || index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={column.isActive}
                            onChange={(e) => handleColumnToggle(column.id, e.target.checked)}
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate" title={column.displayName}>{column.displayName}</p>
                            <p className="text-xs text-gray-500 truncate" title={column.columnName}>{column.columnName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Default
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${column.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {column.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Columns */}
              {customColumns.filter(col => col.isCustom).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Plus className="w-4 h-4 mr-2 text-purple-600" />
                    Custom Columns
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customColumns.filter(col => col.isCustom).map((column, index) => (
                      <div key={column.id || index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={column.isActive}
                            onChange={(e) => handleColumnToggle(column.id, e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate" title={column.displayName}>{column.displayName}</p>
                            <p className="text-xs text-gray-500 truncate" title={column.columnName}>{column.columnName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            Custom
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${column.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {column.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => handleRemoveCustomColumn(column.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete custom column"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Columns className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{selectedProduct ? 'No columns configured yet for this product' : 'Select a product to view columns'}</p>
              <p className="text-sm">{selectedProduct ? 'Columns will appear here once configured' : 'Choose a product from the dropdown above'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              Live Preview - Custom Columns for {selectedProduct || 'Selected Product'}
            </h4>
            <p className="text-gray-600 mt-1">Preview of custom columns that will be available to telecallers</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {getActiveColumns().map((column, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {column.displayName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    {getActiveColumns().map((column, index) => (
                      <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {column.columnName === 'actions' ? (
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 text-xs">Call</button>
                            <button className="text-green-600 hover:text-green-900 text-xs">Update</button>
                            <button className="text-purple-600 hover:text-purple-900 text-xs">View</button>
                          </div>
                        ) : (
                          'Sample Data'
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Configuration Summary for {selectedProduct || 'No Product Selected'}</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{customColumns.filter(c => !c.isCustom).length}</div>
            <div className="text-sm text-gray-600">Default Columns</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{customColumns.filter(c => !c.isCustom && c.isActive).length}</div>
            <div className="text-sm text-gray-600">Active Default</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{customColumns.filter(c => c.isCustom).length}</div>
            <div className="text-sm text-gray-600">Custom Columns</div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{customColumns.filter(c => c.isCustom && c.isActive).length}</div>
            <div className="text-sm text-gray-600">Active Custom</div>
          </div>
        </div>
      </div>

      {/* Add Company Modal */}
      <PromptModal
        isOpen={showAddCompanyModal}
        onClose={() => setShowAddCompanyModal(false)}
        onConfirm={handleAddCompany}
        title="Add New Product"
        message="Enter the name of the new product to add to your column configuration."
        placeholder="e.g., IDFC, HDFC Bank, ICICI Bank"
        confirmText="Add Product"
        cancelText="Cancel"
        required={true}
        validation={(value: string) => {
          if (value.trim().length < 2) {
            return 'Company name must be at least 2 characters long';
          }
          // Use only products from Supabase as single source of truth
          console.log('Validation check:', {
            input: value.trim(),
            products,
            exists: products.includes(value.trim())
          });
          if (products.includes(value.trim())) {
            return 'Product name already exists';
          }
          return null;
        }}
      />

      {/* Clear All Column Data Confirmation Modal */}
      <ClearAllDataModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={executeClearAllColumnData}
        isLoading={isLoading}
      />

      {/* Excel Validation Modal */}
      <ExcelValidationModal
        isOpen={showExcelValidationModal}
        onClose={() => setShowExcelValidationModal(false)}
        user={user}
        selectedProduct={selectedProduct}
        onConfigurationUpdated={() => {
          // Reload custom columns after configuration update
          if (selectedProduct && user?.tenantId) {
            const loadProductColumns = async () => {
              try {
                const configs = await columnConfigService.getColumnConfigurations(user.tenantId, selectedProduct);
                const customConfigs = configs.filter(c => c.is_custom);
                setCustomColumns(customConfigs.map((c, idx) => ({
                  id: idx + 1,
                  columnName: c.column_name,
                  displayName: c.display_name,
                  isActive: c.is_active,
                  isCustom: true
                })));
              } catch (error) {
                console.error('Error reloading columns:', error);
              }
            };
            loadProductColumns();
          }
        }}
      />

      {/* Bulk Add Columns Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <Upload className="w-6 h-6 text-white mr-3" />
                <div>
                  <h3 className="text-xl font-bold text-white">Bulk Add Custom Columns</h3>
                  <p className="text-sm text-indigo-100">Add multiple columns at once</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Column Definitions
                </label>
                <textarea
                  value={bulkColumnText}
                  onChange={(e) => setBulkColumnText(e.target.value)}
                  placeholder={`Enter columns in one of these formats (one per line):

Format 1: columnName: Display Name
branchCode: Branch Code
regionName: Region Name

Format 2: columnName, Display Name
branchCode, Branch Code
regionName, Region Name

Format 3: columnName - Display Name
branchCode - Branch Code
regionName - Region Name

Or just column names (will use same for display):
branchCode
regionName`}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Each line represents one column. Supports multiple formats for column name and display name separation.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setBulkColumnText('');
                    setShowBulkModal(false);
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkAddColumns}
                  disabled={!bulkColumnText.trim()}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Add Columns
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};