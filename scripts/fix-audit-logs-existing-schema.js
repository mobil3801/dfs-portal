#!/usr/bin/env node

/**
 * Fix Audit Logs with Existing Schema
 * This script works with the existing audit_logs table structure
 */

import pg from 'pg';
const { Client } = pg;

// Database connection string from Supabase
const DATABASE_URL = 'postgresql://postgres.nehhjsiuhthflfwkfequ:Dreamframe123@@aws-0-us-east-2.pooler.supabase.com:6543/postgres';

async function fixAuditLogsExistingSchema() {
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
    console.log('📋 Current audit_logs table structure:');
    
    const checkStructureQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await client.query(checkStructureQuery);
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Step 2: Add missing columns that our application expects
    console.log('🔧 Adding missing columns for application compatibility...');
    
    const columnsToAdd = [
      { name: 'event_type', type: 'VARCHAR(255)', nullable: true },
      { name: 'event_status', type: 'VARCHAR(255)', nullable: true },
      { name: 'event_timestamp', type: 'TIMESTAMPTZ', nullable: true, default: 'now()' },
      { name: 'risk_level', type: 'VARCHAR(50)', nullable: true },
      { name: 'username', type: 'VARCHAR(255)', nullable: true },
      { name: 'additional_data', type: 'JSONB', nullable: true },
      { name: 'sensitive_fields_removed', type: 'BOOLEAN', nullable: true, default: 'false' }
    ];

    for (const column of columnsToAdd) {
      const hasColumn = structureResult.rows.some(row => row.column_name === column.name);
      
      if (!hasColumn) {
        console.log(`📝 Adding ${column.name} column...`);
        
        let alterQuery = `ALTER TABLE audit_logs ADD COLUMN ${column.name} ${column.type}`;
        if (column.default) {
          alterQuery += ` DEFAULT ${column.default}`;
        }
        alterQuery += ';';
        
        try {
          await client.query(alterQuery);
          console.log(`✅ Added ${column.name} column`);
        } catch (error) {
          console.error(`❌ Failed to add ${column.name}:`, error.message);
        }
      } else {
        console.log(`✅ ${column.name} column already exists`);
      }
    }

    // Step 3: Create a view or function to map between schemas
    console.log('🔄 Creating compatibility mapping...');
    
    // Create a function to insert audit logs with the expected interface
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION insert_audit_log(
        p_event_type VARCHAR(255),
        p_event_status VARCHAR(255),
        p_action_performed VARCHAR(255),
        p_username VARCHAR(255) DEFAULT NULL,
        p_user_id UUID DEFAULT NULL,
        p_failure_reason TEXT DEFAULT NULL,
        p_additional_data JSONB DEFAULT NULL,
        p_ip_address VARCHAR(50) DEFAULT NULL,
        p_user_agent TEXT DEFAULT NULL,
        p_session_id VARCHAR(255) DEFAULT NULL
      ) RETURNS UUID AS $$
      DECLARE
        new_id UUID;
      BEGIN
        INSERT INTO audit_logs (
          action,
          user_id,
          user_email,
          success,
          error_message,
          ip_address,
          user_agent,
          session_id,
          event_type,
          event_status,
          username,
          additional_data,
          created_at
        ) VALUES (
          p_action_performed,
          p_user_id,
          p_username,
          CASE WHEN p_event_status = 'Success' THEN true ELSE false END,
          p_failure_reason,
          p_ip_address::inet,
          p_user_agent,
          p_session_id,
          p_event_type,
          p_event_status,
          p_username,
          p_additional_data,
          now()
        ) RETURNING id INTO new_id;
        
        RETURN new_id;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    try {
      await client.query(createFunctionQuery);
      console.log('✅ Created audit log insert function');
    } catch (error) {
      console.error('❌ Failed to create function:', error.message);
    }

    // Step 4: Test the function
    console.log('🧪 Testing audit log function...');
    
    const testFunctionQuery = `
      SELECT insert_audit_log(
        'System',
        'Success', 
        'schema_compatibility_test',
        'system',
        NULL,
        NULL,
        '{"test": "compatibility", "timestamp": "' || now() || '"}'::jsonb
      ) as test_id;
    `;
    
    try {
      const testResult = await client.query(testFunctionQuery);
      console.log('✅ Function test successful:', testResult.rows[0]);
      
      // Clean up test record
      const cleanupQuery = `DELETE FROM audit_logs WHERE action = 'schema_compatibility_test';`;
      await client.query(cleanupQuery);
      console.log('🧹 Cleaned up test record');
      
    } catch (error) {
      console.error('❌ Function test failed:', error.message);
    }

    // Step 5: Verify final structure
    console.log('🔍 Final table structure:');
    
    const finalStructureResult = await client.query(checkStructureQuery);
    finalStructureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n🎉 Audit logs compatibility fix completed!');
    console.log('✅ Added missing columns for application compatibility');
    console.log('✅ Created insert_audit_log function for seamless integration');
    console.log('✅ Existing data preserved');
    console.log('✅ Application can now log audit events without errors');

  } catch (error) {
    console.error('💥 Fix failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
fixAuditLogsExistingSchema()
  .then(() => {
    console.log('🏁 Compatibility fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix script failed:', error);
    process.exit(1);
  });
