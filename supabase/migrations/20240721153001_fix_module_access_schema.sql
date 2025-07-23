-- Migration: Fix module_access table schema to match React context expectations
-- This resolves the error: "Could not find the 'create_enabled' column of 'module_access' in the schema cache"

-- Add missing columns that the React context expects
ALTER TABLE module_access 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

ALTER TABLE module_access 
ADD COLUMN IF NOT EXISTS create_enabled BOOLEAN DEFAULT false;

ALTER TABLE IF EXISTS module_access 
ADD COLUMN IF NOT EXISTS edit_enabled BOOLEAN DEFAULT false;

ALTER TABLE IF NOT EXISTS module_access 
ADD COLUMN IF NOT EXISTS delete_enabled BOOLEAN DEFAULT false;

-- Update existing records to have sensible defaults based on module_name
UPDATE module_access 
SET 
    display_name = CASE 
        WHEN module_name = 'products' THEN 'Products'
        WHEN module_name = 'employees' THEN 'Employees'
        WHEN module_name = 'sales' THEN 'Sales Reports'
        WHEN module_name = 'vendors' THEN 'Vendors'
        WHEN module_name = 'orders' THEN 'Orders'
        WHEN module_name = 'licenses' THEN 'Licenses & Certificates'
        WHEN module_name = 'salary' THEN 'Salary Records'
        WHEN module_name = 'delivery' THEN 'Delivery Records'
        WHEN module_name = 'admin' THEN 'Admin Panel'
        ELSE INITCAP(module_name)
    END,
    create_enabled = true,
    edit_enabled = true,
    delete_enabled = true
WHERE display_name IS NULL;

-- For any remaining records, set conservative defaults
UPDATE module_access 
SET 
    create_enabled = COALESCE(create_enabled, false),
    edit_enabled = COALESCE(edit_enabled, false),
    delete_enabled = COALESCE(delete_enabled, false),
    display_name = COALESCE(display_name, INITCAP(module_name))
WHERE create_enabled IS NULL OR edit_enabled IS NULL OR delete_enabled IS NULL OR display_name IS NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_module_access_create_enabled ON module_access(create_enabled);
CREATE INDEX IF NOT EXISTS idx_module_access_edit_enabled ON module_access(edit_enabled);
CREATE INDEX IF NOT EXISTS idx_module_access_delete_enabled ON module_access(delete_enabled);
CREATE INDEX IF NOT EXISTS idx_module_access_module_name ON module_access(module_name);

-- Ensure the id column is properly configured for the React context
-- The React context expects id to be a number, but we have UUID
-- We'll create a view to map UUID to integer for backward compatibility
CREATE OR REPLACE VIEW module_access_view AS
SELECT 
    row_number() OVER (ORDER BY created_at) as id,
    module_name,
    display_name,
    create_enabled,
    edit_enabled,
    delete_enabled,
    created_at,
    updated_at
FROM module_access
WHERE is_active = true;

-- Grant necessary permissions
GRANT SELECT ON module_access_view TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON module_access TO authenticated;

-- Update RLS policies to work with the new structure
DROP POLICY IF EXISTS "module_access_policy" ON module_access;

CREATE POLICY IF NOT EXISTS "Users can view module access" ON module_access FOR SELECT 
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

CREATE POLICY IF NOT EXISTS "Admins can manage module access" ON module_access FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);
