import { useState, useCallback } from 'react';

export const useTabs = (defaultTab: string = '') => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const changeTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const resetTab = useCallback(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  return {
    activeTab,
    setActiveTab: changeTab,
    resetTab,
  };
};