/*
  # Add team_id column to employees table

  ## Overview
  This migration adds the team_id column to the employees table to support
  direct team assignment for telecallers. This allows each telecaller to be
  assigned to one team.

  ## Changes Made
  1. Add team_id column to employees table
     - Type: uuid (nullable)
     - Foreign key reference to teams(id)
     - ON DELETE SET NULL (when team is deleted, unassign telecaller)
  
  2. Create index on team_id for performance
     - Speeds up queries filtering by team assignment
  
  ## Security
  - No RLS changes needed (employees table already has RLS policies)
  
  ## Notes
  - Existing employees will have team_id = NULL (unassigned)
  - Team assignments can be updated through team management interface
*/

-- Add team_id column to employees table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE employees 
    ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id);

-- Add comment for documentation
COMMENT ON COLUMN employees.team_id IS 'Team assignment for telecallers - NULL means unassigned';
