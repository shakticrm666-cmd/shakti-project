-- Add product_name column to column_configurations table

ALTER TABLE column_configurations
ADD COLUMN product_name text NOT NULL DEFAULT 'General';

-- Update existing records to have a default product name
UPDATE column_configurations
SET product_name = 'General'
WHERE product_name = '';

-- Add index for product_name
CREATE INDEX IF NOT EXISTS idx_column_config_product ON column_configurations(product_name);

-- Update RLS policies if needed (assuming they remain the same)