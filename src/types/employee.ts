export type EmployeeRole = 'TeamIncharge' | 'Telecaller';
export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  tenantId: string;
  name: string;
  mobile: string;
  empId: string;
  passwordHash?: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateEmployeeRequest {
  name: string;
  mobile: string;
  empId: string;
  password: string;
  role: EmployeeRole;
}

export interface UpdateEmployeeRequest {
  name?: string;
  mobile?: string;
  empId?: string;
  role?: EmployeeRole;
  password?: string;
}

export interface EmployeeFormData {
  name: string;
  mobile: string;
  empId: string;
  password: string;
  role: EmployeeRole;
}
