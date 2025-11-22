import React from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

interface FollowUpCardProps {
  followUpData: {
    todaysFollowUps: number;
    upcomingFollowUps: number;
    todaysPTP: number;
  };
}

export const FollowUpCard: React.FC<FollowUpCardProps> = ({ followUpData }) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg mr-3">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Follow-ups</h3>
      </div>

      {/* Mini Chart Placeholder */}
      <div className="mb-6 h-20 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-lg"></div>
        <svg className="w-full h-full" viewBox="0 0 100 40">
          <defs>
            <linearGradient id="followupGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          <path
            d="M0,32 Q15,28 30,35 T50,25 T70,30 T90,20 T100,18"
            fill="none"
            stroke="url(#followupGradient)"
            strokeWidth="2"
            className="animate-pulse"
          />
          <circle cx="15" cy="28" r="1.5" fill="#F97316" className="animate-bounce" style={{animationDelay: '0.1s'}} />
          <circle cx="30" cy="35" r="1.5" fill="#EF4444" className="animate-bounce" style={{animationDelay: '0.3s'}} />
          <circle cx="50" cy="25" r="1.5" fill="#F97316" className="animate-bounce" style={{animationDelay: '0.5s'}} />
          <circle cx="70" cy="30" r="1.5" fill="#EF4444" className="animate-bounce" style={{animationDelay: '0.7s'}} />
          <circle cx="90" cy="20" r="1.5" fill="#F97316" className="animate-bounce" style={{animationDelay: '0.9s'}} />
        </svg>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200/50">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-orange-600 mr-2" />
            <span className="font-semibold text-gray-700">Today's Follow-ups</span>
          </div>
          <span className="text-lg font-bold text-orange-700">{followUpData.todaysFollowUps}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200/50">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-orange-600 mr-2" />
            <span className="font-semibold text-gray-700">Upcoming Follow-ups</span>
          </div>
          <span className="text-lg font-bold text-orange-700">{followUpData.upcomingFollowUps}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200/50">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-orange-600 mr-2" />
            <span className="font-semibold text-gray-700">Today PTP</span>
          </div>
          <span className="text-lg font-bold text-orange-700">{followUpData.todaysPTP}</span>
        </div>
      </div>
    </div>
  );
};