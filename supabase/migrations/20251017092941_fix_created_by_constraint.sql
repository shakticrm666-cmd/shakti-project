/*
  # Fix created_by Foreign Key Constraint
  
  ## Changes
  This migration fixes the foreign key constraint on the `created_by` field
  to prevent cascading issues when super admins are deleted.
  
  ## Details
  - Updates the foreign key constraint on `tenants.created_by` to SET NULL on delete
  - Updates the foreign key constraint on `company_admins.created_by` to SET NULL on delete
  
  ## Safety
  - This is a safe operation that only modifies constraints
  - Existing data is preserved
  - No data loss will occur
*/

-- Drop and recreate the foreign key constraint on tenants table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tenants_created_by_fkey'
    AND table_name = 'tenants'
  ) THEN
    ALTER TABLE tenants DROP CONSTRAINT tenants_created_by_fkey;
  END IF;
END $$;

ALTER TABLE tenants 
ADD CONSTRAINT tenants_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES super_admins(id) 
ON DELETE SET NULL;

-- Drop and recreate the foreign key constraint on company_admins table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'company_admins_created_by_fkey'
    AND table_name = 'company_admins'
  ) THEN
    ALTER TABLE company_admins DROP CONSTRAINT company_admins_created_by_fkey;
  END IF;
END $$;

ALTER TABLE company_admins 
ADD CONSTRAINT company_admins_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES super_admins(id) 
ON DELETE SET NULL;