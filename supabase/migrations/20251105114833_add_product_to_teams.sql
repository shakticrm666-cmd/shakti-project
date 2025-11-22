/*
  # Add Product Name to Teams

  1. Changes
    - Add `product_name` column to teams table
    - Set default value 'General' for all existing teams
    - Create index for product_name

  2. Purpose
    - Associate teams with specific products
    - Enable product-based team filtering
*/

ALTER TABLE teams
ADD COLUMN IF NOT EXISTS product_name text NOT NULL DEFAULT 'General';

UPDATE teams
SET product_name = 'General'
WHERE product_name = '' OR product_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_teams_product ON teams(product_name);