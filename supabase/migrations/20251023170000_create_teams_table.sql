-- Drop existing teams table if it exists
DROP TABLE IF EXISTS teams CASCADE;

-- Create teams table for team management
CREATE TABLE teams (
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

-- Add team_id to employees table (allowing multiple teams per telecaller)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for team_id
CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id);

-- Update updated_at trigger for teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- RLS policies for teams
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
