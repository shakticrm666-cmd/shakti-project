import { useState, useEffect, useCallback } from 'react';
import { columnConfigService } from '../../services/columnConfigService';
import { customerCaseService } from '../../services/customerCaseService';
import { CustomerCase, ColumnConfig, ActivityItem, NotificationState } from './types';
import { generateTransactionId, formatDateTime, showNotification } from './utils';
import type { Employee } from '../../types/employee';

export const useCustomerCases = (user: Employee) => {
  const [customerCases, setCustomerCases] = useState<CustomerCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomerCases = useCallback(async () => {
    if (!user?.tenantId || !user?.empId) return;

    try {
      setIsLoading(true);
      setError(null);
      const cases = await customerCaseService.getCasesByEmployee(user.tenantId, user.empId);

      const formattedCases: CustomerCase[] = cases.map(c => ({
        id: c.id || '',
        customerName: c.customer_name || '',
        loanId: c.loan_id || '',
        loanAmount: c.loan_amount || '',
        mobileNo: c.mobile_no || '',
        dpd: c.dpd || 0,
        outstandingAmount: c.outstanding_amount || '',
        posAmount: c.pos_amount || '',
        emiAmount: c.emi_amount || '',
        pendingDues: c.pending_dues || '',
        paymentLink: c.payment_link || '',
        address: c.address || '',
        sanctionDate: c.sanction_date || '',
        lastPaidAmount: c.last_paid_amount || '',
        lastPaidDate: c.last_paid_date || '',
        alternateNumber: c.alternate_number || '',
        email: c.email || '',
        branchName: c.branch_name || '',
        loanType: c.loan_type || '',
        remarks: c.remarks || '',
        caseStatus: c.case_status || ''
      }));

      setCustomerCases(formattedCases);
    } catch (error) {
      console.error('Error loading customer cases:', error);
      setError('Failed to load customer cases');
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId, user?.empId]);

  useEffect(() => {
    loadCustomerCases();
  }, [loadCustomerCases]);

  return { customerCases, isLoading, error, refetch: loadCustomerCases };
};

export const useColumnConfigurations = (user: Employee) => {
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadColumnConfigurations = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setError(null);
      const configs = await columnConfigService.getActiveColumnConfigurations(user.tenantId);
      const formattedConfigs: ColumnConfig[] = configs.map(config => ({
        id: parseInt(config.id || '0'),
        columnName: config.column_name,
        displayName: config.display_name,
        isActive: config.is_active
      }));
      setColumnConfigs(formattedConfigs);
    } catch (error) {
      console.error('Error loading column configurations:', error);
      setError('Failed to load column configurations');
    }
  }, [user?.tenantId]);

  useEffect(() => {
    loadColumnConfigurations();
  }, [loadColumnConfigurations]);

  return { columnConfigs, error };
};

export const useActivityLog = () => {
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([
    { id: '1', type: 'call', time: '2:30 PM', customer: 'Amit Patel', duration: '8 min', result: 'Promise to Pay', status: 'success' },
    { id: '2', type: 'call', time: '1:45 PM', customer: 'Meera Reddy', duration: '3 min', result: 'No Answer', status: 'failed' },
    { id: '3', type: 'call', time: '12:15 PM', customer: 'Rohit Gupta', duration: '12 min', result: 'Partial Payment', status: 'success' },
    { id: '4', type: 'call', time: '11:30 AM', customer: 'Kavita Singh', duration: '5 min', result: 'Callback Requested', status: 'pending' },
    { id: '5', type: 'call', time: '10:45 AM', customer: 'Deepak Kumar', duration: '15 min', result: 'Full Settlement', status: 'success' }
  ]);

  const addActivity = useCallback((activity: Omit<ActivityItem, 'id'>) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: Date.now().toString()
    };
    setActivityLog(prev => [newActivity, ...prev.slice(0, 9)]); // Keep only last 10 activities
  }, []);

  return { activityLog, addActivity };
};

export const useNotifications = () => {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showPaymentNotification = useCallback((
    customerName: string,
    amount: string,
    status: 'success' | 'failed' | 'pending' = 'success'
  ) => {
    const now = new Date();
    const timeString = formatDateTime(now);
    const transactionId = generateTransactionId();

    const newActivity: ActivityItem = {
      id: `payment-${Date.now()}`,
      type: 'payment',
      time: timeString,
      customer: customerName,
      amount: amount,
      status: status,
      transactionId: transactionId
    };

    // Show real-time notification
    setNotification({
      show: true,
      type: 'payment',
      message: `Payment ${status === 'success' ? 'received' : status === 'pending' ? 'pending' : 'failed'}`,
      customer: customerName,
      amount: amount,
      status: status
    });

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);

    // Browser notification for successful payments
    if (status === 'success') {
      showNotification('💰 Payment Received!', `${customerName} paid ${amount}`);
    }

    return newActivity;
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return { notification, showPaymentNotification, hideNotification };
};

export const useSearch = (initialTerm: string = '') => {
  const [searchTerm, setSearchTerm] = useState(initialTerm);

  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return { searchTerm, updateSearchTerm };
};

export const usePagination = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  return { currentPage, setCurrentPage: goToPage, nextPage, prevPage };
};

export const useModal = (initialState: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
};

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = Date.now().toString();
    const toast: ToastData = {
      id,
      type,
      title,
      message,
      duration
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);



  const success = useCallback((title: string, message?: string) =>
    addToast('success', title, message), [addToast]);

  const error = useCallback((title: string, message?: string) =>
    addToast('error', title, message), [addToast]);

  const warning = useCallback((title: string, message?: string) =>
    addToast('warning', title, message), [addToast]);

  const info = useCallback((title: string, message?: string) =>
    addToast('info', title, message), [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};