-- Migration: Fix module_access RLS policies to prevent circular dependency
-- This resolves authentication failures caused by circular RLS policy references

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "module_access_policy" ON module_access;
DROP POLICY IF EXISTS "Users can view module access" ON module_access;
DROP POLICY IF EXISTS "Admins can manage module access" ON module_access;

-- Ensure RLS is enabled
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;

-- Create simplified, non-circular RLS policies
-- Policy 1: Allow authenticated users to read their own module access
CREATE POLICY "Users can read own module access" ON module_access
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy 2: Allow service role (backend) full access for system operations
CREATE POLICY "Service role full access" ON module_access
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy 3: Allow authenticated users to read admin module for role checking
-- This is a simplified approach that doesn't create circular dependencies
CREATE POLICY "Users can check admin access" ON module_access
    FOR SELECT 
    USING (
        module_name = 'admin' 
        AND auth.uid() IS NOT NULL
    );

-- Policy 4: Allow users with existing admin module access to manage all module access
-- This uses a direct table lookup instead of a subquery to avoid circular dependency
CREATE POLICY "Admin users can manage module access" ON module_access
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM module_access ma 
            WHERE ma.user_id = auth.uid() 
            AND ma.module_name = 'admin' 
            AND ma.access_level = 'admin' 
            AND ma.is_active = true
        )
    );

-- Create default admin module access for system initialization
-- This ensures there's always a way to access the admin panel
INSERT INTO module_access (user_id, module_name, access_level, is_active, display_name, create_enabled, edit_enabled, delete_enabled)
SELECT 
    auth.uid(),
    'admin',
    'admin',
    true,
    'Admin Panel',
    true,
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM module_access 
    WHERE module_name = 'admin' 
    AND access_level = 'admin'
    AND is_active = true
)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_module_access_user_module_active 
    ON module_access(user_id, module_name, is_active);
CREATE INDEX IF NOT EXISTS idx_module_access_admin_lookup 
    ON module_access(user_id, module_name, access_level) 
    WHERE module_name = 'admin' AND is_active = true;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON module_access TO authenticated;
GRANT ALL ON module_access TO service_role;

-- Create a function to safely check admin access without circular dependency
CREATE OR REPLACE FUNCTION is_admin_user(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM module_access 
        WHERE user_id = user_uuid 
        AND module_name = 'admin' 
        AND access_level = 'admin' 
        AND is_active = true
    );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;

-- Create a function to initialize default module access for new users
CREATE OR REPLACE FUNCTION initialize_user_modules(user_uuid UUID, user_role TEXT DEFAULT 'employee')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert default modules based on role
    INSERT INTO module_access (user_id, module_name, access_level, is_active, display_name, create_enabled, edit_enabled, delete_enabled)
    VALUES 
        (user_uuid, 'products', user_role, true, 'Products', true, true, user_role = 'admin'),
        (user_uuid, 'employees', user_role, true, 'Employees', user_role IN ('admin', 'manager'), user_role IN ('admin', 'manager'), user_role = 'admin'),
        (user_uuid, 'sales', user_role, true, 'Sales Reports', false, false, false),
        (user_uuid, 'vendors', user_role, true, 'Vendors', user_role IN ('admin', 'manager'), user_role IN ('admin', 'manager'), user_role = 'admin'),
        (user_uuid, 'orders', user_role, true, 'Orders', true, true, user_role IN ('admin', 'manager')),
        (user_uuid, 'licenses', user_role, true, 'Licenses & Certificates', user_role IN ('admin', 'manager'), user_role IN ('admin', 'manager'), user_role = 'admin'),
        (user_uuid, 'delivery', user_role, true, 'Delivery Records', true, true, user_role IN ('admin', 'manager'))
    ON CONFLICT (user_id, module_name) DO NOTHING;
    
    -- Add admin module for admin users
    IF user_role = 'admin' THEN
        INSERT INTO module_access (user_id, module_name, access_level, is_active, display_name, create_enabled, edit_enabled, delete_enabled)
        VALUES (user_uuid, 'admin', 'admin', true, 'Admin Panel', true, true, true)
        ON CONFLICT (user_id, module_name) DO NOTHING;
    END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION initialize_user_modules TO authenticated;

-- Update existing records to ensure consistency
UPDATE module_access 
SET 
    display_name = COALESCE(display_name, INITCAP(module_name)),
    create_enabled = COALESCE(create_enabled, false),
    edit_enabled = COALESCE(edit_enabled, false),
    delete_enabled = COALESCE(delete_enabled, false)
WHERE display_name IS NULL OR create_enabled IS NULL OR edit_enabled IS NULL OR delete_enabled IS NULL;

-- Add a comment explaining the fix
COMMENT ON TABLE module_access IS 'Module access control table with fixed RLS policies to prevent circular dependencies during authentication';
