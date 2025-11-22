import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { CreateTeam } from './CreateTeam';
import { EditTeamModal } from './forms/EditTeamModal';
import { Modal } from '../shared/Modal';
import { TeamService } from '../../services/teamService';
import { TeamWithDetails } from '../../models';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useNotification, notificationHelpers } from '../shared/Notification';
import { useAuth } from '../../contexts/AuthContext';

export const Teams: React.FC = () => {
  const { user } = useAuth();
  const { showConfirmation } = useConfirmation();
  const { showNotification } = useNotification();
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showViewTeamModal, setShowViewTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(null);

  const loadTeams = useCallback(async () => {
    if (!user?.tenantId) {
      console.warn('Tenant ID not available, cannot load teams');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading teams for tenant:', user.tenantId);
      const teamsData = await TeamService.getTeams(user.tenantId);
      console.log('Teams loaded successfully:', teamsData.length, 'teams');
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
      showNotification(notificationHelpers.error(
        'Failed to Load Teams',
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId, showNotification]);

  useEffect(() => {
    if (user?.tenantId) {
      loadTeams();
    }
  }, [user?.tenantId, loadTeams]);

  const handleTeamCreated = () => {
    loadTeams();
  };

  const handleViewTeam = (team: TeamWithDetails) => {
    setSelectedTeam(team);
    setShowViewTeamModal(true);
  };

  const handleEditTeam = (team: TeamWithDetails) => {
    setSelectedTeam(team);
    setShowEditTeamModal(true);
  };

  const handleDeleteTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    try {
      // Get deletion impact information
      const impact = await TeamService.getTeamDeletionImpact(teamId);

      // Build detailed warning message
      const impactDetails = [
        `Team: ${team.name}`,
        `Telecallers to be unassigned: ${impact.telecallerCount}`,
        `Customer cases to be deleted: ${impact.caseCount}`,
        `Call logs to be deleted: ${impact.callLogCount}`
      ].join('\n');

      const warningMessage = impact.caseCount > 0
        ? `WARNING: This action will permanently delete:\n\n${impactDetails}\n\nThis action CANNOT be undone. All case data and call history will be permanently lost.`
        : `This will unassign ${impact.telecallerCount} telecaller(s) from the team.\n\nThe team has no cases assigned, so no case data will be lost.`;

      showConfirmation({
        title: 'Delete Team - Confirm Permanent Deletion',
        message: warningMessage,
        confirmText: 'Delete Permanently',
        cancelText: 'Cancel',
        type: 'danger',
        onConfirm: async () => {
          try {
            await TeamService.deleteTeam(teamId);
            loadTeams();
            showNotification(notificationHelpers.success(
              'Team Deleted',
              `Team "${team.name}" and all related data have been permanently deleted.`
            ));
          } catch (error) {
            console.error('Error deleting team:', error);
            showNotification(notificationHelpers.error(
              'Delete Failed',
              error instanceof Error ? error.message : 'Failed to delete team. Please try again.'
            ));
          }
        }
      });
    } catch (error) {
      console.error('Error getting deletion impact:', error);
      showNotification(notificationHelpers.error(
        'Error',
        'Failed to load team information. Please try again.'
      ));
    }
  };

  const handleToggleStatus = async (teamId: string) => {
    try {
      await TeamService.toggleTeamStatus(teamId);
      loadTeams();
      showNotification(notificationHelpers.success(
        'Status Updated',
        'Team status has been updated successfully.'
      ));
    } catch (error) {
      console.error('Error toggling team status:', error);
      showNotification(notificationHelpers.error(
        'Update Failed',
        'Failed to update team status. Please try again.'
      ));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Teams
              </h3>
              <p className="text-sm text-gray-600 mt-1">Manage your teams and their assignments</p>
            </div>
            <button
              onClick={() => setShowCreateTeamModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No teams created yet</h4>
              <p className="text-gray-600 mb-4">Create your first team to get started with team management.</p>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Create Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div key={team.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{team.name}</h4>
                      <p className="text-sm text-gray-600">In-charge: {team.team_incharge?.name || 'Not assigned'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${team.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {team.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(team.id)}
                        className={`text-sm px-3 py-1 rounded font-medium ${team.status === 'active'
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        title={team.status === 'active' ? 'Deactivate Team' : 'Activate Team'}
                      >
                        {team.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Product:</p>
                      <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {team.product_name || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Telecallers ({team.telecallers?.length || 0})</p>
                      <div className="max-h-20 overflow-y-auto">
                        {team.telecallers && team.telecallers.length > 0 ? (
                          <div className="space-y-1">
                            {team.telecallers.map((telecaller) => (
                              <div key={telecaller.id} className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                                {telecaller.name} ({telecaller.emp_id})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No telecallers assigned</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Total Cases:</span>
                      <span className="text-lg font-bold text-green-600">{team.total_cases || 0}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => handleViewTeam(team)}
                      className="text-blue-600 hover:text-blue-900 text-sm p-2 rounded"
                      title="View Team Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditTeam(team)}
                      className="text-green-600 hover:text-green-900 text-sm p-2 rounded"
                      title="Edit Team"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-red-600 hover:text-red-900 text-sm p-2 rounded"
                      title="Delete Team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      <CreateTeam
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onTeamCreated={handleTeamCreated}
      />

      {/* View Team Modal */}
      <Modal
        isOpen={showViewTeamModal}
        onClose={() => {
          setShowViewTeamModal(false);
          setSelectedTeam(null);
        }}
        title="Team Details"
        size="lg"
      >
        {selectedTeam && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">{selectedTeam.name}</h3>
              <p className="text-gray-600">Team Management Overview</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${selectedTeam.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {selectedTeam.status === 'active' ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Team In-charge</h4>
                <p className="text-gray-900">{selectedTeam.team_incharge?.name || 'Not assigned'}</p>
                <p className="text-sm text-gray-500">ID: {selectedTeam.team_incharge?.emp_id || 'N/A'}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Product</h4>
                <p className="text-gray-900">{selectedTeam.product_name || 'Not specified'}</p>
                <p className="text-sm text-gray-500">Assigned product for this team</p>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
              <h4 className="text-lg font-semibold text-green-800 mb-3">
                Assigned Telecallers ({selectedTeam.telecallers?.length || 0})
              </h4>
              {selectedTeam.telecallers && selectedTeam.telecallers.length > 0 ? (
                <div className="space-y-2">
                  {selectedTeam.telecallers.map((telecaller) => (
                    <div key={telecaller.id} className="bg-white rounded p-2 border border-green-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {telecaller.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{telecaller.name}</p>
                          <p className="text-sm text-gray-500">{telecaller.emp_id} - Team Member</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No telecallers assigned to this team</p>
              )}
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <span className="text-2xl font-bold text-orange-700">{selectedTeam.total_cases || 0}</span>
              <p className="text-orange-600">Total Cases Assigned</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Team Modal */}
      <EditTeamModal
        isOpen={showEditTeamModal}
        onClose={() => {
          setShowEditTeamModal(false);
          setSelectedTeam(null);
        }}
        onTeamUpdated={loadTeams}
        team={selectedTeam}
      />
    </div>
  );
};