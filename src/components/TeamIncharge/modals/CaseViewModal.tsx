import React, { useState, useEffect, useCallback } from 'react';
import { Eye, X, Search, User, Calendar, FileText, MapPin, DollarSign, AlertCircle } from 'lucide-react';
import { customerCaseService } from '../../../services/customerCaseService';
import { TeamService } from '../../../services/teamService';
import { useNotification, notificationHelpers } from '../../shared/Notification';
import { useAuth } from '../../../contexts/AuthContext';
import type { TeamInchargeCase } from '../../../types/caseManagement';
import type { CustomerCase } from '../../../services/customerCaseService';

interface CaseViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CaseViewModal: React.FC<CaseViewModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; team_incharge_id: string; status: string; telecallers?: Array<{ id: string; name: string; emp_id: string }> }>>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [telecallers, setTelecallers] = useState<Array<{ id: string; name: string; emp_id: string }>>([]);
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [cases, setCases] = useState<CustomerCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<CustomerCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTeams = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setIsLoading(true);
      const teamData = await TeamService.getTeams(user.tenantId);
      const userTeams = teamData.filter((team) =>
        team.team_incharge_id === user!.id && team.status === 'active'
      );
      setTeams(userTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
      showNotification(notificationHelpers.error(
        'Error',
        'Failed to load teams'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, showNotification]);

  const loadTelecallersForTeam = useCallback(async (teamId: string) => {
    const selectedTeamData = teams.find(t => t.id === teamId);
    setTelecallers(selectedTeamData?.telecallers || []);
    setSelectedTelecaller('');
    setCases([]);
    setSelectedCase(null);
  }, [teams]);

  const loadTelecallerCases = useCallback(async (telecallerId: string) => {
    if (!user?.tenantId) return;

    try {
      setIsLoading(true);
      // Find the telecaller's emp_id
      const telecaller = telecallers.find(t => t.id === telecallerId);
      if (!telecaller) return;

      const casesData = await customerCaseService.getCasesByTelecaller(user.tenantId, telecaller.emp_id);
      setCases(casesData as TeamInchargeCase[]);
      setSelectedCase(null);
    } catch (error) {
      console.error('Error loading telecaller cases:', error);
      showNotification(notificationHelpers.error(
        'Error',
        'Failed to load cases'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId, telecallers, showNotification]);

  useEffect(() => {
    if (isOpen && user?.tenantId && user?.id) {
      loadTeams();
    }
  }, [isOpen, user?.tenantId, user?.id, loadTeams]);

  useEffect(() => {
    if (selectedTeam) {
      loadTelecallersForTeam(selectedTeam);
    }
  }, [selectedTeam, loadTelecallersForTeam]);

  useEffect(() => {
    if (selectedTelecaller) {
      loadTelecallerCases(selectedTelecaller);
    }
  }, [selectedTelecaller, loadTelecallerCases]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
  };

  const handleTelecallerChange = (telecallerId: string) => {
    setSelectedTelecaller(telecallerId);
  };

  const handleCaseSelect = (case_: CustomerCase) => {
    setSelectedCase(case_);
  };

  const filteredCases = cases.filter(case_ =>
    searchTerm === '' ||
    case_.loan_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.mobile_no?.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderCaseList = () => (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {filteredCases.map((case_) => (
        <div
          key={case_.id}
          onClick={() => handleCaseSelect(case_)}
          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {case_.customer_name || 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Case ID:</span> {case_.loan_id}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Mobile:</span> {case_.mobile_no || 'N/A'}
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${case_.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                case_.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  case_.status === 'closed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                {case_.status || 'new'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {case_.created_at ? formatDate(case_.created_at) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      ))}
      {filteredCases.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No cases found</p>
        </div>
      )}
    </div>
  );

  const renderCaseDetails = () => {
    if (!selectedCase) return null;

    return (
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Case Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Case ID:</span>
              <span className="ml-2 text-gray-900">{selectedCase.loan_id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${selectedCase.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                selectedCase.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  selectedCase.status === 'closed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                {selectedCase.status || 'new'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <User className="w-4 h-4 mr-2" />
            Customer Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-900">{selectedCase.customer_name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Mobile:</span>
              <span className="ml-2 text-gray-900">{selectedCase.mobile_no || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Alternate Mobile:</span>
              <span className="ml-2 text-gray-900">{selectedCase.alternate_number || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-gray-900">{selectedCase.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Loan Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Loan Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Loan Amount:</span>
              <span className="ml-2 text-gray-900">{selectedCase.loan_amount || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Outstanding Amount:</span>
              <span className="ml-2 text-gray-900">{selectedCase.outstanding_amount || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">POS Amount:</span>
              <span className="ml-2 text-gray-900">{selectedCase.pos_amount || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">EMI Amount:</span>
              <span className="ml-2 text-gray-900">{selectedCase.emi_amount || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Pending Dues:</span>
              <span className="ml-2 text-gray-900">{selectedCase.pending_dues || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">DPD:</span>
              <span className="ml-2 text-gray-900">{selectedCase.dpd || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Loan Type:</span>
              <span className="ml-2 text-gray-900">{selectedCase.loan_type || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Sanction Date:</span>
              <span className="ml-2 text-gray-900">{selectedCase.sanction_date ? formatDate(selectedCase.sanction_date) : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Location Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Branch:</span>
              <span className="ml-2 text-gray-900">{selectedCase.branch_name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Address:</span>
              <span className="ml-2 text-gray-900">{selectedCase.address || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">City:</span>
              <span className="ml-2 text-gray-900">{selectedCase.city || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">State:</span>
              <span className="ml-2 text-gray-900">{selectedCase.state || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Pincode:</span>
              <span className="ml-2 text-gray-900">{selectedCase.pincode || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Payment Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Last Paid Date:</span>
              <span className="ml-2 text-gray-900">{selectedCase.last_paid_date ? formatDate(selectedCase.last_paid_date) : 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Paid Amount:</span>
              <span className="ml-2 text-gray-900">{selectedCase.last_paid_amount || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Payment Link:</span>
              <span className="ml-2 text-gray-900 break-all">{selectedCase.payment_link || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Additional Information
          </h4>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Remarks:</span>
              <div className="ml-2 text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                {selectedCase.remarks || 'No remarks'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Priority:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${selectedCase.priority === 'high' ? 'bg-red-100 text-red-800' :
                selectedCase.priority === 'urgent' ? 'bg-red-200 text-red-900' :
                  selectedCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                }`}>
                {selectedCase.priority || 'low'}
              </span>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Timestamps
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <span className="ml-2 text-gray-900">{selectedCase.created_at ? formatDate(selectedCase.created_at) : 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Updated:</span>
              <span className="ml-2 text-gray-900">{selectedCase.updated_at ? formatDate(selectedCase.updated_at) : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Custom Fields */}
        {selectedCase.case_data && Object.keys(selectedCase.case_data).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Additional Fields
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {Object.entries(selectedCase.case_data).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium text-gray-700">{key}:</span>
                  <span className="ml-2 text-gray-900">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const resetModal = () => {
    setTeams([]);
    setSelectedTeam('');
    setTelecallers([]);
    setSelectedTelecaller('');
    setCases([]);
    setSelectedCase(null);
    setSearchTerm('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[95vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-blue-600" />
            View Cases
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Telecaller Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telecaller</label>
              <select
                value={selectedTelecaller}
                onChange={(e) => handleTelecallerChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading || !selectedTeam}
              >
                <option value="">Select Telecaller</option>
                {telecallers.map((telecaller) => (
                  <option key={telecaller.id} value={telecaller.id}>
                    {telecaller.name} ({telecaller.emp_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Cases</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by case ID, name, or mobile"
                  className="pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Case Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Cases</label>
              <div className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-blue-600 font-medium">
                  {filteredCases.length} cases
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="flex h-[calc(100vh-280px)]">
              {/* Case List */}
              <div className="w-1/2 border-r border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedCase ? 'Case List' : 'Select a Case'}
                </h4>
                {renderCaseList()}
              </div>

              {/* Case Details */}
              <div className="w-1/2 p-6">
                {selectedCase ? (
                  renderCaseDetails()
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Eye className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Select a case to view details</p>
                    <p className="text-sm text-center mt-2">
                      Click on any case from the list to see full information
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};