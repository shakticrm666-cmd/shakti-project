-- Fix unique constraint for column_configurations to include product_name
-- This resolves 409 conflicts when saving configurations for different products

-- Drop the old unique constraint
ALTER TABLE column_configurations DROP CONSTRAINT IF EXISTS column_configurations_tenant_id_column_name_key;

-- Add the new unique constraint including product_name
ALTER TABLE column_configurations ADD CONSTRAINT column_configurations_tenant_product_column_unique UNIQUE (tenant_id, product_name, column_name);

-- Update the index to include product_name for better performance
DROP INDEX IF EXISTS idx_column_config_tenant;
CREATE INDEX idx_column_config_tenant_product ON column_configurations(tenant_id, product_name);