import React from 'react';
import { FileText, Phone, DollarSign, AlertCircle } from 'lucide-react';
import { CustomerCase } from './types';

interface DashboardMetricsProps {
  customerCases: CustomerCase[];
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ customerCases }) => {
  // Calculate metrics
  const assignedCases = customerCases.length;
  const callsToday = 23; // This would come from activity logs in a real implementation
  const recoveryToday = '₹45K'; // This would be calculated from actual payment data
  const pendingFollowups = 12; // This would be calculated from case statuses

  const metrics = [
    {
      title: 'Assigned Cases',
      value: assignedCases.toString(),
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      title: 'Calls Today',
      value: callsToday.toString(),
      icon: Phone,
      color: 'bg-blue-500'
    },
    {
      title: 'Recovery Today',
      value: recoveryToday,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Pending Follow-ups',
      value: pendingFollowups.toString(),
      icon: AlertCircle,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className={`${metric.color} rounded-lg p-3 mr-4`}>
              <metric.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.title}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardMetrics;