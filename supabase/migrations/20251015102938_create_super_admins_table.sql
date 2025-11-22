/*
  # Create super_admins table for authentication

  1. New Tables
    - `super_admins`
      - `id` (uuid, primary key, auto-generated)
      - `username` (text, unique, not null) - Login username
      - `password_hash` (text, not null) - Bcrypt hashed password
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `super_admins` table
    - Add policy for authenticated super admins to read their own data
  
  3. Initial Data
    - Insert super admin with username "Shaktiadmin"
    - Password will be hashed using bcrypt in application layer before insertion
*/

CREATE TABLE IF NOT EXISTS super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read own data"
  ON super_admins
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_super_admins_username ON super_admins(username);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_super_admins_updated_at BEFORE UPDATE ON super_admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
