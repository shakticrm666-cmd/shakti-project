/*
  # Complete Database Schema - Multi-Tenant Loan Recovery System

  This migration creates the entire database schema for a multi-tenant loan recovery application.

  ## New Tables
  
  1. **super_admins** - Super administrator authentication
     - `id` (uuid, primary key)
     - `username` (text, unique)
     - `password_hash` (text)
     - `created_at`, `updated_at` (timestamps)

  2. **tenants** - Company/tenant registry
     - `id` (uuid, primary key)
     - `name`, `subdomain` (text, subdomain unique)
     - `status` (active/inactive/suspended)
     - Company details (proprietor, phone, email, address, GST, PAN, city, state, pincode)
     - `plan`, `max_users`, `max_connections`
     - `settings` (jsonb)
     - `created_by` (references super_admins)

  3. **tenant_databases** - Database connection registry
     - `id` (uuid, primary key)
     - `tenant_id` (references tenants)
     - Database connection info (url, name, host, port)
     - Health monitoring fields
     - `schema_version`

  4. **company_admins** - Company administrators
     - `id` (uuid, primary key)
     - `tenant_id` (references tenants)
     - `name`, `employee_id`, `email`, `password_hash`
     - `status`, `role`
     - Authentication fields
     - `created_by` (references super_admins)

  5. **tenant_migrations** - Migration tracking
     - `id` (uuid, primary key)
     - `tenant_id` (references tenants)
     - `migration_name`, `migration_version`
     - `status`, `error_message`

  6. **audit_logs** - System audit trail
     - `id` (uuid, primary key)
     - `tenant_id`, `user_id`, `user_type`
     - Action details (action, resource_type, resource_id)
     - Old and new values (jsonb)
     - Request context (ip_address, user_agent)

  7. **employees** - Team Incharges and Telecallers
     - `id` (uuid, primary key)
     - `tenant_id` (references tenants)
     - `name`, `mobile`, `emp_id`, `password_hash`
     - `role` (TeamIncharge/Telecaller)
     - `status` (active/inactive)
     - `created_by` (references company_admins)

  8. **column_configurations** - Dynamic column settings
     - `id` (uuid, primary key)
     - `tenant_id` (references tenants)
     - `column_name`, `display_name`
     - `is_active`, `is_custom`, `column_order`
     - `data_type` (text/number/date/phone/currency/email/url)

  9. **customer_cases** - Loan recovery cases
     - `id` (uuid, primary key)
     - `tenant_id` (references tenants)
     - `assigned_employee_id`
     - Core case info (loan_id, customer_name, mobile, email, etc.)
     - Loan details (amount, type, outstanding, POS, EMI, etc.)
     - Location (branch, address, city, state, pincode)
     - Dates and payment info
     - `case_status`, `priority`
     - `custom_fields` (jsonb)

  10. **case_call_logs** - Call interaction history
      - `id` (uuid, primary key)
      - `case_id` (references customer_cases)
      - `employee_id`
      - Call details (status, ptp_date, notes, duration)
      - Call result and amount collected

  ## Security
  
  - RLS enabled on all tables
  - Anon access policies for custom authentication
  - Application-layer security (not using Supabase Auth)

  ## Features
  
  - Utility functions for subdomain validation
  - Automatic timestamp updates via triggers
  - Comprehensive indexes for performance
  - Foreign key constraints for data integrity
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Utility Functions
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

-- Table 1: super_admins
CREATE TABLE IF NOT EXISTS super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table 2: tenants
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

-- Table 3: tenant_databases
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

-- Table 4: company_admins
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

-- Table 5: tenant_migrations
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

-- Table 6: audit_logs
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

-- Table 7: employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  mobile text NOT NULL,
  emp_id text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('TeamIncharge', 'Telecaller')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES company_admins(id) ON DELETE SET NULL,
  UNIQUE(tenant_id, emp_id)
);

-- Table 8: column_configurations
CREATE TABLE IF NOT EXISTS column_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  column_name text NOT NULL,
  display_name text NOT NULL,
  is_active boolean DEFAULT true,
  is_custom boolean DEFAULT false,
  column_order integer DEFAULT 0,
  data_type text DEFAULT 'text' CHECK (data_type IN ('text', 'number', 'date', 'phone', 'currency', 'email', 'url')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, column_name)
);

-- Table 9: customer_cases
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, loan_id)
);

-- Table 10: case_call_logs
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

-- Indexes
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
CREATE INDEX IF NOT EXISTS idx_column_config_tenant ON column_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_column_config_active ON column_configurations(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_column_config_order ON column_configurations(tenant_id, column_order);
CREATE INDEX IF NOT EXISTS idx_customer_cases_tenant ON customer_cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_employee ON customer_cases(tenant_id, assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_loan_id ON customer_cases(tenant_id, loan_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_status ON customer_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_customer_cases_dpd ON customer_cases(dpd);
CREATE INDEX IF NOT EXISTS idx_call_logs_case ON case_call_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_employee ON case_call_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON case_call_logs(created_at);

-- Triggers
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

CREATE TRIGGER update_column_configurations_updated_at
  BEFORE UPDATE ON column_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_cases_updated_at
  BEFORE UPDATE ON customer_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE column_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_call_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Anon access for custom authentication)
CREATE POLICY "Allow anonymous select for authentication"
  ON super_admins FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow insert for super admins"
  ON super_admins FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anon read access to tenants"
  ON tenants FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert access to tenants"
  ON tenants FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update access to tenants"
  ON tenants FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete access to tenants"
  ON tenants FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow anon read access to tenant databases"
  ON tenant_databases FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert access to tenant databases"
  ON tenant_databases FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update access to tenant databases"
  ON tenant_databases FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete access to tenant databases"
  ON tenant_databases FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow anon read access to company admins"
  ON company_admins FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert access to company admins"
  ON company_admins FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update access to company admins"
  ON company_admins FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete access to company admins"
  ON company_admins FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow anon read access to tenant migrations"
  ON tenant_migrations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert access to tenant migrations"
  ON tenant_migrations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update access to tenant migrations"
  ON tenant_migrations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon read access to audit logs"
  ON audit_logs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert access to audit logs"
  ON audit_logs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to read employees"
  ON employees FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert employees"
  ON employees FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update employees"
  ON employees FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete employees"
  ON employees FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow anon read column configurations"
  ON column_configurations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert column configurations"
  ON column_configurations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update column configurations"
  ON column_configurations FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anon delete column configurations"
  ON column_configurations FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow anon read customer cases"
  ON customer_cases FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert customer cases"
  ON customer_cases FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update customer cases"
  ON customer_cases FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anon delete customer cases"
  ON customer_cases FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow anon read call logs"
  ON case_call_logs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert call logs"
  ON case_call_logs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update call logs"
  ON case_call_logs FOR UPDATE
  TO anon
  USING (true);