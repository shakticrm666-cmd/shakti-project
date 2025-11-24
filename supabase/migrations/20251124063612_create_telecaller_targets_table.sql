/*
  # Create Telecaller Targets Table

  ## Summary
  Creates a new table to manage performance targets for telecallers, tracking both
  call quantity and collection amount targets on daily, weekly, and monthly basis.

  ## Changes
  1. New Table: telecaller_targets
    - `id` (uuid, primary key) - Unique identifier
    - `telecaller_id` (uuid, unique) - Reference to employees table
    - `daily_calls_target` (integer) - Daily call target
    - `weekly_calls_target` (integer) - Weekly call target
    - `monthly_calls_target` (integer) - Monthly call target
    - `daily_collections_target` (numeric) - Daily collection amount target
    - `weekly_collections_target` (numeric) - Weekly collection amount target
    - `monthly_collections_target` (numeric) - Monthly collection amount target
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  2. Indexes
    - Primary key on id
    - Unique index on telecaller_id
    - Index on telecaller_id for fast lookups

  3. Triggers
    - Auto-update updated_at timestamp on record updates

  4. Security
    - RLS enabled
    - Policies for anon access (custom authentication)

  ## Notes
  - One telecaller can have only one target record (enforced by UNIQUE constraint)
  - All target values default to 0 and must be >= 0
  - Targets are set by Team Incharge or Company Admin
  - Telecallers can view their own targets
*/

-- Create telecaller_targets table
CREATE TABLE IF NOT EXISTS telecaller_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telecaller_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  daily_calls_target integer DEFAULT 0 CHECK (daily_calls_target >= 0),
  weekly_calls_target integer DEFAULT 0 CHECK (weekly_calls_target >= 0),
  monthly_calls_target integer DEFAULT 0 CHECK (monthly_calls_target >= 0),
  daily_collections_target numeric DEFAULT 0 CHECK (daily_collections_target >= 0),
  weekly_collections_target numeric DEFAULT 0 CHECK (weekly_collections_target >= 0),
  monthly_collections_target numeric DEFAULT 0 CHECK (monthly_collections_target >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE telecaller_targets IS 'Performance targets for telecallers (calls and collections)';
COMMENT ON COLUMN telecaller_targets.telecaller_id IS 'Reference to employee with Telecaller role';
COMMENT ON COLUMN telecaller_targets.daily_calls_target IS 'Target number of calls per day';
COMMENT ON COLUMN telecaller_targets.weekly_calls_target IS 'Target number of calls per week';
COMMENT ON COLUMN telecaller_targets.monthly_calls_target IS 'Target number of calls per month';
COMMENT ON COLUMN telecaller_targets.daily_collections_target IS 'Target collection amount per day';
COMMENT ON COLUMN telecaller_targets.weekly_collections_target IS 'Target collection amount per week';
COMMENT ON COLUMN telecaller_targets.monthly_collections_target IS 'Target collection amount per month';

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_telecaller_targets_telecaller_id
  ON telecaller_targets(telecaller_id);

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_telecaller_targets_updated_at
  BEFORE UPDATE ON telecaller_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE telecaller_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom authentication (anon access)
CREATE POLICY "Allow anon read telecaller targets"
  ON telecaller_targets FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert telecaller targets"
  ON telecaller_targets FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update telecaller targets"
  ON telecaller_targets FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete telecaller targets"
  ON telecaller_targets FOR DELETE
  TO anon
  USING (true);
