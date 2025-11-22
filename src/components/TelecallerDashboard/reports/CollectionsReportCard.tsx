import React from 'react';
import { DollarSign } from 'lucide-react';

interface CollectionsReportData {
  collectedToday: number;
  collectedMonth: number;
  targetMonth: number;
  progressPercent: number;
}

interface CollectionsReportCardProps {
  data: CollectionsReportData;
}

export const CollectionsReportCard: React.FC<CollectionsReportCardProps> = ({ data }) => {

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (data.progressPercent / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden">
      {/* Top highlight strip */}
      <div className="h-1 bg-green-500"></div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Collections Report</h3>
              <p className="text-sm text-gray-600">Collections Progress</p>
            </div>
          </div>
        </div>

        {/* Circular progress */}
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="6"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="#10B981"
                strokeWidth="6"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{data.progressPercent}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Collection amounts */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Today:</span>
            <span className="font-semibold text-green-700">₹{data.collectedToday.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">This Month:</span>
            <span className="font-semibold text-green-700">₹{data.collectedMonth.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Target:</span>
            <span className="font-semibold text-gray-700">₹{data.targetMonth.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Monthly progress • Target achievement
        </div>
      </div>
    </div>
  );
};