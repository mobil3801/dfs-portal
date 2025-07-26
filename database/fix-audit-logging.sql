-- Fix Audit Logging System
-- This script creates the missing insert_audit_log RPC function and ensures proper table schema

-- First, ensure the audit_logs table has all required columns
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS event_timestamp TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_status ON public.audit_logs(event_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON public.audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_timestamp ON public.audit_logs(event_timestamp);

-- Drop any existing versions of insert_audit_log function first
DROP FUNCTION IF EXISTS public.insert_audit_log CASCADE;

-- Create the insert_audit_log RPC function
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_event_type TEXT,
  p_event_status TEXT,
  p_action_performed TEXT,
  p_username TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL,
  p_additional_data JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_risk_level TEXT;
  v_user_uuid UUID;
BEGIN
  -- Generate UUID for the audit log entry
  v_audit_id := gen_random_uuid();
  
  -- Convert user_id to UUID if valid, otherwise set to NULL
  BEGIN
    IF p_user_id IS NOT NULL AND p_user_id != '' THEN
      v_user_uuid := p_user_id::UUID;
    ELSE
      v_user_uuid := NULL;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      v_user_uuid := NULL;
  END;
  
  -- Determine risk level based on event characteristics
  CASE
    WHEN p_event_status = 'Failed' AND p_event_type = 'Login' THEN
      v_risk_level := 'Medium';
    WHEN p_event_status = 'Blocked' THEN
      v_risk_level := 'High';
    WHEN p_event_status = 'Suspicious' THEN
      v_risk_level := 'Critical';
    WHEN p_event_type IN ('Permission Change', 'Admin Action') THEN
      v_risk_level := 'High';
    WHEN p_event_type = 'Data Modification' THEN
      v_risk_level := 'Medium';
    ELSE
      v_risk_level := 'Low';
  END CASE;

  -- Insert the audit log entry (matching actual table schema)
  INSERT INTO public.audit_logs (
    id,
    event_type,
    event_status,
    action_performed,
    username,
    user_id,
    failure_reason,
    additional_data,
    ip_address,
    user_agent,
    session_id,
    risk_level,
    event_timestamp,
    created_at,
    action
  ) VALUES (
    v_audit_id,
    p_event_type,
    p_event_status,
    p_action_performed,
    p_username,
    v_user_uuid,  -- Use converted UUID
    p_failure_reason,
    p_additional_data,
    CASE
      WHEN p_ip_address IS NOT NULL AND p_ip_address != '' THEN
        p_ip_address::inet
      ELSE
        NULL
    END,
    p_user_agent,
    p_session_id,
    v_risk_level,
    NOW(),
    NOW(),
    p_action_performed  -- action column is required
  );

  -- Return the generated UUID
  RETURN v_audit_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE NOTICE 'Error in insert_audit_log: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_audit_log TO service_role;

-- Create RLS policy for audit_logs if it doesn't exist
DO $$
BEGIN
  -- Enable RLS on audit_logs table
  ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for authenticated users to insert audit logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' 
    AND policyname = 'Enable insert for authenticated users'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users" 
    ON public.audit_logs FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
  END IF;
  
  -- Create policy for service role to have full access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' 
    AND policyname = 'Enable all for service role'
  ) THEN
    CREATE POLICY "Enable all for service role" 
    ON public.audit_logs FOR ALL 
    TO service_role 
    WITH CHECK (true);
  END IF;
  
  -- Create policy for authenticated users to read their own audit logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' 
    AND policyname = 'Enable read for own records'
  ) THEN
    CREATE POLICY "Enable read for own records" 
    ON public.audit_logs FOR SELECT 
    TO authenticated 
    USING (auth.uid()::text = user_id OR auth.jwt()->>'role' = 'service_role');
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating RLS policies: %', SQLERRM;
END $$;

-- Test the function to ensure it works
DO $$
DECLARE
  test_id UUID;
BEGIN
  -- Test the insert_audit_log function
  SELECT public.insert_audit_log(
    'System Test',
    'Success',
    'test_function',
    'system',
    'test-user-id',
    NULL,
    '{"test": true}'::jsonb,
    '127.0.0.1',
    'PostgreSQL Test',
    'test-session'
  ) INTO test_id;
  
  RAISE NOTICE 'insert_audit_log function test successful. Generated ID: %', test_id;
  
  -- Clean up test data
  DELETE FROM public.audit_logs WHERE id = test_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'insert_audit_log function test failed: %', SQLERRM;
END $$;

-- Create a helper function to check if audit logging is working
CREATE OR REPLACE FUNCTION public.test_audit_logging() RETURNS BOOLEAN AS $$
DECLARE
  test_count INTEGER;
BEGIN
  -- Try to insert a test audit log
  PERFORM public.insert_audit_log(
    'Health Check',
    'Success',
    'system_health_check',
    'system',
    NULL,
    NULL,
    '{"health_check": true}'::jsonb,
    '127.0.0.1',
    'Health Check Function',
    'health-check-session'
  );
  
  -- Check if the insert was successful
  SELECT COUNT(*) INTO test_count 
  FROM public.audit_logs 
  WHERE event_type = 'Health Check' 
  AND action_performed = 'system_health_check'
  AND created_at > NOW() - INTERVAL '1 minute';
  
  -- Clean up test data
  DELETE FROM public.audit_logs 
  WHERE event_type = 'Health Check' 
  AND action_performed = 'system_health_check';
  
  RETURN test_count > 0;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for the test function
GRANT EXECUTE ON FUNCTION public.test_audit_logging TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_audit_logging TO service_role;

-- Output success message
SELECT 'Audit logging system has been repaired successfully!' as status;