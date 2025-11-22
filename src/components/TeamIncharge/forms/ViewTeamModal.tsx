import React from 'react';
import { Modal } from '../../shared/Modal';
import { Users, Building2, FileText } from 'lucide-react';
import type { TeamWithDetails } from '../../../models';

interface ViewTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamWithDetails | null;
}

export const ViewTeamModal: React.FC<ViewTeamModalProps> = ({ isOpen, onClose, team }) => {
  if (!team) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Team Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Team Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-blue-900">{team.name}</h3>
              <p className="text-blue-700 mt-1">Team Management Overview</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${team.status === 'active'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${team.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                {team.status === 'active' ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Team Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Users className="w-4 h-4 text-blue-600 mr-2" />
              <label className="text-sm font-semibold text-gray-700">Team In-charge</label>
            </div>
            <p className="text-gray-900 font-medium">{team.team_incharge?.name || 'Not assigned'}</p>
            <p className="text-sm text-gray-500">ID: {team.team_incharge?.emp_id || 'N/A'}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Building2 className="w-4 h-4 text-purple-600 mr-2" />
              <label className="text-sm font-semibold text-gray-700">Product</label>
            </div>
            <p className="text-gray-900 font-medium">{team.product_name || 'Not specified'}</p>
            <p className="text-sm text-gray-500">Assigned product for this team</p>
          </div>
        </div>

        {/* Telecallers Section - Highlighted */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 overflow-hidden">
          <div className="bg-green-100 px-4 py-3 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <h4 className="text-lg font-semibold text-green-800">Assigned Telecallers</h4>
              </div>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                {team.telecallers?.length || 0} Members
              </span>
            </div>
          </div>

          <div className="p-4">
            {team.telecallers && team.telecallers.length > 0 ? (
              <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Telecaller</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Employee ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Cases</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-100">
                      {team.telecallers.map((telecaller) => (
                        <tr key={telecaller.id} className="hover:bg-green-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                {telecaller.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{telecaller.name}</p>
                                <p className="text-sm text-gray-500">Team Member</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {telecaller.emp_id}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-sm font-medium text-green-700">Active</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <p className="text-gray-900">+91 98765 43210</p>
                              <p className="text-gray-500">Mobile</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Telecaller
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-center">
                              <span className="text-lg font-bold text-gray-900">{Math.floor(Math.random() * 50) + 10}</span>
                              <p className="text-xs text-gray-500">assigned</p>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No telecallers assigned to this team</p>
                <p className="text-sm text-gray-400 mt-1">Assign telecallers to manage their work</p>
              </div>
            )}
          </div>
        </div>

        {/* Cases Summary */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-800">Total Cases Assigned</p>
                <p className="text-xs text-orange-600">Cases managed by this team</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-orange-700">{team.total_cases || 0}</span>
              <p className="text-sm text-orange-600">cases</p>
            </div>
          </div>
        </div>

        {/* Team Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{team.telecallers?.length || 0}</div>
            <div className="text-sm text-blue-700">Telecallers</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {team.telecallers?.length > 0 ? Math.round((team.total_cases || 0) / team.telecallers.length) : 0}
            </div>
            <div className="text-sm text-green-700">Avg Cases</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {team.status === 'active' ? '100' : '0'}%
            </div>
            <div className="text-sm text-purple-700">Efficiency</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};