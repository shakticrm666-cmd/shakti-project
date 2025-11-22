import React from 'react';
import { FileText, Target, Activity, TrendingUp } from 'lucide-react';
import { CustomerCase } from '../../services/customerCaseService';

interface CasesStatusOverviewCardProps {
  customerCases: CustomerCase[];
}

export const CasesStatusOverviewCard: React.FC<CasesStatusOverviewCardProps> = ({ customerCases }) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg mr-3">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Cases Status Overview</h3>
      </div>

      {/* Mini Chart Placeholder */}
      <div className="mb-6 h-20 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg"></div>
        <svg className="w-full h-full" viewBox="0 0 100 40">
          <defs>
            <linearGradient id="casesGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          <path
            d="M0,35 Q12,28 25,32 T45,25 T65,20 T85,15 T100,12"
            fill="none"
            stroke="url(#casesGradient)"
            strokeWidth="2"
            className="animate-pulse"
          />
          <circle cx="12" cy="28" r="1.5" fill="#8B5CF6" className="animate-bounce" style={{animationDelay: '0.2s'}} />
          <circle cx="25" cy="32" r="1.5" fill="#EC4899" className="animate-bounce" style={{animationDelay: '0.4s'}} />
          <circle cx="45" cy="25" r="1.5" fill="#8B5CF6" className="animate-bounce" style={{animationDelay: '0.6s'}} />
          <circle cx="65" cy="20" r="1.5" fill="#EC4899" className="animate-bounce" style={{animationDelay: '0.8s'}} />
          <circle cx="85" cy="15" r="1.5" fill="#8B5CF6" className="animate-bounce" style={{animationDelay: '1.0s'}} />
        </svg>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-1.5 bg-green-500 rounded-lg mr-3">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-700">Closed Cases</span>
          </div>
          <span className="text-xl font-bold text-green-700">
            {customerCases.filter(c => c.status === 'closed').length}
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-500 rounded-lg mr-3">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-700">In Progress</span>
          </div>
          <span className="text-xl font-bold text-blue-700">
            {customerCases.filter(c => c.status === 'in_progress').length}
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-1.5 bg-purple-500 rounded-lg mr-3">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-700">Assigned</span>
          </div>
          <span className="text-xl font-bold text-purple-700">
            {customerCases.filter(c => c.status === 'assigned').length}
          </span>
        </div>
      </div>
    </div>
  );
};