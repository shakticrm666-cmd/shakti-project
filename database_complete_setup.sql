/*
  ===============================================================================
  COMPLETE DATABASE SETUP - MULTI-TENANT LOAN RECOVERY SYSTEM
  ===============================================================================

  This SQL script creates a complete database schema from scratch for a
  multi-tenant loan recovery application system.

  USAGE:
    1. Update the superadmin credentials below (search for "SUPERADMIN CONFIG")
    2. Run this script in your Supabase SQL Editor or via psql
    3. The script is idempotent - safe to run multiple times

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
  - Password hashing with bcrypt (work factor 10)

  ===============================================================================
*/

BEGIN;

-- ===============================================================================
-- SECTION 1: EXTENSIONS AND PREREQUISITES
-- ===============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================================================================
-- SECTION 2: DROP EXISTING TABLES (IN REVERSE DEPENDENCY ORDER)
-- ===============================================================================
-- WARNING: This will delete all existing data. Comment out this section if you
-- want to preserve existing data.

DROP TABLE IF EXISTS case_call_logs CASCADE;
DROP TABLE IF EXISTS customer_cases CASCADE;
DROP TABLE IF EXISTS column_configurations CASCADE;
DROP TABLE IF EXISTS team_telecallers CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS tenant_migrations CASCADE;
DROP TABLE IF EXISTS company_admins CASCADE;
DROP TABLE IF EXISTS tenant_databases CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS super_admins CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS validate_subdomain_format(text) CASCADE;
DROP FUNCTION IF EXISTS normalize_and_validate_subdomain() CASCADE;

-- ===============================================================================
-- SECTION 3: UTILITY FUNCTIONS
-- ===============================================================================

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate subdomain format
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

-- Function to normalize and validate subdomain on insert/update
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
-- SECTION 4: CORE TABLES (IN DEPENDENCY ORDER)
-- ===============================================================================

-- TABLE 1: super_admins
CREATE TABLE super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_username_not_empty CHECK (LENGTH(TRIM(username)) > 0),
  CONSTRAINT check_username_length CHECK (LENGTH(username) >= 3)
);

COMMENT ON TABLE super_admins IS 'Super administrators with system-wide access';
COMMENT ON COLUMN super_admins.password_hash IS 'Bcrypt hashed password (work factor 10)';

-- TABLE 2: tenants
CREATE TABLE tenants (
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
  CONSTRAINT check_subdomain_format CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  CONSTRAINT check_max_users_positive CHECK (max_users > 0),
  CONSTRAINT check_max_connections_positive CHECK (max_connections > 0)
);

COMMENT ON TABLE tenants IS 'Multi-tenant companies using the system';
COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain for tenant isolation (e.g., company.domain.com)';
COMMENT ON COLUMN tenants.settings IS 'JSON configuration for branding and features';

-- TABLE 3: tenant_databases
CREATE TABLE tenant_databases (
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

COMMENT ON TABLE tenant_databases IS 'Database connection information for each tenant';

-- TABLE 4: company_admins
CREATE TABLE company_admins (
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
  UNIQUE(tenant_id, employee_id),
  CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE company_admins IS 'Administrator users for each tenant company';
COMMENT ON COLUMN company_admins.password_hash IS 'Bcrypt hashed password';

-- TABLE 5: tenant_migrations
CREATE TABLE tenant_migrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  migration_name text NOT NULL,
  migration_version text NOT NULL,
  applied_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message text,
  UNIQUE(tenant_id, migration_name)
);

COMMENT ON TABLE tenant_migrations IS 'Track database migrations per tenant';

-- TABLE 6: audit_logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id uuid,
  user_type text CHECK (user_type IN ('SuperAdmin', 'CompanyAdmin', 'TeamIncharge', 'Telecaller')),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE audit_logs IS 'System-wide audit trail for all critical operations';

-- TABLE 7: employees
CREATE TABLE employees (
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
  UNIQUE(tenant_id, emp_id),
  CONSTRAINT check_mobile_format CHECK (mobile ~ '^[0-9+()-\s]{10,15}$')
);

COMMENT ON TABLE employees IS 'Team incharge and telecaller employees';
COMMENT ON COLUMN employees.team_id IS 'Team assignment for telecallers (NULL for team incharge)';

-- TABLE 8: teams
CREATE TABLE teams (
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

COMMENT ON TABLE teams IS 'Teams for organizing telecallers under a team incharge';
COMMENT ON COLUMN teams.product_name IS 'Product/loan type this team handles';

-- Add foreign key constraint to employees.team_id after teams table is created
ALTER TABLE employees
  ADD CONSTRAINT employees_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- TABLE 9: team_telecallers
CREATE TABLE team_telecallers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  telecaller_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, telecaller_id)
);

COMMENT ON TABLE team_telecallers IS 'Junction table for team-telecaller many-to-many relationships';

-- TABLE 10: column_configurations
CREATE TABLE column_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  column_name text NOT NULL,
  display_name text NOT NULL,
  is_active boolean DEFAULT true,
  is_custom boolean DEFAULT false,
  column_order integer DEFAULT 0,
  data_type text DEFAULT 'text' CHECK (data_type IN ('text', 'number', 'date', 'phone', 'currency', 'email', 'url', 'boolean')),
  product_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, column_name, product_name)
);

COMMENT ON TABLE column_configurations IS 'Dynamic column configurations per tenant and product';
COMMENT ON COLUMN column_configurations.is_custom IS 'True for user-created columns, false for system columns';
COMMENT ON COLUMN column_configurations.column_order IS 'Display order in UI';

-- TABLE 11: customer_cases
CREATE TABLE customer_cases (
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
  case_data jsonb DEFAULT '{}'::jsonb,
  case_status text DEFAULT 'pending' CHECK (case_status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  uploaded_by uuid,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  product_name text,
  total_collected_amount numeric DEFAULT 0 CHECK (total_collected_amount >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, loan_id)
);

COMMENT ON TABLE customer_cases IS 'Loan recovery cases with customer and loan details';
COMMENT ON COLUMN customer_cases.custom_fields IS 'JSONB storage for custom configured fields';
COMMENT ON COLUMN customer_cases.case_data IS 'JSONB storage for Excel import data (backward compatibility)';
COMMENT ON COLUMN customer_cases.total_collected_amount IS 'Cumulative total of all payments collected for this case';
COMMENT ON COLUMN customer_cases.dpd IS 'Days Past Due';

-- TABLE 12: case_call_logs
CREATE TABLE case_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES customer_cases(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  call_status text NOT NULL CHECK (call_status IN (
    'WN',         -- Wrong Number
    'SW',         -- Switched Off
    'RNR',        -- Ringing No Response
    'BUSY',       -- Busy
    'CALL_BACK',  -- Call Back
    'PTP',        -- Promise to Pay
    'FUTURE_PTP', -- Future Promise to Pay
    'BPTP',       -- Broken Promise to Pay
    'RTP',        -- Refused to Pay
    'NC',         -- Not Connected
    'CD',         -- Call Disconnected
    'INC',        -- Incomplete
    'PAYMENT_RECEIVED' -- Payment Received
  )),
  ptp_date timestamptz,
  call_notes text,
  call_duration integer DEFAULT 0,
  call_result text,
  amount_collected numeric DEFAULT 0 CHECK (amount_collected >= 0),
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE case_call_logs IS 'Call interaction history and status updates';
COMMENT ON COLUMN case_call_logs.call_status IS 'Status code for call outcome';
COMMENT ON COLUMN case_call_logs.ptp_date IS 'Promise to Pay date (if applicable)';
COMMENT ON COLUMN case_call_logs.amount_collected IS 'Payment amount collected during this interaction';

-- ===============================================================================
-- SECTION 5: INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===============================================================================

-- super_admins indexes
CREATE INDEX idx_super_admins_username ON super_admins(username);

-- tenants indexes
CREATE UNIQUE INDEX idx_tenants_subdomain_lower ON tenants(LOWER(subdomain));
CREATE INDEX idx_tenants_subdomain_status ON tenants(LOWER(subdomain), status);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_created_by ON tenants(created_by);

-- tenant_databases indexes
CREATE INDEX idx_tenant_databases_tenant_id ON tenant_databases(tenant_id);
CREATE INDEX idx_tenant_databases_status ON tenant_databases(status);

-- company_admins indexes
CREATE INDEX idx_company_admins_tenant_id ON company_admins(tenant_id);
CREATE INDEX idx_company_admins_email ON company_admins(email);
CREATE INDEX idx_company_admins_status ON company_admins(status);

-- tenant_migrations indexes
CREATE INDEX idx_tenant_migrations_tenant_id ON tenant_migrations(tenant_id);
CREATE INDEX idx_tenant_migrations_status ON tenant_migrations(status);

-- audit_logs indexes
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- employees indexes
CREATE INDEX idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX idx_employees_emp_id ON employees(emp_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_mobile ON employees(mobile);
CREATE INDEX idx_employees_created_by ON employees(created_by);
CREATE INDEX idx_employees_team_id ON employees(team_id);

-- teams indexes
CREATE INDEX idx_teams_tenant_id ON teams(tenant_id);
CREATE INDEX idx_teams_team_incharge_id ON teams(team_incharge_id);
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_teams_product_name ON teams(product_name);

-- team_telecallers indexes
CREATE INDEX idx_team_telecallers_team_id ON team_telecallers(team_id);
CREATE INDEX idx_team_telecallers_telecaller_id ON team_telecallers(telecaller_id);

-- column_configurations indexes
CREATE INDEX idx_column_config_tenant ON column_configurations(tenant_id);
CREATE INDEX idx_column_config_active ON column_configurations(tenant_id, is_active);
CREATE INDEX idx_column_config_custom ON column_configurations(tenant_id, is_custom);
CREATE INDEX idx_column_config_order ON column_configurations(tenant_id, column_order);
CREATE INDEX idx_column_config_product ON column_configurations(product_name);

-- customer_cases indexes
CREATE INDEX idx_customer_cases_tenant ON customer_cases(tenant_id);
CREATE INDEX idx_customer_cases_employee ON customer_cases(tenant_id, assigned_employee_id);
CREATE INDEX idx_customer_cases_loan_id ON customer_cases(tenant_id, loan_id);
CREATE INDEX idx_customer_cases_status ON customer_cases(case_status);
CREATE INDEX idx_customer_cases_dpd ON customer_cases(dpd);
CREATE INDEX idx_customer_cases_team_id ON customer_cases(team_id);
CREATE INDEX idx_customer_cases_customer_name ON customer_cases(customer_name);
CREATE INDEX idx_customer_cases_mobile ON customer_cases(mobile_no);
CREATE INDEX idx_customer_cases_collected_amount ON customer_cases(total_collected_amount);

-- JSONB indexes for efficient queries
CREATE INDEX idx_customer_cases_custom_fields ON customer_cases USING gin(custom_fields);
CREATE INDEX idx_customer_cases_case_data ON customer_cases USING gin(case_data);

-- case_call_logs indexes
CREATE INDEX idx_call_logs_case ON case_call_logs(case_id);
CREATE INDEX idx_call_logs_employee ON case_call_logs(employee_id);
CREATE INDEX idx_call_logs_created ON case_call_logs(created_at);
CREATE INDEX idx_call_logs_status ON case_call_logs(call_status);
CREATE INDEX idx_call_logs_ptp_date ON case_call_logs(ptp_date) WHERE ptp_date IS NOT NULL;

-- ===============================================================================
-- SECTION 6: TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ===============================================================================

CREATE TRIGGER update_super_admins_updated_at
  BEFORE UPDATE ON super_admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_normalize_validate_subdomain_insert
  BEFORE INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION normalize_and_validate_subdomain();

CREATE TRIGGER trigger_normalize_validate_subdomain_update
  BEFORE UPDATE OF subdomain ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION normalize_and_validate_subdomain();

CREATE TRIGGER update_tenant_databases_updated_at
  BEFORE UPDATE ON tenant_databases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_admins_updated_at
  BEFORE UPDATE ON company_admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_column_configurations_updated_at
  BEFORE UPDATE ON column_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_cases_updated_at
  BEFORE UPDATE ON customer_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS)
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
-- SECTION 8: RLS POLICIES (ANON ACCESS FOR CUSTOM AUTH)
-- ===============================================================================

-- super_admins policies
CREATE POLICY "Allow anonymous select for authentication"
  ON super_admins FOR SELECT TO anon USING (true);

CREATE POLICY "Allow insert for super admins"
  ON super_admins FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update for super admins"
  ON super_admins FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- tenants policies
CREATE POLICY "Allow anon read access to tenants"
  ON tenants FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert access to tenants"
  ON tenants FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update access to tenants"
  ON tenants FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete access to tenants"
  ON tenants FOR DELETE TO anon USING (true);

-- tenant_databases policies
CREATE POLICY "Allow anon read access to tenant databases"
  ON tenant_databases FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert access to tenant databases"
  ON tenant_databases FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update access to tenant databases"
  ON tenant_databases FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete access to tenant databases"
  ON tenant_databases FOR DELETE TO anon USING (true);

-- company_admins policies
CREATE POLICY "Allow anon read access to company admins"
  ON company_admins FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert access to company admins"
  ON company_admins FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update access to company admins"
  ON company_admins FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete access to company admins"
  ON company_admins FOR DELETE TO anon USING (true);

-- tenant_migrations policies
CREATE POLICY "Allow anon read access to tenant migrations"
  ON tenant_migrations FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert access to tenant migrations"
  ON tenant_migrations FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update access to tenant migrations"
  ON tenant_migrations FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- audit_logs policies
CREATE POLICY "Allow anon read access to audit logs"
  ON audit_logs FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert access to audit logs"
  ON audit_logs FOR INSERT TO anon WITH CHECK (true);

-- employees policies
CREATE POLICY "Allow anon to read employees"
  ON employees FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon to insert employees"
  ON employees FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon to update employees"
  ON employees FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to delete employees"
  ON employees FOR DELETE TO anon USING (true);

-- teams policies
CREATE POLICY "Allow anon read teams"
  ON teams FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert teams"
  ON teams FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update teams"
  ON teams FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete teams"
  ON teams FOR DELETE TO anon USING (true);

-- team_telecallers policies
CREATE POLICY "Allow anon read team_telecallers"
  ON team_telecallers FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert team_telecallers"
  ON team_telecallers FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update team_telecallers"
  ON team_telecallers FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete team_telecallers"
  ON team_telecallers FOR DELETE TO anon USING (true);

-- column_configurations policies
CREATE POLICY "Allow anon read column configurations"
  ON column_configurations FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert column configurations"
  ON column_configurations FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update column configurations"
  ON column_configurations FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete column configurations"
  ON column_configurations FOR DELETE TO anon USING (true);

-- customer_cases policies
CREATE POLICY "Allow anon read customer cases"
  ON customer_cases FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert customer cases"
  ON customer_cases FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update customer cases"
  ON customer_cases FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete customer cases"
  ON customer_cases FOR DELETE TO anon USING (true);

-- case_call_logs policies
CREATE POLICY "Allow anon read call logs"
  ON case_call_logs FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert call logs"
  ON case_call_logs FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update call logs"
  ON case_call_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ===============================================================================
-- SECTION 9: DEFAULT SUPERADMIN ACCOUNT CREATION
-- ===============================================================================

/*
  ==================== SUPERADMIN CONFIG ====================
  IMPORTANT: Update these values before running the script!

  Default credentials:
  - Username: superadmin
  - Password: SuperAdmin@123

  The password is hashed using crypt() with bcrypt algorithm.
  To generate a new hash for a different password, use:
  SELECT crypt('your_password', gen_salt('bf', 10));
  ===========================================================
*/

-- Insert default superadmin account
-- Password: SuperAdmin@123
-- Hash generated with: crypt('SuperAdmin@123', gen_salt('bf', 10))
INSERT INTO super_admins (username, password_hash)
VALUES (
  'superadmin',
  crypt('SuperAdmin@123', gen_salt('bf', 10))
)
ON CONFLICT (username) DO NOTHING;

-- Log the creation in audit_logs
INSERT INTO audit_logs (
  user_type,
  action,
  resource_type,
  new_values,
  created_at
)
VALUES (
  'SuperAdmin',
  'create_default_superadmin',
  'super_admins',
  jsonb_build_object(
    'username', 'superadmin',
    'note', 'Default superadmin account created during database setup'
  ),
  now()
);

-- ===============================================================================
-- SECTION 10: COMPLETION AND VERIFICATION
-- ===============================================================================

-- Verify table creation
DO $$
DECLARE
  table_count integer;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'super_admins', 'tenants', 'tenant_databases', 'company_admins',
    'tenant_migrations', 'audit_logs', 'employees', 'teams',
    'team_telecallers', 'column_configurations', 'customer_cases', 'case_call_logs'
  );

  IF table_count = 12 THEN
    RAISE NOTICE '✓ All 12 tables created successfully';
  ELSE
    RAISE WARNING '⚠ Expected 12 tables, found %', table_count;
  END IF;
END $$;

-- Display superadmin credentials
DO $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM super_admins WHERE username = 'superadmin';

  IF admin_count > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Default Superadmin Account Created';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Username: superadmin';
    RAISE NOTICE 'Password: SuperAdmin@123';
    RAISE NOTICE '';
    RAISE NOTICE '⚠ IMPORTANT: Change this password immediately after first login!';
    RAISE NOTICE '========================================';
  END IF;
END $$;

COMMIT;

/*
  ===============================================================================
  SETUP COMPLETE!
  ===============================================================================

  Next Steps:
  1. Login with superadmin credentials
  2. Change the default superadmin password
  3. Create your first tenant company
  4. Set up company admin for the tenant
  5. Configure employees and teams

  Database Statistics:
  - Total Tables: 12
  - Total Indexes: 50+
  - Total Triggers: 10
  - Total Functions: 3
  - RLS Policies: 40+

  For more information, refer to the project documentation.
  ===============================================================================
*/
