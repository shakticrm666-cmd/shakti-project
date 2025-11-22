import React from 'react';
import { FileText } from 'lucide-react';

export const ReportsSection: React.FC = () => {
  return (
    <div>
      <div className="flex items-center mb-6">
        <FileText className="w-6 h-6 mr-3 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reports Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">View performance reports and analytics</p>
        </div>
      </div>

      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports & Analytics</h3>
        <p className="text-gray-600">Reports and analytics functionality will be implemented here.</p>
      </div>
    </div>
  );
};