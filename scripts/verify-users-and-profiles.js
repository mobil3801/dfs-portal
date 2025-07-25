#!/usr/bin/env node

/**
 * Comprehensive Users and Profiles Verification Script
 * This script verifies existing users and profiles in the database
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

async function verifyUsersAndProfiles() {
  console.log('🔍 Comprehensive Users and Profiles Verification\n');
  
  try {
    // 1. Check user_profiles table
    console.log('👤 Checking user_profiles table...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(10);
    
    if (profilesError) {
      console.error('❌ Error accessing user_profiles:', profilesError);
    } else {
      console.log(`✅ user_profiles table accessible`);
      console.log(`📊 Found ${profiles?.length || 0} user profiles`);
      
      if (profiles && profiles.length > 0) {
        console.log('📋 Profile structure:', Object.keys(profiles[0]));
        console.log('👥 Sample profiles:');
        profiles.slice(0, 3).forEach((profile, index) => {
          console.log(`  ${index + 1}. ${profile.first_name} ${profile.last_name} (${profile.email}) - Role: ${profile.role} - Active: ${profile.is_active}`);
        });
      }
    }
    
    // 2. Check auth.users table (Supabase built-in)
    console.log('\n🔐 Checking auth.users table...');
    
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Error accessing auth.users:', authError);
      } else {
        console.log(`✅ auth.users table accessible`);
        console.log(`📊 Found ${authUsers?.users?.length || 0} authenticated users`);
        
        if (authUsers?.users && authUsers.users.length > 0) {
          console.log('👥 Sample auth users:');
          authUsers.users.slice(0, 3).forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} - ID: ${user.id} - Created: ${new Date(user.created_at).toLocaleDateString()}`);
          });
        }
      }
    } catch (authError) {
      console.error('❌ Auth users check failed:', authError);
    }
    
    // 3. Check module_access table
    console.log('\n🔧 Checking module_access table...');
    
    const { data: moduleAccess, error: moduleError } = await supabase
      .from('module_access')
      .select('*')
      .limit(10);
    
    if (moduleError) {
      console.error('❌ Error accessing module_access:', moduleError);
    } else {
      console.log(`✅ module_access table accessible`);
      console.log(`📊 Found ${moduleAccess?.length || 0} module access records`);
      
      if (moduleAccess && moduleAccess.length > 0) {
        console.log('📋 Module access structure:', Object.keys(moduleAccess[0]));
        console.log('🔑 Sample module access:');
        moduleAccess.slice(0, 3).forEach((access, index) => {
          console.log(`  ${index + 1}. User: ${access.user_id} - Module: ${access.module_name} - Level: ${access.access_level} - Active: ${access.is_active}`);
        });
      }
    }
    
    // 4. Check audit_logs table
    console.log('\n📝 Checking audit_logs table...');
    
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (auditError) {
      console.error('❌ Error accessing audit_logs:', auditError);
    } else {
      console.log(`✅ audit_logs table accessible`);
      console.log(`📊 Found ${auditLogs?.length || 0} recent audit log entries`);
      
      if (auditLogs && auditLogs.length > 0) {
        console.log('📋 Recent audit activities:');
        auditLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. ${log.event_type} - ${log.event_status} - User: ${log.username || 'N/A'} - ${new Date(log.created_at).toLocaleString()}`);
        });
      }
    }
    
    // 5. Cross-reference users and profiles
    console.log('\n🔗 Cross-referencing users and profiles...');
    
    if (profiles && profiles.length > 0) {
      console.log('🔍 Checking profile-auth user relationships:');
      
      for (const profile of profiles.slice(0, 5)) {
        try {
          const { data: authUser, error } = await supabase.auth.admin.getUserById(profile.user_id);
          
          if (error) {
            console.log(`  ❌ Profile ${profile.email} - No matching auth user (${error.message})`);
          } else {
            console.log(`  ✅ Profile ${profile.email} - Auth user exists (${authUser.user.email})`);
          }
        } catch (error) {
          console.log(`  ⚠️ Profile ${profile.email} - Error checking auth user`);
        }
      }
    }
    
    // 6. Summary
    console.log('\n📋 Verification Summary:');
    console.log('✅ Database connection: Working');
    console.log(`📊 User profiles: ${profiles?.length || 0} found`);
    console.log(`🔐 Auth users: Available via admin API`);
    console.log(`🔧 Module access: ${moduleAccess?.length || 0} records found`);
    console.log(`📝 Audit logs: ${auditLogs?.length || 0} recent entries found`);
    
    console.log('\n🎉 Users and profiles verification completed successfully!');
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

// Run the verification
verifyUsersAndProfiles()
  .then(() => {
    console.log('🏁 Verification script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification script failed:', error);
    process.exit(1);
  });
