import React from 'react';
import { Users, FileText, Phone, Target, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3 mr-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Teams</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3 mr-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Telecallers</p>
              <p className="text-2xl font-bold text-gray-900">48</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3 mr-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Cases</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-lg p-3 mr-4">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Calls Today</p>
              <p className="text-2xl font-bold text-gray-900">234</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance and Case Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Today</h3>
          <div className="space-y-4">
            {[
              { name: 'Team Alpha', members: 8, cases: 45, success: 78 },
              { name: 'Team Beta', members: 6, cases: 32, success: 82 },
              { name: 'Team Gamma', members: 7, cases: 38, success: 75 },
              { name: 'Team Delta', members: 5, cases: 28, success: 85 }
            ].map((team, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{team.name}</h4>
                  <span className="text-sm font-semibold text-green-600">{team.success}%</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                  <div><p className="font-medium">Telecallers: {team.members}</p></div>
                  <div><p className="font-medium">Cases: {team.cases}</p></div>
                  <div><p className="font-medium">Status: Active</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Status Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-500 mr-3" />
                <span className="font-medium text-gray-900">Pending Cases</span>
              </div>
              <span className="text-xl font-bold text-blue-600">67</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-yellow-500 mr-3" />
                <span className="font-medium text-gray-900">In Progress</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">89</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium text-gray-900">Resolved Today</span>
              </div>
              <span className="text-xl font-bold text-green-600">34</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-red-500 mr-3" />
                <span className="font-medium text-gray-900">High Priority</span>
              </div>
              <span className="text-xl font-bold text-red-600">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};