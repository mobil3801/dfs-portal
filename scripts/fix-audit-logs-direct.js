#!/usr/bin/env node

/**
 * Direct Audit Logs Fix Script
 * This script fixes the audit_logs table by adding the missing action_performed column
 */

import pg from 'pg';
const { Client } = pg;

// Database connection string from Supabase
const DATABASE_URL = 'postgresql://postgres.nehhjsiuhthflfwkfequ:Dreamframe123@@aws-0-us-east-2.pooler.supabase.com:6543/postgres';

async function fixAuditLogsTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Check current table structure
    console.log('📋 Checking current audit_logs table structure...');
    
    const checkStructureQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await client.query(checkStructureQuery);
    console.log('📊 Current columns:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check if action_performed column exists
    const hasActionPerformed = structureResult.rows.some(row => row.column_name === 'action_performed');
    
    if (hasActionPerformed) {
      console.log('✅ action_performed column already exists');
    } else {
      console.log('❌ action_performed column is missing - adding it...');
      
      // Step 2: Add missing action_performed column
      const addColumnQuery = `
        ALTER TABLE audit_logs 
        ADD COLUMN action_performed VARCHAR(255) NOT NULL DEFAULT 'unknown';
      `;
      
      await client.query(addColumnQuery);
      console.log('✅ Added action_performed column');
    }

    // Step 3: Add failure_reason column if it doesn't exist
    const hasFailureReason = structureResult.rows.some(row => row.column_name === 'failure_reason');
    
    if (!hasFailureReason) {
      console.log('📝 Adding failure_reason column...');
      
      const addFailureReasonQuery = `
        ALTER TABLE audit_logs 
        ADD COLUMN IF NOT EXISTS failure_reason TEXT;
      `;
      
      await client.query(addFailureReasonQuery);
      console.log('✅ Added failure_reason column');
    }

    // Step 4: Update existing records
    console.log('🔄 Updating existing records...');
    
    const updateQuery = `
      UPDATE audit_logs 
      SET action_performed = COALESCE(action_performed, 'legacy_action')
      WHERE action_performed IS NULL OR action_performed = '';
    `;
    
    const updateResult = await client.query(updateQuery);
    console.log(`✅ Updated ${updateResult.rowCount} existing records`);

    // Step 5: Test insert
    console.log('🧪 Testing insert...');
    
    const testInsertQuery = `
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
        $1
      ) RETURNING id;
    `;
    
    const testData = JSON.stringify({
      test: 'schema_fix',
      timestamp: new Date().toISOString()
    });
    
    const insertResult = await client.query(testInsertQuery, [testData]);
    console.log('✅ Test insert successful:', insertResult.rows[0]);

    // Step 6: Verify the fix
    console.log('🔍 Verifying the fix...');
    
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const verifyResult = await client.query(verifyQuery);
    console.log('📊 Updated table structure:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Clean up test record
    const cleanupQuery = `DELETE FROM audit_logs WHERE action_performed = 'schema_fix_test';`;
    await client.query(cleanupQuery);
    console.log('🧹 Cleaned up test record');

    console.log('\n🎉 Audit logs table fix completed successfully!');
    console.log('✅ action_performed column is now present');
    console.log('✅ failure_reason column is now present');
    console.log('✅ Existing records have been updated');
    console.log('✅ Insert functionality verified');

  } catch (error) {
    console.error('💥 Fix failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
fixAuditLogsTable()
  .then(() => {
    console.log('🏁 Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix script failed:', error);
    process.exit(1);
  });
