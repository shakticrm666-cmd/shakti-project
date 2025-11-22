/*
  # Fix Team Cascade Deletes and Foreign Key Constraints

  ## Overview
  This migration fixes foreign key constraints related to the teams table to ensure
  proper cascade behavior when a team is deleted.

  ## Changes Made

  ### 1. Teams Table Foreign Keys
  - **team_incharge_id**: Changed from CASCADE to RESTRICT
    - Prevents accidentally deleting a team incharge when their team is deleted
    - Team incharge must exist before their team can be deleted
    - Ensures data integrity for employee records

  ### 2. Customer Cases Table Foreign Keys
  - **team_id**: Changed from SET NULL to CASCADE
    - When a team is deleted, all associated customer cases are also deleted
    - This cascades to case_call_logs (which already has CASCADE on case_id)
    - Prevents orphaned cases in the database

  ### 3. Employees Table Foreign Keys
  - **team_id**: Remains SET NULL
    - When a team is deleted, telecallers are unassigned but remain in the system
    - Allows telecallers to be reassigned to other teams
    - Preserves employee records

  ### 4. Team Telecallers Junction Table
  - **team_id**: Remains CASCADE
    - Junction table records are automatically deleted when team is deleted
    - Already correctly configured

  ## Impact
  - Deleting a team will now:
    1. Delete all customer_cases assigned to that team
    2. Delete all case_call_logs for those cases (via CASCADE)
    3. Delete all team_telecallers junction records
    4. Set employees.team_id to NULL (unassign telecallers)
    5. Prevent deletion if it would orphan critical references

  ## Data Safety
  - No data loss from this migration (only changes constraints)
  - Existing data remains intact
  - Future deletions will be handled consistently by database
*/

-- ============================================================================
-- STEP 1: Drop existing foreign key constraints that need modification
-- ============================================================================

-- Drop teams.team_incharge_id foreign key (will recreate with RESTRICT)
ALTER TABLE teams
DROP CONSTRAINT IF EXISTS teams_team_incharge_id_fkey;

-- Drop customer_cases.team_id foreign key (will recreate with CASCADE)
ALTER TABLE customer_cases
DROP CONSTRAINT IF EXISTS customer_cases_team_id_fkey;

-- Drop employees.team_id foreign key (will recreate with SET NULL - same as before)
ALTER TABLE employees
DROP CONSTRAINT IF EXISTS employees_team_id_fkey;

-- ============================================================================
-- STEP 2: Recreate foreign key constraints with correct CASCADE behavior
-- ============================================================================

-- Recreate teams.team_incharge_id with RESTRICT
-- This prevents deleting a team incharge who is managing a team
ALTER TABLE teams
ADD CONSTRAINT teams_team_incharge_id_fkey
FOREIGN KEY (team_incharge_id)
REFERENCES employees(id)
ON DELETE RESTRICT;

-- Recreate customer_cases.team_id with CASCADE
-- This ensures all cases are deleted when a team is deleted
ALTER TABLE customer_cases
ADD CONSTRAINT customer_cases_team_id_fkey
FOREIGN KEY (team_id)
REFERENCES teams(id)
ON DELETE CASCADE;

-- Recreate employees.team_id with SET NULL
-- This unassigns telecallers when their team is deleted
ALTER TABLE employees
ADD CONSTRAINT employees_team_id_fkey
FOREIGN KEY (team_id)
REFERENCES teams(id)
ON DELETE SET NULL;

-- ============================================================================
-- STEP 3: Verify team_telecallers cascade is still in place
-- ============================================================================

-- Ensure team_telecallers.team_id has CASCADE (should already exist)
DO $$
BEGIN
  -- Drop if exists
  ALTER TABLE team_telecallers
  DROP CONSTRAINT IF EXISTS team_telecallers_team_id_fkey;

  -- Recreate with CASCADE
  ALTER TABLE team_telecallers
  ADD CONSTRAINT team_telecallers_team_id_fkey
  FOREIGN KEY (team_id)
  REFERENCES teams(id)
  ON DELETE CASCADE;
END $$;

-- ============================================================================
-- STEP 4: Add helpful comments to document the constraints
-- ============================================================================

COMMENT ON CONSTRAINT teams_team_incharge_id_fkey ON teams IS
'RESTRICT: Prevents deleting team incharge who manages active teams';

COMMENT ON CONSTRAINT customer_cases_team_id_fkey ON customer_cases IS
'CASCADE: Deletes all cases when team is deleted';

COMMENT ON CONSTRAINT employees_team_id_fkey ON employees IS
'SET NULL: Unassigns telecallers but preserves their records when team is deleted';

COMMENT ON CONSTRAINT team_telecallers_team_id_fkey ON team_telecallers IS
'CASCADE: Removes junction table entries when team is deleted';
