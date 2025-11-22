import React, { useState, useEffect, useCallback } from 'react';
import { Upload, UserCheck, BarChart3, Plus, TrendingUp, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { customerCaseService } from '../../services/customerCaseService';
import { TeamService } from '../../services/teamService';
import { UploadCasesModal, AssignCasesModal, CaseTrackerModal } from './modals';

interface DashboardStats {
  totalTeams: number;
  totalTelecallers: number;
  totalCases: number;
  unassignedCases: number;
  assignedCases: number;
  inProgressCases: number;
  closedCases: number;
}

export const CaseManagement: React.FC = () => {
  const { user } = useAuth();

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalTeams: 0,
    totalTelecallers: 0,
    totalCases: 0,
    unassignedCases: 0,
    assignedCases: 0,
    inProgressCases: 0,
    closedCases: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardStats = useCallback(async () => {
    if (!user?.tenantId || !user?.id) {
      console.warn('Tenant ID or User ID not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading case management dashboard for user:', user.id, 'tenant:', user.tenantId);

      // Get teams for this team incharge
      const teamData = await TeamService.getTeams(user.tenantId);
      console.log('Total teams loaded:', teamData.length);

      const userTeams = teamData.filter(team =>
        team.team_incharge_id === user.id && team.status === 'active'
      );
      console.log('User teams (in-charge and active):', userTeams.length);

      // Calculate stats
      const totalTeams = userTeams.length;
      const totalTelecallers = userTeams.reduce((sum, team) => sum + (team.telecallers?.length || 0), 0);

      // Get case counts for all teams
      let totalCases = 0;
      let unassignedCases = 0;
      let assignedCases = 0;
      let inProgressCases = 0;
      let closedCases = 0;

      for (const team of userTeams) {
        console.log(`Loading cases for team: ${team.name} (${team.id})`);
        try {
          const teamCases = await customerCaseService.getTeamCases(user.tenantId, team.id);
          console.log(`Found ${teamCases.length} cases for team ${team.name}`);

          totalCases += teamCases.length;
          unassignedCases += teamCases.filter(c => !c.telecaller_id).length;
          assignedCases += teamCases.filter(c => c.status === 'assigned').length;
          inProgressCases += teamCases.filter(c => c.status === 'in_progress').length;
          closedCases += teamCases.filter(c => c.status === 'closed').length;
        } catch (teamError) {
          console.error(`Error loading cases for team ${team.name}:`, teamError);
        }
      }

      console.log('Dashboard stats calculated:', {
        totalTeams,
        totalTelecallers,
        totalCases,
        unassignedCases,
        assignedCases,
        inProgressCases,
        closedCases
      });

      setDashboardStats({
        totalTeams,
        totalTelecallers,
        totalCases,
        unassignedCases,
        assignedCases,
        inProgressCases,
        closedCases
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setDashboardStats({
        totalTeams: 0,
        totalTelecallers: 0,
        totalCases: 0,
        unassignedCases: 0,
        assignedCases: 0,
        inProgressCases: 0,
        closedCases: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId, user?.id]);

  useEffect(() => {
    if (user?.tenantId && user?.id) {
      loadDashboardStats();
    }
  }, [user?.tenantId, user?.id, loadDashboardStats]);

  const handleModalSuccess = () => {
    // Reload dashboard stats when any modal operation succeeds
    loadDashboardStats();
  };

  const getCardStats = () => [
    {
      title: 'Total Teams',
      value: dashboardStats.totalTeams,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Active teams'
    },
    {
      title: 'Total Telecallers',
      value: dashboardStats.totalTelecallers,
      icon: UserCheck,
      color: 'bg-green-500',
      description: 'Team members'
    },
    {
      title: 'Total Cases',
      value: dashboardStats.totalCases,
      icon: BarChart3,
      color: 'bg-purple-500',
      description: 'All cases'
    },
    {
      title: 'Unassigned Cases',
      value: dashboardStats.unassignedCases,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      description: 'Need assignment'
    },
    {
      title: 'Assigned Cases',
      value: dashboardStats.assignedCases,
      icon: CheckCircle,
      color: 'bg-blue-500',
      description: 'In progress'
    },
    {
      title: 'Closed Cases',
      value: dashboardStats.closedCases,
      icon: TrendingUp,
      color: 'bg-green-500',
      description: 'Completed'
    }
  ];

  const getMenuCards = () => [
    {
      title: 'Upload Cases',
      description: 'Upload new customer cases via Excel template',
      icon: Upload,
      color: 'bg-green-500',
      onClick: () => setShowUploadModal(true),
      action: 'Upload',
      stats: null
    },
    {
      title: 'Assign Cases',
      description: 'Assign or unassign cases to telecallers',
      icon: UserCheck,
      color: 'bg-blue-500',
      onClick: () => setShowAssignModal(true),
      action: 'Manage',
      stats: {
        unassigned: dashboardStats.unassignedCases,
        total: dashboardStats.totalCases
      }
    },
    {
      title: 'Case Tracker',
      description: 'Track and monitor all cases with filters',
      icon: BarChart3,
      color: 'bg-purple-500',
      onClick: () => setShowTrackerModal(true),
      action: 'Track',
      stats: {
        total: dashboardStats.totalCases,
        inProgress: dashboardStats.inProgressCases
      }
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
            Case Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage, assign, and track customer cases across your teams
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getCardStats().map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                  <div className="flex items-center">
                    <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-xs text-gray-500">{stat.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Case Operations</h3>
          <p className="text-gray-600 mt-1">Choose an operation to manage your cases</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getMenuCards().map((card, index) => {
              const IconComponent = card.icon;
              return (
                <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <div className={`${card.color} rounded-lg p-3 mr-4`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{card.title}</h4>
                      {card.stats && (
                        <p className="text-sm text-gray-600">
                          {card.stats.total !== undefined && `${card.stats.total} total`}
                          {card.stats.unassigned !== undefined && ` • ${card.stats.unassigned} unassigned`}
                          {card.stats.inProgress !== undefined && ` • ${card.stats.inProgress} in progress`}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{card.description}</p>

                  <button
                    onClick={card.onClick}
                    className={`w-full py-2 px-4 ${card.color} text-white rounded-lg hover:opacity-90 transition-all duration-200 flex items-center justify-center font-medium`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {card.action}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity (Placeholder for future enhancement) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No recent activity</p>
            <p className="text-sm">Case activities will appear here</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadCasesModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleModalSuccess}
      />

      <AssignCasesModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={handleModalSuccess}
      />

      <CaseTrackerModal
        isOpen={showTrackerModal}
        onClose={() => setShowTrackerModal(false)}
        onSuccess={handleModalSuccess}
        telecallerCounts={[]} // This would be populated with actual data if needed
      />
    </div>
  );
};