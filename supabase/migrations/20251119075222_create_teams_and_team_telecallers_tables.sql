/*
  # Create Teams and Team Telecallers Tables

  ## Overview
  This migration creates the teams management tables for organizing telecallers
  into teams managed by team incharges in the loan recovery CRM system.

  ## New Tables

  ### 1. teams
  Stores team information with team incharge assignments
  - `id` (uuid, primary key) - Unique team identifier
  - `tenant_id` (uuid, foreign key) - Reference to tenant
  - `name` (text) - Team name
  - `team_incharge_id` (uuid, foreign key) - Reference to employee (team incharge)
  - `product_name` (text) - Product/loan type this team handles
  - `status` (text) - Team status: active, inactive
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid) - Creator reference

  ### 2. team_telecallers
  Junction table for many-to-many relationship between teams and telecallers
  - `id` (uuid, primary key) - Unique identifier
  - `team_id` (uuid, foreign key) - Reference to team
  - `telecaller_id` (uuid, foreign key) - Reference to employee (telecaller)
  - `assigned_by` (uuid) - Employee who made the assignment
  - `created_at` (timestamptz) - Assignment timestamp

  ## Security
  - Enable RLS on both tables
  - Add policies for anonymous access (custom auth system)

  ## Indexes
  - Performance indexes on foreign keys and frequently queried columns
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  team_incharge_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  product_name text NOT NULL DEFAULT 'General',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  
  UNIQUE(tenant_id, name)
);

-- Create team_telecallers junction table
CREATE TABLE IF NOT EXISTS team_telecallers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  telecaller_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(team_id, telecaller_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON teams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_incharge_id ON teams(team_incharge_id);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_product_name ON teams(product_name);

CREATE INDEX IF NOT EXISTS idx_team_telecallers_team_id ON team_telecallers(team_id);
CREATE INDEX IF NOT EXISTS idx_team_telecallers_telecaller_id ON team_telecallers(telecaller_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_telecallers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
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
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete teams"
  ON teams FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for team_telecallers
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
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete team_telecallers"
  ON team_telecallers FOR DELETE
  TO anon
  USING (true);
