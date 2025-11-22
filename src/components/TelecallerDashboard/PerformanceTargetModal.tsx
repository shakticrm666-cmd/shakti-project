import React, { useState, useEffect } from 'react';
import { X, Target, TrendingUp, DollarSign } from 'lucide-react';

interface PerformanceTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PerformanceData {
  dailyCalls: { current: number; target: number; progress: number[] };
  weeklyCalls: { current: number; target: number; progress: number[] };
  monthlyCalls: { current: number; target: number; progress: number[] };
  collections: { collected: number; target: number; progress: number };
}

const PerformanceTargetModal: React.FC<PerformanceTargetModalProps> = ({ isOpen, onClose }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    dailyCalls: { current: 45, target: 60, progress: [20, 35, 45, 50, 45] },
    weeklyCalls: { current: 280, target: 300, progress: [180, 220, 250, 270, 280] },
    monthlyCalls: { current: 1200, target: 1500, progress: [800, 950, 1100, 1150, 1200] },
    collections: { collected: 85000, target: 100000, progress: 85 }
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setPerformanceData(prev => ({
        ...prev,
        dailyCalls: {
          ...prev.dailyCalls,
          progress: [...prev.dailyCalls.progress.slice(1), Math.floor(Math.random() * 60) + 40]
        },
        weeklyCalls: {
          ...prev.weeklyCalls,
          progress: [...prev.weeklyCalls.progress.slice(1), Math.floor(Math.random() * 50) + 250]
        },
        monthlyCalls: {
          ...prev.monthlyCalls,
          progress: [...prev.monthlyCalls.progress.slice(1), Math.floor(Math.random() * 100) + 1100]
        }
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const AnimatedLineGraph: React.FC<{ data: number[]; color: string; height?: number }> = ({
    data,
    color,
    height = 40
  }) => {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = height - ((value - minValue) / range) * (height - 10);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative" style={{ height }}>
        <svg className="w-full h-full" viewBox={`0 0 100 ${height}`}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="50%" stopColor={color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={color} stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
            className="animate-pulse"
          />
          <polyline
            fill={`url(#gradient-${color})`}
            stroke="none"
            points={`0,${height} ${points} 100,${height}`}
          />
        </svg>
      </div>
    );
  };

  const MetricRow: React.FC<{
    label: string;
    current: number;
    target: number;
    color: string;
    progressData: number[]
  }> = ({ label, current, target, color, progressData }) => (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{current}/{target}</span>
      </div>
      <AnimatedLineGraph data={progressData} color={color} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center">
            <Target className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Targets</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* Calls Targets */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
              Calls Performance
            </h4>

            <MetricRow
              label="Daily Calls Target"
              current={performanceData.dailyCalls.current}
              target={performanceData.dailyCalls.target}
              color="#3B82F6"
              progressData={performanceData.dailyCalls.progress}
            />

            <MetricRow
              label="Weekly Calls Target"
              current={performanceData.weeklyCalls.current}
              target={performanceData.weeklyCalls.target}
              color="#10B981"
              progressData={performanceData.weeklyCalls.progress}
            />

            <MetricRow
              label="Monthly Calls Target"
              current={performanceData.monthlyCalls.current}
              target={performanceData.monthlyCalls.target}
              color="#F59E0B"
              progressData={performanceData.monthlyCalls.progress}
            />
          </div>

          {/* Collections Summary */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-600" />
              Collections Summary
            </h4>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Collected Amount</span>
                <span className="text-sm font-bold text-gray-900">
                  ₹{performanceData.collections.collected.toLocaleString()} / ₹{performanceData.collections.target.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${performanceData.collections.progress}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{performanceData.collections.progress}% Complete</span>
                <span>₹{(performanceData.collections.target - performanceData.collections.collected).toLocaleString()} remaining</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTargetModal;