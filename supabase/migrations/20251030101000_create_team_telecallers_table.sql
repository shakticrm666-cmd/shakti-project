-- Migration to create team_telecallers table if it doesn't exist

-- Table to manage telecaller-team relationships
CREATE TABLE IF NOT EXISTS team_telecallers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  telecaller_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(team_id, telecaller_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_team_telecallers_team ON team_telecallers(team_id);
CREATE INDEX IF NOT EXISTS idx_team_telecallers_telecaller ON team_telecallers(telecaller_id);

-- RLS
ALTER TABLE team_telecallers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read team_telecallers"
  ON team_telecallers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert team_telecallers"
  ON team_telecallers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update team_telecallers"
  ON team_telecallers FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anon delete team_telecallers"
  ON team_telecallers FOR DELETE
  TO anon
  USING (true);