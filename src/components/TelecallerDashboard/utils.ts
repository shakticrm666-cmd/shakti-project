import { CustomerCase, CallStatusOption, PtpOption } from './types';

export const getDPDColor = (dpd: number): string => {
  if (dpd <= 30) return 'text-green-600 bg-green-100';
  if (dpd <= 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+91[-\s]?)?[0]?(91)?[789]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validateAmount = (amount: string): boolean => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const callStatusOptions: CallStatusOption[] = [
  { value: 'WN', label: 'WN (Wrong Number)' },
  { value: 'SW', label: 'SW (Switched Off)' },
  { value: 'RNR', label: 'RNR (Ringing No Response)' },
  { value: 'BUSY', label: 'BUSY' },
  { value: 'CALL_BACK', label: 'CALL BACK' },
  { value: 'PTP', label: 'PTP (Promise to Pay)' },
  { value: 'FUTURE_PTP', label: 'Future PTP (Future Promise to Pay)' },
  { value: 'BPTP', label: 'BPTP (Broken Promise to Pay)' },
  { value: 'RTP', label: 'RTP (Refuse to Pay)' },
  { value: 'NC', label: 'NC (No Contact)' },
  { value: 'CD', label: 'CD (Call Disconnected)' },
  { value: 'INC', label: 'INC (Incoming Call)' }
];

export const ptpOptions: PtpOption[] = [
  { value: 'TODAY', label: 'Today' },
  { value: 'TOMORROW', label: 'Tomorrow' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'NEXT_WEEK', label: 'Next Week' },
  { value: 'PARTIAL', label: 'Partial Payment' },
  { value: 'FULL', label: 'Full Payment' }
];

export const filterCases = (
  cases: CustomerCase[],
  searchTerm: string
): CustomerCase[] => {
  if (!searchTerm.trim()) return cases;

  const term = searchTerm.toLowerCase();
  return cases.filter(case_ =>
    (case_.customerName || '').toLowerCase().includes(term) ||
    (case_.loanId || '').toLowerCase().includes(term) ||
    (case_.mobileNo || '').includes(searchTerm)
  );
};

export const paginateCases = (
  cases: CustomerCase[],
  currentPage: number,
  itemsPerPage: number
): CustomerCase[] => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return cases.slice(startIndex, startIndex + itemsPerPage);
};

export const getTotalPages = (totalItems: number, itemsPerPage: number): number => {
  return Math.ceil(totalItems / itemsPerPage);
};

export const generateTransactionId = (): string => {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const showNotification = (
  title: string,
  body: string,
  icon?: string
): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon });
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Simulate payment notification (for demo purposes)
export const simulatePaymentNotification = (
  customerName: string,
  loanId: string,
  amount: string,
  status: 'success' | 'failed' | 'pending' = 'success'
): void => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const transactionId = generateTransactionId();

  // This would normally update activity log via hooks
  console.log('Payment notification:', {
    customerName,
    loanId,
    amount,
    status,
    timeString,
    transactionId
  });

  // Show real-time notification (would be handled by useNotifications hook)
  // Show browser notification for successful payments
  if (status === 'success') {
    showNotification('💰 Payment Received!', `${customerName} paid ${amount}`);
  }
};