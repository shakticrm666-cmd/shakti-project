import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Edit2, Trash2, Upload, FileSpreadsheet, Eye, Key, Filter } from 'lucide-react';
import type { Employee } from '../../../types/employee';
import { BulkDeleteModal } from '../forms/BulkDeleteModal';
import { useConfirmation } from '../../../contexts/ConfirmationContext';

// TODO: Create Table, Badge, EmptyState components or import from shared

interface UserManagementProps {
  employees: Employee[];
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => Promise<boolean>;
  onBulkDelete?: (employeeIds: string[]) => Promise<void>;
  onBulkUpload?: () => void;
  onDownloadTemplate?: () => void;
  onViewEmployee?: (employee: Employee) => void;
  onResetPassword?: (employeeId: string) => Promise<string>;
  isLoading?: boolean;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onBulkDelete,
  onBulkUpload,
  onDownloadTemplate,
  onViewEmployee,
  onResetPassword,
  isLoading = false,
}) => {
  const { showConfirmation } = useConfirmation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.empId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort by EMP ID in ascending order (EMP001, EMP002, EMP003, etc.)
    filtered.sort((a, b) => {
      // Extract numeric part from EMP ID (e.g., "EMP001" -> 1)
      const aNum = parseInt(a.empId.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.empId.replace(/\D/g, '')) || 0;
      return aNum - bNum; // Ascending order
    });

    return filtered;
  }, [employees, searchQuery, roleFilter, statusFilter]);

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
            } else {
              setSelectedEmployees(new Set());
            }
          }}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
      ),
      render: (emp: Employee) => (
        <input
          type="checkbox"
          checked={selectedEmployees.has(emp.id)}
          onChange={(e) => {
            const newSelection = new Set(selectedEmployees);
            if (e.target.checked) {
              newSelection.add(emp.id);
            } else {
              newSelection.delete(emp.id);
            }
            setSelectedEmployees(newSelection);
          }}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
      ),
    },
    {
      key: 'emp_id',
      header: 'Employee ID',
      render: (emp: Employee) => (
        <span>{emp.empId}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (emp: Employee) => (
        <div>
          <div>{emp.name}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (emp: Employee) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          emp.role === 'TeamIncharge' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {emp.role === 'TeamIncharge' ? 'Team Incharge' : 'Telecaller'}
        </span>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (emp: Employee) => (
        <span className="text-sm text-gray-500">{emp.mobile}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (emp: Employee) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {emp.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (emp: Employee) => (
        <div className="flex space-x-1">
          {onViewEmployee && (
            <button
              onClick={() => onViewEmployee(emp)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="View employee"
              disabled={isLoading}
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEditEmployee(emp)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="Edit employee"
            disabled={isLoading}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {onResetPassword && (
            <button
              onClick={() => onResetPassword(emp.id)}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              aria-label="Reset password"
              disabled={isLoading}
            >
              <Key className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              showConfirmation({
                title: 'Delete Employee',
                message: `Are you sure you want to delete "${emp.name}"? This action cannot be undone.`,
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'danger',
                onConfirm: async () => {
                  await onDeleteEmployee(emp.id);
                }
              });
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete employee"
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage all employees with role-based filtering</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onAddEmployee}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            aria-label="Add new employee"
          >
            <UserPlus className="w-5 h-5" />
            Add Employee
          </button>
          {onBulkUpload && (
            <button
              onClick={onBulkUpload}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              aria-label="Bulk upload employees"
            >
              <Upload className="w-5 h-5" />
              Bulk Upload
            </button>
          )}
          {onDownloadTemplate && (
            <button
              onClick={onDownloadTemplate}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              aria-label="Download template"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Download Template
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedEmployees.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-base font-medium text-blue-900">
                {selectedEmployees.size} employee{selectedEmployees.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedEmployees(new Set())}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
              >
                Clear Selection
              </button>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={isLoading || !onBulkDelete}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg text-sm font-medium inline-flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Bulk Delete ({selectedEmployees.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Employees</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                aria-label="Search employees"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[140px]"
              >
                <option value="All">All Roles</option>
                <option value="TeamIncharge">Team Incharge</option>
                <option value="Telecaller">Telecaller</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[140px]"
              >
                <option value="All">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('All');
                  setStatusFilter('All');
                }}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center font-medium"
                aria-label="Clear filters"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <UserPlus className="w-20 h-20 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No employees found</h3>
            <p className="text-gray-600 mb-6 text-lg">Add your first employee to get started</p>
            <button
              onClick={onAddEmployee}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center text-lg"
            >
              <UserPlus className="w-5 h-5 mr-3" />
              Add Employee
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  {columns.map((column, index) => (
                    <td key={index} className="px-6 py-2 whitespace-nowrap">
                      {column.render(employee)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        selectedEmployees={employees.filter(emp => selectedEmployees.has(emp.id))}
        onConfirmDelete={async () => {
          if (!onBulkDelete) return;

          setIsBulkDeleting(true);
          try {
            const selectedIds = Array.from(selectedEmployees);
            await onBulkDelete(selectedIds);
            setSelectedEmployees(new Set()); // Clear selection after successful delete
          } catch (error) {
            console.error('Bulk delete error:', error);
            throw error; // Re-throw to let modal handle error display
          } finally {
            setIsBulkDeleting(false);
          }
        }}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
};