/*
  # Create Teams Table

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, references tenants)
      - `name` (text, unique per tenant)
      - `team_incharge_id` (uuid, references employees)
      - `status` (active/inactive)
      - `created_at`, `updated_at`, `created_by` (timestamps)
  
  2. Changes
    - Add `team_id` column to employees table
    - Create index for team_id

  3. Security
    - Enable RLS on teams table
    - Add policies for anon access (custom authentication)
*/

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  team_incharge_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE(tenant_id, name)
);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id);

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read teams"
  ON teams FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert teams"
  ON teams FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update teams"
  ON teams FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anon delete teams"
  ON teams FOR DELETE
  TO anon
  USING (true);