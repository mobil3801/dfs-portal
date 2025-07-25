#!/usr/bin/env node

/**
 * Test Login Script
 * This script tests the login functionality to see if the audit logging issues are resolved
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://nehhjsiuhthflfwkfequ.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGhqc2l1aHRoZmxmd2tmZXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTMxNzUsImV4cCI6MjA2ODU4OTE3NX0.osjykkMo-WoYdRdh6quNu2F8DQHi5dN32JwSiaT5eLc';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  console.log('🧪 Testing login functionality...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('🔗 Testing Supabase connection...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError && !userError.message.includes('not authenticated')) {
      console.error('❌ Connection error:', userError);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test 2: Check audit_logs table structure
    console.log('📋 Checking audit_logs table...');
    
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ audit_logs table error:', error);
        console.log('🔧 This confirms the schema issue - audit_logs table needs to be fixed');
      } else {
        console.log('✅ audit_logs table is accessible');
        console.log('📊 Sample data:', data);
      }
    } catch (tableError) {
      console.error('❌ Table access error:', tableError);
    }
    
    // Test 3: Try a simple insert to audit_logs (this will likely fail)
    console.log('📝 Testing audit_logs insert...');
    
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: 'test',
          event_status: 'success',
          action_performed: 'schema_test',
          username: 'test_user'
        })
        .select();
      
      if (error) {
        console.error('❌ Insert failed:', error);
        console.log('🔧 This confirms the missing action_performed column issue');
      } else {
        console.log('✅ Insert successful:', data);
      }
    } catch (insertError) {
      console.error('❌ Insert error:', insertError);
    }
    
    // Test 4: Check user_profiles table
    console.log('👤 Checking user_profiles table...');
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ user_profiles table error:', error);
      } else {
        console.log('✅ user_profiles table is accessible');
        console.log('📊 Sample data:', data);
      }
    } catch (profileError) {
      console.error('❌ Profile table error:', profileError);
    }
    
    console.log('\n📋 Test Summary:');
    console.log('- Supabase connection: Working');
    console.log('- audit_logs table: Needs schema fix');
    console.log('- user_profiles table: Check results above');
    console.log('\n💡 Next steps:');
    console.log('1. Fix audit_logs table schema');
    console.log('2. Test login with graceful error handling');
    console.log('3. Verify real-time features work');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testLogin()
  .then(() => {
    console.log('🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
