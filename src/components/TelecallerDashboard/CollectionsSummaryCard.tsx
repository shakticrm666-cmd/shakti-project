import React from 'react';
import { DollarSign } from 'lucide-react';

interface CollectionsSummaryCardProps {
  performanceData: {
    collections: {
      collected: number;
      target: number;
      progress: number;
    };
  };
}

export const CollectionsSummaryCard: React.FC<CollectionsSummaryCardProps> = ({ performanceData }) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mr-3">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Collections Summary</h3>
      </div>

      {/* Mini Chart Placeholder */}
      <div className="mb-6 h-20 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-lg"></div>
        <svg className="w-full h-full" viewBox="0 0 100 40">
          <defs>
            <linearGradient id="collectionsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <path
            d="M0,30 Q15,20 30,25 T50,15 T70,20 T90,10 T100,8"
            fill="none"
            stroke="url(#collectionsGradient)"
            strokeWidth="2"
            className="animate-pulse"
          />
          <circle cx="15" cy="20" r="1.5" fill="#10B981" className="animate-bounce" style={{animationDelay: '0.1s'}} />
          <circle cx="30" cy="25" r="1.5" fill="#3B82F6" className="animate-bounce" style={{animationDelay: '0.3s'}} />
          <circle cx="50" cy="15" r="1.5" fill="#10B981" className="animate-bounce" style={{animationDelay: '0.5s'}} />
          <circle cx="70" cy="20" r="1.5" fill="#3B82F6" className="animate-bounce" style={{animationDelay: '0.7s'}} />
          <circle cx="90" cy="10" r="1.5" fill="#10B981" className="animate-bounce" style={{animationDelay: '0.9s'}} />
        </svg>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200/50">
          <span className="font-semibold text-gray-700">Collected Amount</span>
          <span className="text-lg font-bold text-green-700">
            ₹{performanceData.collections.collected.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200/50">
          <span className="font-semibold text-gray-700">Target Amount</span>
          <span className="text-lg font-bold text-green-700">
            ₹{performanceData.collections.target.toLocaleString()}
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600 font-medium">
            <span>Progress</span>
            <span className="text-green-700 font-semibold">{performanceData.collections.progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${performanceData.collections.progress}%` }}
            ></div>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-600 font-medium">
              ₹{(performanceData.collections.target - performanceData.collections.collected).toLocaleString()} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};