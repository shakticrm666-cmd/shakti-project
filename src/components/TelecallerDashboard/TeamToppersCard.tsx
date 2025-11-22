import React from 'react';
import { Trophy } from 'lucide-react';

interface TeamTopper {
  name: string;
  callsDoneToday: number;
  collectionAmount: number;
  ptpSuccessPercent: number;
}

interface TeamToppersCardProps {
  toppers: TeamTopper[];
}

export const TeamToppersCard: React.FC<TeamToppersCardProps> = ({ toppers }) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg mr-3">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Team Toppers</h3>
      </div>

      {/* Mini Chart Placeholder */}
      <div className="mb-6 h-20 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg"></div>
        <svg className="w-full h-full" viewBox="0 0 100 40">
          <defs>
            <linearGradient id="toppersGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
          <path
            d="M0,32 Q15,28 30,35 T50,25 T70,30 T90,20 T100,18"
            fill="none"
            stroke="url(#toppersGradient)"
            strokeWidth="2"
            className="animate-pulse"
          />
          <circle cx="15" cy="28" r="1.5" fill="#F59E0B" className="animate-bounce" style={{ animationDelay: '0.1s' }} />
          <circle cx="30" cy="35" r="1.5" fill="#EA580C" className="animate-bounce" style={{ animationDelay: '0.3s' }} />
          <circle cx="50" cy="25" r="1.5" fill="#F59E0B" className="animate-bounce" style={{ animationDelay: '0.5s' }} />
          <circle cx="70" cy="30" r="1.5" fill="#EA580C" className="animate-bounce" style={{ animationDelay: '0.7s' }} />
          <circle cx="90" cy="20" r="1.5" fill="#F59E0B" className="animate-bounce" style={{ animationDelay: '0.9s' }} />
        </svg>
      </div>

      <div className="space-y-4">
        {toppers.map((topper, index) => (
          <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200/50 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                  }`}>
                  {index + 1}
                </div>
                <span className="font-semibold text-gray-800">{topper.name}</span>
              </div>

              <div className="text-right">
                <span className="text-lg font-bold text-green-700">₹{topper.collectionAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};