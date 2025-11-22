import { useState, useEffect, useCallback } from 'react';
import { columnConfigService, type ColumnConfiguration } from '../services/columnConfigService';

export const useColumnConfig = (tenantId?: string) => {
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadColumnConfigs = useCallback(async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      setError(null);
      const configs = await columnConfigService.getActiveColumnConfigurations(tenantId);
      setColumnConfigs(configs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load column configurations';
      setError(errorMessage);
      console.error('Error loading column configurations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      loadColumnConfigs();
    }
  }, [tenantId, loadColumnConfigs]);

  return {
    columnConfigs,
    isLoading,
    error,
    loadColumnConfigs,
  };
};