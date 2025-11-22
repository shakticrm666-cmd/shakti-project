export type UserType = 'SuperAdmin' | 'CompanyAdmin';

export interface AuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  user_type: UserType | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogInsert {
  tenant_id?: string;
  user_id?: string;
  user_type?: UserType;
  action: string;
  resource_type?: string;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export const AUDIT_LOG_TABLE = 'audit_logs' as const;
