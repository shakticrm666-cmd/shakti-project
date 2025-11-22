import React, { useState, useEffect, useCallback } from 'react';
import { X, Eye, Phone, Search, Filter, ArrowUpDown } from 'lucide-react';
import { customerCaseService, CustomerCase } from '../../services/customerCaseService';
import { columnConfigService } from '../../services/columnConfigService';
import { useNotification, notificationHelpers } from '../shared/Notification';
import { ColumnValidationModal } from '../TeamIncharge/forms/ColumnValidationModal';
import type { Employee } from '../../types/employee';

interface CasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Employee;
}

export const CasesModal: React.FC<CasesModalProps> = ({ isOpen, onClose, user }) => {
  const { showNotification } = useNotification();
  const [cases, setCases] = useState<CustomerCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<CustomerCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dpdFilter, setDpdFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dpd');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCase, setSelectedCase] = useState<CustomerCase | null>(null);
  const [showColumnValidationModal, setShowColumnValidationModal] = useState(false);

  const loadCases = useCallback(async () => {
    if (!user?.tenantId || !user?.id) return;

    try {
      setIsLoading(true);

      // Check if we have required column configurations
      const allProducts = await columnConfigService.getColumnConfigurations(user.tenantId);
      const products = [...new Set(allProducts.map(c => c.product_name))];

      if (products.length === 0) {
        showNotification(notificationHelpers.warning(
          'No Products',
          'No products configured. Please contact your administrator.'
        ));
        return;
      }

      // For telecallers, we need to get cases assigned to them
      // First, get all cases for this tenant and find ones assigned to this user
      const allCases = await customerCaseService.getAllCases(user.tenantId);

      // Filter cases assigned to this telecaller (by emp_id)
      const userCases = allCases.filter(case_ =>
        case_.assigned_employee_id === user.empId ||
        case_.telecaller_id === user.id
      );

      console.log('Loaded cases for telecaller:', userCases.length);
      setCases(userCases);

      // Load column configurations for validation
      if (products.length > 0) {
        try {
          const configs = await columnConfigService.getActiveColumnConfigurations(user.tenantId, products[0]);

          // Check for required columns
          const hasCustomerName = configs.some(col => col.column_name === 'customerName');
          const hasLoanId = configs.some(col => col.column_name === 'loanId');

          if (!hasCustomerName || !hasLoanId) {
            console.log('Required columns missing, showing validation modal');
            setShowColumnValidationModal(true);
            return;
          }
        } catch (configError) {
          console.error('Error loading column configurations:', configError);
          setShowColumnValidationModal(true);
          return;
        }
      }

    } catch (error) {
      console.error('Error loading cases:', error);
      showNotification(notificationHelpers.error(
        'Error',
        'Failed to load cases'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, showNotification]);

  // Load cases when modal opens
  useEffect(() => {
    if (isOpen && user?.tenantId && user?.id) {
      loadCases();
    }
  }, [isOpen, user?.tenantId, user?.id, loadCases]);

  // Filter and sort cases
  useEffect(() => {
    let filtered = [...cases];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(case_ =>
        case_.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.loan_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.mobile_no?.includes(searchTerm)
      );
    }

    // Apply DPD filter
    if (dpdFilter !== 'all') {
      filtered = filtered.filter(case_ => {
        const dpd = case_.dpd || 0;
        if (dpdFilter === '0-30') return dpd <= 30;
        if (dpdFilter === '31-60') return dpd > 30 && dpd <= 60;
        if (dpdFilter === '60+') return dpd > 60;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: unknown = a[sortBy as keyof CustomerCase];
      let bVal: unknown = b[sortBy as keyof CustomerCase];

      // Handle numeric fields
      if (sortBy === 'dpd') {
        aVal = a.dpd || 0;
        bVal = b.dpd || 0;
      } else if (sortBy.includes('Amount')) {
        aVal = parseFloat(String(aVal).replace(/[^0-9.-]/g, '')) || 0;
        bVal = parseFloat(String(bVal).replace(/[^0-9.-]/g, '')) || 0;
      }

      if (sortOrder === 'asc') {
        return (aVal as number) > (bVal as number) ? 1 : -1;
      } else {
        return (aVal as number) < (bVal as number) ? 1 : -1;
      }
    });

    setFilteredCases(filtered);
  }, [cases, searchTerm, dpdFilter, sortBy, sortOrder]);

  const handleViewCase = (caseData: CustomerCase) => {
    setSelectedCase(caseData);
  };

  const handleCallCustomer = (caseData: CustomerCase) => {
    // Implement call functionality
    showNotification(notificationHelpers.info(
      'Call Customer',
      `Initiating call to ${caseData.customer_name} at ${caseData.mobile_no}`
    ));
  };

  const handleConfigurationFixed = () => {
    // Reload cases after configuration is fixed
    loadCases();
  };

  const getDPDColor = (dpd: number) => {
    if (dpd <= 30) return 'bg-green-100 text-green-800';
    if (dpd <= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return '-';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              My Cases
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex h-[calc(100vh-200px)]">
            {/* Cases List */}
            <div className="w-2/3 border-r border-gray-200 flex flex-col">
              {/* Search and Filter Bar */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, loan ID, or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      Showing {filteredCases.length} of {cases.length} cases
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-3 flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">DPD Filter:</span>
                    <select
                      value={dpdFilter}
                      onChange={(e) => setDpdFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Cases</option>
                      <option value="0-30">0-30 Days</option>
                      <option value="31-60">31-60 Days</option>
                      <option value="60+">60+ Days</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Sort By:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dpd">DPD</option>
                      <option value="customer_name">Customer Name</option>
                      <option value="outstanding_amount">Outstanding Amount</option>
                      <option value="emi_amount">EMI Amount</option>
                      <option value="last_paid_date">Last Paid Date</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cases Table */}
              <div className="flex-1 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loan ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mobile
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          DPD
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Outstanding
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          EMI Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                              Loading cases...
                            </div>
                          </td>
                        </tr>
                      ) : filteredCases.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            {searchTerm || dpdFilter !== 'all' ? 'No cases match your filters' : 'No cases assigned yet'}
                          </td>
                        </tr>
                      ) : (
                        filteredCases.map((case_, index) => (
                          <tr key={case_.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {case_.customer_name || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {case_.loan_id || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {case_.mobile_no || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDPDColor(case_.dpd || 0)}`}>
                                {case_.dpd || 0} days
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                              {formatCurrency(case_.outstanding_amount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(case_.emi_amount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewCase(case_)}
                                  className="text-blue-600 hover:text-blue-900 inline-flex items-center text-xs"
                                  title="View Details"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </button>
                                <button
                                  onClick={() => handleCallCustomer(case_)}
                                  className="text-green-600 hover:text-green-900 inline-flex items-center text-xs"
                                  title="Call Customer"
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  Call
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Case Details Panel */}
            <div className="w-1/3 bg-gray-50 p-6 overflow-y-auto">
              {selectedCase ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h4>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Customer Name:</span>
                        <span className="text-sm text-gray-900">{selectedCase.customer_name || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Loan ID:</span>
                        <span className="text-sm text-gray-900">{selectedCase.loan_id || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Mobile:</span>
                        <span className="text-sm text-gray-900">{selectedCase.mobile_no || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Alternate Number:</span>
                        <span className="text-sm text-gray-900">{selectedCase.alternate_number || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <span className="text-sm text-gray-900">{selectedCase.email || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">DPD:</span>
                        <span className={`text-sm font-medium ${getDPDColor(selectedCase.dpd || 0)}`}>
                          {selectedCase.dpd || 0} days
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Loan Amount:</span>
                        <span className="text-sm text-gray-900">{formatCurrency(selectedCase.loan_amount)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Outstanding Amount:</span>
                        <span className="text-sm font-medium text-red-600">{formatCurrency(selectedCase.outstanding_amount)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">EMI Amount:</span>
                        <span className="text-sm text-gray-900">{formatCurrency(selectedCase.emi_amount)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">POS Amount:</span>
                        <span className="text-sm text-gray-900">{formatCurrency(selectedCase.pos_amount)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Pending Dues:</span>
                        <span className="text-sm text-gray-900">{formatCurrency(selectedCase.pending_dues)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Loan Type:</span>
                        <span className="text-sm text-gray-900">{selectedCase.loan_type || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Branch Name:</span>
                        <span className="text-sm text-gray-900">{selectedCase.branch_name || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Address:</span>
                        <span className="text-sm text-gray-900">{selectedCase.address || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">City:</span>
                        <span className="text-sm text-gray-900">{selectedCase.city || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">State:</span>
                        <span className="text-sm text-gray-900">{selectedCase.state || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">PIN Code:</span>
                        <span className="text-sm text-gray-900">{selectedCase.pincode || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Sanction Date:</span>
                        <span className="text-sm text-gray-900">{selectedCase.sanction_date || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Last Paid Date:</span>
                        <span className="text-sm text-gray-900">{selectedCase.last_paid_date || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Last Paid Amount:</span>
                        <span className="text-sm text-gray-900">{formatCurrency(selectedCase.last_paid_amount)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Payment Link:</span>
                        <span className="text-sm text-blue-600 truncate max-w-32" title={selectedCase.payment_link || '-'}>
                          {selectedCase.payment_link || '-'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Case Status:</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${selectedCase.case_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedCase.case_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            selectedCase.case_status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {selectedCase.case_status || 'pending'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Priority:</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${selectedCase.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          selectedCase.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            selectedCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                          }`}>
                          {selectedCase.priority || 'low'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Remarks:</span>
                        <span className="text-sm text-gray-900">{selectedCase.remarks || '-'}</span>
                      </div>

                      <div className="mt-4">
                        <span className="text-sm font-medium text-gray-500 block mb-2">Custom Fields:</span>
                        {selectedCase.custom_fields && Object.keys(selectedCase.custom_fields).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(selectedCase.custom_fields).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-gray-500">{key}:</span>
                                <span className="text-gray-900">{String(value) || '-'}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No custom fields</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a case to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Column Validation Modal */}
      <ColumnValidationModal
        isOpen={showColumnValidationModal}
        onClose={() => setShowColumnValidationModal(false)}
        tenantId={user?.tenantId || ''}
        productName="General" // Default product for telecallers
        onConfigurationFixed={handleConfigurationFixed}
      />
    </>
  );
};