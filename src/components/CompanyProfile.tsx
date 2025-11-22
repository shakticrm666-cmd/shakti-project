import React, { useState } from 'react';
import { useNotification, notificationHelpers } from './shared/Notification';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  BarChart3,
  ArrowLeft,
  Edit,
  MoreVertical,
  Save,
  X,
  UserPlus,
  Shield,
  ToggleLeft,
  ToggleRight,
  Key,
  Trash2,
  Edit as EditIcon,
  Check,
  SquarePen,
  AlertCircle
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface Company {
  id: string;
  name: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface Admin {
  id: number;
  empId: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

interface FormErrors {
  [key: string]: string;
}

interface CompanyProfileProps {
  company: Company;
  onBack: () => void;
}

const CompanyProfile: React.FC<CompanyProfileProps> = ({ company, onBack }) => {
  const { showNotification } = useNotification();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    proprietorName: '',
    contactNumber: '',
    emailAddress: '',
    gstNumber: '',
    website: '',
    panNumber: '',
    companyAddress: '',
    city: '',
    state: '',
    pinCode: '',
    registrationDate: ''
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Admin Management State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedAdminForReset, setSelectedAdminForReset] = useState<Admin | null>(null);
  const [adminFormData, setAdminFormData] = useState({
    empId: '',
    password: '',
    confirmPassword: '',
    adminName: '',
    email: '',
    phone: ''
  });
  const [passwordResetData, setPasswordResetData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [adminFormErrors, setAdminFormErrors] = useState<FormErrors>({});
  const [passwordResetErrors, setPasswordResetErrors] = useState<FormErrors>({});
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  // Manual Password Update State
  const [showManualPasswordUpdateModal, setShowManualPasswordUpdateModal] = useState(false);
  const [selectedAdminForManualUpdate, setSelectedAdminForManualUpdate] = useState<Admin | null>(null);
  const [manualPasswordUpdateData, setManualPasswordUpdateData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [manualPasswordUpdateErrors, setManualPasswordUpdateErrors] = useState<FormErrors>({});
  const [admins, setAdmins] = useState<Admin[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!editFormData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }
    if (!editFormData.proprietorName.trim()) {
      errors.proprietorName = 'Proprietor name is required';
    }
    if (!editFormData.contactNumber.trim()) {
      errors.contactNumber = 'Contact number is required';
    } else if (!/^\+?[\d\s\-()]+$/.test(editFormData.contactNumber)) {
      errors.contactNumber = 'Please enter a valid contact number';
    }
    if (!editFormData.emailAddress.trim()) {
      errors.emailAddress = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.emailAddress)) {
      errors.emailAddress = 'Please enter a valid email address';
    }
    if (!editFormData.gstNumber.trim()) {
      errors.gstNumber = 'GST number is required';
    } else if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(editFormData.gstNumber)) {
      errors.gstNumber = 'Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)';
    }
    if (editFormData.panNumber && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(editFormData.panNumber)) {
      errors.panNumber = 'Please enter a valid PAN number (e.g., AABCT1234F)';
    }
    if (!editFormData.companyAddress.trim()) {
      errors.companyAddress = 'Company address is required';
    }
    if (!editFormData.city.trim()) {
      errors.city = 'City is required';
    }
    if (!editFormData.state.trim()) {
      errors.state = 'State is required';
    }
    if (!editFormData.pinCode.trim()) {
      errors.pinCode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(editFormData.pinCode)) {
      errors.pinCode = 'Please enter a valid 6-digit PIN code';
    }
    if (!editFormData.registrationDate) {
      errors.registrationDate = 'Registration date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      // Here you would typically save to backend
      console.log('Saving company data:', editFormData);
      setShowEditModal(false);
      // Show success message or update the display
    }
  };

  const handleCancel = () => {
    // Reset form data to empty values
    setEditFormData({
      companyName: '',
      proprietorName: '',
      contactNumber: '',
      emailAddress: '',
      gstNumber: '',
      website: '',
      panNumber: '',
      companyAddress: '',
      city: '',
      state: '',
      pinCode: '',
      registrationDate: ''
    });
    setFormErrors({});
    setShowEditModal(false);
  };

  // Admin Management Functions
  const handleAdminInputChange = (field: string, value: string) => {
    setAdminFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (adminFormErrors[field]) {
      setAdminFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateAdminForm = () => {
    const errors: {[key: string]: string} = {};

    if (!adminFormData.empId.trim()) {
      errors.empId = 'EMP ID is required';
    }
    if (!adminFormData.password.trim()) {
      errors.password = 'Password is required';
    } else if (adminFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!adminFormData.confirmPassword.trim()) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (adminFormData.password !== adminFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!adminFormData.adminName.trim()) {
      errors.adminName = 'Admin name is required';
    }
    if (!adminFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminFormData.email)) {
      errors.email = 'Please enter a valid email';
    }

    setAdminFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAdmin = () => {
    setEditingAdmin(null);
    setAdminFormData({
      empId: '',
      password: '',
      confirmPassword: '',
      adminName: '',
      email: '',
      phone: ''
    });
    setAdminFormErrors({});
    setShowAdminModal(true);
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setAdminFormData({
      empId: admin.empId,
      password: '',
      confirmPassword: '',
      adminName: admin.name,
      email: admin.email,
      phone: admin.phone
    });
    setAdminFormErrors({});
    setShowAdminModal(true);
  };

  const handleSaveAdmin = () => {
    if (validateAdminForm()) {
      if (editingAdmin) {
        // Update existing admin
        setAdmins(prev => prev.map(admin =>
          admin.id === editingAdmin.id
            ? { ...admin, empId: adminFormData.empId, name: adminFormData.adminName, email: adminFormData.email, phone: adminFormData.phone }
            : admin
        ));
      } else {
        // Add new admin
        const newAdmin: Admin = {
          id: Math.max(...admins.map(a => a.id)) + 1,
          empId: adminFormData.empId,
          name: adminFormData.adminName,
          email: adminFormData.email,
          phone: adminFormData.phone,
          status: 'Active' as const,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setAdmins(prev => [...prev, newAdmin]);
      }
      setShowAdminModal(false);
    }
  };

  const handleDeleteAdmin = (adminId: number) => {
    setAdmins(prev => prev.filter(admin => admin.id !== adminId));
  };

  const handleToggleAdminStatus = (adminId: number) => {
    setAdmins(prev => prev.map(admin =>
      admin.id === adminId
        ? { ...admin, status: admin.status === 'Active' ? 'Inactive' : 'Active' }
        : admin
    ));
  };

  const handleResetPassword = (admin: Admin) => {
    setSelectedAdminForReset(admin);
    setPasswordResetData({
      newPassword: '',
      confirmNewPassword: ''
    });
    setPasswordResetErrors({});
    setShowPasswordResetModal(true);
  };

  const handlePasswordResetInputChange = (field: string, value: string) => {
    setPasswordResetData(prev => ({
      ...prev,
      [field]: value
    }));
    if (passwordResetErrors[field]) {
      setPasswordResetErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validatePasswordReset = () => {
    const errors: {[key: string]: string} = {};

    if (!passwordResetData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (passwordResetData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordResetData.confirmNewPassword.trim()) {
      errors.confirmNewPassword = 'Please confirm the new password';
    } else if (passwordResetData.newPassword !== passwordResetData.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match';
    }

    setPasswordResetErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmPasswordReset = () => {
    if (validatePasswordReset() && selectedAdminForReset) {
      // In a real app, this would call an API to reset the password
      // TODO: Implement secure password reset API call

      // Show success message
      showNotification(notificationHelpers.success(
        'Password Reset',
        `Password has been successfully reset for ${selectedAdminForReset.name} (${selectedAdminForReset.empId})`
      ));

      setShowPasswordResetModal(false);
      setSelectedAdminForReset(null);
    }
  };

  // Manual Password Update Functions
  const handleManualPasswordUpdate = (admin: Admin) => {
    setSelectedAdminForManualUpdate(admin);
    setManualPasswordUpdateData({
      newPassword: '',
      confirmNewPassword: ''
    });
    setManualPasswordUpdateErrors({});
    setShowManualPasswordUpdateModal(true);
  };

  const handleManualPasswordUpdateInputChange = (field: string, value: string) => {
    setManualPasswordUpdateData(prev => ({
      ...prev,
      [field]: value
    }));
    if (manualPasswordUpdateErrors[field]) {
      setManualPasswordUpdateErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateManualPasswordUpdate = () => {
    const errors: {[key: string]: string} = {};

    if (!manualPasswordUpdateData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (manualPasswordUpdateData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!manualPasswordUpdateData.confirmNewPassword.trim()) {
      errors.confirmNewPassword = 'Please confirm the new password';
    } else if (manualPasswordUpdateData.newPassword !== manualPasswordUpdateData.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match';
    }

    setManualPasswordUpdateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmManualPasswordUpdate = () => {
    if (validateManualPasswordUpdate() && selectedAdminForManualUpdate) {
      // In a real app, this would call an API to update the password
      // TODO: Implement secure password update API call

      // Show success message
      showNotification(notificationHelpers.success(
        'Password Updated',
        `Password has been successfully updated for ${selectedAdminForManualUpdate.name} (${selectedAdminForManualUpdate.empId})`
      ));

      setShowManualPasswordUpdateModal(false);
      setSelectedAdminForManualUpdate(null);
    }
  };

  // TODO: Replace with real company data from API
  const companyDetails = {
    ...company,
    address: '',
    email: '',
    website: '',
    phone: '',
    establishedDate: '',
    licenseNumber: '',
    totalLoans: 0,
    activeLoans: 0,
    recoveredAmount: 0,
    pendingAmount: 0,
    defaultRate: 0,
    avgRecoveryTime: 0,
    monthlyTarget: 0,
    employees: [],
    recentActivities: [],
    monthlyTrends: {
      labels: [],
      datasets: [{
        label: 'Collections (₹)',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{companyDetails.name}</h1>
                <p className="text-gray-600">Company Profile & Performance Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Information Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Metrics Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Business Metrics</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">Total Recovered</span>
                <span className="text-lg font-bold text-green-900">₹{(companyDetails.recoveredAmount / 100000).toFixed(1)}L</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">Recovery Rate</span>
                <span className="text-lg font-bold text-blue-900">{(100 - companyDetails.defaultRate).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-purple-800">Active Loans</span>
                <span className="text-lg font-bold text-purple-900">{companyDetails.activeLoans}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium text-orange-800">Avg Recovery Time</span>
                <span className="text-lg font-bold text-orange-900">{companyDetails.avgRecoveryTime} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Phone className="w-6 h-6 text-green-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Email Address</p>
                  <p className="font-semibold text-gray-900">{companyDetails.email}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-semibold text-gray-900">{companyDetails.phone}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Globe className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  <p className="font-semibold text-gray-900">{companyDetails.website}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-900">{companyDetails.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Information Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Building2 className="w-6 h-6 text-purple-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Legal Information</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">GST Number:</span>
                <span className="font-semibold text-gray-900">-</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">PAN Number:</span>
                <span className="font-semibold text-gray-900">-</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Registration Date:</span>
                <span className="font-semibold text-gray-900">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Admin Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-purple-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Admin Management</h3>
                <p className="text-sm text-gray-600">Manage company administrators and their access</p>
              </div>
            </div>
            <button
              onClick={handleAddAdmin}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMP ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.empId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        admin.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.createdAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Active/Inactive Toggle */}
                        <button
                          onClick={() => handleToggleAdminStatus(admin.id)}
                          className={`p-1 rounded-full ${
                            admin.status === 'Active' ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {admin.status === 'Active' ?
                            <ToggleRight className="w-5 h-5" /> :
                            <ToggleLeft className="w-5 h-5" />
                          }
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Admin"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleResetPassword(admin)}
                          className="text-orange-600 hover:text-orange-900 p-1"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        {/* Manual Password Update Button */}
                        <button
                          onClick={() => handleManualPasswordUpdate(admin)}
                          className="text-purple-600 hover:text-purple-900 p-1"
                          title="Update Password Manually"
                        >
                          <SquarePen className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Company Profile</h2>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-8">
                {/* Basic Information Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={editFormData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.companyName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter company name"
                      />
                      {formErrors.companyName && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.companyName}</p>
                      )}
                    </div>

                    {/* Proprietor Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proprietor Name *
                      </label>
                      <input
                        type="text"
                        value={editFormData.proprietorName}
                        onChange={(e) => handleInputChange('proprietorName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.proprietorName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter proprietor name"
                      />
                      {formErrors.proprietorName && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.proprietorName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        value={editFormData.contactNumber}
                        onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.contactNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter contact number"
                      />
                      {formErrors.contactNumber && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.contactNumber}</p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={editFormData.emailAddress}
                        onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.emailAddress ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter email address"
                      />
                      {formErrors.emailAddress && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.emailAddress}</p>
                      )}
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website <span className="text-sm text-gray-500">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={editFormData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="www.example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Legal Information Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Legal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* GST Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST Number *
                      </label>
                      <input
                        type="text"
                        value={editFormData.gstNumber}
                        onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.gstNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="XXAAAAA0000A1Z5"
                        maxLength={15}
                      />
                      {formErrors.gstNumber && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.gstNumber}</p>
                      )}
                    </div>

                    {/* PAN Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number <span className="text-sm text-gray-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.panNumber}
                        onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.panNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="AAAAA0000A"
                        maxLength={10}
                      />
                      {formErrors.panNumber && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.panNumber}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Address Information</h4>
                  <div className="space-y-6">
                    {/* Company Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Address *
                      </label>
                      <textarea
                        value={editFormData.companyAddress}
                        onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.companyAddress ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter complete company address"
                      />
                      {formErrors.companyAddress && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.companyAddress}</p>
                      )}
                    </div>

                    {/* City, State, PIN Code Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* City */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={editFormData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter city"
                        />
                        {formErrors.city && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                        )}
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          value={editFormData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.state ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter state"
                        />
                        {formErrors.state && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.state}</p>
                        )}
                      </div>

                      {/* PIN Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          value={editFormData.pinCode}
                          onChange={(e) => handleInputChange('pinCode', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.pinCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="123456"
                          maxLength={6}
                        />
                        {formErrors.pinCode && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.pinCode}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration Information Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Registration Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Registration Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Registration / Onboarding *
                      </label>
                      <input
                        type="date"
                        value={editFormData.registrationDate}
                        onChange={(e) => handleInputChange('registrationDate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.registrationDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.registrationDate && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.registrationDate}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Management Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
                </h2>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EMP ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EMP ID *
                  </label>
                  <input
                    type="text"
                    value={adminFormData.empId}
                    onChange={(e) => handleAdminInputChange('empId', e.target.value.toUpperCase())}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      adminFormErrors.empId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="EMPXXX"
                    maxLength={10}
                  />
                  {adminFormErrors.empId && (
                    <p className="text-red-500 text-sm mt-1">{adminFormErrors.empId}</p>
                  )}
                </div>

                {/* Admin Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Name *
                  </label>
                  <input
                    type="text"
                    value={adminFormData.adminName}
                    onChange={(e) => handleAdminInputChange('adminName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      adminFormErrors.adminName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter admin name"
                  />
                  {adminFormErrors.adminName && (
                    <p className="text-red-500 text-sm mt-1">{adminFormErrors.adminName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={adminFormData.email}
                    onChange={(e) => handleAdminInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      adminFormErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="admin@company.com"
                  />
                  {adminFormErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{adminFormErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={adminFormData.phone}
                    onChange={(e) => handleAdminInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (XXX) XXX-XXXX"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {!editingAdmin && '*'}
                  </label>
                  <input
                    type="password"
                    value={adminFormData.password}
                    onChange={(e) => handleAdminInputChange('password', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      adminFormErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={editingAdmin ? 'Leave blank to keep current password' : 'Enter password'}
                  />
                  {adminFormErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{adminFormErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password {!editingAdmin && '*'}
                  </label>
                  <input
                    type="password"
                    value={adminFormData.confirmPassword}
                    onChange={(e) => handleAdminInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      adminFormErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm password"
                  />
                  {adminFormErrors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{adminFormErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAdmin}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {editingAdmin ? 'Update Admin' : 'Add Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && selectedAdminForReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Key className="w-6 h-6 text-orange-500 mr-3" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
                    <p className="text-sm text-gray-600">Reset password for {selectedAdminForReset.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordResetModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Admin Details</p>
                    <p className="text-sm text-blue-600">{selectedAdminForReset.name} ({selectedAdminForReset.empId})</p>
                    <p className="text-sm text-blue-600">{selectedAdminForReset.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordResetData.newPassword}
                    onChange={(e) => handlePasswordResetInputChange('newPassword', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      passwordResetErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
                  />
                  {passwordResetErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordResetErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordResetData.confirmNewPassword}
                    onChange={(e) => handlePasswordResetInputChange('confirmNewPassword', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      passwordResetErrors.confirmNewPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                  />
                  {passwordResetErrors.confirmNewPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordResetErrors.confirmNewPassword}</p>
                  )}
                </div>
              </div>

              {/* Warning Message */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This action cannot be undone. The admin will need to use the new password to log in.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPasswordResetModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPasswordReset}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Password Update Modal */}
      {showManualPasswordUpdateModal && selectedAdminForManualUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <SquarePen className="w-6 h-6 text-purple-500 mr-3" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Update Password Manually</h2>
                    <p className="text-sm text-gray-600">Update password for {selectedAdminForManualUpdate.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualPasswordUpdateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-purple-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Admin Details</p>
                    <p className="text-sm text-purple-600">{selectedAdminForManualUpdate.name} ({selectedAdminForManualUpdate.empId})</p>
                    <p className="text-sm text-purple-600">{selectedAdminForManualUpdate.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={manualPasswordUpdateData.newPassword}
                    onChange={(e) => handleManualPasswordUpdateInputChange('newPassword', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      manualPasswordUpdateErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
                  />
                  {manualPasswordUpdateErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{manualPasswordUpdateErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={manualPasswordUpdateData.confirmNewPassword}
                    onChange={(e) => handleManualPasswordUpdateInputChange('confirmNewPassword', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      manualPasswordUpdateErrors.confirmNewPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                  />
                  {manualPasswordUpdateErrors.confirmNewPassword && (
                    <p className="text-red-500 text-sm mt-1">{manualPasswordUpdateErrors.confirmNewPassword}</p>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowManualPasswordUpdateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmManualPasswordUpdate}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center"
                >
                  <SquarePen className="w-4 h-4 mr-2" />
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;