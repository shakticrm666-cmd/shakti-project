// ColumnValidationModal.tsx - Fixed implementation
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, AlertTriangle, CheckCircle, Plus, Settings } from 'lucide-react';
import { columnConfigService, ColumnConfiguration } from '../../../services/columnConfigService';
import { useNotification, notificationHelpers } from '../../shared/Notification';

interface ColumnValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  productName: string;
  onConfigurationFixed: () => void;
}

export const ColumnValidationModal: React.FC<ColumnValidationModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  productName,
  onConfigurationFixed,
}) => {
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [columns, setColumns] = useState<ColumnConfiguration[]>([]);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);

  // Required columns are static, memoize to avoid changing reference each render
  const requiredColumns = useMemo(
    () => [
      { column_name: 'customerName', display_name: 'Customer Name', data_type: 'text' },
      { column_name: 'loanId', display_name: 'Loan ID', data_type: 'text' },
    ],
    []
  );

  const loadColumns = useCallback(async () => {
    if (!tenantId || !productName) return;
    try {
      setIsLoading(true);
      console.log('🔍 ColumnValidationModal: Loading columns for tenant:', tenantId, 'product:', productName);
      const configs = await columnConfigService.getColumnConfigurations(tenantId, productName);
      console.log('🔍 ColumnValidationModal: Raw configs from database:', configs);
      console.log('🔍 ColumnValidationModal: Column names found:', configs.map(c => c.column_name));
      console.log('🔍 ColumnValidationModal: Display names found:', configs.map(c => c.display_name));
      setColumns(configs);

      // Determine missing required columns
      const missing = requiredColumns
        .filter(req => !configs.some(col => col.column_name === req.column_name))
        .map(req => req.column_name);
      console.log('🔍 ColumnValidationModal: Missing columns:', missing);
      setMissingColumns(missing);
    } catch (error) {
      console.error('Error loading columns:', error);
      showNotification(
        notificationHelpers.error('Error', 'Failed to load column configuration')
      );
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, productName, showNotification, requiredColumns]);

  useEffect(() => {
    if (isOpen && tenantId && productName) {
      loadColumns();
    }
  }, [isOpen, tenantId, productName, loadColumns]);

  const addMissingColumn = async (columnName: string) => {
    const columnDef = requiredColumns.find(c => c.column_name === columnName);
    if (!columnDef) return;
    try {
      setIsLoading(true);
      const newColumn: Omit<ColumnConfiguration, 'id' | 'tenant_id' | 'product_name'> = {
        column_name: columnDef.column_name,
        display_name: columnDef.display_name,
        is_active: true,
        is_custom: false,
        column_order: columns.length + 1,
        data_type: columnDef.data_type,
      };
      const updatedColumns = [...columns, { ...newColumn, tenant_id: tenantId, product_name: productName } as ColumnConfiguration];
      await columnConfigService.saveColumnConfigurations(tenantId, productName, updatedColumns.map(c => ({
        column_name: c.column_name,
        display_name: c.display_name,
        is_active: c.is_active,
        is_custom: c.is_custom,
        column_order: c.column_order,
        data_type: c.data_type,
      })));
      setColumns(updatedColumns);
      setMissingColumns(prev => prev.filter(col => col !== columnName));
      showNotification(
        notificationHelpers.success('Column Added', `Required column "${columnDef.display_name}" has been added and activated.`)
      );
      if (missingColumns.length <= 1) {
        onConfigurationFixed();
        onClose();
      }
    } catch (error) {
      console.error('Error adding column:', error);
      showNotification(
        notificationHelpers.error('Error', 'Failed to add required column')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activateColumn = async (columnName: string) => {
    try {
      setIsLoading(true);
      const updatedColumns = columns.map(col =>
        col.column_name === columnName ? { ...col, is_active: true } : col
      );
      await columnConfigService.saveColumnConfigurations(tenantId, productName, updatedColumns.map(c => ({
        column_name: c.column_name,
        display_name: c.display_name,
        is_active: c.column_name === columnName ? true : c.is_active,
        is_custom: c.is_custom,
        column_order: c.column_order,
        data_type: c.data_type,
      })));
      setColumns(updatedColumns);
      setMissingColumns(prev => prev.filter(col => col !== columnName));
      showNotification(
        notificationHelpers.success('Column Activated', `Required column has been activated.`)
      );
      if (missingColumns.length <= 1) {
        onConfigurationFixed();
        onClose();
      }
    } catch (error) {
      console.error('Error activating column:', error);
      showNotification(
        notificationHelpers.error('Error', 'Failed to activate required column')
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-white mr-3" />
            <div>
              <h3 className="text-xl font-bold text-white">Fix Column Configuration</h3>
              <p className="text-sm text-red-100">Required columns are missing or inactive</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-red-900 font-medium mb-2">Configuration Issue</h4>
                  <p className="text-red-700 text-sm">
                    Your product "{productName}" is missing required columns that are needed for Excel template generation.
                    These columns are essential for case management and must be present and active.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Required Columns Status:</h5>
              {requiredColumns.map(req => {
                const existingColumn = columns.find(col => col.column_name === req.column_name);
                const isMissing = !existingColumn;
                const isInactive = existingColumn && !existingColumn.is_active;
                return (
                  <div key={req.column_name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {isMissing ? (
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-red-600" />
                        </div>
                      ) : isInactive ? (
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Settings className="w-4 h-4 text-yellow-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{req.display_name}</p>
                        <p className="text-sm text-gray-500">{req.column_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isMissing && (
                        <button
                          onClick={() => addMissingColumn(req.column_name)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </button>
                      )}
                      {isInactive && (
                        <button
                          onClick={() => activateColumn(req.column_name)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Activate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
              Cancel
            </button>
            {missingColumns.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  onConfigurationFixed();
                  onClose();
                }}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Configuration Fixed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};