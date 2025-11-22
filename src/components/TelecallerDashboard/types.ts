import type { Employee } from '../../types/employee';
import type { LucideIcon } from 'lucide-react';

export interface TelecallerDashboardProps {
  user: Employee;
  onLogout: () => void;
}

export interface PaymentNotification {
  id: string;
  customerName: string;
  loanId: string;
  amount: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  transactionId?: string;
}

export interface ActivityItem {
  id: string;
  type: 'call' | 'payment';
  time: string;
  customer: string;
  duration?: string;
  result?: string;
  amount?: string;
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
}

export interface CustomerCase {
  id: string;
  customerName: string;
  loanId: string;
  loanAmount: string;
  mobileNo: string;
  dpd: number;
  outstandingAmount: string;
  posAmount: string;
  emiAmount: string;
  pendingDues: string;
  paymentLink: string;
  address: string;
  sanctionDate: string;
  lastPaidAmount: string;
  lastPaidDate: string;
  alternateNumber: string;
  email: string;
  branchName: string;
  loanType: string;
  remarks: string;
  caseStatus?: string;
  total_collected_amount?: number;
}

export interface ColumnConfig {
  id: number;
  columnName: string;
  displayName: string;
  isActive: boolean;
}

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  department: string;
  designation: string;
  joiningDate: string;
  reportingManager: string;
  address: string;
  emergencyContact: string;
  emergencyContactName: string;
  bankAccount: string;
  ifscCode: string;
  panNumber: string;
  aadharNumber: string;
}

export interface NotificationState {
  show: boolean;
  type: 'payment' | 'call';
  message: string;
  customer: string;
  amount?: string;
  status: 'success' | 'failed' | 'pending';
}

export interface CallStatusOption {
  value: string;
  label: string;
}

export interface PtpOption {
  value: string;
  label: string;
}

export interface MenuItem {
  name: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}