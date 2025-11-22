export interface Employee {
  id: string;
  tenant_id: string;
  name: string;
  mobile: string;
  emp_id: string;
  password_hash: string;
  role: 'TeamIncharge' | 'Telecaller';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface EmployeeInsert {
  tenant_id: string;
  name: string;
  mobile: string;
  emp_id: string;
  password_hash: string;
  role: 'TeamIncharge' | 'Telecaller';
  status?: 'active' | 'inactive';
  created_by?: string;
}

export interface EmployeeUpdate {
  name?: string;
  mobile?: string;
  emp_id?: string;
  password_hash?: string;
  role?: 'TeamIncharge' | 'Telecaller';
  status?: 'active' | 'inactive';
}

export interface EmployeeWithDetails extends Employee {
  email?: string;
  phone?: string;
  team_id?: string;
  assigned_cases?: number;
}

export const EMPLOYEE_TABLE = 'employees' as const;
