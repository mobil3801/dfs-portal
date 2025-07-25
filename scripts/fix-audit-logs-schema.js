#!/usr/bin/env node

/**
 * Fix Audit Logs Schema Issues
 * This script addresses the column naming inconsistencies in the audit_logs table
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://nehhjsiuhthflfwkfequ.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGhqc2l1aHRoZmxmd2tmZXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxMzE3NSwiZXhwIjoyMDY4NTg5MTc1fQ.7naT6l_oNH8VI5MaEKgJ19PoYw1EErv6-ftkEin12wE';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAuditLogsSchema() {
  console.log('🔧 Fixing audit_logs schema issues...\n');
  
  try {
    // First, let's check the current table structure
    console.log('📋 Checking current audit_logs structure...');
    
    const { data: currentData, error: selectError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error accessing audit_logs:', selectError);
      return false;
    }
    
    if (currentData && currentData.length > 0) {
      console.log('📊 Current columns:', Object.keys(currentData[0]));
    }
    
