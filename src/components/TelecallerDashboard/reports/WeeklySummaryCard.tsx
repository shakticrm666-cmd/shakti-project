import React from 'react';
import { BarChart3 } from 'lucide-react';

interface WeeklySummaryData {
  totalCalls: number;
  dailyCalls: number[];
}

interface WeeklySummaryCardProps {
  data: WeeklySummaryData;
}

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ data }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxCalls = Math.max(...data.dailyCalls);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden">
      {/* Top highlight strip */}
      <div className="h-1 bg-orange-500"></div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Weekly Summary</h3>
              <p className="text-sm text-gray-600">Weekly Activity Overview</p>
            </div>
          </div>
        </div>

        {/* Main number */}
        <div className="mb-4">
          <div className="text-3xl font-bold text-orange-600">{data.totalCalls}</div>
          <div className="text-sm text-gray-600">Total Weekly Calls</div>
        </div>

        {/* Mini bar chart */}
        <div className="h-20 bg-orange-50 rounded-lg p-3">
          <div className="flex items-end justify-between h-full">
            {data.dailyCalls.map((calls, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className="bg-orange-500 rounded-t w-6 transition-all duration-1000 ease-out hover:bg-orange-600"
                  style={{
                    height: `${(calls / maxCalls) * 100}%`,
                    animationDelay: `${index * 0.1}s`
                  }}
                ></div>
                <span className="text-xs text-gray-600 mt-1">{days[index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Daily breakdown • Last 7 days
        </div>
      </div>
    </div>
  );
};