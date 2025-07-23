-- Migration to add missing columns to module_access table

ALTER TABLE module_access
ADD COLUMN IF NOT EXISTS create_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edit_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delete_enabled BOOLEAN DEFAULT FALSE;
