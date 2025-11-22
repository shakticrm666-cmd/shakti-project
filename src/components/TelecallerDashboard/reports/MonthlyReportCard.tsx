import React from 'react';
import { TrendingUp } from 'lucide-react';

interface MonthlyReportData {
  totalCalls: number;
  monthlyTrend: number[];
}

interface MonthlyReportCardProps {
  data: MonthlyReportData;
}

export const MonthlyReportCard: React.FC<MonthlyReportCardProps> = ({ data }) => {
  const maxCalls = Math.max(...data.monthlyTrend);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden">
      {/* Top highlight strip */}
      <div className="h-1 bg-violet-500"></div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-violet-100 rounded-lg mr-3">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Monthly Report</h3>
              <p className="text-sm text-gray-600">Monthly Calling Trend</p>
            </div>
          </div>
        </div>

        {/* Main number */}
        <div className="mb-4">
          <div className="text-3xl font-bold text-violet-600">{data.totalCalls}</div>
          <div className="text-sm text-gray-600">Total Monthly Calls</div>
        </div>

        {/* Line chart */}
        <div className="h-20 bg-violet-50 rounded-lg p-3 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-px bg-violet-300 absolute top-1/4"></div>
            <div className="w-full h-px bg-violet-300 absolute top-1/2"></div>
            <div className="w-full h-px bg-violet-300 absolute top-3/4"></div>
          </div>

          <svg className="w-full h-full relative z-10" viewBox="0 0 100 40">
            <defs>
              <linearGradient id="monthlyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            <path
              d={`M0,${40 - (data.monthlyTrend[0] / maxCalls) * 30} ${data.monthlyTrend.map((value, index) => {
                const x = (index / (data.monthlyTrend.length - 1)) * 100;
                const y = 40 - (value / maxCalls) * 30;
                return `L${x},${y}`;
              }).join(' ')}`}
              fill="none"
              stroke="url(#monthlyGradient)"
              strokeWidth="2"
              className="animate-pulse"
            />
            {data.monthlyTrend.filter((_, index) => index % 5 === 0).map((value, index) => {
              const actualIndex = index * 5;
              const x = (actualIndex / (data.monthlyTrend.length - 1)) * 100;
              const y = 40 - (value / maxCalls) * 30;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="#8B5CF6"
                  className="animate-bounce"
                  style={{ animationDelay: `${index * 0.2}s` }}
                />
              );
            })}
          </svg>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          30-day trend • Smooth curve
        </div>
      </div>
    </div>
  );
};