/*
  # Add case_data column to customer_cases table

  1. Changes
    - Add `case_data` (jsonb) - Flexible storage for dynamic case fields from column configurations
    - Add GIN index on case_data for efficient JSONB queries
    
  2. Purpose
    - Store all dynamic case fields in a flexible JSONB structure
    - Allows for custom fields without schema changes
    - Maintains backward compatibility with existing code
*/

-- Add case_data column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_cases' AND column_name = 'case_data'
  ) THEN
    ALTER TABLE customer_cases
    ADD COLUMN case_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_customer_cases_case_data ON customer_cases USING gin(case_data);

-- Add comment
COMMENT ON COLUMN customer_cases.case_data IS 'Flexible JSONB storage for dynamic case fields based on column configurations';