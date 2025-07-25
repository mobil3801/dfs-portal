-- Fix audit_logs table by adding missing action_performed column
-- This SQL should be executed directly in Supabase SQL Editor

-- First, let's check the current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add the missing action_performed column
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS action_performed VARCHAR(255) NOT NULL DEFAULT 'unknown';

-- Add failure_reason column if it doesn't exist
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Update existing records to have a valid action_performed value
UPDATE audit_logs 
SET action_performed = COALESCE(action_performed, 'legacy_action')
WHERE action_performed IS NULL OR action_performed = '';

-- Verify the fix
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert
INSERT INTO audit_logs (
  event_type,
  event_status,
  action_performed,
  username,
  additional_data
) VALUES (
  'System',
  'Success',
  'schema_fix_test',
  'system',
  '{"test": "schema_fix", "timestamp": "' || now() || '"}'
);

-- Verify the test record was inserted
SELECT * FROM audit_logs WHERE action_performed = 'schema_fix_test' LIMIT 1;
