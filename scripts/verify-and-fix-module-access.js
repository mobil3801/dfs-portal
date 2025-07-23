#!/usr/bin/env node

/**
 * Script to verify and fix the module_access table schema
 * This addresses the missing 'create_enabled' column issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkModuleAccessSchema() {
  console.log('🔍 Checking module_access table schema...');
  
  try {
    // Check if the table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'module_access')
      .order('ordinal_position');

    if (tableError) {
      console.error('Error checking table:', tableError);
      return false;
    }

    if (!tableInfo || tableInfo.length === 0) {
      console.error('❌ module_access table does not exist');
      return false;
    }

    console.log('📋 Current columns in module_access:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // Check for create_enabled column
    const hasCreateEnabled = tableInfo.some(col => col.column_name === 'create_enabled');
    const hasEditEnabled = tableInfo.some(col => col.column_name === 'edit_enabled');
    const hasDeleteEnabled = tableInfo.some(col => col.column_name === 'delete_enabled');

    console.log('\n🔍 Missing columns check:');
    console.log(`  create_enabled: ${hasCreateEnabled ? '✅' : '❌'}`);
    console.log(`  edit_enabled: ${hasEditEnabled ? '✅' : '❌'}`);
    console.log(`  delete_enabled: ${hasDeleteEnabled ? '✅' : '❌'}`);

    if (!hasCreateEnabled || !hasEditEnabled || !hasDeleteEnabled) {
      console.log('\n🛠️ Applying schema fixes...');
      
      // Apply the schema fix
      const { error: fixError } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$
          BEGIN
            -- Add create_enabled column
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'module_access' AND column_name = 'create_enabled'
            ) THEN
                ALTER TABLE module_access ADD COLUMN create_enabled BOOLEAN DEFAULT false;
            END IF;

            -- Add edit_enabled column
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'module_access' AND column_name = 'edit_enabled'
            ) THEN
                ALTER TABLE module_access ADD COLUMN edit_enabled BOOLEAN DEFAULT false;
            END IF;

            -- Add delete_enabled column
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'module_access' AND column_name = 'delete_enabled'
            ) THEN
                ALTER TABLE module_access ADD COLUMN delete_enabled BOOLEAN DEFAULT false;
            END IF;

            -- Update existing records
            UPDATE module_access 
            SET 
                create_enabled = COALESCE(create_enabled, true),
                edit_enabled = COALESCE(edit_enabled, true),
                delete_enabled = COALESCE(delete_enabled, true)
            WHERE module_name IN ('orders', 'products', 'employees', 'vendors', 'licenses');

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_module_access_create_enabled ON module_access(create_enabled);
            CREATE INDEX IF NOT EXISTS idx_module_access_user_module ON module_access(user_id, module_name);
          END $$;
        `
      });

      if (fixError) {
        console.error('❌ Error applying fixes:', fixError);
        return false;
      }

      console.log('✅ Schema fixes applied successfully!');
      
      // Re-check the schema
      return checkModuleAccessSchema();
    }

    console.log('✅ All required columns exist!');
    return true;

  } catch (error) {
    console.error('❌ Error checking schema:', error);
    return false;
  }
}

async function testOrdersModuleCreation() {
  console.log('\n🧪 Testing orders module creation...');
  
  try {
    // Try to create a test module access record for orders
    const { data, error } = await supabase
      .from('module_access')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
        module_name: 'orders',
        access_level: 'full',
        is_active: true,
        create_enabled: true,
        edit_enabled: true,
        delete_enabled: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating orders module access:', error);
      return false;
    }

    console.log('✅ Successfully created orders module access record:', data);
    
    // Clean up test record
    await supabase
      .from('module_access')
      .delete()
      .eq('id', data.id);

    return true;

  } catch (error) {
    console.error('❌ Error testing orders module:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting module_access schema verification...\n');
  
  const schemaOk = await checkModuleAccessSchema();
  
  if (schemaOk) {
    console.log('\n✅ Schema verification complete!');
    
    const testOk = await testOrdersModuleCreation();
    if (testOk) {
      console.log('✅ Orders module creation test passed!');
    } else {
      console.log('❌ Orders module creation test failed!');
    }
  } else {
    console.log('\n❌ Schema verification failed!');
    process.exit(1);
  }
}

// Run the verification
main().catch(console.error);
