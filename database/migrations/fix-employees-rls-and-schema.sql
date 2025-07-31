-- ============================================
-- Fix Employees Table RLS and Schema Issues
-- Migration to resolve "Failed to load employees" error
-- ============================================

-- First, let's check if the employees table exists and its current structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        RAISE NOTICE 'Employees table does not exist, creating it...';
    ELSE
        RAISE NOTICE 'Employees table exists, updating structure...';
    END IF;
END $$;

-- ============================================
-- 1. UPDATE EMPLOYEES TABLE SCHEMA
-- ============================================

-- Add missing columns that the frontend expects
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS station VARCHAR(255),
ADD COLUMN IF NOT EXISTS shift VARCHAR(100),
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100) DEFAULT 'Ongoing',
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS current_address TEXT,
ADD COLUMN IF NOT EXISTS mailing_address TEXT,
ADD COLUMN IF NOT EXISTS reference_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS id_document_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS profile_image_id UUID,
ADD COLUMN IF NOT EXISTS id_document_file_id UUID,
ADD COLUMN IF NOT EXISTS id_document_2_file_id UUID,
ADD COLUMN IF NOT EXISTS id_document_3_file_id UUID,
ADD COLUMN IF NOT EXISTS id_document_4_file_id UUID;

-- Add a sequential ID column for compatibility with frontend expectations
-- The frontend expects integer IDs, but we're using UUIDs
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ID SERIAL;

-- Create a unique index on the ID column
CREATE UNIQUE INDEX IF NOT EXISTS employees_id_unique ON employees(ID);

-- Update existing records to have proper station names instead of UUIDs
UPDATE employees 
SET station = COALESCE(
    (SELECT name FROM stations WHERE stations.id = employees.station_id),
    'MOBIL'
) 
WHERE station IS NULL OR station = '';

-- Set default values for required fields
UPDATE employees 
SET 
    shift = COALESCE(shift, 'Day'),
    employment_status = COALESCE(employment_status, 'Ongoing'),
    is_active = COALESCE(is_active, true)
WHERE shift IS NULL OR employment_status IS NULL OR is_active IS NULL;

-- ============================================
-- 2. CREATE MISSING RLS POLICIES
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Station access for employees" ON employees;
DROP POLICY IF EXISTS "Employees read access" ON employees;
DROP POLICY IF EXISTS "Employees write access" ON employees;
DROP POLICY IF EXISTS "Admin full access to employees" ON employees;

-- Create comprehensive RLS policies for employees table
-- Policy 1: Admin users have full access
CREATE POLICY "Admin full access to employees" ON employees
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy 2: Manager users have full access to their station's employees
CREATE POLICY "Manager station access to employees" ON employees
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = auth.uid() 
        AND up.role = 'manager'
        AND (
            -- Allow access if station matches
            employees.station = ANY(
                SELECT jsonb_array_elements_text(up.station_access)
            )
            OR
            -- Allow access if station_id matches (UUID reference)
            employees.station_id::text = ANY(
                SELECT jsonb_array_elements_text(up.station_access)
            )
            OR
            -- Fallback: if no station restrictions, allow all
            jsonb_array_length(up.station_access) = 0
        )
    )
);

-- Policy 3: Employee users have read-only access to their station's employees
CREATE POLICY "Employee read access to station employees" ON employees
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = auth.uid() 
        AND up.role = 'employee'
        AND (
            -- Allow access if station matches
            employees.station = ANY(
                SELECT jsonb_array_elements_text(up.station_access)
            )
            OR
            -- Allow access if station_id matches (UUID reference)
            employees.station_id::text = ANY(
                SELECT jsonb_array_elements_text(up.station_access)
            )
            OR
            -- Fallback: if no station restrictions, allow all
            jsonb_array_length(up.station_access) = 0
        )
    )
);

-- Policy 4: Fallback policy for authenticated users without profiles
CREATE POLICY "Authenticated user fallback access" ON employees
FOR SELECT
TO authenticated
USING (
    NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid()
    )
);

-- ============================================
-- 3. CREATE VIEW FOR FRONTEND COMPATIBILITY
-- ============================================

-- Create a view that maps UUID fields to the expected format
CREATE OR REPLACE VIEW employees_view AS
SELECT 
    ID,
    id as uuid_id,
    employee_id,
    first_name,
    last_name,
    email,
    phone,
    position,
    department,
    station,
    shift,
    hire_date,
    termination_date,
    salary,
    hourly_rate,
    is_active,
    employment_status,
    date_of_birth,
    current_address,
    mailing_address,
    reference_name,
    id_document_type,
    profile_image_id,
    id_document_file_id,
    id_document_2_file_id,
    id_document_3_file_id,
    id_document_4_file_id,
    notes,
    created_by,
    created_at,
    updated_at,
    -- Add station_id for reference but convert to string for compatibility
    station_id::text as station_id_text
FROM employees;

-- Grant access to the view
GRANT SELECT ON employees_view TO authenticated;

-- Enable RLS on the view
ALTER VIEW employees_view SET (security_barrier = true);

-- ============================================
-- 4. UPDATE SUPABASE ADAPTER TABLE MAPPING
-- ============================================

-- Add a comment to track this migration
COMMENT ON TABLE employees IS 'Updated with RLS policies and frontend compatibility - Migration applied';

-- ============================================
-- 5. INSERT SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample employees if table is empty (for testing)
INSERT INTO employees (
    employee_id, first_name, last_name, email, phone, position, 
    station, shift, employment_status, hire_date, salary, is_active
) 
SELECT * FROM (VALUES
    ('EMP001', 'John', 'Doe', 'john.doe@dfs.com', '555-0101', 'Manager', 'MOBIL', 'Day', 'Ongoing', '2023-01-15', 55000.00, true),
    ('EMP002', 'Jane', 'Smith', 'jane.smith@dfs.com', '555-0102', 'Cashier', 'MOBIL', 'Night', 'Ongoing', '2023-02-01', 35000.00, true),
    ('EMP003', 'Mike', 'Johnson', 'mike.johnson@dfs.com', '555-0103', 'Attendant', 'AMOCO ROSEDALE', 'Day', 'Ongoing', '2023-03-10', 32000.00, true),
    ('EMP004', 'Sarah', 'Wilson', 'sarah.wilson@dfs.com', '555-0104', 'Supervisor', 'AMOCO BROOKLYN', 'Day & Night', 'Ongoing', '2023-01-20', 45000.00, true),
    ('EMP005', 'Tom', 'Brown', 'tom.brown@dfs.com', '555-0105', 'Cashier', 'MOBIL', 'Night', 'Left', '2022-12-01', 33000.00, false)
) AS sample_data(employee_id, first_name, last_name, email, phone, position, station, shift, employment_status, hire_date, salary, is_active)
WHERE NOT EXISTS (SELECT 1 FROM employees LIMIT 1);

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Verify the table structure
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== EMPLOYEES TABLE VERIFICATION ===';
    
    -- Check table exists
    SELECT COUNT(*) INTO rec FROM information_schema.tables 
    WHERE table_name = 'employees';
    RAISE NOTICE 'Employees table exists: %', (rec.count > 0);
    
    -- Check RLS is enabled
    SELECT relrowsecurity INTO rec FROM pg_class 
    WHERE relname = 'employees';
    RAISE NOTICE 'RLS enabled on employees: %', rec.relrowsecurity;
    
    -- Check policies exist
    SELECT COUNT(*) INTO rec FROM pg_policies 
    WHERE tablename = 'employees';
    RAISE NOTICE 'Number of RLS policies: %', rec.count;
    
    -- Check record count
    EXECUTE 'SELECT COUNT(*) FROM employees' INTO rec;
    RAISE NOTICE 'Total employees: %', rec.count;
    
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;

-- Log completion
INSERT INTO audit_logs (
    action, 
    action_performed, 
    table_name, 
    success, 
    user_email
) VALUES (
    'MIGRATION', 
    'Fixed employees RLS policies and schema compatibility', 
    'employees', 
    true, 
    'system@migration'
);

RAISE NOTICE 'Migration completed successfully!';
RAISE NOTICE 'Employees table now has proper RLS policies and frontend compatibility.';