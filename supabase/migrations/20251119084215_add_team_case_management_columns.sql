/*
  # Add Team and Case Management Columns to customer_cases

  1. Changes to customer_cases table
    - Add `team_id` (uuid, references teams) - Team assigned to this case
    - Add `telecaller_id` (uuid, references employees) - Telecaller assigned to this case
    - Add `product_name` (text) - Product associated with this case
    - Add `status` (text) - Case workflow status (new/assigned/in_progress/closed)
    - Add `case_data` (jsonb) - Flexible storage for dynamic case fields from column configurations

  2. Indexes
    - Create index on team_id for fast team-based queries
    - Create index on telecaller_id for fast telecaller-based queries
    - Create index on product_name for product-based filtering
    - Create index on status for status-based filtering

  3. Security
    - Maintain existing RLS policies
    - Allow anon access as configured in existing policies
*/

-- Add columns to customer_cases table
ALTER TABLE customer_cases
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS telecaller_id uuid REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS product_name text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'closed', 'pending')),
ADD COLUMN IF NOT EXISTS case_data jsonb DEFAULT '{}'::jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_cases_team_id ON customer_cases(team_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_telecaller_id ON customer_cases(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_product_name ON customer_cases(product_name);
CREATE INDEX IF NOT EXISTS idx_customer_cases_status ON customer_cases(status);
CREATE INDEX IF NOT EXISTS idx_customer_cases_case_data ON customer_cases USING gin(case_data);

-- Add comments for documentation
COMMENT ON COLUMN customer_cases.team_id IS 'Team to which this case belongs';
COMMENT ON COLUMN customer_cases.telecaller_id IS 'UUID of the assigned telecaller employee';
COMMENT ON COLUMN customer_cases.product_name IS 'Product name for this case';
COMMENT ON COLUMN customer_cases.status IS 'Case workflow status: new, assigned, in_progress, closed, pending';
COMMENT ON COLUMN customer_cases.case_data IS 'Flexible JSONB storage for dynamic case fields based on column configurations';