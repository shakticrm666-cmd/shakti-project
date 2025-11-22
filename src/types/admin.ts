export interface CompanyAdmin {
  id: string;
  tenantId: string;
  name: string;
  employeeId: string;
  email: string;
  passwordHash?: string; // Not exposed in API responses
  status: 'active' | 'inactive';
  role: 'CompanyAdmin';
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // SuperAdmin ID
}

export interface CreateAdminRequest {
  name: string;
  employeeId: string;
  email: string;
  password: string;
  status?: 'active' | 'inactive';
}

export interface UpdateAdminRequest {
  name?: string;
  employeeId?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export interface AdminContextType {
  admins: CompanyAdmin[];
  isLoading: boolean;
  error: string | null;
  createAdmin: (tenantId: string, adminData: CreateAdminRequest) => Promise<CompanyAdmin>;
  updateAdmin: (adminId: string, updates: UpdateAdminRequest) => Promise<CompanyAdmin>;
  deleteAdmin: (adminId: string) => Promise<boolean>;
  resetPassword: (adminId: string) => Promise<string>; // Returns new temporary password
  toggleAdminStatus: (adminId: string) => Promise<CompanyAdmin>;
}