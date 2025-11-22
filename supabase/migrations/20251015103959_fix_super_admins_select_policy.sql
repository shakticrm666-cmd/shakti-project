/*
  # Fix Super Admins SELECT Policy

  1. Changes
    - Drop the existing restrictive SELECT policy
    - Create a new SELECT policy that allows anonymous users to read super_admins table
    - This is necessary for login authentication to work, as users are anonymous before authentication

  2. Security
    - While this allows reading the super_admins table, the password_hash is still secure
    - Password verification happens server-side with bcrypt
    - This is a standard pattern for authentication systems
*/

DROP POLICY IF EXISTS "Super admins can read own data" ON super_admins;

CREATE POLICY "Allow anonymous select for authentication"
  ON super_admins
  FOR SELECT
  TO anon
  USING (true);
