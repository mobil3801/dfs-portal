-- Migration to add create_enabled column to module_access table
ALTER TABLE module_access
ADD COLUMN IF NOT EXISTS create_enabled BOOLEAN DEFAULT false;
