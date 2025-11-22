import React, { useMemo } from 'react';
import { MetricCard } from '../../shared/MetricCard';
import { Users, Briefcase, UserCheck, Phone } from 'lucide-react';
import type { Employee } from '../../../types/employee';

interface DashboardOverviewProps {
  employees: Employee[];
  products: string[];
  teamIncharges: Employee[];
  telecallers: Employee[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  employees,
  products,
  teamIncharges,
  telecallers,
}) => {
  const activeEmployees = useMemo(
    () => employees.filter(emp => emp.status === 'active'),
    [employees]
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Employees"
          value={activeEmployees.length}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Products"
          value={products.length}
          icon={Briefcase}
          color="green"
        />
        <MetricCard
          title="Team Incharges"
          value={teamIncharges.length}
          icon={UserCheck}
          color="purple"
        />
        <MetricCard
          title="Telecallers"
          value={telecallers.length}
          icon={Phone}
          color="orange"
        />
      </div>
      {/* Add more dashboard widgets here */}
    </div>
  );
};