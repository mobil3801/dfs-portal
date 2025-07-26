const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixAuditLogging() {
  console.log('🔧 Starting Audit Logging System Repair...');
  
  // Supabase connection details (using connection string format that worked before)
  const connectionString = 'postgresql://postgres.nehhjsiuhthflfwkfequ:Dreamframe123@@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database');

    // Read the SQL fix file
    const sqlPath = path.join(__dirname, 'database', 'fix-audit-logging.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing audit logging repair SQL...');

    // Execute the SQL fix
    const result = await client.query(sqlContent);
    console.log('✅ Audit logging repair completed successfully');

    // Test the RPC function
    console.log('\n🧪 Testing insert_audit_log RPC function...');
    try {
      const testResult = await client.query(`
        SELECT public.insert_audit_log(
          'System Repair Test',
          'Success', 
          'test_rpc_function',
          'system',
          'test-user-id',
          NULL,
          '{"repair_test": true}'::jsonb,
          '127.0.0.1',
          'Node.js Test Script',
          'repair-test-session'
        ) as audit_id;
      `);
      
      const auditId = testResult.rows[0]?.audit_id;
      console.log(`✅ RPC function test successful! Generated audit ID: ${auditId}`);
      
      // Clean up test data
      await client.query('DELETE FROM public.audit_logs WHERE id = $1', [auditId]);
      console.log('🧹 Cleaned up test data');
      
    } catch (testError) {
      console.error('❌ RPC function test failed:', testError.message);
    }

    // Test the health check function
    console.log('\n🩺 Testing audit logging health check...');
    try {
      const healthResult = await client.query('SELECT public.test_audit_logging() as is_healthy;');
      const isHealthy = healthResult.rows[0]?.is_healthy;
      
      if (isHealthy) {
        console.log('✅ Audit logging system is healthy!');
      } else {
        console.log('⚠️ Audit logging system health check failed');
      }
    } catch (healthError) {
      console.error('❌ Health check failed:', healthError.message);
    }

    // Verify table structure
    console.log('\n📋 Verifying audit_logs table structure...');
    try {
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      console.log('📊 Table structure:');
      structureResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
    } catch (structureError) {
      console.error('❌ Structure verification failed:', structureError.message);
    }

    // Verify RPC function exists
    console.log('\n🔍 Verifying RPC function exists...');
    try {
      const rpcResult = await client.query(`
        SELECT routine_name, routine_type 
        FROM information_schema.routines 
        WHERE routine_name = 'insert_audit_log' 
        AND routine_schema = 'public';
      `);
      
      if (rpcResult.rows.length > 0) {
        console.log('✅ insert_audit_log RPC function exists');
      } else {
        console.log('❌ insert_audit_log RPC function not found');
      }
    } catch (rpcError) {
      console.error('❌ RPC verification failed:', rpcError.message);
    }

    console.log('\n🎉 Audit logging system repair completed!');
    console.log('\nNext steps:');
    console.log('1. Test the application to ensure audit logging is working');
    console.log('2. Check browser console for any remaining audit errors');
    console.log('3. Verify that login/logout actions generate audit logs');

  } catch (error) {
    console.error('❌ Audit logging repair failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the repair
fixAuditLogging().catch(console.error);