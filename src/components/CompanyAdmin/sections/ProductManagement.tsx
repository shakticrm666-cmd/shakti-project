import React from 'react';
import { Briefcase } from 'lucide-react';

export const ProductManagement: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage products and their configurations</p>
        </div>
      </div>

      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Management</h3>
        <p className="text-gray-600">Product management functionality will be implemented here.</p>
      </div>
    </div>
  );
};