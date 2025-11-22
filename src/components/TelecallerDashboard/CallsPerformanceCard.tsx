import React from 'react';
import { TrendingUp } from 'lucide-react';

interface CallsPerformanceCardProps {
  performanceData: {
    dailyCalls: { current: number; target: number };
    weeklyCalls: { current: number; target: number };
    monthlyCalls: { current: number; target: number };
  };
}

export const CallsPerformanceCard: React.FC<CallsPerformanceCardProps> = ({ performanceData }) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-3">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Calls Performance</h3>
      </div>

      {/* Mini Chart Placeholder */}
      <div className="mb-6 h-20 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-green-400/20 rounded-lg"></div>
        <svg className="w-full h-full" viewBox="0 0 100 40">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <path
            d="M0,35 Q10,25 20,30 T40,20 T60,15 T80,10 T100,5"
            fill="none"
            stroke="url(#chartGradient)"
            strokeWidth="2"
            className="animate-pulse"
          />
          <circle cx="20" cy="30" r="1.5" fill="#3B82F6" className="animate-bounce" style={{animationDelay: '0s'}} />
          <circle cx="40" cy="20" r="1.5" fill="#10B981" className="animate-bounce" style={{animationDelay: '0.2s'}} />
          <circle cx="60" cy="15" r="1.5" fill="#3B82F6" className="animate-bounce" style={{animationDelay: '0.4s'}} />
          <circle cx="80" cy="10" r="1.5" fill="#10B981" className="animate-bounce" style={{animationDelay: '0.6s'}} />
          <circle cx="100" cy="5" r="1.5" fill="#3B82F6" className="animate-bounce" style={{animationDelay: '0.8s'}} />
        </svg>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
          <span className="font-semibold text-gray-700">Daily Calls Target</span>
          <span className="text-lg font-bold text-blue-700">{performanceData.dailyCalls.current}/{performanceData.dailyCalls.target}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
          <span className="font-semibold text-gray-700">Weekly Calls Target</span>
          <span className="text-lg font-bold text-blue-700">{performanceData.weeklyCalls.current}/{performanceData.weeklyCalls.target}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
          <span className="font-semibold text-gray-700">Monthly Calls Target</span>
          <span className="text-lg font-bold text-blue-700">{performanceData.monthlyCalls.current}/{performanceData.monthlyCalls.target}</span>
        </div>
      </div>
    </div>
  );
};