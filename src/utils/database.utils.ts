import { supabase } from '../lib/supabase';
import {
  SUPER_ADMIN_TABLE,
  TENANT_TABLE,
  TENANT_DATABASE_TABLE,
  COMPANY_ADMIN_TABLE,
  EMPLOYEE_TABLE,
  TEAM_TABLE,
  TEAM_TELECALLER_TABLE,
  CUSTOMER_CASE_TABLE,
  CASE_CALL_LOG_TABLE,
  COLUMN_CONFIGURATION_TABLE,
  AUDIT_LOG_TABLE,
  TENANT_MIGRATION_TABLE
} from '../models';

export const TABLE_NAMES = {
  SUPER_ADMINS: SUPER_ADMIN_TABLE,
  TENANTS: TENANT_TABLE,
  TENANT_DATABASES: TENANT_DATABASE_TABLE,
  COMPANY_ADMINS: COMPANY_ADMIN_TABLE,
  EMPLOYEES: EMPLOYEE_TABLE,
  TEAMS: TEAM_TABLE,
  TEAM_TELECALLERS: TEAM_TELECALLER_TABLE,
  CUSTOMER_CASES: CUSTOMER_CASE_TABLE,
  CASE_CALL_LOGS: CASE_CALL_LOG_TABLE,
  COLUMN_CONFIGURATIONS: COLUMN_CONFIGURATION_TABLE,
  AUDIT_LOGS: AUDIT_LOG_TABLE,
  TENANT_MIGRATIONS: TENANT_MIGRATION_TABLE
} as const;

export type DatabaseTable = typeof TABLE_NAMES[keyof typeof TABLE_NAMES];

export function getSupabaseClient() {
  return supabase;
}

export async function queryTable<T>(
  tableName: DatabaseTable,
  filters?: Record<string, unknown>
): Promise<T[]> {
  let query = supabase.from(tableName).select('*');

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to query ${tableName}: ${error.message}`);
  }

  return data as T[];
}

export async function insertRecord<T>(
  tableName: DatabaseTable,
  record: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase
    .from(tableName)
    .insert(record)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert into ${tableName}: ${error.message}`);
  }

  return data as T;
}

export async function updateRecord<T>(
  tableName: DatabaseTable,
  id: string,
  updates: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update ${tableName}: ${error.message}`);
  }

  return data as T;
}

export async function deleteRecord(
  tableName: DatabaseTable,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete from ${tableName}: ${error.message}`);
  }
}

export async function countRecords(
  tableName: DatabaseTable,
  filters?: Record<string, unknown>
): Promise<number> {
  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to count ${tableName}: ${error.message}`);
  }

  return count || 0;
}

export function buildQuery(tableName: DatabaseTable) {
  return supabase.from(tableName);
}
