import React from 'react';
import { BarChart3, FileText, TrendingUp } from 'lucide-react';

export const ReportsComponent: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Reports & Analytics
          </h3>
          <p className="text-sm text-gray-600 mt-1">Generate comprehensive reports on team performance and case recovery</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-lg flex flex-col items-center justify-center transition-colors">
              <FileText className="w-8 h-8 mb-3" />
              <span className="font-medium">Performance Report</span>
              <span className="text-sm opacity-90 mt-1">Team performance metrics</span>
            </button>
            
            <button className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg flex flex-col items-center justify-center transition-colors">
              <BarChart3 className="w-8 h-8 mb-3" />
              <span className="font-medium">Recovery Analytics</span>
              <span className="text-sm opacity-90 mt-1">Case recovery insights</span>
            </button>
            
            <button className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg flex flex-col items-center justify-center transition-colors">
              <TrendingUp className="w-8 h-8 mb-3" />
              <span className="font-medium">Team Metrics</span>
              <span className="text-sm opacity-90 mt-1">Detailed team analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};