import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

console.log('🚀 Advanced Supabase Database Migration...\n');
console.log('Database URL:', SUPABASE_URL);
console.log('Service Key:', SERVICE_ROLE_KEY ? `${SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT FOUND');
console.log('');

// Database schema definitions
const TABLE_SCHEMAS = {
  gas_stations: {
    id: 'SERIAL PRIMARY KEY',
    name: 'VARCHAR(255) NOT NULL',
    address: 'TEXT',
    phone: 'VARCHAR(50)',
    email: 'VARCHAR(255)',
    manager_id: 'INTEGER',
    status: 'VARCHAR(50) DEFAULT \'active\'',
    fuel_capacity: 'JSONB',
    operating_hours: 'JSONB',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  },
  users: {
    id: 'SERIAL PRIMARY KEY',
    username: 'VARCHAR(100) UNIQUE NOT NULL',
    email: 'VARCHAR(255) UNIQUE NOT NULL',
    password_hash: 'VARCHAR(255) NOT NULL',
    role: 'VARCHAR(50) DEFAULT \'employee\'',
    station_id: 'INTEGER',
    full_name: 'VARCHAR(255)',
    phone: 'VARCHAR(50)',
    hire_date: 'DATE',
    status: 'VARCHAR(50) DEFAULT \'active\'',
    last_login: 'TIMESTAMP WITH TIME ZONE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  },
  audit_logs: {
    id: 'SERIAL PRIMARY KEY',
    user_id: 'INTEGER',
    action: 'VARCHAR(100) NOT NULL',
    table_name: 'VARCHAR(100)',
    record_id: 'INTEGER',
    old_values: 'JSONB',
    new_values: 'JSONB',
    ip_address: 'INET',
    user_agent: 'TEXT',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  },
  fuel_inventory: {
    id: 'SERIAL PRIMARY KEY',
    station_id: 'INTEGER NOT NULL',
    fuel_type: 'VARCHAR(50) NOT NULL',
    tank_number: 'INTEGER NOT NULL',
    current_level: 'DECIMAL(10,2)',
    capacity: 'DECIMAL(10,2)',
    reorder_level: 'DECIMAL(10,2)',
    cost_per_gallon: 'DECIMAL(10,4)',
    supplier_id: 'INTEGER',
    last_delivery_date: 'DATE',
    last_updated: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  },
  sales_transactions: {
    id: 'SERIAL PRIMARY KEY',
    station_id: 'INTEGER NOT NULL',
    user_id: 'INTEGER',
    transaction_type: 'VARCHAR(50) NOT NULL',
    fuel_type: 'VARCHAR(50)',
    quantity: 'DECIMAL(10,3)',
    price_per_unit: 'DECIMAL(10,4)',
    total_amount: 'DECIMAL(12,2) NOT NULL',
    payment_method: 'VARCHAR(50)',
    pump_number: 'INTEGER',
    receipt_number: 'VARCHAR(100)',
    transaction_date: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  },
  equipment_maintenance: {
    id: 'SERIAL PRIMARY KEY',
    station_id: 'INTEGER NOT NULL',
    equipment_type: 'VARCHAR(100) NOT NULL',
    equipment_id: 'VARCHAR(100) NOT NULL',
    maintenance_type: 'VARCHAR(50) NOT NULL',
    description: 'TEXT',
    technician_id: 'INTEGER',
    scheduled_date: 'DATE',
    completed_date: 'DATE',
    cost: 'DECIMAL(10,2)',
    status: 'VARCHAR(50) DEFAULT \'scheduled\'',
    notes: 'TEXT',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  },
  financial_reports: {
    id: 'SERIAL PRIMARY KEY',
    station_id: 'INTEGER NOT NULL',
    report_type: 'VARCHAR(50) NOT NULL',
    report_period: 'VARCHAR(50) NOT NULL',
    start_date: 'DATE NOT NULL',
    end_date: 'DATE NOT NULL',
    total_sales: 'DECIMAL(12,2)',
    total_fuel_sold: 'DECIMAL(10,2)',
    total_expenses: 'DECIMAL(12,2)',
    net_profit: 'DECIMAL(12,2)',
    report_data: 'JSONB',
    generated_by: 'INTEGER',
    generated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  },
  suppliers: {
    id: 'SERIAL PRIMARY KEY',
    name: 'VARCHAR(255) NOT NULL',
    contact_person: 'VARCHAR(255)',
    phone: 'VARCHAR(50)',
    email: 'VARCHAR(255)',
    address: 'TEXT',
    fuel_types: 'JSONB',
    contract_terms: 'TEXT',
    payment_terms: 'VARCHAR(100)',
    status: 'VARCHAR(50) DEFAULT \'active\'',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  },
  fuel_orders: {
    id: 'SERIAL PRIMARY KEY',
    station_id: 'INTEGER NOT NULL',
    supplier_id: 'INTEGER NOT NULL',
    fuel_type: 'VARCHAR(50) NOT NULL',
    quantity_ordered: 'DECIMAL(10,2) NOT NULL',
    quantity_received: 'DECIMAL(10,2)',
    price_per_gallon: 'DECIMAL(10,4)',
    total_cost: 'DECIMAL(12,2)',
    order_date: 'DATE NOT NULL',
    expected_delivery: 'DATE',
    actual_delivery: 'DATE',
    status: 'VARCHAR(50) DEFAULT \'pending\'',
    delivery_notes: 'TEXT',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  },
  employee_shifts: {
    id: 'SERIAL PRIMARY KEY',
    user_id: 'INTEGER NOT NULL',
    station_id: 'INTEGER NOT NULL',
    shift_date: 'DATE NOT NULL',
    start_time: 'TIME NOT NULL',
    end_time: 'TIME',
    scheduled_hours: 'DECIMAL(5,2)',
    actual_hours: 'DECIMAL(5,2)',
    hourly_rate: 'DECIMAL(8,2)',
    total_pay: 'DECIMAL(10,2)',
    status: 'VARCHAR(50) DEFAULT \'scheduled\'',
    notes: 'TEXT',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  },
  system_settings: {
    id: 'SERIAL PRIMARY KEY',
    setting_key: 'VARCHAR(100) UNIQUE NOT NULL',
    setting_value: 'TEXT',
    setting_type: 'VARCHAR(50) DEFAULT \'string\'',
    description: 'TEXT',
    category: 'VARCHAR(50)',
    is_public: 'BOOLEAN DEFAULT FALSE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
  }
};

// RLS Policies
const RLS_POLICIES = {
  gas_stations: [
    "CREATE POLICY \"Users can view stations\" ON gas_stations FOR SELECT USING (auth.role() = 'authenticated');",
    "CREATE POLICY \"Managers can modify stations\" ON gas_stations FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));"
  ],
  users: [
    "CREATE POLICY \"Users can view own profile\" ON users FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'service_role');",
    "CREATE POLICY \"Admins can manage users\" ON users FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');"
  ],
  audit_logs: [
    "CREATE POLICY \"Service role can access audit logs\" ON audit_logs FOR ALL USING (auth.role() = 'service_role');",
    "CREATE POLICY \"Admins can view audit logs\" ON audit_logs FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');"
  ],
  fuel_inventory: [
    "CREATE POLICY \"Authenticated users can view inventory\" ON fuel_inventory FOR SELECT USING (auth.role() = 'authenticated');",
    "CREATE POLICY \"Managers can modify inventory\" ON fuel_inventory FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));"
  ],
  sales_transactions: [
    "CREATE POLICY \"Users can view station transactions\" ON sales_transactions FOR SELECT USING (auth.role() = 'authenticated');",
    "CREATE POLICY \"Service role can manage transactions\" ON sales_transactions FOR ALL USING (auth.role() = 'service_role');"
  ],
  equipment_maintenance: [
    "CREATE POLICY \"Authenticated users can view maintenance\" ON equipment_maintenance FOR SELECT USING (auth.role() = 'authenticated');",
    "CREATE POLICY \"Managers can modify maintenance\" ON equipment_maintenance FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));"
  ],
  financial_reports: [
    "CREATE POLICY \"Managers can access reports\" ON financial_reports FOR SELECT USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));",
    "CREATE POLICY \"Service role can manage reports\" ON financial_reports FOR ALL USING (auth.role() = 'service_role');"
  ],
  suppliers: [
    "CREATE POLICY \"Authenticated users can view suppliers\" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');",
    "CREATE POLICY \"Managers can modify suppliers\" ON suppliers FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));"
  ],
  fuel_orders: [
    "CREATE POLICY \"Authenticated users can view orders\" ON fuel_orders FOR SELECT USING (auth.role() = 'authenticated');",
    "CREATE POLICY \"Managers can modify orders\" ON fuel_orders FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));"
  ],
  employee_shifts: [
    "CREATE POLICY \"Users can view own shifts\" ON employee_shifts FOR SELECT USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');",
    "CREATE POLICY \"Managers can manage shifts\" ON employee_shifts FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));"
  ],
  system_settings: [
    "CREATE POLICY \"Public settings are viewable\" ON system_settings FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');",
    "CREATE POLICY \"Only admins can modify settings\" ON system_settings FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');"
  ]
};

async function executeSQL(sql, description = '') {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql })
    });

    if (response.ok) {
      console.log(`✅ ${description || 'SQL executed successfully'}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ ${description || 'SQL execution failed'}: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description || 'SQL execution error'}: ${error.message}`);
    return false;
  }
}

async function createTableDirectly(tableName, schema) {
  const columns = Object.entries(schema)
    .map(([col, type]) => `${col} ${type}`)
    .join(',\n    ');
  
  const createSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (
    ${columns}
);`;

  console.log(`📋 Creating table: ${tableName}`);
  console.log('   SQL:', createSQL.substring(0, 100) + '...');
  
  try {
    // Try direct HTTP request to PostgreSQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ 
        sql: createSQL 
      })
    });

    if (response.ok) {
      console.log(`   ✅ Table ${tableName} created successfully`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed to create ${tableName}: ${response.status} - ${errorText}`);
      
      // Try alternative approach using raw SQL
      return await createTableAlternative(tableName, createSQL);
    }
  } catch (error) {
    console.log(`   ❌ Error creating ${tableName}: ${error.message}`);
    return await createTableAlternative(tableName, createSQL);
  }
}

async function createTableAlternative(tableName, createSQL) {
  console.log(`   🔄 Trying alternative creation method for ${tableName}...`);
  
  try {
    // Alternative: Use Supabase management API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        query: createSQL
      })
    });

    if (response.ok) {
      console.log(`   ✅ Alternative method succeeded for ${tableName}`);
      return true;
    } else {
      console.log(`   ⚠️  Alternative method failed for ${tableName}`);
      console.log('   💡 Manual creation required - SQL provided below');
      console.log('   📋 SQL:', createSQL);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Alternative method error: ${error.message}`);
    console.log('   📋 SQL for manual execution:', createSQL);
    return false;
  }
}

async function enableRLS(tableName) {
  const rlsSQL = `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`;
  console.log(`🔒 Enabling RLS for ${tableName}`);
  return await executeSQL(rlsSQL, `RLS enabled for ${tableName}`);
}

async function createPolicies(tableName, policies) {
  console.log(`🛡️  Creating policies for ${tableName}`);
  let success = true;
  
  for (const policy of policies) {
    const result = await executeSQL(policy, `Policy created for ${tableName}`);
    if (!result) success = false;
  }
  
  return success;
}

async function verifyTableExists(tableName) {
  try {
    const response = await fetch(`${SUPABASE_REST_URL}/${tableName}?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });

    const exists = response.ok;
    console.log(`   ${exists ? '✅' : '❌'} Table '${tableName}' ${exists ? 'exists' : 'not found'}`);
    return exists;
  } catch (error) {
    console.log(`   ❌ Error checking ${tableName}: ${error.message}`);
    return false;
  }
}

async function insertSampleData() {
  console.log('\n📊 Inserting sample data...');
  
  const sampleData = [
    {
      table: 'gas_stations',
      data: [{
        name: 'Main Street Station',
        address: '123 Main Street, City, State 12345',
        phone: '(555) 123-4567',
        email: 'main@station.com',
        status: 'active',
        fuel_capacity: '{"regular": 10000, "premium": 5000, "diesel": 8000}',
        operating_hours: '{"monday": "6:00-22:00", "tuesday": "6:00-22:00", "wednesday": "6:00-22:00", "thursday": "6:00-22:00", "friday": "6:00-23:00", "saturday": "7:00-23:00", "sunday": "8:00-20:00"}'
      }]
    },
    {
      table: 'users',
      data: [{
        username: 'admin',
        email: 'admin@station.com',
        password_hash: '$2b$10$example.hash.placeholder',
        role: 'admin',
        full_name: 'System Administrator',
        status: 'active'
      }]
    },
    {
      table: 'system_settings',
      data: [
        {
          setting_key: 'app_version',
          setting_value: '1.0.0',
          setting_type: 'string',
          description: 'Application version',
          category: 'system',
          is_public: true
        },
        {
          setting_key: 'maintenance_mode',
          setting_value: 'false',
          setting_type: 'boolean',
          description: 'Maintenance mode toggle',
          category: 'system',
          is_public: false
        }
      ]
    }
  ];

  for (const { table, data } of sampleData) {
    console.log(`   📋 Inserting sample data into ${table}...`);
    
    try {
      for (const record of data) {
        const response = await fetch(`${SUPABASE_REST_URL}/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(record)
        });

        if (response.ok) {
          console.log(`   ✅ Sample data inserted into ${table}`);
        } else {
          const error = await response.text();
          console.log(`   ⚠️  Could not insert sample data into ${table}: ${error}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error inserting sample data into ${table}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting Complete Migration Process...\n');
  
  let successCount = 0;
  let totalTables = Object.keys(TABLE_SCHEMAS).length;

  // Step 1: Create all tables
  console.log('🏗️  Creating database tables with complete schema...');
  for (const [tableName, schema] of Object.entries(TABLE_SCHEMAS)) {
    const success = await createTableDirectly(tableName, schema);
    if (success) successCount++;
  }

  // Step 2: Enable RLS on all tables
  console.log('\n🔒 Enabling Row Level Security...');
  for (const tableName of Object.keys(TABLE_SCHEMAS)) {
    await enableRLS(tableName);
  }

  // Step 3: Create RLS policies
  console.log('\n🛡️  Creating Row Level Security Policies...');
  for (const [tableName, policies] of Object.entries(RLS_POLICIES)) {
    await createPolicies(tableName, policies);
  }

  // Step 4: Insert sample data
  await insertSampleData();

  // Step 5: Verify all tables
  console.log('\n🔍 Verifying created tables...');
  let verifiedCount = 0;
  for (const tableName of Object.keys(TABLE_SCHEMAS)) {
    const exists = await verifyTableExists(tableName);
    if (exists) verifiedCount++;
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Tables Created: ${successCount}/${totalTables}`);
  console.log(`   Tables Verified: ${verifiedCount}/${totalTables}`);
  console.log(`   Success Rate: ${Math.round((verifiedCount/totalTables)*100)}%`);

  if (verifiedCount === totalTables) {
    console.log('\n🎉 ✅ MIGRATION COMPLETED SUCCESSFULLY! 🎉');
    console.log('\nNext steps:');
    console.log('1. Navigate to http://localhost:8080/admin/supabase-test');
    console.log('2. Verify connection shows 🟢 CONNECTED');
    console.log('3. Test application functionality');
  } else {
    console.log('\n⚠️  PARTIAL MIGRATION COMPLETED');
    console.log('\nSome tables may need manual creation. Check the SQL statements above.');
    console.log('You can also run individual table creation commands manually.');
  }

  console.log('\n🔗 Useful links:');
  console.log(`   Supabase Dashboard: https://supabase.com/dashboard/project/nehhjsiuhthflfwkfequ`);
  console.log(`   Application: http://localhost:8080`);
  console.log(`   Test Page: http://localhost:8080/admin/supabase-test`);
}

// Execute migration
main().catch(error => {
  console.error('🚨 Migration failed:', error);
  process.exit(1);
});