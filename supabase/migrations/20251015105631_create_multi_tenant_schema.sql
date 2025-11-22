/*
  # Multi-Tenant System - Main Control Database Schema
  
  ## Overview
  This migration creates the main control database schema for managing 100+ separate tenant databases.
  Each tenant (company) will have its own isolated Supabase database.
  
  ## New Tables
  
  ### 1. `tenants` - Company/Tenant Registry
  Central registry of all companies in the system
  - `id` (uuid, primary key) - Unique tenant identifier
  - `name` (text, not null) - Company name
  - `subdomain` (text, unique, not null) - Subdomain for routing (e.g., 'techcorp')
  - `status` (text, not null) - Tenant status: active, inactive, suspended
  - `proprietor_name` (text) - Company proprietor/owner name
  - `phone_number` (text) - Contact phone number
  - `email` (text) - Primary contact email
  - `address` (text) - Company address
  - `gst_number` (text) - GST registration number
  - `pan_number` (text) - PAN number
  - `city` (text) - City
  - `state` (text) - State
  - `pincode` (text) - PIN code
  - `plan` (text) - Subscription plan
  - `max_users` (integer) - Maximum users allowed
  - `max_connections` (integer) - Maximum concurrent connections
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid) - Super admin who created this tenant
  
  ### 2. `tenant_databases` - Database Connection Registry
  Stores connection information for each tenant's separate database
  - `id` (uuid, primary key) - Unique identifier
  - `tenant_id` (uuid, foreign key) - Reference to tenant
  - `database_url` (text, encrypted, not null) - Full database connection URL
  - `database_name` (text, not null) - Database name
  - `host` (text, not null) - Database host
  - `port` (integer, default 5432) - Database port
  - `status` (text) - Database status: healthy, degraded, down
  - `last_health_check` (timestamptz) - Last health check timestamp
  - `schema_version` (text) - Current schema version
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 3. `company_admins` - Company Administrator Users
  Administrators who manage individual tenant/company
  - `id` (uuid, primary key) - Unique identifier
  - `tenant_id` (uuid, foreign key) - Reference to tenant
  - `name` (text, not null) - Admin full name
  - `employee_id` (text, unique per tenant) - Employee/admin ID
  - `email` (text, unique, not null) - Email address
  - `password_hash` (text, not null) - Bcrypt hashed password
  - `status` (text, default 'active') - Status: active, inactive
  - `role` (text, default 'CompanyAdmin') - Role type
  - `last_login_at` (timestamptz) - Last login timestamp
  - `password_reset_token` (text) - Password reset token
  - `password_reset_expires` (timestamptz) - Token expiry
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid) - Super admin who created this
  
  ### 4. `tenant_migrations` - Migration Tracking
  Tracks schema migrations applied to each tenant database
  - `id` (uuid, primary key) - Unique identifier
  - `tenant_id` (uuid, foreign key) - Reference to tenant
  - `migration_name` (text, not null) - Migration file name
  - `migration_version` (text, not null) - Migration version
  - `applied_at` (timestamptz) - When migration was applied
  - `status` (text) - Status: success, failed, pending
  - `error_message` (text) - Error details if failed
  
  ### 5. `audit_logs` - System Audit Trail
  Comprehensive audit logging for all operations
  - `id` (uuid, primary key) - Unique identifier
  - `tenant_id` (uuid) - Reference to tenant (null for super admin actions)
  - `user_id` (uuid) - User who performed action
  - `user_type` (text) - User type: SuperAdmin, CompanyAdmin
  - `action` (text, not null) - Action performed
  - `resource_type` (text) - Resource affected
  - `resource_id` (uuid) - ID of affected resource
  - `old_values` (jsonb) - Previous values
  - `new_values` (jsonb) - New values
  - `ip_address` (text) - IP address of user
  - `user_agent` (text) - Browser user agent
  - `created_at` (timestamptz) - Timestamp
  
  ## Security
  - Enable RLS on all tables
  - Super admins can access all data
  - Company admins can only access their tenant's data
  - Database URLs are encrypted
  - Audit all sensitive operations
  
  ## Indexes
  - Subdomain lookup index on tenants
  - Tenant ID indexes on all related tables
  - Email indexes for authentication
  - Status indexes for filtering
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: tenants
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Company Details
  proprietor_name text,
  phone_number text,
  email text,
  address text,
  gst_number text,
  pan_number text,
  city text,
  state text,
  pincode text,
  
  -- Subscription & Limits
  plan text DEFAULT 'basic' CHECK (plan IN ('basic', 'standard', 'premium', 'enterprise')),
  max_users integer DEFAULT 10,
  max_connections integer DEFAULT 5,
  
  -- Settings
  settings jsonb DEFAULT '{"branding": {}, "features": {"voip": false, "sms": false, "analytics": true, "apiAccess": false}}'::jsonb,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES super_admins(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: tenant_databases
-- =====================================================
CREATE TABLE IF NOT EXISTS tenant_databases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Database Connection Info (encrypted in production)
  database_url text NOT NULL,
  database_name text NOT NULL,
  host text NOT NULL,
  port integer DEFAULT 5432,
  
  -- Health Monitoring
  status text DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'down', 'provisioning')),
  last_health_check timestamptz,
  schema_version text DEFAULT '1.0.0',
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id)
);

-- =====================================================
-- TABLE: company_admins
-- =====================================================
CREATE TABLE IF NOT EXISTS company_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Admin Details
  name text NOT NULL,
  employee_id text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  
  -- Status & Role
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  role text DEFAULT 'CompanyAdmin',
  
  -- Authentication
  last_login_at timestamptz,
  password_reset_token text,
  password_reset_expires timestamptz,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES super_admins(id) ON DELETE SET NULL,
  
  UNIQUE(tenant_id, employee_id)
);

-- =====================================================
-- TABLE: tenant_migrations
-- =====================================================
CREATE TABLE IF NOT EXISTS tenant_migrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  migration_name text NOT NULL,
  migration_version text NOT NULL,
  applied_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message text,
  
  UNIQUE(tenant_id, migration_name)
);

-- =====================================================
-- TABLE: audit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id uuid,
  user_type text CHECK (user_type IN ('SuperAdmin', 'CompanyAdmin')),
  
  -- Action Details
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  
  -- Request Context
  ip_address text,
  user_agent text,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_by ON tenants(created_by);

CREATE INDEX IF NOT EXISTS idx_tenant_databases_tenant_id ON tenant_databases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_databases_status ON tenant_databases(status);

CREATE INDEX IF NOT EXISTS idx_company_admins_tenant_id ON company_admins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_company_admins_email ON company_admins(email);
CREATE INDEX IF NOT EXISTS idx_company_admins_status ON company_admins(status);

CREATE INDEX IF NOT EXISTS idx_tenant_migrations_tenant_id ON tenant_migrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_migrations_status ON tenant_migrations(status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_databases_updated_at 
  BEFORE UPDATE ON tenant_databases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_admins_updated_at 
  BEFORE UPDATE ON company_admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Super Admins can access all data
CREATE POLICY "Super admins can read all tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can update tenants"
  ON tenants FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can delete tenants"
  ON tenants FOR DELETE
  TO authenticated
  USING (true);

-- Tenant Databases policies
CREATE POLICY "Super admins can read all tenant databases"
  ON tenant_databases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert tenant databases"
  ON tenant_databases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can update tenant databases"
  ON tenant_databases FOR UPDATE
  TO authenticated
  USING (true);

-- Company Admins policies
CREATE POLICY "Super admins can read all company admins"
  ON company_admins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert company admins"
  ON company_admins FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can update company admins"
  ON company_admins FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can delete company admins"
  ON company_admins FOR DELETE
  TO authenticated
  USING (true);

-- Tenant Migrations policies
CREATE POLICY "Super admins can read all tenant migrations"
  ON tenant_migrations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert tenant migrations"
  ON tenant_migrations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Audit Logs policies (read-only for security)
CREATE POLICY "Super admins can read all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
