import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, X, Download, Search, Eye, Trash2, User, Users, Activity, Maximize, Minimize, ChevronDown, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { customerCaseService } from '../../../services/customerCaseService';
import { TeamService } from '../../../services/teamService';
import { excelUtils } from '../../../utils/excelUtils';
import { columnConfigService } from '../../../services/columnConfigService';
import { useNotification, notificationHelpers } from '../../shared/Notification';
import { useAuth } from '../../../contexts/AuthContext';
import type { TeamInchargeCase, CaseFilters } from '../../../types/caseManagement';
import { PromptModal } from '../../shared/PromptModal';
import { CaseDetailsModal } from './CaseDetailsModal';

interface CaseTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  telecallerCounts?: Array<{
    id: string;
    name: string;
    emp_id: string;
    totalCases: number;
    assignedCases: number;
    inProgressCases: number;
    closedCases: number;
    unassignedCases: number;
  }>;
}

export const CaseTrackerModal: React.FC<CaseTrackerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  telecallerCounts = []
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [activeView, setActiveView] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [cases, setCases] = useState<TeamInchargeCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<TeamInchargeCase[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; team_incharge_id: string; status: string; telecallers?: Array<{ id: string; name: string; emp_id: string }> }>>([]);
  const [telecallers, setTelecallers] = useState<Array<{ id: string; name: string; emp_id: string }>>([]);
  const [products, setProducts] = useState<string[]>([]);


  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<TeamInchargeCase | null>(null);

  // Filters
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // UI states
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<TeamInchargeCase | null>(null);
  const [expandedTelecaller, setExpandedTelecaller] = useState<string | null>(null);
  const [telecallerCases, setTelecallerCases] = useState<{ [key: string]: TeamInchargeCase[] }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);



  const loadInitialData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load teams for this team incharge
      const teamData = await TeamService.getTeams(user.id);
      const userTeams = teamData.filter((team) =>
        team.team_incharge_id === user?.id && team.status === 'active'
      );
      setTeams(userTeams);

      if (userTeams.length > 0) {
        setSelectedTeam(userTeams[0].id);

        // Load telecallers from first team
        const telecallerList = userTeams[0].telecallers || [];
        setTelecallers(telecallerList);

        // Load products from column configurations
        const configs = await columnConfigService.getColumnConfigurations(user.id);
        const uniqueProducts = [...new Set(configs.map(c => c.product_name))];
        setProducts(uniqueProducts);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      showNotification(notificationHelpers.error(
        'Error',
        'Failed to load initial data'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    if (isOpen && user?.tenantId && user?.id) {
      loadInitialData();
    }
  }, [isOpen, user?.tenantId, user?.id, loadInitialData]);

  const loadCases = useCallback(async () => {
    if (!selectedTeam || !user?.tenantId) return;

    try {
      setIsLoading(true);

      const filters: CaseFilters = {
        product: selectedProduct || undefined,
        telecaller: selectedTelecaller || undefined,
        status: selectedStatus || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      const teamCases = await customerCaseService.getCasesByFilters(
        user.tenantId,
        selectedTeam,
        filters
      );
      setCases(teamCases);
    } catch (error) {
      console.error('Error loading cases:', error);
      showNotification(notificationHelpers.error(
        'Error',
        'Failed to load cases'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeam, selectedProduct, selectedTelecaller, selectedStatus, dateFrom, dateTo, user?.tenantId, showNotification]);

  const applyFilters = useCallback(() => {
    let filtered = [...cases];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(case_ =>
        case_.case_data?.customerName?.toString().toLowerCase().includes(searchLower) ||
        case_.case_data?.loanId?.toString().toLowerCase().includes(searchLower) ||
        case_.case_data?.mobileNo?.toString().includes(searchTerm) ||
        case_.telecaller?.name?.toString().toLowerCase().includes(searchLower)
      );
    }

    setFilteredCases(filtered);
    setCurrentPage(1);
  }, [cases, searchTerm]);

  useEffect(() => {
    if (isOpen && user?.tenantId && user?.id) {
      loadInitialData();
    }
  }, [isOpen, user?.tenantId, user?.id, loadInitialData]);

  useEffect(() => {
    loadCases();
  }, [selectedTeam, loadCases]);

  useEffect(() => {
    applyFilters();
  }, [cases, selectedProduct, selectedTelecaller, selectedStatus, dateFrom, dateTo, searchTerm, applyFilters]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    setSelectedTelecaller('');
    setSelectedProduct('');
    setSelectedStatus('');
    setSearchTerm('');

    // Update telecallers for selected team
    const selectedTeamData = teams.find(t => t.id === teamId);
    setTelecallers(selectedTeamData?.telecallers || []);
  };

  const handleDeleteCase = async (caseToDelete: TeamInchargeCase) => {
    setCaseToDelete(caseToDelete);
    setDeleteModalOpen(true);
  };

  const confirmDeleteCase = async () => {
    if (!caseToDelete || !user?.tenantId) return;

    try {
      await customerCaseService.deleteCase(caseToDelete.id);

      showNotification(notificationHelpers.success(
        'Case Deleted',
        'Case has been successfully deleted'
      ));

      // Refresh cases
      await loadCases();
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting case:', error);
      showNotification(notificationHelpers.error(
        'Delete Failed',
        error instanceof Error ? error.message : 'Failed to delete case'
      ));
    } finally {
      setDeleteModalOpen(false);
      setCaseToDelete(null);
    }
  };

  const handleExportCases = () => {
    if (!user) return;

    if (filteredCases.length === 0) {
      showNotification(notificationHelpers.warning(
        'No Data',
        'No cases to export'
      ));
      return;
    }

    try {
      // Get column configurations for the selected product
      if (selectedProduct) {
        columnConfigService.getActiveColumnConfigurations(user.id, selectedProduct)
          .then(configs => {
            excelUtils.exportCasesToExcel(
              filteredCases.map(case_ => ({
                ...case_.case_data,
                telecallerName: case_.telecaller?.name || 'Unassigned',
                status: case_.status,
                createdAt: case_.created_at
              })),
              configs
            );
            showNotification(notificationHelpers.success(
              'Export Complete',
              `Exported ${filteredCases.length} cases to Excel`
            ));
          });
      } else {
        // Export basic case data
        const exportData = filteredCases.map(case_ => ({
          'Case ID': case_.id?.substring(0, 8),
          'Customer Name': case_.case_data?.customerName || '',
          'Loan ID': case_.case_data?.loanId || '',
          'Mobile': case_.case_data?.mobileNo || '',
          'Telecaller': case_.telecaller?.name || 'Unassigned',
          'Status': case_.status,
          'Product': case_.product_name,
          'Created At': new Date(case_.created_at).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cases');

        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `cases_export_${timestamp}.xlsx`);

        showNotification(notificationHelpers.success(
          'Export Complete',
          `Exported ${filteredCases.length} cases to Excel`
        ));
      }
    } catch (error) {
      console.error('Export error:', error);
      showNotification(notificationHelpers.error(
        'Export Failed',
        'Failed to export cases'
      ));
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'New' },
      assigned: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Assigned' },
      in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Progress' },
      closed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Closed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const clearFilters = () => {
    setSelectedProduct('');
    setSelectedTelecaller('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
  };

  const loadTelecallerCases = async (telecallerId: string) => {
    if (!user?.tenantId || !selectedTeam) return;

    try {
      const telecallerFilters: CaseFilters = {
        telecaller: telecallerId,
        product: selectedProduct || undefined,
        status: selectedStatus || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      const telecallerCasesData = await customerCaseService.getCasesByFilters(
        user.tenantId,
        selectedTeam,
        telecallerFilters
      );
      setTelecallerCases(prev => ({
        ...prev,
        [telecallerId]: telecallerCasesData
      }));
    } catch (error) {
      console.error('Error loading telecaller cases:', error);
    }
  };

  const toggleTelecallerExpansion = async (telecallerId: string) => {
    if (expandedTelecaller === telecallerId) {
      setExpandedTelecaller(null);
    } else {
      setExpandedTelecaller(telecallerId);
      if (!telecallerCases[telecallerId]) {
        await loadTelecallerCases(telecallerId);
      }
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCases = filteredCases.slice(startIndex, endIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-xl shadow-2xl w-full transition-all duration-300 transform ${isMaximized
        ? 'h-screen rounded-none'
        : 'max-w-7xl mx-4 max-h-[95vh]'
        } overflow-hidden border border-gray-100`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-violet-50">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Case Tracker
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMaximize}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveView('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeView === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveView('telecaller')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeView === 'telecaller'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Telecaller Wise ({telecallerCounts.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Content based on active view */}
        {activeView === 'overview' && (
          <>
            {/* Filters */}
            <div className="p-6 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
                {/* Team Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  >
                    <option value="">All Teams</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                {/* Product Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  >
                    <option value="">All Products</option>
                    {products.map((product) => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                </div>

                {/* Telecaller Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telecaller</label>
                  <select
                    value={selectedTelecaller}
                    onChange={(e) => setSelectedTelecaller(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading || !selectedTeam}
                  >
                    <option value="">All Telecallers</option>
                    {telecallers.map((telecaller) => (
                      <option key={telecaller.id} value={telecaller.id}>
                        {telecaller.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  >
                    <option value="">All Statuses</option>
                    <option value="new">New</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Search and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search cases..."
                      className="pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Clear Filters */}
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportCases}
                  disabled={filteredCases.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export ({filteredCases.length})
                </button>
              </div>

              {/* Results Summary */}
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredCases.length} of {cases.length} cases
                {selectedTeam && ` • Team: ${teams.find(t => t.id === selectedTeam)?.name}`}
                {selectedProduct && ` • Product: ${selectedProduct}`}
                {selectedTelecaller && ` • Telecaller: ${telecallers.find(t => t.id === selectedTelecaller)?.name}`}
              </div>
            </div>

            {/* Cases Table */}
            <div className={`flex-1 overflow-hidden ${isMaximized ? 'h-[calc(100vh-320px)]' : ''}`}>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : currentCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No cases found</p>
                  <p className="text-sm">
                    {cases.length === 0
                      ? 'No cases match your current filters'
                      : 'Try adjusting your filter criteria'
                    }
                  </p>
                </div>
              ) : (
                <div className={`overflow-auto ${isMaximized ? 'h-full' : 'max-h-96'}`}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Case ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Telecaller
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentCases.map((case_) => {
                        const details = case_.case_data || {};

                        return (
                          <React.Fragment key={case_.id}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {case_.id?.substring(0, 8)}...
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {String(details.customerName || 'N/A')}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {String(details.loanId || '')} • {String(details.mobileNo || '')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{case_.product_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {case_.telecaller?.name || 'Unassigned'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {case_.telecaller?.emp_id || ''}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(case_.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(case_.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setSelectedCaseForDetails(case_)}
                                    className="text-blue-600 hover:text-blue-900 flex items-center"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCase(case_)}
                                    className="text-red-600 hover:text-red-900 flex items-center"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Row */}
                            {expandedCase === case_.id && (
                              <tr>
                                <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                  <div className="text-sm">
                                    <h4 className="font-medium text-gray-900 mb-3">Case Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {Object.entries(details).map(([key, value]) => (
                                        <div key={key}>
                                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                          </label>
                                          <p className="text-sm text-gray-900">{String(value || 'N/A')}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCases.length)} of {filteredCases.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Telecaller-wise view */}
        {activeView === 'telecaller' && (
          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Telecaller-wise Case Distribution
              </h4>
              <p className="text-gray-600">Click on any telecaller to view their individual cases</p>
            </div>

            {telecallerCounts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Telecallers Found</h4>
                <p className="text-gray-600">No telecallers are assigned to your teams yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {telecallerCounts.map((telecaller) => (
                  <div key={telecaller.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    {/* Telecaller Header */}
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => toggleTelecallerExpansion(telecaller.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-4">
                            {expandedTelecaller === telecaller.id ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">{telecaller.name}</h5>
                            <p className="text-sm text-gray-500">{telecaller.emp_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{telecaller.totalCases}</div>
                          <div className="text-sm text-gray-500">Total Cases</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-700">Assigned</span>
                          </div>
                          <span className="text-sm font-medium text-blue-600">{telecaller.assignedCases}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-700">In Progress</span>
                          </div>
                          <span className="text-sm font-medium text-orange-600">{telecaller.inProgressCases}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-700">Closed</span>
                          </div>
                          <span className="text-sm font-medium text-green-600">{telecaller.closedCases}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-700">Progress</span>
                          </div>
                          <span className="text-sm font-medium text-purple-600">
                            {Math.round((telecaller.closedCases / telecaller.totalCases) * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(telecaller.closedCases / telecaller.totalCases) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Cases List */}
                    {expandedTelecaller === telecaller.id && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h6 className="font-medium text-gray-900">Cases for {telecaller.name}</h6>
                            <span className="text-sm text-gray-500">
                              {telecallerCases[telecaller.id]?.length || 0} cases
                            </span>
                          </div>

                          {telecallerCases[telecaller.id] === undefined ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                          ) : telecallerCases[telecaller.id].length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p>No cases found for this telecaller</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {telecallerCases[telecaller.id].slice(0, 10).map((case_) => {
                                const details = case_.case_data || {};
                                return (
                                  <div key={case_.id} className="bg-white rounded-lg border p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-4">
                                          <div>
                                            <div className="font-medium text-gray-900">
                                              {String(details.customerName || 'N/A')}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                              {String(details.loanId || '')} • {String(details.mobileNo || '')}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-sm text-gray-900">{case_.product_name}</div>
                                            <div className="text-xs text-gray-500">
                                              {new Date(case_.created_at).toLocaleDateString()}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        {getStatusBadge(case_.status)}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedCase(expandedCase === case_.id ? null : case_.id);
                                          }}
                                          className="text-blue-600 hover:text-blue-900 flex items-center text-sm"
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          View Details
                                        </button>
                                      </div>
                                    </div>

                                    {/* Expanded Case Details */}
                                    {expandedCase === case_.id && (
                                      <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                          {Object.entries(details).map(([key, value]) => (
                                            <div key={key}>
                                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                              </label>
                                              <p className="text-sm text-gray-900">{String(value || 'N/A')}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {telecallerCases[telecaller.id].length > 10 && (
                                <div className="text-center py-2">
                                  <p className="text-sm text-gray-500">
                                    Showing 10 of {telecallerCases[telecaller.id].length} cases
                                  </p>
                                  <button
                                    onClick={() => setActiveView('overview')}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                                  >
                                    View all in Overview tab →
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <PromptModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDeleteCase}
          title="Delete Case"
          message={`Are you sure you want to delete this case? This action cannot be undone.`}
          confirmText="Delete Case"
          cancelText="Cancel"
        />
        {/* Case Details Modal */}
        <CaseDetailsModal
          isOpen={!!selectedCaseForDetails}
          onClose={() => setSelectedCaseForDetails(null)}
          caseData={selectedCaseForDetails}
        />
      </div>
    </div>
  );
};