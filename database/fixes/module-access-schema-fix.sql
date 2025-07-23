-- Complete schema fix for module_access table
-- This addresses the "create_enabled" column missing issue

-- First, let's see the current structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'module_access'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add create_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'module_access' AND column_name = 'create_enabled'
    ) THEN
        ALTER TABLE module_access ADD COLUMN create_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Add edit_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'module_access' AND column_name = 'edit_enabled'
    ) THEN
        ALTER TABLE module_access ADD COLUMN edit_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Add delete_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'module_access' AND column_name = 'delete_enabled'
    ) THEN
        ALTER TABLE module_access ADD COLUMN delete_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Add display_name column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'module_access' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE module_access ADD COLUMN display_name TEXT;
    END IF;
END $$;

-- Update existing records with sensible defaults
UPDATE module_access 
SET 
    create_enabled = COALESCE(create_enabled, true),
    edit_enabled = COALESCE(edit_enabled, true),
    delete_enabled = COALESCE(delete_enabled, true)
WHERE module_name IN ('orders', 'products', 'employees', 'vendors', 'licenses', 'sales', 'delivery');

-- For other modules, set more restrictive defaults
UPDATE module_access 
SET 
    create_enabled = COALESCE(create_enabled, false),
    edit_enabled = COALESCE(edit_enabled, false),
    delete_enabled = COALESCE(delete_enabled, false)
WHERE create_enabled IS NULL OR edit_enabled IS NULL OR delete_enabled IS NULL;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_module_access_user_id ON module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_module_access_module_name ON module_access(module_name);
CREATE INDEX IF NOT EXISTS idx_module_access_user_module ON module_access(user_id, module_name);
CREATE INDEX IF NOT EXISTS idx_module_access_create_enabled ON module_access(create_enabled);

-- Verify the fix
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'module_access'
ORDER BY ordinal_position;
