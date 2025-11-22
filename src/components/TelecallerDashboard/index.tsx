import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Phone,
  DollarSign,
  AlertCircle,
  AlertTriangle,

  X,
  Zap,
  Bell,
  Users,
  Briefcase,
  BarChart3,
  Settings,
} from 'lucide-react';
import { customerCaseService, CustomerCase as ServiceCustomerCase } from '../../services/customerCaseService';
import { useNotification, notificationHelpers } from '../shared/Notification';
import CustomerCaseTable from './CustomerCaseTable';
import { CallsPerformanceCard } from './CallsPerformanceCard';
import { CollectionsSummaryCard } from './CollectionsSummaryCard';
import { CasesStatusOverviewCard } from './CasesStatusOverviewCard';
import { FollowUpCard } from './FollowUpCard';
import { TeamToppersCard } from './TeamToppersCard';
import { ReportsDashboard } from './ReportsDashboard';
import { NotificationsDrawer } from './NotificationsDrawer';
import { EditProfileModal } from './EditProfileModal';
import { CaseDetailsModal } from './CaseDetailsModal';
import { CallLogModal, CallLogData } from './CallLogModal';
import { StatusUpdateModal } from './StatusUpdateModal';
import { CelebrationProvider } from '../../contexts/CelebrationContext';
import { PaymentCelebration } from './PaymentCelebration';
import { CaseFieldModal } from './CaseFieldModal';
import { CustomerCase as DashboardCustomerCase } from './types';

interface TelecallerDashboardProps {
  user: {
    id: string;
    empId: string;
    role: string;
    tenantId?: string;
    [key: string]: unknown;
  };
  onLogout: () => void;
}

export const TelecallerDashboard: React.FC<TelecallerDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'SHAMA',
    email: 'shama@example.com',
    phone: '+91 9876543210',
    dob: '1990-05-15',
    gender: 'Female',
    address: '123 Main Street, Apartment 4B',
    city: 'Mumbai',
    state: 'Maharashtra'
  });
  const [performanceData, setPerformanceData] = useState({
    dailyCalls: { current: 45, target: 60 },
    weeklyCalls: { current: 280, target: 300 },
    monthlyCalls: { current: 1200, target: 1500 },
    collections: { collected: 0, target: 100000, progress: 0 }
  });

  const [followUpData, setFollowUpData] = useState({
    todaysFollowUps: 0,
    upcomingFollowUps: 0,
    todaysPTP: 0
  });

  const [caseStatusMetrics, setCaseStatusMetrics] = useState({
    total: 0,
    new: 0,
    assigned: 0,
    inProgress: 0,
    closed: 0
  });

  const teamToppersData = [
    { name: 'Rajesh Kumar', callsDoneToday: 67, collectionAmount: 45000, ptpSuccessPercent: 85 },
    { name: 'Priya Sharma', callsDoneToday: 62, collectionAmount: 38000, ptpSuccessPercent: 78 },
    { name: 'Amit Singh', callsDoneToday: 58, collectionAmount: 32000, ptpSuccessPercent: 72 }
  ];

  const [customerCases, setCustomerCases] = useState<ServiceCustomerCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    assignedCases: 0,
    callsToday: 0,
    recoveryToday: 0,
    pendingFollowups: 0
  });

  const [selectedCase, setSelectedCase] = useState<DashboardCustomerCase | null>(null);
  const [isCaseDetailsOpen, setIsCaseDetailsOpen] = useState(false);
  const [isCallLogOpen, setIsCallLogOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [isCaseFieldModalOpen, setIsCaseFieldModalOpen] = useState(false);
  const [casesWithPendingFollowups, setCasesWithPendingFollowups] = useState<string[]>([]);
  const [showPendingFollowupsOnly, setShowPendingFollowupsOnly] = useState(false);

  const { showNotification } = useNotification();

  const menuItems = [
    { name: 'My Workboard', icon: Briefcase, active: activeSection === 'dashboard', onClick: () => setActiveSection('dashboard') },
    { name: 'Cases', icon: FileText, active: activeSection === 'cases', onClick: () => setActiveSection('cases') },
    { name: 'Reports', icon: BarChart3, active: activeSection === 'reports', onClick: () => setActiveSection('reports') },
    { name: 'Notifications', icon: Bell, active: activeSection === 'notifications', onClick: () => setActiveSection('notifications') },
    { name: 'Profile & Settings', icon: Settings, active: activeSection === 'profile', onClick: () => setActiveSection('profile') },
  ];

  // Performance data is now static to match the desired design

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const cases = await customerCaseService.getCasesByTelecaller(user.tenantId!, user!.empId);
      setCustomerCases(cases);

      const dashboardMetrics = await customerCaseService.getDashboardMetrics(user.tenantId!, user.empId);

      setPerformanceData(prev => ({
        ...prev,
        collections: dashboardMetrics.collections
      }));

      setFollowUpData(dashboardMetrics.followUps);
      setCaseStatusMetrics(dashboardMetrics.caseStatus);

      const casesWithFollowups = await customerCaseService.getCasesWithPendingFollowups(user.tenantId!, user.empId);
      setCasesWithPendingFollowups(casesWithFollowups);

      const assignedCases = cases.length;
      const pendingFollowups = dashboardMetrics.followUps.todaysFollowUps + dashboardMetrics.followUps.upcomingFollowUps;

      setMetrics({
        assignedCases,
        callsToday: 0,
        recoveryToday: dashboardMetrics.collections.collected,
        pendingFollowups
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showNotification(notificationHelpers.error(
        'Error',
        'Failed to load customer cases'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, showNotification]);

  // Load basic dashboard data
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id, loadDashboardData]);

  // Performance data is now static to match the desired design





  return (
    <CelebrationProvider tenantId={user.tenantId} teamId={user.teamId}>
      <PaymentCelebration />
      <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        <div className="flex items-center justify-center border-b border-gray-300 bg-white h-20">
          <div className="flex items-center px-6 py-3">
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-2xl shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <Zap className="w-7 h-7 lg:w-8 lg:h-8 text-white relative z-10" strokeWidth={2.5} />
              </div>
              <div className="absolute -inset-1 border-2 border-orange-300/30 rounded-2xl animate-pulse"></div>
            </div>
            <div className="flex flex-col ml-4">
              <h2 className="text-xl lg:text-2xl font-bold text-black tracking-wide drop-shadow-sm">Shakti</h2>
            </div>
          </div>
        </div>

        <nav className="mt-5 px-2 flex-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`${item.active
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-slate-50 hover:text-slate-800'
                  } group flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full mb-2 transition-all duration-200 border border-transparent hover:border-slate-200`}
              >
                <IconComponent className="mr-3 flex-shrink-0 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>


        <div className="flex-shrink-0 w-full p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center mb-3">
            <div className="bg-purple-500 rounded-full p-2 mr-3 shadow-md">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{String(user.name)}</p>
              <p className="text-xs text-slate-600 font-medium">Telecaller</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-all duration-200 border border-slate-200"
          >
            <X className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white shadow-lg border-b border-gray-300 flex-shrink-0 h-20">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center space-x-2 lg:space-x-3 flex-1 min-w-0">
              <div className="bg-purple-500 rounded-lg p-2 flex-shrink-0">
                <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm lg:text-base font-semibold text-black truncate">Shakti - Telecaller</h2>
                <p className="text-xs text-gray-700 hidden sm:block">Tenant Dashboard</p>
              </div>
            </div>
            <div className="flex items-center flex-shrink-0 ml-4 space-x-3">
              <button
                onClick={() => setActiveSection('notifications')}
                className="relative p-2 text-black transition-colors rounded-lg hover:bg-gray-100"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">3</span>
              </button>
              <div className="hidden md:flex items-center space-x-3 text-black">
                <div className="text-right">
                  <p className="text-sm font-medium text-black">Welcome back</p>
                  <p className="text-xs text-gray-700">{String(user.name)}</p>
                </div>
                <div className="bg-green-500 rounded-full p-2">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
          <div className="max-w-full">
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-purple-500 rounded-lg p-3 mr-4">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Assigned Cases</p>
                        <p className="text-2xl font-bold text-gray-900">{metrics.assignedCases}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-blue-500 rounded-lg p-3 mr-4">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Calls Today</p>
                        <p className="text-2xl font-bold text-gray-900">{metrics.callsToday}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-green-500 rounded-lg p-3 mr-4">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Recovery Today</p>
                        <p className="text-2xl font-bold text-gray-900">{metrics.recoveryToday}</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-lg hover:border-orange-300 transition-all duration-200"
                    onClick={() => {
                      setActiveSection('cases');
                      setShowPendingFollowupsOnly(true);
                    }}
                  >
                    <div className="flex items-center">
                      <div className="bg-orange-500 rounded-lg p-3 mr-4">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Follow-ups</p>
                        <p className="text-2xl font-bold text-gray-900">{metrics.pendingFollowups}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CallsPerformanceCard performanceData={performanceData} />
                  <CollectionsSummaryCard performanceData={performanceData} />
                  <CasesStatusOverviewCard customerCases={customerCases} caseStatusMetrics={caseStatusMetrics} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FollowUpCard followUpData={followUpData} />
                  <TeamToppersCard toppers={teamToppersData} />
                </div>
              </div>
            )}

            {activeSection === 'cases' && (
              <div className="space-y-6">
                {/* Cases Header with Field Management Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">My Cases</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage and track your assigned loan recovery cases</p>
                  </div>
                </div>

                <CustomerCaseTable
                  casesWithPendingFollowups={casesWithPendingFollowups}
                  showPendingFollowupsOnly={showPendingFollowupsOnly}
                  onClearFollowupFilter={() => setShowPendingFollowupsOnly(false)}
                  customerCases={customerCases.map(c => {
                    const details = c.case_data || {};

                    // Helper to safely get values with multiple key possibilities
                    const getValue = (keys: string[]) => {
                      for (const key of keys) {
                        if (details[key] !== undefined && details[key] !== null && details[key] !== '') {
                          return details[key];
                        }
                      }
                      return '';
                    };

                    const mappedCase = {
                      id: c.id || '',
                      customerName: c.customer_name || getValue(['customerName', 'Customer Name']) || '',
                      loanId: c.loan_id || getValue(['loanId', 'loanNumber', 'Loan ID']) || '',
                      mobileNo: c.mobile_no || getValue(['mobileNo', 'mobileNumber', 'Mobile Number']) || '',
                      dpd: c.dpd || Number(getValue(['dpd', 'DPD'])) || 0,
                      outstandingAmount: c.outstanding_amount || getValue(['totalOutstanding', 'outstandingAmount', 'TOTAL OUTSTANDING', 'Total Outstanding', 'pos', 'posAmount']) || '',
                      emiAmount: c.emi_amount || getValue(['emi', 'emiAmount', 'EMI']) || '',
                      lastPaidDate: c.last_paid_date || getValue(['lastPaymentDate', 'lastPaidDate', 'LAST PAYMENT DATE']) || '',
                      loanAmount: c.loan_amount || getValue(['loanAmount', 'Loan Amount']) || '',
                      posAmount: c.pos_amount || getValue(['pos', 'posAmount', 'POS']) || '',
                      pendingDues: c.pending_dues || '',
                      paymentLink: c.payment_link || getValue(['paymentLink', 'Payment Link']) || '',
                      alternateNumber: c.alternate_number || getValue(['alternateNumber', 'Alternate Number']) || '',
                      sanctionDate: c.sanction_date || getValue(['loanCreatedAt', 'sanctionDate', 'LOAN CREATED AT']) || '',
                      lastPaidAmount: c.last_paid_amount || getValue(['lastPaymentAmount', 'lastPaidAmount', 'LAST PAYMENT AMOUNT']) || '',
                      branchName: c.branch_name || '',
                      loanType: c.loan_type || getValue(['loanType', 'Loan Type']) || '',
                      caseStatus: c.case_status || '',
                      address: c.address || getValue(['address', 'Address']) || '',
                      email: c.email || getValue(['email', 'Email']) || '',
                      remarks: c.remarks || '',
                      total_collected_amount: c.total_collected_amount || 0,
                      // Include all fields from case_data for complete details
                      ...details,
                      // Include all fields from custom_fields if they exist
                      ...(c.custom_fields || {})
                    };
                    return mappedCase;
                  })}
                  columnConfigs={[
                    { id: 1, columnName: 'customerName', displayName: 'Customer Name', isActive: true },
                    { id: 2, columnName: 'loanId', displayName: 'Loan ID', isActive: true },
                    { id: 3, columnName: 'mobileNo', displayName: 'Mobile', isActive: true },
                    { id: 4, columnName: 'dpd', displayName: 'DPD', isActive: true },
                    { id: 5, columnName: 'outstandingAmount', displayName: 'Outstanding', isActive: true },
                    { id: 6, columnName: 'emiAmount', displayName: 'EMI Amount', isActive: true },
                    { id: 7, columnName: 'lastPaidDate', displayName: 'Last Paid', isActive: true }
                  ]}
                  isLoading={isLoading}
                  tenantId={user.tenantId!}
                  empId={user.empId}
                  onViewDetails={(caseData) => {
                    setSelectedCase(caseData);
                    setIsCaseDetailsOpen(true);
                  }}
                  onCallCustomer={(caseData) => {
                    setSelectedCase(caseData);
                    setIsCallLogOpen(true);
                  }}
                  onManageFields={(caseData) => {
                    setSelectedCase(caseData);
                    setIsCaseFieldModalOpen(true);
                  }}
                />
              </div>
            )}

            {activeSection === 'reports' && (
              <ReportsDashboard />
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                  <p className="text-gray-600 mb-6">Latest updates from your CRM</p>

                  {/* Category Tabs */}
                  <div className="mb-6">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {['All', 'Cases', 'Follow-ups', 'PTP', 'Payments', 'Attendance', 'System'].map((category) => (
                        <button
                          key={category}
                          className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${category === 'All'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                        >
                          {category}
                          {category === 'All' && (
                            <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              3
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="space-y-4">
                    {[
                      {
                        id: '1',
                        title: 'New case assigned',
                        description: 'Case #1234 has been assigned to you for follow-up',
                        time: '2 minutes ago',
                        isRead: false,
                        category: 'Cases'
                      },
                      {
                        id: '2',
                        title: 'Follow-up reminder',
                        description: 'Scheduled follow-up with customer Rajesh Kumar in 30 minutes',
                        time: '15 minutes ago',
                        isRead: false,
                        category: 'Follow-ups'
                      },
                      {
                        id: '3',
                        title: 'PTP confirmed',
                        description: 'Promise to pay confirmed for ₹25,000 by customer Priya Sharma',
                        time: '1 hour ago',
                        isRead: true,
                        category: 'PTP'
                      },
                      {
                        id: '4',
                        title: 'Payment received',
                        description: '₹15,000 payment received from customer Amit Singh',
                        time: '2 hours ago',
                        isRead: true,
                        category: 'Payments'
                      },
                      {
                        id: '5',
                        title: 'Attendance marked',
                        description: 'Your attendance has been marked for today',
                        time: '3 hours ago',
                        isRead: true,
                        category: 'Attendance'
                      },
                      {
                        id: '6',
                        title: 'System maintenance',
                        description: 'Scheduled maintenance completed successfully',
                        time: '1 day ago',
                        isRead: true,
                        category: 'System'
                      }
                    ].map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-colors ${!notification.isRead
                          ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-900'
                              }`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Mark All as Read
                      </button>
                      <button className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                        Clear Notifications
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'profile' && (
              <div className="min-h-screen bg-gray-50 animate-fade-in">
                <div className="max-w-4xl mx-auto py-10 px-5">
                  {/* Profile Header Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 relative">
                    <button
                      onClick={() => setIsEditProfileOpen(true)}
                      className="absolute top-6 right-6 bg-gray-900 text-white text-sm px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
                    >
                      Edit
                    </button>

                    <div className="flex items-center space-x-8">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform ease-in-out">
                          <span className="text-3xl font-bold text-white">
                            {profileData.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="mt-2 text-center">
                          <button className="text-sm text-blue-600 hover:underline cursor-pointer">
                            Change Photo
                          </button>
                        </div>
                      </div>

                      <div className="flex-1">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{profileData.name}</h1>
                        <div className="space-y-1 text-gray-600">
                          <p className="text-sm">Telecaller</p>
                          <p className="text-sm">EMP ID: {user.empId}</p>
                          <p className="text-sm">{profileData.email}</p>
                          <p className="text-sm">{profileData.phone}</p>
                        </div>
                        <div className="mt-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            Telecaller
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Personal Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border-b border-gray-100 py-3">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">Full Name</label>
                        <p className="text-base text-gray-800 font-medium">{profileData.name}</p>
                      </div>

                      <div className="border-b border-gray-100 py-3">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">Email</label>
                        <p className="text-base text-gray-800 font-medium">{profileData.email}</p>
                      </div>

                      <div className="border-b border-gray-100 py-3">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">Phone Number</label>
                        <p className="text-base text-gray-800 font-medium">{profileData.phone}</p>
                      </div>

                      <div className="border-b border-gray-100 py-3">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">Date of Birth</label>
                        <p className="text-base text-gray-800 font-medium">{new Date(profileData.dob).toLocaleDateString()}</p>
                      </div>

                      <div className="border-b border-gray-100 py-3">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">Gender</label>
                        <p className="text-base text-gray-800 font-medium">{profileData.gender}</p>
                      </div>

                      <div className="border-b border-gray-100 py-3">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">City / State</label>
                        <p className="text-base text-gray-800 font-medium">{profileData.city}, {profileData.state}</p>
                      </div>

                      <div className="border-b border-gray-100 py-3 md:col-span-2">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">Address</label>
                        <p className="text-base text-gray-800 font-medium">{profileData.address}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Edit Information
                      </button>
                    </div>
                  </div>

                  {/* Account Details Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Account Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border-b border-gray-100 py-3">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">EMP ID</label>
                        <p className="text-base text-gray-800 font-medium">{user.empId}</p>
                      </div>

                      <div className="border-b border-gray-100 py-3">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">Team Name</label>
                        <p className="text-base text-gray-800 font-medium">Collections Team A</p>
                      </div>

                      <div className="border-b border-gray-100 py-3">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">Supervisor Name</label>
                        <p className="text-base text-gray-800 font-medium">Rajesh Kumar</p>
                      </div>

                      <div className="border-b border-gray-100 py-3">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">Joining Date</label>
                        <p className="text-base text-gray-800 font-medium">January 15, 2024</p>
                      </div>

                      <div className="border-b border-gray-100 py-3 md:col-span-2">
                        <label className="block text-sm uppercase tracking-wide text-gray-500 mb-1">Status</label>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={(data) => {
          setProfileData(data);
          showNotification(notificationHelpers.success(
            'Success',
            'Profile updated successfully'
          ));
        }}
        initialData={profileData}
      />

      {/* Case Details Modal */}
      <CaseDetailsModal
        isOpen={isCaseDetailsOpen}
        onClose={() => {
          setIsCaseDetailsOpen(false);
          setSelectedCase(null);
        }}
        caseData={selectedCase}
        user={user}
        onCaseUpdated={loadDashboardData}
      />

      {/* Call Log Modal */}
      <CallLogModal
        isOpen={isCallLogOpen}
        onClose={() => {
          setIsCallLogOpen(false);
          setSelectedCase(null);
        }}
        caseData={selectedCase}
        onSave={(logData: CallLogData) => {
          console.log('Call log saved:', logData);
          showNotification(notificationHelpers.success(
            'Call Logged',
            `Call log saved successfully for ${selectedCase?.customerName}`
          ));
          setIsCallLogOpen(false);
          setSelectedCase(null);
          loadDashboardData();
        }}
      />

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={isStatusUpdateOpen}
        onClose={() => {
          setIsStatusUpdateOpen(false);
          setSelectedCase(null);
        }}
        caseData={selectedCase}
        onSave={(status: string) => {
          console.log('Status updated:', status);
          showNotification(notificationHelpers.success(
            'Status Updated',
            `Case status updated to: ${status}`
          ));
          setIsStatusUpdateOpen(false);
          setSelectedCase(null);
          loadDashboardData();
        }}
      />

      {/* Case Field Management Modal */}
      <CaseFieldModal
        isOpen={isCaseFieldModalOpen}
        onClose={() => setIsCaseFieldModalOpen(false)}
        caseData={selectedCase}
        onSave={async (updatedFields) => {
          if (!selectedCase?.id) return;

          try {
            // Map camelCase fields to snake_case for the service
            const serviceUpdates: Partial<ServiceCustomerCase> = {};
            if (updatedFields.mobileNo) serviceUpdates.mobile_no = updatedFields.mobileNo;
            if (updatedFields.outstandingAmount) serviceUpdates.outstanding_amount = updatedFields.outstandingAmount;
            if (updatedFields.emiAmount) serviceUpdates.emi_amount = updatedFields.emiAmount;
            if (updatedFields.lastPaidDate) serviceUpdates.last_paid_date = updatedFields.lastPaidDate;
            if (updatedFields.lastPaidAmount) serviceUpdates.last_paid_amount = updatedFields.lastPaidAmount;
            if (updatedFields.alternateNumber) serviceUpdates.alternate_number = updatedFields.alternateNumber;
            if (updatedFields.email) serviceUpdates.email = updatedFields.email;
            if (updatedFields.address) serviceUpdates.address = updatedFields.address;

            await customerCaseService.updateCase(selectedCase.id, serviceUpdates);
            showNotification(notificationHelpers.success(
              'Fields Updated',
              'Case fields have been updated successfully.'
            ));
            // Refresh cases data
            loadDashboardData();
          } catch (error) {
            console.error('Error updating case fields:', error);
            showNotification(notificationHelpers.error(
              'Update Failed',
              'Failed to update case fields. Please try again.'
            ));
          }
        }}
      />
      </div>
    </CelebrationProvider>
  );
};

export default TelecallerDashboard;