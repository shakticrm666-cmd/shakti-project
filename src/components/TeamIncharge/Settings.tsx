import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <SettingsIcon className="w-5 h-5 mr-2 text-blue-600" />
            Settings
          </h3>
          <p className="text-sm text-gray-600 mt-1">Configure your dashboard preferences and system settings</p>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Column Configuration</h4>
                <p className="text-sm text-gray-600 mb-4">Customize the data fields displayed in your case management tables.</p>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">
                  Configure Fields
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Notification Settings</h4>
                <p className="text-sm text-gray-600 mb-4">Manage email and in-app notification preferences.</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                  Manage Notifications
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">User Preferences</h4>
                <p className="text-sm text-gray-600 mb-4">Set up your personal dashboard preferences and themes.</p>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                  Edit Preferences
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">System Configuration</h4>
                <p className="text-sm text-gray-600 mb-4">Configure system-wide settings and integrations.</p>
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm">
                  System Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};