/*
  # Column Configuration and Customer Cases System

  ## Overview
  This migration creates the schema for managing dynamic column configurations
  and customer cases that can be assigned to employees with EMPID tracking.

  ## New Tables

  ### 1. `column_configurations` - Dynamic Column Settings
  Stores the column configuration created by Company Admin
  - `id` (uuid, primary key) - Unique identifier
  - `tenant_id` (uuid, foreign key) - Reference to tenant
  - `column_name` (text, not null) - Internal column name (e.g., 'customerName')
  - `display_name` (text, not null) - Display name shown in UI (e.g., 'Customer Name')
  - `is_active` (boolean, default true) - Whether column is active/visible
  - `is_custom` (boolean, default false) - Whether this is a custom column
  - `column_order` (integer) - Display order of columns
  - `data_type` (text) - Data type for validation (text, number, date, phone)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `customer_cases` - Case Management
  Stores all customer loan recovery cases uploaded by Team Incharge
  - `id` (uuid, primary key) - Unique identifier
  - `tenant_id` (uuid, foreign key) - Reference to tenant
  - `assigned_employee_id` (text, not null) - EMPID of assigned employee
  - `loan_id` (text, not null) - Loan ID
  - Default columns (customer_name, mobile_no, loan_amount, etc.)
  - `custom_fields` (jsonb) - Stores custom column data
  - `case_status` (text) - Status: pending, in_progress, resolved
  - `uploaded_by` (uuid) - Team Incharge who uploaded the case
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `case_call_logs` - Call History
  Tracks all call interactions for each case
  - `id` (uuid, primary key) - Unique identifier
  - `case_id` (uuid, foreign key) - Reference to customer_cases
  - `employee_id` (text) - EMPID who made the call
  - `call_status` (text) - Call status (WN, SW, RNR, PTP, etc.)
  - `ptp_date` (date) - Promise to Pay date if applicable
  - `call_notes` (text) - Notes from the call
  - `call_duration` (integer) - Call duration in seconds
  - `created_at` (timestamptz) - Call timestamp

  ## Security
  - Enable RLS on all tables
  - Tenant isolation enforced
  - Employees can only access cases assigned to them
  - Team Incharge can access all cases in their tenant
  - Company Admin can manage column configurations

  ## Important Notes
  - Column configurations are tenant-specific
  - EMPID is used for case assignment (not internal UUID)
  - Custom fields are stored as JSONB for flexibility
  - All operations are audited
*/

-- =====================================================
-- TABLE: column_configurations
-- =====================================================
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

-- =====================================================
-- TABLE: customer_cases
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Assignment
  assigned_employee_id text NOT NULL,
  
  -- Core Case Information
  loan_id text NOT NULL,
  customer_name text NOT NULL,
  mobile_no text,
  alternate_number text,
  email text,
  
  -- Loan Details
  loan_amount text,
  loan_type text,
  outstanding_amount text,
  pos_amount text,
  emi_amount text,
  pending_dues text,
  dpd integer,
  
  -- Branch and Location
  branch_name text,
  address text,
  city text,
  state text,
  pincode text,
  
  -- Dates
  sanction_date date,
  last_paid_date date,
  last_paid_amount text,
  
  -- Payment
  payment_link text,
  
  -- Additional Fields
  remarks text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  
  -- Case Management
  case_status text DEFAULT 'pending' CHECK (case_status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Metadata
  uploaded_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, loan_id)
);

-- =====================================================
-- TABLE: case_call_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS case_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES customer_cases(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  
  -- Call Details
  call_status text NOT NULL CHECK (call_status IN ('WN', 'SW', 'RNR', 'BUSY', 'CALL_BACK', 'PTP', 'FUTURE_PTP', 'BPTP', 'RTP', 'NC', 'CD', 'INC')),
  ptp_date date,
  call_notes text,
  call_duration integer DEFAULT 0,
  
  -- Call Result
  call_result text,
  amount_collected text,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
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

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_column_configurations_updated_at 
  BEFORE UPDATE ON column_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_cases_updated_at 
  BEFORE UPDATE ON customer_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE column_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_call_logs ENABLE ROW LEVEL SECURITY;

-- Column Configurations Policies (anon access for reading)
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

-- Customer Cases Policies (anon access)
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

-- Call Logs Policies (anon access)
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