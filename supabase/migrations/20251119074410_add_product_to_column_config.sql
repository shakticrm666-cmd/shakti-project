/*
  # Add product_name column to column_configurations table

  1. Changes
    - Adds `product_name` column to `column_configurations` table
    - Sets default value to 'General' for existing records
    - Creates index for better query performance

  2. Notes
    - This allows different products to have their own column configurations
    - Existing configurations will be assigned to 'General' product
*/

ALTER TABLE column_configurations
ADD COLUMN IF NOT EXISTS product_name text NOT NULL DEFAULT 'General';

-- Update existing records to have a default product name
UPDATE column_configurations
SET product_name = 'General'
WHERE product_name IS NULL OR product_name = '';

-- Add index for product_name
CREATE INDEX IF NOT EXISTS idx_column_config_product ON column_configurations(product_name);

-- Drop and recreate the unique constraint to include product_name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'column_configurations_tenant_id_column_name_key'
  ) THEN
    ALTER TABLE column_configurations 
    DROP CONSTRAINT column_configurations_tenant_id_column_name_key;
  END IF;
END $$;

-- Add new unique constraint that includes product_name
ALTER TABLE column_configurations
ADD CONSTRAINT column_configurations_tenant_product_column_key 
UNIQUE (tenant_id, product_name, column_name);