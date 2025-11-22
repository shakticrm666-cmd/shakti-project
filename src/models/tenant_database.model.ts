export interface TenantDatabase {
  id: string;
  tenant_id: string;
  database_url: string;
  database_name: string;
  host: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down' | 'provisioning';
  last_health_check: string | null;
  schema_version: string;
  created_at: string;
  updated_at: string;
}

export interface TenantDatabaseInsert {
  tenant_id: string;
  database_url: string;
  database_name: string;
  host: string;
  port?: number;
  status?: 'healthy' | 'degraded' | 'down' | 'provisioning';
  schema_version?: string;
}

export interface TenantDatabaseUpdate {
  database_url?: string;
  database_name?: string;
  host?: string;
  port?: number;
  status?: 'healthy' | 'degraded' | 'down' | 'provisioning';
  last_health_check?: string;
  schema_version?: string;
}

export const TENANT_DATABASE_TABLE = 'tenant_databases' as const;
