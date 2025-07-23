-- Migration: Add create_enabled column to module_access table
-- This fixes the error: "Could not find the 'create_enabled' column of 'module_access' in the schema cache"

-- Add the missing create_enabled column if it doesn't exist
ALTER TABLE module_access 
ADD COLUMN IF NOT EXISTS create_enabled BOOLEAN DEFAULT false;

-- Add other missing columns that might be referenced
ALTER TABLE module_access 
ADD COLUMN IF NOT EXISTS edit_enabled BOOLEAN DEFAULT false;

ALTER TABLE module_access 
ADD COLUMN IF NOT EXISTS delete_enabled BOOLEAN DEFAULT false;

-- Ensure the table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_module_access_create_enabled ON module_access(create_enabled);
CREATE INDEX IF NOT EXISTS idx_module_access_user_module_create ON module_access(user_id, module_name, create_enabled);

-- Update existing records to have sensible defaults
UPDATE module_access 
SET create_enabled = true, edit_enabled = true, delete_enabled = true 
WHERE module_name IN ('orders', 'products', 'employees', 'vendors', 'licenses');

-- For other modules, set conservative defaults
UPDATE module_access 
SET create_enabled = false, edit_enabled = false, delete_enabled = false 
WHERE create_enabled IS NULL;

-- Ensure RLS is enabled
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'module_access' AND policyname = 'module_access_policy') THEN
        CREATE POLICY "module_access_policy" ON module_access
            FOR ALL USING (auth.uid() = user_id OR auth.uid() IN (
                SELECT user_id FROM module_access
                WHERE module_name = 'admin' AND access_level = 'admin' AND is_active = true
            ));
    END IF;
END $$;
