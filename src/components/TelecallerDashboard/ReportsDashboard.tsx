import React from 'react';
import { DailyPerformanceCard } from './reports/DailyPerformanceCard';
import { WeeklySummaryCard } from './reports/WeeklySummaryCard';
import { MonthlyReportCard } from './reports/MonthlyReportCard';
import { CollectionsReportCard } from './reports/CollectionsReportCard';

export const ReportsDashboard: React.FC = () => {
  // Sample data for the reports
  const dailyData = {
    totalCalls: 67,
    hourlyTrend: [12, 15, 18, 22, 25, 28, 30, 32]
  };

  const weeklyData = {
    totalCalls: 320,
    dailyCalls: [45, 52, 48, 61, 55, 42, 67]
  };

  const monthlyData = {
    totalCalls: 1450,
    monthlyTrend: Array.from({ length: 30 }, () => Math.floor(Math.random() * 60) + 20)
  };

  const collectionsData = {
    collectedToday: 45000,
    collectedMonth: 850000,
    targetMonth: 1000000,
    progressPercent: 85
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports Dashboard</h2>
        <p className="text-gray-600">Comprehensive performance analytics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DailyPerformanceCard data={dailyData} />
        <WeeklySummaryCard data={weeklyData} />
        <MonthlyReportCard data={monthlyData} />
        <CollectionsReportCard data={collectionsData} />
      </div>
    </div>
  );
};