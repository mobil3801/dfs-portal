-- ============================================================================
-- SUPABASE ROLES MANAGEMENT SCHEMA
-- ============================================================================
-- This schema creates a dedicated roles table and supporting structures
-- for comprehensive role-based access control (RBAC)
-- ============================================================================

-- Create enum for user roles (if not exists)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for permission actions
DO $$ BEGIN
    CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'execute', 'manage');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for resource types
DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('users', 'roles', 'reports', 'settings', 'audit_logs', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ROLES DEFINITION TABLE
-- ============================================================================
-- Defines available roles with metadata and default permissions
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name user_role NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false, -- System roles cannot be deleted
    is_active BOOLEAN DEFAULT true,
    hierarchy_level INTEGER DEFAULT 0, -- Higher numbers = more permissions (admin=100, manager=75, employee=50, viewer=25)
    default_permissions JSONB DEFAULT '{}', -- Default permissions for this role
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by INTEGER,
    updated_by INTEGER
);

-- ============================================================================
-- ROLE PERMISSIONS TABLE
-- ============================================================================
-- Defines specific permissions for each role
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id SERIAL PRIMARY KEY,
    role_name user_role NOT NULL REFERENCES public.roles(name) ON UPDATE CASCADE ON DELETE CASCADE,
    resource resource_type NOT NULL,
    action permission_action NOT NULL,
    granted BOOLEAN DEFAULT true,
    conditions JSONB DEFAULT '{}', -- Additional conditions for permission (e.g., own records only)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Unique constraint to prevent duplicate permissions
    UNIQUE(role_name, resource, action)
);

-- ============================================================================
-- USER ROLE ASSIGNMENTS TABLE
-- ============================================================================
-- Tracks role assignments with history and metadata
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- References user_profiles.user_id
    role_name user_role NOT NULL REFERENCES public.roles(name) ON UPDATE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    assigned_by INTEGER, -- User ID who assigned the role
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional role expiration
    is_active BOOLEAN DEFAULT true,
    reason TEXT, -- Reason for assignment
    metadata JSONB DEFAULT '{}', -- Additional assignment metadata
    
    -- Ensure one active role per user (can be extended for multiple roles later)
    UNIQUE(user_id, role_name) WHERE is_active = true
);

-- ============================================================================
-- ROLE AUDIT LOG TABLE
-- ============================================================================
-- Tracks all role changes for audit purposes
CREATE TABLE IF NOT EXISTS public.role_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    old_role user_role,
    new_role user_role,
    changed_by INTEGER,
    change_reason TEXT,
    change_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql'; -- PostgreSQL procedural language

-- Function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log when user_profiles.role changes
    IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO public.role_audit_log (user_id, old_role, new_role, change_timestamp, metadata)
        VALUES (
            NEW.user_id,
            OLD.role::user_role,
            NEW.role::user_role,
            timezone('utc'::text, now()),
            jsonb_build_object(
                'table', 'user_profiles',
                'trigger', 'update',
                'old_data', row_to_json(OLD),
                'new_data', row_to_json(NEW)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql'; -- PostgreSQL procedural language

-- Function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id INTEGER)
RETURNS TABLE(resource resource_type, action permission_action, granted BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT rp.resource, rp.action, rp.granted
    FROM public.user_profiles up
    JOIN public.role_permissions rp ON up.role::user_role = rp.role_name
    WHERE up.user_id = p_user_id AND up.is_active = true;
END;
$$ language 'plpgsql'; -- PostgreSQL procedural language

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id INTEGER, p_resource resource_type, p_action permission_action)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.get_user_permissions(p_user_id) gup
        WHERE gup.resource = p_resource AND gup.action = p_action AND gup.granted = true
    );
END;
$$ language 'plpgsql'; -- PostgreSQL procedural language

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp triggers
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_role_permissions_updated_at ON public.role_permissions;
CREATE TRIGGER update_role_permissions_updated_at
    BEFORE UPDATE ON public.role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Role change audit trigger (assumes user_profiles table exists)
DROP TRIGGER IF EXISTS user_profiles_role_change_audit ON public.user_profiles;
CREATE TRIGGER user_profiles_role_change_audit
    AFTER UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_role_change();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
CREATE POLICY "Allow read access to all authenticated users" ON public.roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin users to manage roles" ON public.roles
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = (current_setting('request.jwt.claims'::text)::json ->> 'sub')::integer 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- RLS Policies for role_permissions table
CREATE POLICY "Allow read access to all authenticated users" ON public.role_permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin users to manage permissions" ON public.role_permissions
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = (current_setting('request.jwt.claims'::text)::json ->> 'sub')::integer 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- RLS Policies for user_role_assignments table
CREATE POLICY "Allow users to see their own assignments" ON public.user_role_assignments
    FOR SELECT TO authenticated USING (
        user_id = (current_setting('request.jwt.claims'::text)::json ->> 'sub')::integer
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = (current_setting('request.jwt.claims'::text)::json ->> 'sub')::integer 
            AND role IN ('admin', 'manager') 
            AND is_active = true
        )
    );

CREATE POLICY "Allow admin users to manage assignments" ON public.user_role_assignments
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = (current_setting('request.jwt.claims'::text)::json ->> 'sub')::integer 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- RLS Policies for role_audit_log table
CREATE POLICY "Allow admin and manager users to view audit logs" ON public.role_audit_log
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = (current_setting('request.jwt.claims'::text)::json ->> 'sub')::integer 
            AND role IN ('admin', 'manager') 
            AND is_active = true
        )
    );

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default roles
INSERT INTO public.roles (name, display_name, description, is_system_role, hierarchy_level) VALUES
    ('admin', 'Administrator', 'Full system access with all permissions', true, 100),
    ('manager', 'Manager', 'Management access with elevated permissions', true, 75),
    ('employee', 'Employee', 'Standard user access with basic permissions', true, 50),
    ('viewer', 'Viewer', 'Read-only access to system data', true, 25)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    hierarchy_level = EXCLUDED.hierarchy_level,
    updated_at = timezone('utc'::text, now());

-- Insert default permissions for admin role
INSERT INTO public.role_permissions (role_name, resource, action, granted) VALUES
    ('admin', 'users', 'create', true),
    ('admin', 'users', 'read', true),
    ('admin', 'users', 'update', true),
    ('admin', 'users', 'delete', true),
    ('admin', 'roles', 'create', true),
    ('admin', 'roles', 'read', true),
    ('admin', 'roles', 'update', true),
    ('admin', 'roles', 'delete', true),
    ('admin', 'reports', 'create', true),
    ('admin', 'reports', 'read', true),
    ('admin', 'reports', 'update', true),
    ('admin', 'reports', 'delete', true),
    ('admin', 'settings', 'read', true),
    ('admin', 'settings', 'update', true),
    ('admin', 'audit_logs', 'read', true),
    ('admin', 'system', 'manage', true)
ON CONFLICT (role_name, resource, action) DO UPDATE SET
    granted = EXCLUDED.granted,
    updated_at = timezone('utc'::text, now());

-- Insert default permissions for manager role
INSERT INTO public.role_permissions (role_name, resource, action, granted) VALUES
    ('manager', 'users', 'read', true),
    ('manager', 'users', 'update', true),
    ('manager', 'reports', 'create', true),
    ('manager', 'reports', 'read', true),
    ('manager', 'reports', 'update', true),
    ('manager', 'settings', 'read', true),
    ('manager', 'audit_logs', 'read', true)
ON CONFLICT (role_name, resource, action) DO UPDATE SET
    granted = EXCLUDED.granted,
    updated_at = timezone('utc'::text, now());

-- Insert default permissions for employee role
INSERT INTO public.role_permissions (role_name, resource, action, granted) VALUES
    ('employee', 'users', 'read', true),
    ('employee', 'reports', 'read', true),
    ('employee', 'reports', 'create', true)
ON CONFLICT (role_name, resource, action) DO UPDATE SET
    granted = EXCLUDED.granted,
    updated_at = timezone('utc'::text, now());

-- Insert default permissions for viewer role
INSERT INTO public.role_permissions (role_name, resource, action, granted) VALUES
    ('viewer', 'users', 'read', true),
    ('viewer', 'reports', 'read', true)
ON CONFLICT (role_name, resource, action) DO UPDATE SET
    granted = EXCLUDED.granted,
    updated_at = timezone('utc'::text, now());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.roles IS 'Defines available system roles with metadata and permissions';
COMMENT ON TABLE public.role_permissions IS 'Defines specific permissions for each role and resource combination';
COMMENT ON TABLE public.user_role_assignments IS 'Tracks role assignments with history and expiration support';
COMMENT ON TABLE public.role_audit_log IS 'Audit trail for all role changes in the system';

COMMENT ON FUNCTION public.get_user_permissions(INTEGER) IS 'Returns all permissions for a given user based on their role';
COMMENT ON FUNCTION public.user_has_permission(INTEGER, resource_type, permission_action) IS 'Checks if a user has a specific permission';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON public.user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_name ON public.user_role_assignments(role_name);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active ON public.user_role_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_name ON public.role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource_action ON public.role_permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_user_id ON public.role_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_timestamp ON public.role_audit_log(change_timestamp);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SUPABASE ROLES MANAGEMENT SCHEMA INSTALLATION COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  - public.roles (role definitions)';
    RAISE NOTICE '  - public.role_permissions (role-based permissions)';
    RAISE NOTICE '  - public.user_role_assignments (user role history)';
    RAISE NOTICE '  - public.role_audit_log (audit trail)';
    RAISE NOTICE '';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '  - get_user_permissions(user_id)';
    RAISE NOTICE '  - user_has_permission(user_id, resource, action)';
    RAISE NOTICE '';
    RAISE NOTICE 'Configured Row Level Security (RLS) policies';
    RAISE NOTICE 'Inserted default roles and permissions';
    RAISE NOTICE '============================================================================';
END $$;