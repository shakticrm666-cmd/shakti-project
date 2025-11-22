/*
  # Add INSERT policy for super_admins table

  1. Changes
    - Add policy to allow inserting super admin records
    - This enables seeding and initial admin creation
*/

CREATE POLICY "Allow insert for super admins"
  ON super_admins
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
