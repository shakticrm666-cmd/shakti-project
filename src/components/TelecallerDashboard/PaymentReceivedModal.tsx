import React, { useState } from 'react';
import { X, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface PaymentReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: {
    id: string;
    customer_name?: string;
    customerName?: string;
    loan_id?: string;
    loanId?: string;
    outstanding_amount?: string;
    outstandingAmount?: string;
    loan_amount?: string;
    loanAmount?: string;
    total_collected_amount?: number;
  };
  onSubmit: (amount: number, notes: string) => Promise<void>;
}

export const PaymentReceivedModal: React.FC<PaymentReceivedModalProps> = ({
  isOpen,
  onClose,
  caseData,
  onSubmit
}) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const customerName = caseData.customer_name || caseData.customerName || 'N/A';
  const loanId = caseData.loan_id || caseData.loanId || 'N/A';
  const outstandingAmount = parseFloat(caseData.outstanding_amount || caseData.outstandingAmount || '0');
  const totalCollected = caseData.total_collected_amount || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountValue = parseFloat(amount);

    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!notes.trim()) {
      setError('Please add notes about this payment');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(amountValue, notes.trim());
      setAmount('');
      setNotes('');
      onClose();
    } catch (err) {
      setError('Failed to record payment. Please try again.');
      console.error('Payment submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const remainingAmount = outstandingAmount - totalCollected;
  const willExceedOutstanding = parseFloat(amount) > remainingAmount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 rounded-t-2xl border-b-4 border-emerald-700 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Payment Received</h2>
              <p className="text-emerald-50 text-sm">Record customer payment</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-emerald-50 text-sm">Customer:</span>
              <span className="text-white font-semibold">{customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-50 text-sm">Loan ID:</span>
              <span className="text-white font-semibold">{loanId}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Outstanding Amount:</span>
              <span className="text-gray-900 font-bold text-lg">₹{outstandingAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Already Collected:</span>
              <span className="text-green-600 font-semibold">₹{totalCollected.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-700 font-medium">Remaining:</span>
              <span className="text-blue-600 font-bold text-lg">₹{remainingAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount Collected <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                ₹
              </span>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-lg font-semibold"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {willExceedOutstanding && amount && (
              <div className="mt-2 flex items-start space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Amount exceeds remaining balance by ₹{(parseFloat(amount) - remainingAmount).toLocaleString('en-IN')}.
                  This might indicate overpayment or advance payment.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Payment Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about this payment (e.g., transaction ID, payment method, etc.)"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="flex items-start space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || !notes.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
