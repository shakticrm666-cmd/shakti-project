/*
  ===============================================================================
  SEED DATA INSERT STATEMENTS
  ===============================================================================

  This SQL file contains INSERT statements to recreate all existing data
  from the database. Execute these statements AFTER creating the schema
  using complete_database_schema.sql

  EXISTING DATA FOUND:
  - super_admins: 1 record
  - tenants: 1 record
  - tenant_databases: 0 records
  - company_admins: 0 records
  - tenant_migrations: 0 records
  - audit_logs: 0 records
  - employees: 0 records
  - column_configurations: 0 records
  - customer_cases: 0 records
  - case_call_logs: 0 records

  EXECUTION ORDER:
  1. First run complete_database_schema.sql to create tables
  2. Then run this file to insert existing data

  ===============================================================================
*/

-- ===============================================================================
-- SECTION 1: SUPER ADMINS DATA
-- ===============================================================================

-- Insert super admin record
-- Username: Shaktiadmin
-- Note: Password hash is already encrypted with bcrypt
INSERT INTO super_admins (id, username, password_hash, created_at, updated_at)
VALUES (
  '52a23756-8328-4a0b-95fb-df39fd90f61a',
  'Shaktiadmin',
  '$2a$10$jgpYSAX/9U5P40gusnPSJuJJtWgvtlbgrd74lE9J8Xti2X0J9MJxm',
  '2025-10-15 10:32:00.819797+00',
  '2025-10-15 10:35:28.230847+00'
)
ON CONFLICT (id) DO NOTHING;

-- ===============================================================================
-- SECTION 2: TENANTS DATA
-- ===============================================================================

-- Insert tenant record
-- Company: Yanavi infotech
-- Subdomain: yanavi
INSERT INTO tenants (
  id,
  name,
  subdomain,
  status,
  proprietor_name,
  phone_number,
  email,
  address,
  gst_number,
  pan_number,
  city,
  state,
  pincode,
  plan,
  max_users,
  max_connections,
  settings,
  created_at,
  updated_at,
  created_by
)
VALUES (
  '2e64a0d0-dd47-4c61-8c4d-373b36459a0a',
  'Yanavi infotech',
  'yanavi',
  'active',
  'naveen',
  '9986155669',
  NULL,
  'dasarahalli',
  '22NOTHING IS IMPOSSIBEL',
  NULL,
  NULL,
  NULL,
  NULL,
  'basic',
  10,
  5,
  '{"branding": {}, "features": {"sms": false, "voip": true, "analytics": true, "apiAccess": false}}'::jsonb,
  '2025-10-17 11:48:01.297887+00',
  '2025-10-17 11:48:01.297887+00',
  '52a23756-8328-4a0b-95fb-df39fd90f61a'
)
ON CONFLICT (id) DO NOTHING;

-- ===============================================================================
-- SECTION 3: TENANT DATABASES DATA
-- ===============================================================================

-- No records found in tenant_databases table

-- ===============================================================================
-- SECTION 4: COMPANY ADMINS DATA
-- ===============================================================================

-- No records found in company_admins table

-- ===============================================================================
-- SECTION 5: TENANT MIGRATIONS DATA
-- ===============================================================================

-- No records found in tenant_migrations table

-- ===============================================================================
-- SECTION 6: AUDIT LOGS DATA
-- ===============================================================================

-- No records found in audit_logs table

-- ===============================================================================
-- SECTION 7: EMPLOYEES DATA
-- ===============================================================================

-- No records found in employees table

-- ===============================================================================
-- SECTION 8: COLUMN CONFIGURATIONS DATA
-- ===============================================================================

-- No records found in column_configurations table

-- ===============================================================================
-- SECTION 9: CUSTOMER CASES DATA
-- ===============================================================================

-- No records found in customer_cases table

-- ===============================================================================
-- SECTION 10: CASE CALL LOGS DATA
-- ===============================================================================

-- No records found in case_call_logs table

-- ===============================================================================
-- VERIFICATION QUERIES
-- ===============================================================================

-- Run these queries to verify data was inserted correctly:

-- Check super_admins count
SELECT COUNT(*) as super_admins_count FROM super_admins;

-- Check tenants count
SELECT COUNT(*) as tenants_count FROM tenants;

-- Check all relationships are valid
SELECT
  t.name as tenant_name,
  t.subdomain,
  sa.username as created_by_admin
FROM tenants t
LEFT JOIN super_admins sa ON t.created_by = sa.id;

-- ===============================================================================
-- SUCCESS MESSAGE
-- ===============================================================================

DO $$
BEGIN
  RAISE NOTICE '===============================================================================';
  RAISE NOTICE 'SEED DATA INSERTED SUCCESSFULLY!';
  RAISE NOTICE '===============================================================================';
  RAISE NOTICE 'Records inserted:';
  RAISE NOTICE '- super_admins: 1 record';
  RAISE NOTICE '- tenants: 1 record';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '1. Log in with username: Shaktiadmin';
  RAISE NOTICE '2. Access tenant: yanavi.yourdomain.com';
  RAISE NOTICE '3. Create company admins for the tenant';
  RAISE NOTICE '4. Add employees and manage cases';
  RAISE NOTICE '===============================================================================';
END $$;
