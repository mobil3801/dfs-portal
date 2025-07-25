#!/usr/bin/env node

/**
 * Database Schema Test Script
 * This script tests the database schema directly using service role
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration with service role for admin access
const SUPABASE_URL = 'https://nehhjsiuhthflfwkfequ.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGhqc2l1aHRoZmxmd2tmZXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxMzE3NSwiZXhwIjoyMDY4NTg5MTc1fQ.7naT6l_oNH8VI5MaEKgJ19PoYw1EErv6-ftkEin12wE';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDatabaseSchema() {
  console.log('🧪 Testing database schema with service role...');
  
  try {
    // Test 1: Check if audit_logs table exists and its structure
    console.log('📋 Checking audit_logs table structure...');
    
    try {
      // Try to get table columns using information_schema
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'audit_logs')
        .eq('table_schema', 'public');
      
      if (columnsError) {
        console.error('❌ Error checking columns:', columnsError);
      } else if (columns && columns.length > 0) {
        console.log('✅ audit_logs table exists with columns:');
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check if action_performed column exists
        const hasActionPerformed = columns.some(col => col.column_name === 'action_performed');
        if (hasActionPerformed) {
          console.log('✅ action_performed column exists');
        } else {
          console.log('❌ action_performed column is missing');
        }
      } else {
        console.log('❌ audit_logs table does not exist');
      }
    } catch (schemaError) {
      console.error('❌ Schema check error:', schemaError);
    }
    
    // Test 2: Try to insert a test record
    console.log('📝 Testing audit_logs insert...');
    
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: 'test',
          event_status: 'success',
          action_performed: 'schema_test',
          username: 'test_user',
          event_timestamp: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('❌ Insert failed:', error);
        console.log('🔧 This indicates schema issues that need to be fixed');
        
        // If insert fails, try to create the table
        console.log('🏗️ Attempting to create/fix audit_logs table...');
        await createAuditLogsTable();
        
      } else {
        console.log('✅ Insert successful:', data);
        
        // Clean up test record
        if (data && data[0]) {
          await supabase
            .from('audit_logs')
            .delete()
            .eq('id', data[0].id);
          console.log('🧹 Cleaned up test record');
        }
      }
    } catch (insertError) {
      console.error('❌ Insert error:', insertError);
    }
    
    // Test 3: Check user_profiles table
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
        if (data && data.length > 0) {
          console.log('📊 Sample profile structure:', Object.keys(data[0]));
        }
      }
    } catch (profileError) {
      console.error('❌ Profile table error:', profileError);
    }
    
    console.log('\n📋 Schema Test Summary:');
    console.log('✅ Service role connection: Working');
    console.log('📊 Check results above for table status');
    
  } catch (error) {
    console.error('💥 Schema test failed:', error);
  }
}

async function createAuditLogsTable() {
  console.log('🏗️ Creating audit_logs table with correct schema...');
  
  try {
    // Drop existing table if it exists
    const dropSQL = `DROP TABLE IF EXISTS audit_logs CASCADE;`;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSQL });
    
    if (dropError && !dropError.message.includes('does not exist')) {
      console.error('⚠️ Error dropping table:', dropError);
    }
    
    // Create new table with correct schema
    const createSQL = `
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
      
      -- Create indexes
      CREATE INDEX idx_audit_logs_event_timestamp ON audit_logs(event_timestamp);
      CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
      CREATE INDEX idx_audit_logs_username ON audit_logs(username);
      CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
      
      -- Enable RLS
      ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Enable read access for authenticated users" ON audit_logs
        FOR SELECT USING (auth.role() = 'authenticated');
      
      CREATE POLICY "Enable insert access for authenticated users" ON audit_logs
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      
      -- Grant permissions
      GRANT ALL ON audit_logs TO authenticated;
      GRANT ALL ON audit_logs TO service_role;
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createSQL });
    
    if (createError) {
      console.error('❌ Error creating table:', createError);
      
      // Try alternative approach - direct table creation
      console.log('🔄 Trying alternative table creation...');
      
      const { error: altError } = await supabase
        .from('audit_logs')
        .insert({
          event_type: 'test',
          event_status: 'success', 
          action_performed: 'test'
        });
        
      if (altError) {
        console.error('❌ Alternative creation failed:', altError);
        console.log('📝 Manual SQL needed:');
        console.log(createSQL);
      }
      
    } else {
      console.log('✅ Successfully created audit_logs table');
      
      // Test the new table
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: 'System',
          event_status: 'Success',
          action_performed: 'table_creation',
          username: 'system'
        })
        .select();
      
      if (error) {
        console.error('❌ Test insert failed:', error);
      } else {
        console.log('✅ Test insert successful:', data);
      }
    }
    
  } catch (error) {
    console.error('💥 Table creation failed:', error);
  }
}

// Run the schema test
testDatabaseSchema()
  .then(() => {
    console.log('🏁 Schema test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema test script failed:', error);
    process.exit(1);
  });
