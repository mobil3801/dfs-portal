-- Quick fix for missing create_enabled column in module_access table
-- Run this SQL directly in your Supabase SQL editor

-- Add the missing columns
ALTER TABLE module_access 
ADD COLUMN IF NOT EXISTS create_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edit_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delete_enabled BOOLEAN DEFAULT false;

-- Update existing records for core modules
UPDATE module_access 
SET 
    create_enabled = true,
    edit_enabled = true,
    delete_enabled = true 
WHERE module_name IN ('orders', 'products', 'employees', 'vendors', 'licenses', 'sales', 'delivery');

-- For other modules, set conservative defaults
UPDATE module_access 
SET 
    create_enabled = false,
    edit_enabled = false,
    delete_enabled = false 
WHERE create_enabled IS NULL OR edit_enabled IS NULL OR delete_enabled IS NULL;

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_module_access_create_enabled ON module_access(create_enabled);
CREATE INDEX IF NOT EXISTS idx_module_access_user_module ON module_access(user_id, module_name);

-- Verify the fix
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'module_access'
ORDER BY ordinal_position;
