import React from 'react';
import { Phone } from 'lucide-react';

interface DailyPerformanceData {
  totalCalls: number;
  hourlyTrend: number[];
}

interface DailyPerformanceCardProps {
  data: DailyPerformanceData;
}

export const DailyPerformanceCard: React.FC<DailyPerformanceCardProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden">
      {/* Top highlight strip */}
      <div className="h-1 bg-blue-500"></div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Daily Performance</h3>
              <p className="text-sm text-gray-600">Completed Today</p>
            </div>
          </div>
        </div>

        {/* Main number */}
        <div className="mb-4">
          <div className="text-3xl font-bold text-blue-600">{data.totalCalls}</div>
          <div className="text-sm text-gray-600">Total Calls</div>
        </div>

        {/* Sparkline chart */}
        <div className="h-16 bg-blue-50 rounded-lg p-3">
          <svg className="w-full h-full" viewBox="0 0 100 40">
            <defs>
              <linearGradient id="dailyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
            <path
              d={`M0,${40 - (data.hourlyTrend[0] / Math.max(...data.hourlyTrend)) * 30} ${data.hourlyTrend.map((value, index) => {
                const x = (index / (data.hourlyTrend.length - 1)) * 100;
                const y = 40 - (value / Math.max(...data.hourlyTrend)) * 30;
                return `L${x},${y}`;
              }).join(' ')}`}
              fill="none"
              stroke="url(#dailyGradient)"
              strokeWidth="2"
              className="animate-pulse"
            />
            {data.hourlyTrend.map((value, index) => {
              const x = (index / (data.hourlyTrend.length - 1)) * 100;
              const y = 40 - (value / Math.max(...data.hourlyTrend)) * 30;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="#3B82F6"
                  className="animate-bounce"
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
              );
            })}
          </svg>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Hourly trend • Last 8 hours
        </div>
      </div>
    </div>
  );
};