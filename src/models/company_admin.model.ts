export interface CompanyAdmin {
  id: string;
  tenant_id: string;
  name: string;
  employee_id: string;
  email: string;
  password_hash: string;
  status: 'active' | 'inactive';
  role: string;
  last_login_at: string | null;
  password_reset_token: string | null;
  password_reset_expires: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CompanyAdminInsert {
  tenant_id: string;
  name: string;
  employee_id: string;
  email: string;
  password_hash: string;
  status?: 'active' | 'inactive';
  role?: string;
  created_by?: string;
}

export interface CompanyAdminUpdate {
  name?: string;
  employee_id?: string;
  email?: string;
  password_hash?: string;
  status?: 'active' | 'inactive';
  role?: string;
  last_login_at?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
}

export const COMPANY_ADMIN_TABLE = 'company_admins' as const;
