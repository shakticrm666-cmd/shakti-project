export type MigrationStatus = 'pending' | 'success' | 'failed';

export interface TenantMigration {
  id: string;
  tenant_id: string;
  migration_name: string;
  migration_version: string;
  applied_at: string;
  status: MigrationStatus;
  error_message: string | null;
}

export interface TenantMigrationInsert {
  tenant_id: string;
  migration_name: string;
  migration_version: string;
  status?: MigrationStatus;
  error_message?: string;
}

export interface TenantMigrationUpdate {
  status?: MigrationStatus;
  error_message?: string;
}

export const TENANT_MIGRATION_TABLE = 'tenant_migrations' as const;
