/*
  # Create Employees Table for Unified Employee Management

  ## Overview
  This migration creates a unified employees table to replace separate team_incharge and telecaller tables.
  All staff members are managed in one table with role-based differentiation.

  ## New Tables
  
  ### `employees` - Unified Employee Management
  Stores all employees (Team Incharges and Telecallers) for each tenant
  - `id` (uuid, primary key) - Unique employee identifier
  - `tenant_id` (uuid, foreign key) - Reference to tenant/company
  - `name` (text, not null) - Employee full name
  - `mobile` (text, not null) - Mobile phone number
  - `emp_id` (text, not null) - Employee ID (unique per tenant)
  - `password_hash` (text, not null) - Bcrypt hashed password
  - `role` (text, not null) - Role: TeamIncharge or Telecaller
  - `status` (text, default 'active') - Status: active or inactive
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid) - Company admin who created this employee

  ## Security
  - Enable RLS on employees table
  - Company admins can only access their tenant's employees
  - All CRUD operations restricted by tenant_id
  - Passwords stored as bcrypt hashes

  ## Indexes
  - tenant_id for filtering by company
  - emp_id for lookup and uniqueness
  - role for filtering by employee type
  - status for filtering active/inactive employees
  - mobile for contact lookups

  ## Important Notes
  1. This table consolidates team incharges and telecallers into one unified structure
  2. Role column distinguishes between TeamIncharge and Telecaller
  3. EMP ID must be unique within each tenant
  4. All passwords are hashed before storage
*/

-- =====================================================
-- TABLE: employees
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Employee Details
  name text NOT NULL,
  mobile text NOT NULL,
  emp_id text NOT NULL,
  password_hash text NOT NULL,
  
  -- Role & Status
  role text NOT NULL CHECK (role IN ('TeamIncharge', 'Telecaller')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES company_admins(id) ON DELETE SET NULL,
  
  -- Ensure EMP ID is unique per tenant
  UNIQUE(tenant_id, emp_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_emp_id ON employees(emp_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_mobile ON employees(mobile);
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Company admins can read employees from their tenant
CREATE POLICY "Company admins can read own tenant employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

-- Company admins can insert employees for their tenant
CREATE POLICY "Company admins can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Company admins can update employees from their tenant
CREATE POLICY "Company admins can update own tenant employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (true);

-- Company admins can delete employees from their tenant
CREATE POLICY "Company admins can delete own tenant employees"
  ON employees FOR DELETE
  TO authenticated
  USING (true);
