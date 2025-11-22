import React, { useState, useMemo } from 'react';
import { Eye, Phone, Copy, Filter, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { CustomerCase, ColumnConfig } from './types';
import { getDPDColor, copyToClipboard, filterCases, paginateCases, getTotalPages, debounce } from './utils';

interface CustomerCaseTableProps {
  customerCases: CustomerCase[];
  columnConfigs: ColumnConfig[];
  isLoading: boolean;
  onViewDetails: (caseData: CustomerCase) => void;
  onCallCustomer: (caseData: CustomerCase) => void;
  onUpdateStatus?: (caseData: CustomerCase) => void;
  onManageFields?: (caseData: CustomerCase) => void;
}

const CustomerCaseTable: React.FC<CustomerCaseTableProps> = ({
  customerCases,
  columnConfigs,
  isLoading,
  onViewDetails,
  onCallCustomer,

  onManageFields
}) => {


  const hasEmptyCriticalFields = (caseData: CustomerCase) => {
    const criticalFields = ['mobile_no', 'outstanding_amount', 'emi_amount'];
    return criticalFields.some(field => {
      const value = caseData[field as keyof CustomerCase];
      return !value || value === '' || value === null || value === undefined;
    });
  };

  const handleManageFields = (caseData: CustomerCase) => {
    if (onManageFields) {
      onManageFields(caseData);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dpdFilter, setDpdFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dpd');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((...args: unknown[]) => setSearchTerm(args[0] as string), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    debouncedSearch(term);
    setCurrentPage(1); // Reset to first page on search
  };

  // Filter, sort, and paginate cases
  const filteredCases = useMemo(() => {
    let cases = filterCases(customerCases, searchTerm);

    // Apply DPD filter
    if (dpdFilter !== 'all') {
      cases = cases.filter(c => {
        const dpd = c.dpd || 0;
        if (dpdFilter === '0-30') return dpd <= 30;
        if (dpdFilter === '31-60') return dpd > 30 && dpd <= 60;
        if (dpdFilter === '60+') return dpd > 60;
        return true;
      });
    }

    // Apply sorting
    cases.sort((a, b) => {
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

    return cases;
  }, [customerCases, searchTerm, dpdFilter, sortBy, sortOrder]);

  const totalPages = getTotalPages(filteredCases.length, itemsPerPage);
  const paginatedCases = useMemo(() =>
    paginateCases(filteredCases, currentPage, itemsPerPage),
    [filteredCases, currentPage, itemsPerPage]
  );

  const getActiveColumns = (): ColumnConfig[] => {
    const columns = columnConfigs.length > 0
      ? columnConfigs.map(config => ({
        id: config.id,
        columnName: config.columnName,
        displayName: config.displayName,
        isActive: config.isActive
      }))
      : [];

    columns.push({ id: 999, columnName: 'actions', displayName: 'Actions', isActive: true });
    return columns;
  };

  const renderColumnValue = (case_: CustomerCase, column: ColumnConfig) => {
    switch (column.columnName) {
      case 'dpd':
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDPDColor(case_.dpd || 0)}`}>
            {case_.dpd || 0} days
          </span>
        );
      case 'paymentLink':
        return (
          <button
            onClick={() => copyToClipboard(case_.paymentLink || '')}
            disabled={!case_.paymentLink}
            className="inline-flex items-center px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy Link
          </button>
        );
      case 'actions':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails(case_)}
              className="text-purple-600 hover:text-purple-900 inline-flex items-center text-xs"
              title="View Details"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </button>
            <button
              onClick={() => onCallCustomer(case_)}
              className="text-green-600 hover:text-green-900 inline-flex items-center text-xs"
              title="Call Customer"
            >
              <Phone className="w-3 h-3 mr-1" />
              Call
            </button>
            {hasEmptyCriticalFields(case_) && onManageFields && (
              <button
                onClick={() => handleManageFields(case_)}
                className="text-orange-600 hover:text-orange-900 inline-flex items-center text-xs"
                title="Manage Empty Fields"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Fix
              </button>
            )}
          </div>
        );
      default: {
        const caseRecord = case_ as unknown as Record<string, unknown>;
        const value = caseRecord[column.columnName];
        return (
          <span className={
            column.columnName.includes('Amount') || column.columnName.includes('Dues')
              ? column.columnName === 'outstandingAmount' || column.columnName === 'pendingDues'
                ? 'font-medium text-red-600'
                : 'font-medium text-gray-900'
              : 'text-gray-900'
          }>
            {String(value || '-')}
          </span>
        );
      }
    }
  };

  const exportToCSV = () => {
    const activeColumnsList = getActiveColumns().filter(col => col.isActive && col.columnName !== 'actions');
    const headers = activeColumnsList.map(col => col.displayName).join(',');
    const rows = filteredCases.map(case_ =>
      activeColumnsList.map(col => {
        const caseRecord = case_ as unknown as Record<string, unknown>;
        const value = caseRecord[col.columnName] || '';
        return `"${String(value)}"`;
      }).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-cases.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Cases</h3>
            <p className="text-sm text-gray-600 mt-1">Manage and track your assigned loan recovery cases</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportToCSV}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center"
            >
              <Copy className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search by name, loan ID, or mobile..."
                onChange={handleSearchChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-80"
              />
              <span className="text-sm text-gray-600">
                Showing {filteredCases.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCases.length)} of {filteredCases.length} cases
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">DPD Filter:</span>
              <select
                value={dpdFilter}
                onChange={(e) => {
                  setDpdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="dpd">DPD</option>
                <option value="customerName">Customer Name</option>
                <option value="outstandingAmount">Outstanding Amount</option>
                <option value="emiAmount">EMI Amount</option>
                <option value="lastPaidDate">Last Paid Date</option>
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
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {getActiveColumns().filter(col => col.isActive).map((column) => (
                  <th key={column.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={getActiveColumns().length} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mr-2"></div>
                      Loading cases...
                    </div>
                  </td>
                </tr>
              ) : paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={getActiveColumns().length} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No cases match your search criteria' : 'No cases assigned yet'}
                  </td>
                </tr>
              ) : (
                paginatedCases.map((case_, index) => (
                  <tr key={case_.id || index} className="hover:bg-gray-50">
                    {getActiveColumns().filter(col => col.isActive).map((column) => (
                      <td key={column.id} className="px-4 py-4 whitespace-nowrap text-sm">
                        {renderColumnValue(case_, column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-700 rounded-md text-sm font-medium"
              >
                Previous
              </button>
              {(() => {
                const maxPagesToShow = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                if (endPage - startPage < maxPagesToShow - 1) {
                  startPage = Math.max(1, endPage - maxPagesToShow + 1);
                }

                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }

                return pages.map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === page
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                      }`}
                  >
                    {page}
                  </button>
                ));
              })()}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-700 rounded-md text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerCaseTable;