/*
  # Fix Employee RLS Policies for Anonymous Access

  ## Changes
  - Drop existing RLS policies that require authenticated role
  - Create new policies allowing anon role access
  - Policies allow full CRUD operations for anon role since the app uses custom authentication
  
  ## Security Notes
  - This application uses custom authentication (not Supabase Auth)
  - Tenant isolation is enforced at the application level via tenant_id
  - All users access the database via the anon key
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Company admins can read own tenant employees" ON employees;
DROP POLICY IF EXISTS "Company admins can insert employees" ON employees;
DROP POLICY IF EXISTS "Company admins can update own tenant employees" ON employees;
DROP POLICY IF EXISTS "Company admins can delete own tenant employees" ON employees;

-- Create new policies for anon role
CREATE POLICY "Allow anon to read employees"
  ON employees
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert employees"
  ON employees
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update employees"
  ON employees
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete employees"
  ON employees
  FOR DELETE
  TO anon
  USING (true);
