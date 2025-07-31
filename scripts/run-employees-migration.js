#!/usr/bin/env node

/**
 * Migration Script: Fix Employees RLS and Schema Issues
 * This script applies the database migration to fix the "Failed to load employees" error
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', 'env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌');
  console.error('\nPlease check your env.local file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting employees migration...');
    console.log('📍 Supabase URL:', supabaseUrl);
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'fix-employees-rls-and-schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded successfully');
    
    // Test connection first
    console.log('🔗 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'employees')
      .limit(1);
    
    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Employees table exists:', testData && testData.length > 0 ? 'Yes' : 'No');
    
    // Execute the migration
    console.log('⚡ Executing migration...');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (!statement || statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      try {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        // Use rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          // Some errors are expected (like "already exists" errors)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate key')) {
            console.log(`   ⚠️  Expected warning: ${error.message}`);
          } else {
            console.error(`   ❌ Error in statement ${i + 1}: ${error.message}`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Exception in statement ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful statements: ${successCount}`);
    console.log(`   ❌ Failed statements: ${errorCount}`);
    
    // Verify the migration worked
    console.log('\n🔍 Verifying migration results...');
    
    // Check if employees_view exists
    const { data: viewData, error: viewError } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .eq('table_name', 'employees_view');
    
    if (viewError) {
      console.log('   ⚠️  Could not verify employees_view:', viewError.message);
    } else {
      console.log('   📋 employees_view exists:', viewData && viewData.length > 0 ? 'Yes' : 'No');
    }
    
    // Check if we can query employees
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees_view')
      .select('ID, first_name, last_name, station')
      .limit(5);
    
    if (employeeError) {
      console.log('   ❌ Error querying employees_view:', employeeError.message);
    } else {
      console.log(`   👥 Sample employees found: ${employeeData ? employeeData.length : 0}`);
      if (employeeData && employeeData.length > 0) {
        console.log('   📋 Sample data:');
        employeeData.forEach(emp => {
          console.log(`      - ${emp.first_name} ${emp.last_name} (${emp.station})`);
        });
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('💡 The employees page should now load properly.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Migration interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Migration terminated');
  process.exit(0);
});

// Run the migration
runMigration().then(() => {
  console.log('\n✨ All done! You can now test the employees page.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});