# Database Setup Instructions

## Complete Database Recreation Guide for Multi-Tenant Loan Recovery System

This guide provides step-by-step instructions for setting up the complete database schema from scratch.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Database Schema](#database-schema)
4. [Setup Instructions](#setup-instructions)
5. [Customizing Superadmin Credentials](#customizing-superadmin-credentials)
6. [Verification Steps](#verification-steps)
7. [Post-Setup Tasks](#post-setup-tasks)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The `database_complete_setup.sql` file creates a complete multi-tenant loan recovery system with:

- **12 Tables**: All necessary tables for the application
- **50+ Indexes**: Optimized for performance
- **10 Triggers**: Automatic timestamp updates and validation
- **40+ RLS Policies**: Row-level security enabled
- **3 Utility Functions**: Helper functions for common operations
- **Default Superadmin**: Ready-to-use admin account

---

## ⚙️ Prerequisites

Before running the setup script, ensure you have:

1. **Supabase Project**: Active Supabase project
2. **Database Access**: Access to Supabase SQL Editor or `psql` client
3. **Permissions**: Sufficient permissions to create tables and functions
4. **Backup**: If running on existing database, backup your data first

---

## 📊 Database Schema

### Tables Created (12)

| # | Table Name | Description |
|---|------------|-------------|
| 1 | `super_admins` | Super administrator authentication |
| 2 | `tenants` | Multi-tenant company registry |
| 3 | `tenant_databases` | Database connection info per tenant |
| 4 | `company_admins` | Company administrator users |
| 5 | `tenant_migrations` | Migration tracking per tenant |
| 6 | `audit_logs` | System-wide audit trail |
| 7 | `employees` | Team incharge and telecaller employees |
| 8 | `teams` | Team management structure |
| 9 | `team_telecallers` | Team-telecaller relationships |
| 10 | `column_configurations` | Dynamic column settings |
| 11 | `customer_cases` | Loan recovery case management |
| 12 | `case_call_logs` | Call interaction history |

### Key Features

- **UUID Primary Keys**: All tables use UUID for better scalability
- **Timestamptz**: Timezone-aware timestamps for global operations
- **JSONB Fields**: Flexible storage for custom data
- **Foreign Key Constraints**: Data integrity enforcement
- **Check Constraints**: Input validation at database level
- **GIN Indexes**: Fast JSONB queries

---

## 🚀 Setup Instructions

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Create New Query**
   - Click "New Query"
   - Name it "Complete Database Setup"

3. **Copy SQL Script**
   - Open `database_complete_setup.sql`
   - Copy entire contents
   - Paste into SQL Editor

4. **Customize Credentials** (Optional)
   - Find Section 9: "DEFAULT SUPERADMIN ACCOUNT CREATION"
   - Update username and password if needed
   - See [Customizing Superadmin Credentials](#customizing-superadmin-credentials)

5. **Run the Script**
   - Click "Run" button
   - Wait for completion (should take 5-10 seconds)
   - Check for success messages

### Option 2: Using psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the setup script
\i /path/to/database_complete_setup.sql

# Or pipe it directly
psql "postgresql://..." < database_complete_setup.sql
```

### Option 3: Using Supabase CLI

```bash
# Make sure you're in the project directory
cd /path/to/project

# Run the migration
supabase db reset --db-url "postgresql://..."

# Or apply the SQL file
psql -h [host] -U postgres -d postgres -f database_complete_setup.sql
```

---

## 🔐 Customizing Superadmin Credentials

### Default Credentials

```
Username: superadmin
Password: SuperAdmin@123
```

### Changing Credentials

#### Method 1: Edit SQL File Before Running

1. Open `database_complete_setup.sql`
2. Find Section 9 (line ~870)
3. Replace the username:
   ```sql
   INSERT INTO super_admins (username, password_hash)
   VALUES (
     'your_username',  -- Change this
     crypt('YourPassword123', gen_salt('bf', 10))  -- Change password here
   )
   ```

#### Method 2: Generate New Password Hash

Run this in Supabase SQL Editor:

```sql
-- Generate hash for your password
SELECT crypt('YourNewPassword', gen_salt('bf', 10));
```

Copy the output and use it in the INSERT statement:

```sql
INSERT INTO super_admins (username, password_hash)
VALUES (
  'your_username',
  '$2a$10$...'  -- Paste the generated hash here
)
ON CONFLICT (username) DO NOTHING;
```

#### Method 3: Update After Setup

```sql
-- Update existing superadmin password
UPDATE super_admins
SET password_hash = crypt('NewPassword123', gen_salt('bf', 10))
WHERE username = 'superadmin';
```

---

## ✅ Verification Steps

### 1. Check Table Creation

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'super_admins', 'tenants', 'tenant_databases', 'company_admins',
    'tenant_migrations', 'audit_logs', 'employees', 'teams',
    'team_telecallers', 'column_configurations', 'customer_cases', 'case_call_logs'
  )
ORDER BY table_name;
```

Expected: 12 rows

### 2. Verify Superadmin Account

```sql
SELECT id, username, created_at
FROM super_admins
WHERE username = 'superadmin';
```

Expected: 1 row with your superadmin account

### 3. Check Indexes

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Expected: 50+ indexes

### 4. Verify RLS Policies

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: 40+ policies

### 5. Test Triggers

```sql
-- Insert a test tenant
INSERT INTO tenants (name, subdomain, created_by)
VALUES ('Test Company', 'testco', (SELECT id FROM super_admins LIMIT 1))
RETURNING id, created_at, updated_at;

-- Update it
UPDATE tenants SET name = 'Test Company Updated' WHERE subdomain = 'testco'
RETURNING updated_at;

-- Check that updated_at changed
-- Clean up
DELETE FROM tenants WHERE subdomain = 'testco';
```

---

## 📝 Post-Setup Tasks

### 1. Change Default Password

**CRITICAL**: Change the superadmin password immediately!

```sql
UPDATE super_admins
SET password_hash = crypt('YourStrongPassword123!', gen_salt('bf', 10))
WHERE username = 'superadmin';
```

### 2. Create Your First Tenant

```sql
INSERT INTO tenants (
  name,
  subdomain,
  proprietor_name,
  email,
  phone_number,
  plan,
  created_by
)
VALUES (
  'Your Company Name',
  'yourcompany',  -- Will be yourcompany.yourdomain.com
  'John Doe',
  'admin@yourcompany.com',
  '+1234567890',
  'premium',
  (SELECT id FROM super_admins WHERE username = 'superadmin')
)
RETURNING id, name, subdomain;
```

### 3. Create Company Admin

```sql
-- Get tenant_id from previous step
INSERT INTO company_admins (
  tenant_id,
  name,
  employee_id,
  email,
  password_hash,
  created_by
)
VALUES (
  'your-tenant-id-here',
  'Admin User',
  'ADMIN001',
  'admin@yourcompany.com',
  crypt('AdminPassword123', gen_salt('bf', 10)),
  (SELECT id FROM super_admins WHERE username = 'superadmin')
)
RETURNING id, name, email;
```

### 4. Set Up Column Configurations

```sql
-- Initialize default columns for a product
INSERT INTO column_configurations (
  tenant_id,
  product_name,
  column_name,
  display_name,
  is_active,
  is_custom,
  column_order,
  data_type
)
VALUES
  ('your-tenant-id', 'Personal Loan', 'customerName', 'Customer Name', true, false, 1, 'text'),
  ('your-tenant-id', 'Personal Loan', 'loanId', 'Loan ID', true, false, 2, 'text'),
  ('your-tenant-id', 'Personal Loan', 'mobileNo', 'Mobile Number', true, false, 3, 'phone'),
  ('your-tenant-id', 'Personal Loan', 'dpd', 'Days Past Due', true, false, 4, 'number'),
  ('your-tenant-id', 'Personal Loan', 'outstandingAmount', 'Outstanding', true, false, 5, 'currency');
```

### 5. Create Employees and Teams

```sql
-- Create a Team Incharge
INSERT INTO employees (
  tenant_id,
  name,
  mobile,
  emp_id,
  password_hash,
  role,
  created_by
)
VALUES (
  'your-tenant-id',
  'Team Lead Name',
  '1234567890',
  'TL001',
  crypt('TeamLead123', gen_salt('bf', 10)),
  'TeamIncharge',
  'your-company-admin-id'
)
RETURNING id, name, emp_id;

-- Create a Team
INSERT INTO teams (
  tenant_id,
  name,
  team_incharge_id,
  product_name
)
VALUES (
  'your-tenant-id',
  'Personal Loan Team',
  'team-incharge-id-from-above',
  'Personal Loan'
)
RETURNING id, name;
```

---

## 🔧 Troubleshooting

### Error: Extension "uuid-ossp" does not exist

**Solution**: Ensure you have permissions to create extensions. In Supabase, this should be available by default.

```sql
-- Try creating manually
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: Extension "pgcrypto" does not exist

**Solution**: Same as above, pgcrypto should be available.

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Error: Permission denied

**Solution**: You need superuser or appropriate permissions. In Supabase, use the postgres role.

### Error: Relation already exists

**Solution**: The script includes `DROP TABLE IF EXISTS`. If you want to preserve data, backup first:

```bash
# Backup existing database
pg_dump [connection-string] > backup.sql

# Then run the setup script
```

### Subdomain Validation Fails

**Solution**: Subdomains must:
- Be 3-63 characters long
- Start and end with alphanumeric characters
- Only contain lowercase letters, numbers, and hyphens
- Not be in reserved list (www, admin, api, etc.)

### Password Authentication Fails

**Solution**: Ensure you're using bcrypt hashed passwords:

```sql
-- Generate new hash
SELECT crypt('your_password', gen_salt('bf', 10));
```

### RLS Policies Not Working

**Solution**: The script enables RLS and creates anon policies for custom auth. Verify:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;

-- Should return no rows (or empty)
```

---

## 📚 Additional Resources

### Generate Password Hash

```sql
-- Use this query to generate password hashes
SELECT crypt('YourPassword', gen_salt('bf', 10)) AS password_hash;
```

### Verify Password

```sql
-- Test if password matches hash
SELECT (
  password_hash = crypt('TestPassword', password_hash)
) AS password_matches
FROM super_admins
WHERE username = 'superadmin';
```

### List All Tables with Row Counts

```sql
SELECT
  schemaname,
  tablename,
  (
    SELECT COUNT(*)
    FROM pg_catalog.pg_class c
    WHERE c.relname = tablename
  ) AS row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Export Database Schema

```bash
# Export only schema (no data)
pg_dump -s [connection-string] > schema_only.sql

# Export specific table
pg_dump -t super_admins [connection-string] > super_admins.sql
```

---

## 🆘 Support

If you encounter issues:

1. Check the verification steps above
2. Review error messages carefully
3. Ensure you have proper permissions
4. Check Supabase project logs
5. Refer to project documentation

---

## 🔒 Security Best Practices

1. **Change Default Password**: Always change the default superadmin password
2. **Use Strong Passwords**: Minimum 12 characters, mix of letters, numbers, symbols
3. **Rotate Credentials**: Regularly update passwords
4. **Limit Access**: Grant minimum necessary permissions
5. **Audit Logs**: Regularly review audit_logs table
6. **Backup Regularly**: Maintain regular database backups
7. **Monitor Health**: Check tenant_databases.status regularly

---

## 📄 License

This database schema is part of the Multi-Tenant Loan Recovery System project.

---

**Last Updated**: 2024
**Version**: 1.0.0
**Maintainer**: Development Team
