-- Migration: Fix audit_logs table schema and ensure all required columns exist

-- Drop and recreate audit_logs table with correct schema
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(255) NOT NULL,
  event_status VARCHAR(255) NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  risk_level VARCHAR(50),
  ip_address VARCHAR(50),
  user_agent TEXT,
  session_id VARCHAR(255),
  username VARCHAR(255),
  user_id UUID,
  action_performed VARCHAR(255) NOT NULL,
  failure_reason TEXT,
  additional_data JSONB,
  sensitive_fields_removed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_audit_logs_event_timestamp ON audit_logs(event_timestamp);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_username ON audit_logs(username);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_logs
CREATE POLICY "Enable read access for authenticated users" ON audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON audit_logs TO service_role;

-- Insert sample audit log to test
INSERT INTO audit_logs (
  event_type,
  event_status,
  action_performed,
  username,
  additional_data
) VALUES (
  'System',
  'Success',
  'schema_migration',
  'system',
  '{"migration": "fix_audit_logs_schema", "timestamp": "' || now() || '"}'
);
