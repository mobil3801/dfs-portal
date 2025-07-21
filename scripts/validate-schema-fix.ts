/**
 * Schema Consistency Validation Script
 * Tests the fix for PostgreSQL 42P01 "relation does not exist" errors
 */

import { supabase } from '../src/lib/supabase';

interface ValidationResult {
  table: string;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
  queryTime?: number;
}

/**
 * Test all previously failing tables with schema-qualified names
 */
async function validateSchemaFix(): Promise<ValidationResult[]> {
  const testTables = [
    'public.module_access',
    'public.products', 
    'public.sales_reports',
    'public.deliveries',
    'public.user_profiles',
    'public.stations',
    'public.employees',
    'public.audit_logs',
    'public.sms_config',
    'public.sms_history'
  ];

  console.log('🔍 Validating Schema Consistency Fix...\n');
  console.log(`Testing ${testTables.length} tables with qualified names\n`);

  const results: ValidationResult[] = [];

  for (const table of testTables) {
    const startTime = Date.now();
    
    try {
      // Test basic select query with schema qualification
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      const queryTime = Date.now() - startTime;

      if (error) {
        // Check if it's the dreaded 42P01 error
        const is42P01Error = error.code === '42P01' || 
                            error.message.includes('does not exist') ||
                            error.message.includes('relation') && error.message.includes('does not exist');

        results.push({
          table,
          status: 'ERROR',
          error: `${error.code || 'UNKNOWN'}: ${error.message}`,
          queryTime
        });

        console.log(`❌ ${table}: ${is42P01Error ? '🚨 42P01 ERROR STILL EXISTS!' : 'Other error'}`);
        console.log(`   Error: ${error.message}\n`);
      } else {
        results.push({
          table,
          status: 'SUCCESS',
          queryTime
        });

        console.log(`✅ ${table}: Query successful (${queryTime}ms)`);
        console.log(`   Rows accessible: ${data?.length || 0}\n`);
      }

    } catch (error: any) {
      const queryTime = Date.now() - startTime;
      
      results.push({
        table,
        status: 'ERROR', 
        error: error.message || 'Unknown error',
        queryTime
      });

      console.log(`❌ ${table}: Unexpected error`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  return results;
}

/**
 * Generate validation summary report
 */
function generateReport(results: ValidationResult[]): void {
  const successful = results.filter(r => r.status === 'SUCCESS');
  const failed = results.filter(r => r.status === 'ERROR');
  const avgQueryTime = results.reduce((sum, r) => sum + (r.queryTime || 0), 0) / results.length;

  console.log('📊 VALIDATION SUMMARY REPORT');
  console.log('═'.repeat(50));
  console.log(`Total Tables Tested: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⏱️  Average Query Time: ${avgQueryTime.toFixed(2)}ms`);
  console.log(`🎯 Success Rate: ${((successful.length / results.length) * 100).toFixed(1)}%\n`);

  if (failed.length === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Schema consistency fix successfully resolved 42P01 errors');
    console.log('🚀 Ready for production deployment\n');
  } else {
    console.log('⚠️  Some tables still have issues:');
    failed.forEach(result => {
      console.log(`   • ${result.table}: ${result.error}`);
    });
    console.log('\n🔧 Additional investigation may be required\n');
  }

  // Check specifically for 42P01 errors
  const stillHas42P01 = failed.some(r => 
    r.error?.includes('42P01') || 
    r.error?.includes('does not exist')
  );

  if (stillHas42P01) {
    console.log('🚨 CRITICAL: 42P01 "relation does not exist" errors still present!');
    console.log('   This indicates the schema fix may not be complete.');
  }
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  try {
    const results = await validateSchemaFix();
    generateReport(results);
  } catch (error) {
    console.error('💥 Validation script failed:', error);
    process.exit(1);
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { validateSchemaFix, generateReport };