-- Migration to add missing columns for Case Management functionality

-- Add missing columns to customer_cases table for Team Incharge functionality
ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS telecaller_id uuid REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS product_name text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'closed')),
ADD COLUMN IF NOT EXISTS case_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES employees(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_cases_team ON customer_cases(team_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_telecaller ON customer_cases(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_product ON customer_cases(product_name);
CREATE INDEX IF NOT EXISTS idx_customer_cases_case_status ON customer_cases(status);

-- Migrate data from custom_fields to case_data if needed
UPDATE customer_cases 
SET case_data = custom_fields 
WHERE case_data = '{}'::jsonb AND custom_fields != '{}'::jsonb;

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Allow anon read customer cases" ON customer_cases;
DROP POLICY IF EXISTS "Allow anon update customer cases" ON customer_cases;

CREATE POLICY "Allow anon read customer cases"
  ON customer_cases FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon update customer cases"
  ON customer_cases FOR UPDATE
  TO anon
  USING (true);

-- Add comment to document the changes
COMMENT ON COLUMN customer_cases.team_id IS 'Team to which this case belongs';
COMMENT ON COLUMN customer_cases.telecaller_id IS 'UUID of the assigned telecaller employee';
COMMENT ON COLUMN customer_cases.product_name IS 'Product name for this case';
COMMENT ON COLUMN customer_cases.status IS 'Case status: new, assigned, in_progress, closed';
COMMENT ON COLUMN customer_cases.case_data IS 'JSONB field containing all case data including custom fields';
COMMENT ON COLUMN customer_cases.assigned_by IS 'UUID of the employee who assigned this case';