-- Add product_name column to teams table
-- This allows teams to be associated with specific products for column configurations

ALTER TABLE teams
ADD COLUMN product_name text NOT NULL DEFAULT 'General';

-- Update existing teams to have 'General' as default product
UPDATE teams
SET product_name = 'General'
WHERE product_name = '' OR product_name IS NULL;

-- Add index for product_name on teams table
CREATE INDEX IF NOT EXISTS idx_teams_product ON teams(product_name);

-- Update unique constraint to include product_name if needed
-- Note: teams already have a unique constraint on (tenant_id, name)
-- If we want teams to be unique per product, we can add that later