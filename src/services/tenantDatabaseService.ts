import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TENANT_DATABASE_TABLE, COMPANY_ADMIN_TABLE } from '../models';
import { supabase } from '../lib/supabase';

interface TenantDatabase {
  id: string;
  tenantId: string;
  databaseUrl: string;
  databaseName: string;
  host: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down' | 'provisioning';
  lastHealthCheck: Date;
  schemaVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseConnection {
  client: SupabaseClient;
  tenantId: string;
  connectedAt: Date;
}

class TenantDatabaseManager {
  private connectionPool: Map<string, DatabaseConnection> = new Map();
  private readonly CONNECTION_TTL = 30 * 60 * 1000;

  async getTenantDatabaseInfo(tenantId: string): Promise<TenantDatabase | null> {
    const { data, error } = await supabase
      .from(TENANT_DATABASE_TABLE)
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tenant database info:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      databaseUrl: data.database_url,
      databaseName: data.database_name,
      host: data.host,
      port: data.port,
      status: data.status,
      lastHealthCheck: data.last_health_check ? new Date(data.last_health_check) : new Date(),
      schemaVersion: data.schema_version,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getOrCreateConnection(tenantId: string): Promise<SupabaseClient | null> {
    const cached = this.connectionPool.get(tenantId);

    if (cached) {
      const age = Date.now() - cached.connectedAt.getTime();
      if (age < this.CONNECTION_TTL) {
        return cached.client;
      }
      this.connectionPool.delete(tenantId);
    }

    const dbInfo = await this.getTenantDatabaseInfo(tenantId);
    if (!dbInfo) {
      console.error('No database info found for tenant:', tenantId);
      return null;
    }

    try {
      const client = createClient(dbInfo.databaseUrl, dbInfo.databaseUrl);

      const connection: DatabaseConnection = {
        client,
        tenantId,
        connectedAt: new Date()
      };

      this.connectionPool.set(tenantId, connection);
      return client;
    } catch (error) {
      console.error('Error creating database connection:', error);
      return null;
    }
  }

  async createTenantDatabase(tenantId: string, databaseUrl: string, databaseName: string, host: string): Promise<TenantDatabase | null> {
    const { data, error } = await supabase
      .from(TENANT_DATABASE_TABLE)
      .insert({
        tenant_id: tenantId,
        database_url: databaseUrl,
        database_name: databaseName,
        host: host,
        port: 5432,
        status: 'provisioning',
        schema_version: '1.0.0'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tenant database record:', error);
      return null;
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      databaseUrl: data.database_url,
      databaseName: data.database_name,
      host: data.host,
      port: data.port,
      status: data.status,
      lastHealthCheck: data.last_health_check ? new Date(data.last_health_check) : new Date(),
      schemaVersion: data.schema_version,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async updateDatabaseStatus(tenantId: string, status: 'healthy' | 'degraded' | 'down'): Promise<void> {
    const { error } = await supabase
      .from(TENANT_DATABASE_TABLE)
      .update({
        status,
        last_health_check: new Date().toISOString()
      })
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error updating database status:', error);
    }
  }

  async healthCheck(tenantId: string): Promise<boolean> {
    const client = await this.getOrCreateConnection(tenantId);
    if (!client) {
      await this.updateDatabaseStatus(tenantId, 'down');
      return false;
    }

    try {
      const { error } = await client.from(COMPANY_ADMIN_TABLE).select('count').limit(1);
      const isHealthy = !error;
      await this.updateDatabaseStatus(tenantId, isHealthy ? 'healthy' : 'degraded');
      return isHealthy;
    } catch {
      await this.updateDatabaseStatus(tenantId, 'down');
      return false;
    }
  }

  clearConnection(tenantId: string): void {
    this.connectionPool.delete(tenantId);
  }

  clearAllConnections(): void {
    this.connectionPool.clear();
  }
}

export const tenantDatabaseManager = new TenantDatabaseManager();
export type { TenantDatabase, DatabaseConnection };
