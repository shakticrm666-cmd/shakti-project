/*
  # Add Product Name to Column Configurations

  1. Changes
    - Add `product_name` column to column_configurations table
    - Set default value 'General' for all existing records
    - Create index for product_name

  2. Purpose
    - Enable product-specific column configurations
    - Support multiple products per tenant
*/

ALTER TABLE column_configurations
ADD COLUMN IF NOT EXISTS product_name text NOT NULL DEFAULT 'General';

UPDATE column_configurations
SET product_name = 'General'
WHERE product_name = '' OR product_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_column_config_product ON column_configurations(product_name);