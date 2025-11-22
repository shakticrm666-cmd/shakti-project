/*
  # Add Case Management Columns

  1. Changes to customer_cases table
    - Add `team_id` (references teams)
    - Add `telecaller_id` (references employees)
    - Add `product_name` (text)
    - Add `status` (new/assigned/in_progress/closed)
    - Add `case_data` (jsonb for all case data)
    - Add `assigned_by` (references employees)

  2. Performance
    - Create indexes for new columns

  3. Security
    - Update RLS policies for new columns

  4. Notes
    - Migrates data from custom_fields to case_data
*/

ALTER TABLE customer_cases 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS telecaller_id uuid REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS product_name text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'closed')),
ADD COLUMN IF NOT EXISTS case_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES employees(id);

CREATE INDEX IF NOT EXISTS idx_customer_cases_team ON customer_cases(team_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_telecaller ON customer_cases(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_customer_cases_product ON customer_cases(product_name);
CREATE INDEX IF NOT EXISTS idx_customer_cases_case_status ON customer_cases(status);

UPDATE customer_cases 
SET case_data = custom_fields 
WHERE case_data = '{}'::jsonb AND custom_fields != '{}'::jsonb;

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