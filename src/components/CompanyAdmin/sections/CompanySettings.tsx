import React from 'react';
import { Settings } from 'lucide-react';

export const CompanySettings: React.FC = () => {
  return (
    <div>
      <div className="flex items-center mb-6">
        <Settings className="w-6 h-6 mr-3 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Company Settings</h2>
          <p className="text-sm text-gray-600 mt-1">Manage company information and preferences</p>
        </div>
      </div>

      <div className="text-center py-12">
        <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Settings</h3>
        <p className="text-gray-600">Company settings and preferences will be available here.</p>
      </div>
    </div>
  );
};