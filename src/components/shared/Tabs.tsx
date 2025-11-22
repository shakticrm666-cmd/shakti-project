import React from 'react';
import type { TabConfig } from '../../types';

interface TabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-green-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white'
          }`}
          aria-pressed={activeTab === tab.id}
        >
          {tab.icon && <tab.icon className="w-4 h-4 mr-2" />}
          {tab.label}
          {tab.badge && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};