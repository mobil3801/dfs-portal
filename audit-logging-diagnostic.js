// Audit Logging Diagnostic Script
// Run this in the browser console to diagnose audit logging failures

(async function auditDiagnostic() {
  console.log('🔍 Starting Audit Logging Diagnostic...');
  
  // Import supabase client
  const { supabase } = await import('./src/lib/supabase.js');
  
  const results = {
    rpcExists: false,
    tableExists: false,
    tableSchema: null,
    rpcTest: null,
    directInsertTest: null,
    errors: []
  };

  // Test 1: Check if audit_logs table exists
  console.log('\n📋 Test 1: Checking audit_logs table existence...');
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access failed:', error.message);
      results.errors.push(`Table access: ${error.message}`);
    } else {
      console.log('✅ audit_logs table exists and accessible');
      results.tableExists = true;
    }
  } catch (err) {
    console.error('❌ Table check failed:', err);
    results.errors.push(`Table check: ${err.message}`);
  }

  // Test 2: Check table schema
  console.log('\n🏗️ Test 2: Checking table schema...');
  try {
    const { data, error } = await supabase.rpc('describe_table', { table_name: 'audit_logs' });
    if (error) {
      console.warn('⚠️ Schema check via RPC failed, trying alternative...');
      
      // Alternative: Try to insert with all expected fields to see which fail
      const testEntry = {
        event_type: 'diagnostic_test',
        event_status: 'Success',
        action_performed: 'schema_test',
        username: 'diagnostic',
        user_id: 'test-user-id',
        failure_reason: null,
        additional_data: { test: true },
        ip_address: '127.0.0.1',
        user_agent: 'diagnostic-script',
        session_id: 'test-session',
        risk_level: 'Low',
        resource_accessed: 'diagnostic',
        station: 'test-station',
        event_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      const { error: schemaError } = await supabase
        .from('audit_logs')
        .insert([testEntry]);
      
      if (schemaError) {
        console.error('❌ Schema test failed:', schemaError.message);
        results.errors.push(`Schema test: ${schemaError.message}`);
        results.tableSchema = schemaError.message;
      } else {
        console.log('✅ Schema test passed - all expected columns exist');
        results.tableSchema = 'valid';
      }
    } else {
      console.log('✅ Schema retrieved via RPC:', data);
      results.tableSchema = data;
    }
  } catch (err) {
    console.error('❌ Schema check failed:', err);
    results.errors.push(`Schema check: ${err.message}`);
  }

  // Test 3: Test RPC function insert_audit_log
  console.log('\n🔧 Test 3: Testing insert_audit_log RPC function...');
  try {
    const { data, error } = await supabase.rpc('insert_audit_log', {
      p_event_type: 'diagnostic_test',
      p_event_status: 'Success',
      p_action_performed: 'rpc_test',
      p_username: 'diagnostic',
      p_user_id: 'test-user-id',
      p_failure_reason: null,
      p_additional_data: JSON.stringify({ test: true }),
      p_ip_address: '127.0.0.1',
      p_user_agent: 'diagnostic-script',
      p_session_id: 'test-session'
    });

    if (error) {
      console.error('❌ RPC function failed:', error.message);
      results.rpcTest = error.message;
      results.errors.push(`RPC test: ${error.message}`);
    } else {
      console.log('✅ RPC function works:', data);
      results.rpcExists = true;
      results.rpcTest = 'success';
    }
  } catch (err) {
    console.error('❌ RPC test failed:', err);
    results.rpcTest = err.message;
    results.errors.push(`RPC test: ${err.message}`);
  }

  // Test 4: Test direct table insert (fallback method)
  console.log('\n📝 Test 4: Testing direct table insert...');
  try {
    const directEntry = {
      event_type: 'diagnostic_test',
      event_status: 'Success',
      action_performed: 'direct_insert_test',
      username: 'diagnostic',
      user_id: 'test-user-id',
      failure_reason: null,
      additional_data: { test: true },
      ip_address: '127.0.0.1',
      user_agent: 'diagnostic-script',
      session_id: 'test-session',
      risk_level: 'Low',
      resource_accessed: 'diagnostic',
      station: 'test-station',
      created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert([directEntry]);

    if (insertError) {
      console.error('❌ Direct insert failed:', insertError.message);
      results.directInsertTest = insertError.message;
      results.errors.push(`Direct insert: ${insertError.message}`);
    } else {
      console.log('✅ Direct insert works');
      results.directInsertTest = 'success';
    }
  } catch (err) {
    console.error('❌ Direct insert test failed:', err);
    results.directInsertTest = err.message;
    results.errors.push(`Direct insert: ${err.message}`);
  }

  // Test 5: Test full audit logger service
  console.log('\n🧪 Test 5: Testing AuditLoggerService...');
  try {
    const { default: AuditLoggerService } = await import('./src/services/auditLogger.js');
    const auditLogger = AuditLoggerService.getInstance();
    
    await auditLogger.logEvent('diagnostic_test', 'Success', {
      action_performed: 'service_test',
      username: 'diagnostic',
      user_id: 'test-user-id'
    });
    
    console.log('✅ AuditLoggerService test completed (check localStorage for failed_audit_logs if it failed)');
  } catch (err) {
    console.error('❌ AuditLoggerService test failed:', err);
    results.errors.push(`Service test: ${err.message}`);
  }

  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY:');
  console.log('='.repeat(50));
  console.log(`Table exists: ${results.tableExists ? '✅' : '❌'}`);
  console.log(`RPC function exists: ${results.rpcExists ? '✅' : '❌'}`);
  console.log(`Schema valid: ${results.tableSchema === 'valid' ? '✅' : '❌'}`);
  console.log(`Direct insert works: ${results.directInsertTest === 'success' ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 ERRORS FOUND:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  // Check failed logs in localStorage
  const failedLogs = JSON.parse(localStorage.getItem('failed_audit_logs') || '[]');
  if (failedLogs.length > 0) {
    console.log(`\n💾 Found ${failedLogs.length} failed audit logs in localStorage`);
    console.log('Latest failed log:', failedLogs[failedLogs.length - 1]);
  }

  return results;
})();