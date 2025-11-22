import React, { useState } from 'react';
import { X, User, Phone, MapPin, Briefcase, DollarSign, Calendar, Link as LinkIcon, Copy, Plus, CheckCircle } from 'lucide-react';
import { useNotification, notificationHelpers } from '../../shared/Notification';
import type { TeamInchargeCase } from '../../../types/caseManagement';

interface CaseDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseData: TeamInchargeCase | null;
}

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({ isOpen, onClose, caseData }) => {
    const { showNotification } = useNotification();
    const [copiedLink, setCopiedLink] = useState(false);

    if (!isOpen || !caseData) return null;

    const details = caseData.case_data || {};

    // Helper to safely get values with multiple key possibilities
    const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

    const getValue = (keys: string | string[]): string => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        for (const key of keyArray) {
            // Direct match
            if (details[key] !== undefined && details[key] !== null && details[key] !== '') {
                return String(details[key]);
            }
            // Fuzzy match using normalized keys
            const targetNormalized = normalizeKey(key);
            const foundKey = Object.keys(details).find(k => normalizeKey(k) === targetNormalized);

            if (foundKey && details[foundKey] !== undefined && details[foundKey] !== null && details[foundKey] !== '') {
                return String(details[foundKey]);
            }
        }
        return 'N/A';
    };

    const handleCopyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        showNotification(notificationHelpers.success('Copied', 'Payment link copied to clipboard'));
        setTimeout(() => setCopiedLink(false), 2000);
    };

    // Define field groups
    const customerFields = [
        { label: 'Customer Name', value: getValue(['customerName', 'Customer Name', 'Name']), icon: User },
        { label: 'Loan ID', value: getValue(['loanId', 'loanNumber', 'Loan ID', 'Loan No']), icon: Briefcase },
        { label: 'Mobile Number', value: getValue(['mobileNo', 'mobileNumber', 'Mobile Number', 'Mobile']), icon: Phone },
        { label: 'Address', value: getValue(['address', 'Address', 'Location']), icon: MapPin },
        { label: 'Employment Type', value: getValue(['employmentType', 'Employment Type', 'Occupation']), icon: Briefcase },
        { label: 'Loan Amount', value: getValue(['loanAmount', 'Loan Amount', 'Amount']), icon: DollarSign },
    ];

    const loanFields = [
        { label: 'DPD', value: getValue(['dpd', 'DPD', 'Days Past Due']), icon: Calendar },
        { label: 'POS', value: getValue(['pos', 'posAmount', 'POS', 'Principal Outstanding']), icon: DollarSign },
        { label: 'EMI', value: getValue(['emi', 'emiAmount', 'EMI', 'Installment']), icon: DollarSign },
        { label: 'Total Outstanding', value: getValue(['totalOutstanding', 'outstandingAmount', 'TOTAL OUTSTANDING', 'Total Outstanding', 'Total Due']), icon: DollarSign },
        { label: 'Last Payment Date', value: getValue(['lastPaymentDate', 'lastPaidDate', 'LAST PAYMENT DATE', 'Last Payment Date', 'Date of Last Payment', 'Last Repayment Date', 'Collection Date']), icon: Calendar },
        { label: 'Last Payment Amount', value: getValue(['lastPaymentAmount', 'lastPaidAmount', 'LAST PAYMENT AMOUNT', 'Last Payment Amount', 'Collection Amount', 'Receipt Amount', 'Repayment Amount']), icon: DollarSign },
        { label: 'Loan Created At', value: getValue(['loanCreatedAt', 'sanctionDate', 'LOAN CREATED AT', 'Loan Created At', 'Disbursement Date', 'Booking Date', 'Agreement Date']) || (caseData.created_at ? new Date(caseData.created_at).toLocaleDateString() : 'N/A'), icon: Calendar },
    ];

    // Identify additional fields (exclude known fields)
    const knownKeys = [
        'customerName', 'loanId', 'loanNumber', 'mobileNo', 'mobileNumber', 'address', 'employmentType', 'loanAmount',
        'dpd', 'pos', 'posAmount', 'emi', 'emiAmount', 'totalOutstanding', 'outstandingAmount', 'paymentLink',
        'lastPaymentDate', 'lastPaidDate', 'lastPaymentAmount', 'lastPaidAmount', 'loanCreatedAt', 'sanctionDate',
        'name', 'loan no', 'mobile', 'location', 'occupation', 'amount', 'days past due', 'principal outstanding',
        'installment', 'total due', 'date of last payment', 'last repayment date', 'collection date',
        'collection amount', 'receipt amount', 'repayment amount', 'disbursement date', 'booking date', 'agreement date',
        'Last Paid Date', 'Sanction Date', 'Last Paid Amount', 'last payment date', 'last payment amount', 'loan created at'
    ].map(normalizeKey);

    const additionalFields = Object.entries(details)
        .filter(([key]) => !knownKeys.includes(normalizeKey(key)))
        .map(([key, value]) => ({
            label: key.replace(/([A-Z])/g, ' $1').trim(), // Format camelCase to Title Case
            value: String(value),
            icon: Briefcase // Default icon
        }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center text-white">
                        <Briefcase className="w-6 h-6 mr-3" />
                        <h3 className="text-xl font-bold">Case Information</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">

                    {/* Customer Information */}
                    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-blue-800 flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Customer Information
                            </h4>
                            <div className="flex space-x-2">
                                <button className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 transition-colors">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Mobile
                                </button>
                                <button className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 transition-colors">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Address
                                </button>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {customerFields.map((field, idx) => (
                                <div key={idx} className="flex items-start space-x-3">
                                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500 shrink-0">
                                        <field.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{field.label}</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1 break-words">{field.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Loan Details */}
                    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-green-50 px-6 py-3 border-b border-green-100">
                            <h4 className="text-lg font-semibold text-green-800 flex items-center">
                                <DollarSign className="w-5 h-5 mr-2" />
                                Loan Details
                            </h4>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loanFields.map((field, idx) => (
                                <div key={idx} className="flex items-start space-x-3">
                                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500 shrink-0">
                                        <field.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{field.label}</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1 break-words">{field.value}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Payment Link Special Field */}
                            <div className="flex items-start space-x-3 col-span-1 md:col-span-2 lg:col-span-1">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500 shrink-0">
                                    <LinkIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Link</p>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <p className="text-sm font-medium text-blue-600 truncate flex-1">
                                            {getValue('paymentLink') !== 'N/A' ? getValue('paymentLink') : 'No link available'}
                                        </p>
                                        {getValue('paymentLink') !== 'N/A' && (
                                            <button
                                                onClick={() => handleCopyLink(getValue('paymentLink'))}
                                                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
                                                title="Copy Link"
                                            >
                                                {copiedLink ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Additional Details */}
                    {additionalFields.length > 0 && (
                        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-purple-50 px-6 py-3 border-b border-purple-100">
                                <h4 className="text-lg font-semibold text-purple-800 flex items-center">
                                    <Briefcase className="w-5 h-5 mr-2" />
                                    Additional Details
                                </h4>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {additionalFields.map((field, idx) => (
                                    <div key={idx} className="flex items-start space-x-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500 shrink-0">
                                            <field.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{field.label}</p>
                                            <p className="text-sm font-medium text-gray-900 mt-1 break-words">{field.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
