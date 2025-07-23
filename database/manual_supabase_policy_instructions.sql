-- Run these SQL commands manually in Supabase SQL editor with an owner/admin user

-- Add missing columns to module_access table
ALTER TABLE module_access
ADD COLUMN IF NOT EXISTS create_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edit_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delete_enabled BOOLEAN DEFAULT FALSE;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow insert for module_access" ON module_access;
DROP POLICY IF EXISTS "Allow update for module_access" ON module_access;
DROP POLICY IF EXISTS "Allow delete for module_access" ON module_access;

-- Create policies to allow authenticated users to insert, update, delete
CREATE POLICY "Allow insert for module_access" ON module_access
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for module_access" ON module_access
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for module_access" ON module_access
  FOR DELETE TO authenticated
  USING (true);
