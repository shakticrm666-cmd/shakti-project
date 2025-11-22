import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Phone, Eye, Copy, Users, X } from 'lucide-react';
import { customerCaseService, CustomerCase } from '../../../services/customerCaseService';
import { TeamService } from '../../../services/teamService';
import { useNotification, notificationHelpers } from '../../shared/Notification';

interface Team {
  id: string;
  name: string;
  telecallers?: Array<{ emp_id: string }>;
}

interface CasesViewProps {
  user: {
    id: string;
    empId: string;
    role: string;
    tenantId?: string;
    [key: string]: unknown;
  };
}

export const CasesView: React.FC<CasesViewProps> = ({ user }) => {
  const [customerCases, setCustomerCases] = useState<CustomerCase[]>([]);
  const [allCases, setAllCases] = useState<CustomerCase[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<CustomerCase | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);

  const { showNotification } = useNotification();

  const loadCustomerCases = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use the user's empId to fetch cases assigned to this telecaller
      const cases = await customerCaseService.getCasesByTelecaller(user.id, user.empId);
      setAllCases(cases);
      setCustomerCases(cases); // Initially show all cases
    } catch (error) {
      console.error('Error loading customer cases:', error);
      showNotification(notificationHelpers.error(
        'Error',
        'Failed to load customer cases'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user.id, user.empId, showNotification]);

  const loadAvailableTeams = useCallback(async () => {
    try {
      // Get teams where this user is a telecaller by matching EMPID
      const teams = await TeamService.getTeams(user.id);
      const userTeams = teams.filter(team =>
        team.telecallers?.some(tel => tel.emp_id === user.empId)
      );
      setAvailableTeams(userTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }, [user.id, user.empId]);

  // Load customer cases and teams for this telecaller
  useEffect(() => {
    if (user?.tenantId && user?.id && user?.empId) {
      loadCustomerCases();
      loadAvailableTeams();
    }
  }, [user?.tenantId, user?.id, user?.empId, loadCustomerCases, loadAvailableTeams]);

  const handleTeamFilter = (teamId: string) => {
    setSelectedTeam(teamId);

    if (teamId === 'all') {
      setCustomerCases(allCases);
    } else {
      const filteredCases = allCases.filter(case_ => case_.team_id === teamId);
      setCustomerCases(filteredCases);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Basic search implementation - can be enhanced later
    if (!term.trim()) {
      setCustomerCases(selectedTeam === 'all' ? allCases : allCases.filter(c => c.team_id === selectedTeam));
    } else {
      const filtered = allCases.filter(case_ => {
        const caseData = (case_.case_data || {}) as Record<string, unknown>;
        const searchLower = term.toLowerCase();
        const customerName = (caseData.customerName as string) || '';
        const loanId = (caseData.loanId as string) || '';
        const mobileNo = (caseData.mobileNo as string) || '';

        return (
          customerName.toLowerCase().includes(searchLower) ||
          loanId.toLowerCase().includes(searchLower) ||
          mobileNo.toLowerCase().includes(searchLower)
        );
      });
      setCustomerCases(selectedTeam === 'all' ? filtered : filtered.filter(c => c.team_id === selectedTeam));
    }
  };

  const exportToCSV = () => {
    const headers = ['Team', 'Customer Name', 'Loan ID', 'Amount', 'DPD', 'Status'];
    const rows = customerCases.map(case_ => {
      const caseData = (case_.case_data || {}) as Record<string, unknown>;
      return [
        availableTeams.find(t => t.id === case_.team_id)?.name || 'Unknown Team',
        (caseData.customerName as string) || 'N/A',
        (caseData.loanId as string) || 'N/A',
        (caseData.loanAmount as string) || 'N/A',
        case_.dpd?.toString() || '0',
        case_.status || 'new'
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-cases.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    showNotification(notificationHelpers.success(
      'Export Complete',
      'Cases exported to CSV successfully'
    ));
  };

  const handleViewCase = (caseItem: CustomerCase) => {
    setSelectedCase(caseItem);
    setShowCaseDetails(true);
  };

  const handleCloseCaseDetails = () => {
    setSelectedCase(null);
    setShowCaseDetails(false);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      {/* Static Header Section */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              My Cases
            </h3>
            <p className="text-sm text-gray-600 mt-1">Manage and track your assigned loan recovery cases</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => exportToCSV()}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center"
            >
              <Copy className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center space-x-4">
          {/* Team Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <select
              value={selectedTeam}
              onChange={(e) => handleTeamFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            >
              <option value="all">All Teams</option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Search by name, loan ID, or mobile..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <span className="text-sm text-gray-600">
            Showing {customerCases.length} cases
          </span>
        </div>
      </div>

      {/* Scrollable Cases Table Section */}
      <div className="flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading cases...</span>
          </div>
        ) : customerCases.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Cases Found</h4>
            <p className="text-gray-600">
              {searchTerm ? 'No cases match your search criteria.' : 'You don\'t have any cases assigned yet.'}
            </p>
          </div>
        ) : (
          <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden mx-6 mb-6">
            {/* Sticky Header Table */}
            <div className="overflow-auto max-h-[600px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DPD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerCases.map((case_) => {
                    const caseData = (case_.case_data || {}) as Record<string, unknown>;
                    const teamName = availableTeams.find(t => t.id === case_.team_id)?.name || 'Unknown Team';
                    return (
                      <tr key={case_.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {teamName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(caseData.customerName as string) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(caseData.loanId as string) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{caseData.loanAmount ? (caseData.loanAmount as string).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(case_.dpd || 0) > 60 ? 'bg-red-100 text-red-800' :
                              (case_.dpd || 0) > 30 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                            }`}>
                            {(case_.dpd || 0)} days
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${case_.status === 'closed' ? 'bg-green-100 text-green-800' :
                              case_.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                case_.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                            }`}>
                            {case_.status?.replace('_', ' ') || 'new'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewCase(case_)}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </button>
                            <button className="text-green-600 hover:text-green-900 inline-flex items-center text-xs">
                              <Phone className="w-3 h-3 mr-1" />
                              Call
                            </button>
                            <button className="text-purple-600 hover:text-purple-900 text-xs">
                              Update
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Case Details Modal */}
      {showCaseDetails && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Case Details
              </h3>
              <button
                onClick={handleCloseCaseDetails}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const caseData = (selectedCase.case_data || {}) as Record<string, unknown>;
                    return (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-sm text-gray-900">{(caseData.customerName as string) || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                          <p className="text-sm text-gray-900">{(caseData.mobileNo as string) || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-sm text-gray-900">{(caseData.email as string) || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <p className="text-sm text-gray-900">{(caseData.address as string) || 'N/A'}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Loan Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Loan Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const caseData = (selectedCase.case_data || {}) as Record<string, unknown>;
                    return (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Loan ID</label>
                          <p className="text-sm text-gray-900">{(caseData.loanId as string) || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount</label>
                          <p className="text-sm text-gray-900">{(caseData.loanAmount as string) || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                          <p className="text-sm text-gray-900">{(caseData.productType as string) || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Disbursal Date</label>
                          <p className="text-sm text-gray-900">{(caseData.disbursalDate as string) || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                          <p className="text-sm text-gray-900">{(caseData.dueDate as string) || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Outstanding Amount</label>
                          <p className="text-sm text-gray-900">{(caseData.outstandingAmount as string) || 'N/A'}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Case Status */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Case Status</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DPD</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(selectedCase.dpd || 0) > 60 ? 'bg-red-100 text-red-800' :
                        (selectedCase.dpd || 0) > 30 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                      }`}>
                      {(selectedCase.dpd || 0)} days
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedCase.status === 'closed' ? 'bg-green-100 text-green-800' :
                        selectedCase.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          selectedCase.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                      }`}>
                      {selectedCase.status?.replace('_', ' ') || 'new'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                    <p className="text-sm text-gray-900">
                      {availableTeams.find(t => t.id === selectedCase.team_id)?.name || 'Unknown Team'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              {selectedCase.remarks && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Notes</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedCase.remarks}</p>
                  </div>
                </div>
              )}

              {/* Created and Updated Info */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <label className="block font-medium">Created At</label>
                    <p>{selectedCase.created_at ? new Date(selectedCase.created_at).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block font-medium">Updated At</label>
                    <p>{selectedCase.updated_at ? new Date(selectedCase.updated_at).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={handleCloseCaseDetails}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Edit Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};