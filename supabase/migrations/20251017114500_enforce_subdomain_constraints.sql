/*
  # Enforce Subdomain Constraints and Validation

  ## Overview
  This migration enhances the tenants table with stronger subdomain constraints and validation rules
  to ensure data integrity and uniqueness across all environments.

  ## Changes Made

  1. **Subdomain Constraints**
     - Add case-insensitive unique constraint on subdomain
     - Add check constraint to ensure subdomain format compliance
     - Add check constraint for subdomain length (3-63 characters)
     - Prevent null or empty subdomains

  2. **Indexes**
     - Create case-insensitive index for faster subdomain lookups
     - Add composite index for subdomain and status queries

  3. **Validation Function**
     - Create PL/pgSQL function to validate subdomain format
     - Check for reserved subdomain names
     - Ensure subdomain contains only allowed characters

  4. **Triggers**
     - Add trigger to validate subdomain before INSERT
     - Add trigger to validate subdomain before UPDATE
     - Add trigger to normalize subdomain to lowercase

  ## Security Notes
  - Subdomain uniqueness is enforced at database level
  - Reserved subdomains are blocked
  - Format validation prevents injection attacks
*/

-- Drop existing subdomain index if it exists
DROP INDEX IF EXISTS idx_tenants_subdomain;

-- Create case-insensitive unique index on subdomain
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdomain_lower
  ON tenants(LOWER(subdomain));

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain_status
  ON tenants(LOWER(subdomain), status);

-- Create function to validate subdomain format
CREATE OR REPLACE FUNCTION validate_subdomain_format(subdomain_value text)
RETURNS boolean AS $$
DECLARE
  reserved_subdomains text[] := ARRAY[
    'www', 'admin', 'superadmin', 'api', 'app', 'mail', 'smtp', 'ftp',
    'webmail', 'cpanel', 'whm', 'blog', 'forum', 'shop', 'store',
    'dashboard', 'portal', 'support', 'help', 'docs', 'status',
    'dev', 'staging', 'test', 'demo', 'sandbox', 'localhost',
    'ns1', 'ns2', 'dns', 'cdn', 'assets', 'static', 'media',
    'files', 'images'
  ];
BEGIN
  IF subdomain_value IS NULL OR LENGTH(TRIM(subdomain_value)) = 0 THEN
    RAISE EXCEPTION 'Subdomain cannot be empty';
  END IF;

  IF LENGTH(subdomain_value) < 3 THEN
    RAISE EXCEPTION 'Subdomain must be at least 3 characters long';
  END IF;

  IF LENGTH(subdomain_value) > 63 THEN
    RAISE EXCEPTION 'Subdomain must not exceed 63 characters';
  END IF;

  IF LOWER(subdomain_value) = ANY(reserved_subdomains) THEN
    RAISE EXCEPTION 'This subdomain is reserved and cannot be used';
  END IF;

  IF subdomain_value !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$' THEN
    RAISE EXCEPTION 'Subdomain can only contain lowercase letters, numbers, and hyphens (not at start/end)';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to normalize and validate subdomain
CREATE OR REPLACE FUNCTION normalize_and_validate_subdomain()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subdomain := LOWER(TRIM(NEW.subdomain));

  IF NOT validate_subdomain_format(NEW.subdomain) THEN
    RAISE EXCEPTION 'Invalid subdomain format';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_normalize_validate_subdomain_insert ON tenants;
DROP TRIGGER IF EXISTS trigger_normalize_validate_subdomain_update ON tenants;

-- Create triggers for subdomain validation
CREATE TRIGGER trigger_normalize_validate_subdomain_insert
  BEFORE INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION normalize_and_validate_subdomain();

CREATE TRIGGER trigger_normalize_validate_subdomain_update
  BEFORE UPDATE OF subdomain ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION normalize_and_validate_subdomain();

-- Add check constraints to tenants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_subdomain_not_empty'
    AND conrelid = 'tenants'::regclass
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT check_subdomain_not_empty
      CHECK (LENGTH(TRIM(subdomain)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_subdomain_length'
    AND conrelid = 'tenants'::regclass
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT check_subdomain_length
      CHECK (LENGTH(subdomain) >= 3 AND LENGTH(subdomain) <= 63);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_subdomain_format'
    AND conrelid = 'tenants'::regclass
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT check_subdomain_format
      CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$');
  END IF;
END $$;

-- Update existing subdomains to lowercase (if any)
UPDATE tenants SET subdomain = LOWER(subdomain) WHERE subdomain != LOWER(subdomain);
