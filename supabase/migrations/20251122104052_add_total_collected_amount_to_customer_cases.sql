/*
  # Add Payment Collection Tracking to Customer Cases

  ## Summary
  Adds ability to track total collected payment amounts for each customer case
  and enables payment celebration features for team motivation.

  ## Changes
  1. New Column
    - `total_collected_amount` (numeric) - Tracks cumulative payment collections
      - Default value: 0
      - Constraint: must be >= 0
      - Used to display collection progress and calculate remaining outstanding amount

  ## Notes
  - This field will be incremented each time a payment is recorded
  - The field enables progress tracking and motivational celebrations for the team
  - Outstanding balance can be calculated as: loan_amount - total_collected_amount
*/

-- Add total_collected_amount column to customer_cases table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_cases' AND column_name = 'total_collected_amount'
  ) THEN
    ALTER TABLE customer_cases 
    ADD COLUMN total_collected_amount numeric DEFAULT 0 CHECK (total_collected_amount >= 0);
  END IF;
END $$;

-- Create index for efficient querying of collected amounts
CREATE INDEX IF NOT EXISTS idx_customer_cases_collected_amount 
  ON customer_cases(total_collected_amount);

-- Add comment to document the field
COMMENT ON COLUMN customer_cases.total_collected_amount IS 
  'Cumulative total of all payments collected for this case. Updated when Payment Received is recorded.';