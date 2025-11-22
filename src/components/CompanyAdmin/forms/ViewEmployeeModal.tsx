import React, { useState } from 'react';
import { Eye, Edit2, X, Save, Key } from 'lucide-react';
import type { Employee } from '../../../types/employee';

interface ViewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onUpdateEmployee?: (id: string, updates: Partial<Employee>) => Promise<void>;
  onResetPassword?: (employeeId: string) => Promise<string>;
  isLoading?: boolean;
}

export const ViewEmployeeModal: React.FC<ViewEmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  onUpdateEmployee,
  onResetPassword,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  React.useEffect(() => {
    if (employee) {
      setEditForm({
        name: employee.name,
        mobile: employee.mobile,
        empId: employee.empId,
        role: employee.role,
      });
      setNewPassword('');
      setShowPasswordField(false);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleSave = async () => {
    if (!onUpdateEmployee) return;

    try {
      const updates: Partial<Employee> = {
        name: editForm.name,
        mobile: editForm.mobile,
        empId: editForm.empId,
        role: editForm.role,
      };

      if (showPasswordField && newPassword.trim()) {
        (updates as Partial<Employee> & { password?: string }).password = newPassword;
      }

      await onUpdateEmployee(employee.id, updates);
      setIsEditing(false);
      setShowPasswordField(false);
      setNewPassword('');
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const handleResetPassword = async () => {
    if (!onResetPassword) return;

    try {
      await onResetPassword(employee.id);
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Eye className="w-6 h-6 mr-3 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Employee Details</h3>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors inline-flex items-center text-sm"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Employee Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{employee.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.empId || ''}
                  onChange={(e) => setEditForm({ ...editForm, empId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono">{employee.empId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.mobile || ''}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{employee.mobile}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              {isEditing ? (
                <select
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Employee['role'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Telecaller">Telecaller</option>
                  <option value="TeamIncharge">Team Incharge</option>
                </select>
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {employee.role === 'TeamIncharge' ? 'Team Incharge' : 'Telecaller'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                {employee.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created Date
              </label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {new Date(employee.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Password Section */}
          {isEditing && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Password Management</h4>
                <button
                  onClick={() => setShowPasswordField(!showPasswordField)}
                  className="px-3 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors inline-flex items-center text-sm"
                >
                  <Key className="w-4 h-4 mr-1" />
                  {showPasswordField ? 'Cancel' : 'Update Password'}
                </button>
              </div>

              {showPasswordField && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Leave empty to keep current password
                  </p>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors inline-flex items-center text-sm"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Reset to Temporary Password
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setShowPasswordField(false);
                setNewPassword('');
                onClose();
              }}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium"
            >
              {isEditing ? 'Cancel' : 'Close'}
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium inline-flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};