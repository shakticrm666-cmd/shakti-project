import { useState, useEffect, useCallback } from 'react';
import { columnConfigService, ColumnConfiguration } from '../services/columnConfigService';

interface Column {
  id: string | number;
  columnName: string;
  displayName: string;
  isActive: boolean;
}

export const useCustomColumns = (tenantId: string, selectedProduct: string) => {
  const [columns, setColumns] = useState<Column[]>([
    { id: '1', columnName: 'customerName', displayName: 'Customer Name', isActive: true },
    { id: '2', columnName: 'loanId', displayName: 'Loan ID', isActive: true },
    { id: '3', columnName: 'loanAmount', displayName: 'Loan Amount', isActive: true },
    { id: '4', columnName: 'mobileNo', displayName: 'Mobile No', isActive: true },
    { id: '5', columnName: 'dpd', displayName: 'DPD', isActive: true },
    { id: '6', columnName: 'outstanding', displayName: 'Outstanding', isActive: true },
    { id: '7', columnName: 'posAmount', displayName: 'POS Amount', isActive: true },
    { id: '8', columnName: 'emiAmount', displayName: 'EMI Amount', isActive: true },
    { id: '9', columnName: 'pendingDues', displayName: 'Pending Dues', isActive: true },
    { id: '10', columnName: 'paymentLink', displayName: 'Payment Link', isActive: true },
    { id: '11', columnName: 'branchName', displayName: 'Branch Name', isActive: true },
    { id: '12', columnName: 'loanType', displayName: 'Loan Type', isActive: true },
    { id: '13', columnName: 'actions', displayName: 'Actions', isActive: true }
  ]);

  const [customColumns, setCustomColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load columns when selectedProduct changes
  useEffect(() => {
    const loadColumns = async () => {
      if (!tenantId) return;

      try {
        setIsLoading(true);
        const config = await columnConfigService.getColumnConfigurations(tenantId, selectedProduct);
        if (config.length > 0) {
          const defaultCols = config.filter(c => !c.is_custom);
          const customCols = config.filter(c => c.is_custom);
          setColumns(defaultCols.map(c => ({
            id: c.id || 'temp',
            columnName: c.column_name,
            displayName: c.display_name,
            isActive: c.is_active
          })));
          setCustomColumns(customCols.map(c => ({
            id: c.id || 'temp',
            columnName: c.column_name,
            displayName: c.display_name,
            isActive: c.is_active
          })));
        } else {
          // Initialize default columns if none exist
          await columnConfigService.initializeDefaultColumns(tenantId, selectedProduct);
          // Reload after initialization
          const newConfig = await columnConfigService.getColumnConfigurations(tenantId, selectedProduct);
          const defaultCols = newConfig.filter(c => !c.is_custom);
          setColumns(defaultCols.map(c => ({
            id: c.id || 'temp',
            columnName: c.column_name,
            displayName: c.display_name,
            isActive: c.is_active
          })));
          setCustomColumns([]);
        }
      } catch (error) {
        console.error('Error loading columns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadColumns();
  }, [selectedProduct, tenantId]);

  const toggleColumn = useCallback((index: number, isActive: boolean) => {
    setColumns(prev => prev.map((col, i) =>
      i === index ? { ...col, isActive } : col
    ));
  }, []);

  const updateColumnName = useCallback((index: number, displayName: string) => {
    setColumns(prev => prev.map((col, i) =>
      i === index ? { ...col, displayName } : col
    ));
  }, []);

  const toggleCustomColumn = useCallback((index: number, isActive: boolean) => {
    setCustomColumns(prev => prev.map((col, i) =>
      i === index ? { ...col, isActive } : col
    ));
  }, []);

  const addCustomColumn = useCallback((columnName: string, displayName: string) => {
    // Check for duplicate columnName
    const existingColumnNames = [...columns, ...customColumns].map(col => col.columnName);
    if (existingColumnNames.includes(columnName)) {
      throw new Error(`Column name "${columnName}" already exists. Please choose a unique name.`);
    }

    const newColumn = {
      columnName,
      displayName,
      isActive: true,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setCustomColumns(prev => [...prev, newColumn]);
  }, [columns, customColumns]);

  const removeCustomColumn = useCallback((index: number) => {
    setCustomColumns(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getActiveColumns = useCallback(() => {
    const activeDefaults = columns.filter(col => col.isActive);
    const activeCustoms = customColumns.filter(col => col.isActive);
    return [...activeDefaults, ...activeCustoms];
  }, [columns, customColumns]);

  const updateColumnsFromDatabase = useCallback((configs: ColumnConfiguration[]) => {
    const defaultCols = configs.filter(c => !c.is_custom).map((c, idx) => ({
      id: idx + 1,
      columnName: c.column_name,
      displayName: c.display_name,
      isActive: c.is_active
    }));

    const customCols = configs.filter(c => c.is_custom).map((c, idx) => ({
      id: configs.filter(conf => !conf.is_custom).length + idx + 1,
      columnName: c.column_name,
      displayName: c.display_name,
      isActive: c.is_active
    }));

    setColumns(defaultCols);
    setCustomColumns(customCols);
  }, []);

  const loadColumnConfigurations = useCallback(async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      const configs = await columnConfigService.getColumnConfigurations(tenantId, selectedProduct);

      if (configs.length === 0) {
        await columnConfigService.initializeDefaultColumns(tenantId, selectedProduct);
        const defaultConfigs = await columnConfigService.getColumnConfigurations(tenantId, selectedProduct);
        updateColumnsFromDatabase(defaultConfigs);
      } else {
        updateColumnsFromDatabase(configs);
      }
    } catch (error) {
      console.error('Error loading column configurations:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, selectedProduct, updateColumnsFromDatabase]);



  const saveColumnConfiguration = useCallback(async () => {
    try {
      setIsLoading(true);

      const allColumns = [
        ...columns.map((col, index) => ({
          column_name: col.columnName,
          display_name: col.displayName,
          is_active: col.isActive,
          is_custom: false,
          column_order: index + 1,
          data_type: 'text'
        })),
        ...customColumns.map((col, index) => ({
          column_name: col.columnName,
          display_name: col.displayName,
          is_active: col.isActive,
          is_custom: true,
          column_order: columns.length + index + 1,
          data_type: 'text'
        }))
      ];

      // Remove duplicates based on column_name
      const uniqueColumns = allColumns.filter((col, index, self) =>
        index === self.findIndex(c => c.column_name === col.column_name)
      );

      if (tenantId) {
        await columnConfigService.saveColumnConfigurations(tenantId, selectedProduct, uniqueColumns);
      }
    } catch (error) {
      console.error('Error saving column configuration:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [columns, customColumns, tenantId, selectedProduct]);

  return {
    columns,
    customColumns,
    isLoading,
    toggleColumn,
    updateColumnName,
    toggleCustomColumn,
    addCustomColumn,
    removeCustomColumn,
    getActiveColumns,
    loadColumnConfigurations,
    saveColumnConfiguration,
  };
};