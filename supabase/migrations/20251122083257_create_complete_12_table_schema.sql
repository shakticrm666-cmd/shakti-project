/*
  ===============================================================================
  COMPLETE DATABASE SCHEMA - MULTI-TENANT LOAN RECOVERY SYSTEM (12 TABLES)
  ===============================================================================

  This migration creates the complete database schema for a multi-tenant loan
  recovery application system with 12 tables including team management.

  SYSTEM OVERVIEW:
  - Super Admin manages multiple tenant companies
  - Each tenant/company has isolated data with subdomain-based routing
  - Custom authentication system (not using Supabase Auth)
  - Role-based access: SuperAdmin, CompanyAdmin, TeamIncharge, Telecaller
  - Loan recovery case management with call logging and team management

  TABLES (12):
  1. super_admins - Super administrator authentication
  2. tenants - Company/tenant registry
  3. tenant_databases - Database connection registry for each tenant
  4. company_admins - Company administrator users
  5. tenant_migrations - Migration tracking per tenant
  6. audit_logs - System-wide audit trail
  7. employees - Unified employee management (Team Incharge + Telecallers)
  8. teams - Team management for organizing telecallers
  9. team_telecallers - Junction table for team-telecaller assignments
  10. column_configurations - Dynamic column settings per tenant
  11. customer_cases - Loan recovery case management
  12. case_call_logs - Call interaction history

  SECURITY:
  - RLS enabled on all tables
  - Anonymous access policies for custom authentication
  - Tenant data isolation through application-layer security

  ===============================================================================
*/

-- ===============================================================================
-- SECTION 1: EXTENSIONS AND PREREQUISITES
-- ===============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================================================
-- SECTION 2: UTILITY FUNCTIONS
-- ===============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_subdomain_format(subdomain_value text)
RETURNS boolean AS $$
DECLARE
  reserved_subdomains text[] := ARRAY[
    'www', 'admin', 'superadmin', 'api', 'app', 'mail', 'smtp', 'ftp',
    'webmail', 'cpanel', 'whm', 'blog', 'forum', 'shop', 'store',
    'dashboard', 'portal', 'support', 'help', 'docs', 'status',
    'dev', 'staging', 'test', 'demo', 'sandbox', 'localhost',
    'ns1', 'ns2', 'dns', 'cdn', 'assets', 'static', 'media',
    'files', 'images'
  ];
BEGIN
  IF subdomain_value IS NULL OR LENGTH(TRIM(subdomain_value)) = 0 THEN
    RAISE EXCEPTION 'Subdomain cannot be empty';
  END IF;

  IF LENGTH(subdomain_value) < 3 THEN
    RAISE EXCEPTION 'Subdomain must be at least 3 characters long';
  END IF;

  IF LENGTH(subdomain_value) > 63 THEN
    RAISE EXCEPTION 'Subdomain must not exceed 63 characters';
  END IF;

  IF LOWER(subdomain_value) = ANY(reserved_subdomains) THEN
    RAISE EXCEPTION 'This subdomain is reserved and cannot be used';
  END IF;

  IF subdomain_value !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$' THEN
    RAISE EXCEPTION 'Subdomain can only contain lowercase letters, numbers, and hyphens (not at start/end)';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION normalize_and_validate_subdomain()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subdomain := LOWER(TRIM(NEW.subdomain));

  IF NOT validate_subdomain_format(NEW.subdomain) THEN
    RAISE EXCEPTION 'Invalid subdomain format';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================================
-- SECTION 3: CORE TABLES (IN DEPENDENCY ORDER)
-- ===============================================================================

-- TABLE 1: super_admins
CREATE TABLE IF NOT EXISTS super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLE 2: tenants
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  proprietor_name text,
  phone_number text,
  email text,
  address text,
  gst_number text,
  pan_number text,
  city text,
  state text,
  pincode text,
  plan text DEFAULT 'basic' CHECK (plan IN ('basic', 'standard', 'premium', 'enterprise')),
  max_users integer DEFAULT 10,
  max_connections integer DEFAULT 5,
  settings jsonb DEFAULT '{"branding": {}, "features": {"voip": false, "sms": false, "analytics": true, "apiAccess": false}}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES super_admins(id) ON DELETE SET NULL,
  CONSTRAINT check_subdomain_not_empty CHECK (LENGTH(TRIM(subdomain)) > 0),
  CONSTRAINT check_subdomain_length CHECK (LENGTH(subdomain) >= 3 AND LENGTH(subdomain) <= 63),
  CONSTRAINT check_subdomain_format CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$')
);

-- TABLE 3: tenant_databases
CREATE TABLE IF NOT EXISTS tenant_databases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  database_url text NOT NULL,
  database_name text NOT NULL,
  host text NOT NULL,
  port integer DEFAULT 5432,
  status text DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'down', 'provisioning')),
  last_health_check timestamptz,
  schema_version text DEFAULT '1.0.0',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id)
);

-- TABLE 4: company_admins
CREATE TABLE IF NOT EXISTS company_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  employee_id text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  role text DEFAULT 'CompanyAdmin',
  last_login_at timestamptz,
  password_reset_token text,
  password_reset_expires timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES super_admins(id) ON DELETE SET NULL,
  UNIQUE(tenant_id, employee_id)
);

-- TABLE 5: tenant_migrations
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

-- TABLE 6: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id uuid,
  user_type text CHECK (user_type IN ('SuperAdmin', 'CompanyAdmin')),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- TABLE 7: employees (must be created before teams due to circular dependency)
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  mobile text NOT NULL,
  emp_id text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('TeamIncharge', 'Telecaller')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  team_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES company_admins(id) ON DELETE SET NULL,
  UNIQUE(tenant_id, emp_id)
);

-- TABLE 8: teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  team_incharge_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  product_name text NOT NULL DEFAULT 'General',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE(tenant_id, name)
);

-- Add foreign key constraint to employees.team_id after teams table is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'employees_team_id_fkey'
    AND table_name = 'employees'
  ) THEN
    ALTER TABLE employees
    ADD CONSTRAINT employees_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- TABLE 9: team_telecallers
CREATE TABLE IF NOT EXISTS team_telecallers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  telecaller_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, telecaller_id)
);

-- TABLE 10: column_configurations
CREATE TABLE IF NOT EXISTS column_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  column_name text NOT NULL,
  display_name text NOT NULL,
  is_active boolean DEFAULT true,
  is_custom boolean DEFAULT false,
  column_order integer DEFAULT 0,
  data_type text DEFAULT 'text' CHECK (data_type IN ('text', 'number', 'date', 'phone', 'currency', 'email', 'url')),
  product_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, column_name, product_name)
);

-- TABLE 11: customer_cases
CREATE TABLE IF NOT EXISTS customer_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_employee_id text NOT NULL,
  loan_id text NOT NULL,
  customer_name text NOT NULL,
  mobile_no text,
  alternate_number text,
  email text,
  loan_amount text,
  loan_type text,
  outstanding_amount text,
  pos_amount text,
  emi_amount text,
  pending_dues text,
  dpd integer,
  branch_name text,
  address text,
  city text,
  state text,
  pincode text,
  sanction_date date,
  last_paid_date date,
  last_paid_amount text,
  payment_link text,
  remarks text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  case_status text DEFAULT 'pending' CHECK (case_status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  uploaded_by uuid,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  product_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, loan_id)
);

-- TABLE 12: case_call_logs
CREATE TABLE IF NOT EXISTS case_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES customer_cases(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  call_status text NOT NULL CHECK (call_status IN ('WN', 'SW', 'RNR', 'BUSY', 'CALL_BACK', 'PTP', 'FUTURE_PTP', 'BPTP', 'RTP', 'NC', 'CD', 'INC')),
  ptp_date date,
  call_notes text,
  call_duration integer DEFAULT 0,
  call_result text,
  amount_collected text,
  created_at timestamptz DEFAULT now()
);

-- ===============================================================================
-- SECTION 4: INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===============================================================================

CREATE INDEX IF NOT EXISTS idx_super_admins_username ON super_admins(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdomain_lower ON tenants(LOWER(subdomain));
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain_status ON tenants(LOWER(subdomain), status);
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
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_emp_id ON employees(emp_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_mobile ON employees(mobile);
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);
CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON teams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_incharge_id ON teams(team_incharge_id);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_product_name ON teams(product_name);
CREATE INDEX IF NOT EXISTS idx_team_telecallers_team_id ON team_telecallers(team_id);
CREATE INDEX IF NOT EXISTS idx_team_telecallers_telecaller_id ON team_telecallers(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_column_config_tenant ON column_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_column_config_active ON column_configurations(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_column_config_order ON column_configurations(tenant_id, column_order);
CREATE INDEX IF NOT EXISTS idx_customer_cases_tenant ON customer_cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_employee ON customer_cases(tenant_id, assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_loan_id ON customer_cases(tenant_id, loan_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_status ON customer_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_customer_cases_dpd ON customer_cases(dpd);
CREATE INDEX IF NOT EXISTS idx_customer_cases_team_id ON customer_cases(team_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_case ON case_call_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_employee ON case_call_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON case_call_logs(created_at);

-- ===============================================================================
-- SECTION 5: TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ===============================================================================

DROP TRIGGER IF EXISTS update_super_admins_updated_at ON super_admins;
CREATE TRIGGER update_super_admins_updated_at
  BEFORE UPDATE ON super_admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_normalize_validate_subdomain_insert ON tenants;
CREATE TRIGGER trigger_normalize_validate_subdomain_insert
  BEFORE INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION normalize_and_validate_subdomain();

DROP TRIGGER IF EXISTS trigger_normalize_validate_subdomain_update ON tenants;
CREATE TRIGGER trigger_normalize_validate_subdomain_update
  BEFORE UPDATE OF subdomain ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION normalize_and_validate_subdomain();

DROP TRIGGER IF EXISTS update_tenant_databases_updated_at ON tenant_databases;
CREATE TRIGGER update_tenant_databases_updated_at
  BEFORE UPDATE ON tenant_databases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_admins_updated_at ON company_admins;
CREATE TRIGGER update_company_admins_updated_at
  BEFORE UPDATE ON company_admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_column_configurations_updated_at ON column_configurations;
CREATE TRIGGER update_column_configurations_updated_at
  BEFORE UPDATE ON column_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_cases_updated_at ON customer_cases;
CREATE TRIGGER update_customer_cases_updated_at
  BEFORE UPDATE ON customer_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ===============================================================================

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_telecallers ENABLE ROW LEVEL SECURITY;
ALTER TABLE column_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_call_logs ENABLE ROW LEVEL SECURITY;

-- ===============================================================================
-- SECTION 7: RLS POLICIES (ANON ACCESS FOR CUSTOM AUTH)
-- ===============================================================================

-- super_admins policies
DROP POLICY IF EXISTS "Allow anonymous select for authentication" ON super_admins;
CREATE POLICY "Allow anonymous select for authentication"
  ON super_admins FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow insert for super admins" ON super_admins;
CREATE POLICY "Allow insert for super admins"
  ON super_admins FOR INSERT TO anon, authenticated WITH CHECK (true);

-- tenants policies
DROP POLICY IF EXISTS "Allow anon read access to tenants" ON tenants;
CREATE POLICY "Allow anon read access to tenants"
  ON tenants FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert access to tenants" ON tenants;
CREATE POLICY "Allow anon insert access to tenants"
  ON tenants FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update access to tenants" ON tenants;
CREATE POLICY "Allow anon update access to tenants"
  ON tenants FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete access to tenants" ON tenants;
CREATE POLICY "Allow anon delete access to tenants"
  ON tenants FOR DELETE TO anon USING (true);

-- tenant_databases policies
DROP POLICY IF EXISTS "Allow anon read access to tenant databases" ON tenant_databases;
CREATE POLICY "Allow anon read access to tenant databases"
  ON tenant_databases FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert access to tenant databases" ON tenant_databases;
CREATE POLICY "Allow anon insert access to tenant databases"
  ON tenant_databases FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update access to tenant databases" ON tenant_databases;
CREATE POLICY "Allow anon update access to tenant databases"
  ON tenant_databases FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete access to tenant databases" ON tenant_databases;
CREATE POLICY "Allow anon delete access to tenant databases"
  ON tenant_databases FOR DELETE TO anon USING (true);

-- company_admins policies
DROP POLICY IF EXISTS "Allow anon read access to company admins" ON company_admins;
CREATE POLICY "Allow anon read access to company admins"
  ON company_admins FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert access to company admins" ON company_admins;
CREATE POLICY "Allow anon insert access to company admins"
  ON company_admins FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update access to company admins" ON company_admins;
CREATE POLICY "Allow anon update access to company admins"
  ON company_admins FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete access to company admins" ON company_admins;
CREATE POLICY "Allow anon delete access to company admins"
  ON company_admins FOR DELETE TO anon USING (true);

-- tenant_migrations policies
DROP POLICY IF EXISTS "Allow anon read access to tenant migrations" ON tenant_migrations;
CREATE POLICY "Allow anon read access to tenant migrations"
  ON tenant_migrations FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert access to tenant migrations" ON tenant_migrations;
CREATE POLICY "Allow anon insert access to tenant migrations"
  ON tenant_migrations FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update access to tenant migrations" ON tenant_migrations;
CREATE POLICY "Allow anon update access to tenant migrations"
  ON tenant_migrations FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- audit_logs policies
DROP POLICY IF EXISTS "Allow anon read access to audit logs" ON audit_logs;
CREATE POLICY "Allow anon read access to audit logs"
  ON audit_logs FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert access to audit logs" ON audit_logs;
CREATE POLICY "Allow anon insert access to audit logs"
  ON audit_logs FOR INSERT TO anon WITH CHECK (true);

-- employees policies
DROP POLICY IF EXISTS "Allow anon to read employees" ON employees;
CREATE POLICY "Allow anon to read employees"
  ON employees FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon to insert employees" ON employees;
CREATE POLICY "Allow anon to insert employees"
  ON employees FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to update employees" ON employees;
CREATE POLICY "Allow anon to update employees"
  ON employees FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to delete employees" ON employees;
CREATE POLICY "Allow anon to delete employees"
  ON employees FOR DELETE TO anon USING (true);

-- teams policies
DROP POLICY IF EXISTS "Allow anon read teams" ON teams;
CREATE POLICY "Allow anon read teams"
  ON teams FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert teams" ON teams;
CREATE POLICY "Allow anon insert teams"
  ON teams FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update teams" ON teams;
CREATE POLICY "Allow anon update teams"
  ON teams FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete teams" ON teams;
CREATE POLICY "Allow anon delete teams"
  ON teams FOR DELETE TO anon USING (true);

-- team_telecallers policies
DROP POLICY IF EXISTS "Allow anon read team_telecallers" ON team_telecallers;
CREATE POLICY "Allow anon read team_telecallers"
  ON team_telecallers FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert team_telecallers" ON team_telecallers;
CREATE POLICY "Allow anon insert team_telecallers"
  ON team_telecallers FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update team_telecallers" ON team_telecallers;
CREATE POLICY "Allow anon update team_telecallers"
  ON team_telecallers FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete team_telecallers" ON team_telecallers;
CREATE POLICY "Allow anon delete team_telecallers"
  ON team_telecallers FOR DELETE TO anon USING (true);

-- column_configurations policies
DROP POLICY IF EXISTS "Allow anon read column configurations" ON column_configurations;
CREATE POLICY "Allow anon read column configurations"
  ON column_configurations FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert column configurations" ON column_configurations;
CREATE POLICY "Allow anon insert column configurations"
  ON column_configurations FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update column configurations" ON column_configurations;
CREATE POLICY "Allow anon update column configurations"
  ON column_configurations FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete column configurations" ON column_configurations;
CREATE POLICY "Allow anon delete column configurations"
  ON column_configurations FOR DELETE TO anon USING (true);

-- customer_cases policies
DROP POLICY IF EXISTS "Allow anon read customer cases" ON customer_cases;
CREATE POLICY "Allow anon read customer cases"
  ON customer_cases FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert customer cases" ON customer_cases;
CREATE POLICY "Allow anon insert customer cases"
  ON customer_cases FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update customer cases" ON customer_cases;
CREATE POLICY "Allow anon update customer cases"
  ON customer_cases FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete customer cases" ON customer_cases;
CREATE POLICY "Allow anon delete customer cases"
  ON customer_cases FOR DELETE TO anon USING (true);

-- case_call_logs policies
DROP POLICY IF EXISTS "Allow anon read call logs" ON case_call_logs;
CREATE POLICY "Allow anon read call logs"
  ON case_call_logs FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert call logs" ON case_call_logs;
CREATE POLICY "Allow anon insert call logs"
  ON case_call_logs FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update call logs" ON case_call_logs;
CREATE POLICY "Allow anon update call logs"
  ON case_call_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);