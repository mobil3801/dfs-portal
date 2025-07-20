#!/usr/bin/env node

/**
 * Direct Supabase Migration Executor
 * Runs the database migration using service role key
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nehhjsiuhthflfwkfequ.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGhqc2l1aHRoZmxmd2tmZXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxMzE3NSwiZXhwIjoyMDY4NTg5MTc1fQ.7naT6l_oNH8VI5MaEKgJ19PoYw1EErv6-ftkEin12wE';

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Starting Supabase Database Migration...\n');
console.log(`Database URL: ${SUPABASE_URL}`);
console.log(`Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...`);
console.log('');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  try {
    // Test connection by trying to access a table
    const { error } = await supabase.from('test_table').select('*').limit(1);
    
    // Even if table doesn't exist, if we get a proper error response, connection works
    if (error && error.message.includes('does not exist')) {
      console.log('✅ Connection successful (table not found is expected)');
      return true;
    } else if (!error) {
      console.log('✅ Connection successful');
      return true;
    } else {
      console.log('❌ Connection failed:', error.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    return false;
  }
}

async function createTables() {
  console.log('🏗️  Creating database tables with complete schema...');
  
  // Complete database schema from our migration plan
  const COMPLETE_SCHEMA = `
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Gas Stations table
CREATE TABLE IF NOT EXISTS gas_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500),
    manager VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    station_id UUID REFERENCES gas_stations(id),
    status VARCHAR(50) DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Fuel Inventory table
CREATE TABLE IF NOT EXISTS fuel_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES gas_stations(id),
    fuel_type VARCHAR(100) NOT NULL,
    tank_number INTEGER,
    current_volume DECIMAL(10,2),
    capacity DECIMAL(10,2),
    reorder_level DECIMAL(10,2),
    cost_per_gallon DECIMAL(10,4),
    last_delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sales Transactions table
CREATE TABLE IF NOT EXISTS sales_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES gas_stations(id),
    user_id UUID REFERENCES users(id),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    fuel_type VARCHAR(100),
    gallons DECIMAL(10,3),
    price_per_gallon DECIMAL(10,4),
    payment_method VARCHAR(50),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Equipment Maintenance table
CREATE TABLE IF NOT EXISTS equipment_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES gas_stations(id),
    equipment_name VARCHAR(255) NOT NULL,
    maintenance_type VARCHAR(100),
    description TEXT,
    scheduled_date DATE,
    completed_date DATE,
    cost DECIMAL(10,2),
    technician VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Financial Reports table
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES gas_stations(id),
    report_date DATE NOT NULL,
    total_sales DECIMAL(12,2),
    fuel_sales DECIMAL(12,2),
    merchandise_sales DECIMAL(12,2),
    total_expenses DECIMAL(12,2),
    net_profit DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    fuel_types TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Fuel Orders table
CREATE TABLE IF NOT EXISTS fuel_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES gas_stations(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    fuel_type VARCHAR(100) NOT NULL,
    quantity_ordered DECIMAL(10,2) NOT NULL,
    quantity_received DECIMAL(10,2),
    unit_cost DECIMAL(10,4),
    total_cost DECIMAL(12,2),
    order_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Employee Shifts table
CREATE TABLE IF NOT EXISTS employee_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES gas_stations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
    shift_end TIMESTAMP WITH TIME ZONE,
    break_duration INTEGER DEFAULT 0,
    hours_worked DECIMAL(4,2),
    hourly_rate DECIMAL(8,2),
    total_pay DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gas_stations_status ON gas_stations(status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_station_id ON users(station_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_fuel_inventory_station_id ON fuel_inventory(station_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_station_id ON sales_transactions(station_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_station_id ON equipment_maintenance(station_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_station_date ON financial_reports(station_id, report_date);
CREATE INDEX IF NOT EXISTS idx_fuel_orders_station_id ON fuel_orders(station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_orders_supplier_id ON fuel_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_station_id ON employee_shifts(station_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_user_id ON employee_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE gas_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (permissive for service role)
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON gas_stations FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON users FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON audit_logs FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON fuel_inventory FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON sales_transactions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON equipment_maintenance FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON financial_reports FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON suppliers FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON fuel_orders FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON employee_shifts FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for service role" ON system_settings FOR ALL USING (true);
  `;

  try {
    console.log('   Executing complete database schema...');
    
    // Split the schema into individual statements
    const statements = COMPLETE_SCHEMA.split(';').filter(stmt => stmt.trim());
    let executedStatements = 0;
    let errors = [];

    for (const statement of statements) {
      const trimmedStmt = statement.trim();
      if (!trimmedStmt) continue;

      try {
        // Use Supabase client's raw SQL execution
        const { error } = await supabase.rpc('exec_sql', { sql: trimmedStmt });
        
        if (error) {
          // If exec_sql doesn't exist, we'll get an error, but we can still continue
          if (error.message.includes('function public.exec_sql')) {
            console.log('   ⚠️  exec_sql function not found, trying alternative approach...');
            break;
          }
          errors.push(`Statement failed: ${error.message}`);
        } else {
          executedStatements++;
        }
      } catch (err) {
        errors.push(`Statement error: ${err.message}`);
      }
    }

    if (executedStatements === 0) {
      console.log('   ⚠️  Direct SQL execution failed, providing manual instructions...');
      console.log('\n📋 MANUAL SETUP REQUIRED:');
      console.log('Since direct SQL execution is not available, please:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the schema from src/database/supabase-schema.sql');
      console.log('4. Execute the schema manually');
      console.log('\nAlternatively, the database tables should be created through normal application usage.');
      return false;
    }

    console.log(`   ✅ Executed ${executedStatements} SQL statements`);
    
    if (errors.length > 0) {
      console.log(`   ⚠️  ${errors.length} statements had errors`);
      errors.slice(0, 3).forEach(err => console.log(`      - ${err}`));
      if (errors.length > 3) {
        console.log(`      ... and ${errors.length - 3} more errors`);
      }
    }

    return executedStatements > 0;
    
  } catch (error) {
    console.log(`   ❌ Failed to execute schema: ${error.message}`);
    console.log('\n📋 MANUAL SETUP REQUIRED:');
    console.log('Please run the schema manually in Supabase dashboard SQL Editor');
    return false;
  }
}

async function verifyTables() {
  console.log('🔍 Verifying created tables...');
  
  const expectedTables = [
    'gas_stations', 'users', 'audit_logs', 'fuel_inventory',
    'sales_transactions', 'equipment_maintenance', 'financial_reports',
    'suppliers', 'fuel_orders', 'employee_shifts', 'system_settings'
  ];
  let tablesFound = 0;

  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      
      if (!error || error.message.includes('Results contain 0 rows')) {
        console.log(`   ✅ Table '${tableName}' exists`);
        tablesFound++;
      } else if (error.message.includes('does not exist')) {
        console.log(`   ❌ Table '${tableName}' not found`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking table '${tableName}': ${error.message}`);
    }
  }

  console.log(`\n📊 Verification Summary: ${tablesFound}/${expectedTables.length} tables found`);
  return tablesFound === expectedTables.length;
}

async function insertSampleData() {
  console.log('📝 Inserting sample data...');
  
  try {
    // Insert sample gas station
    const { error: stationError } = await supabase
      .from('gas_stations')
      .insert([
        {
          name: 'Main Street Gas Station',
          location: '123 Main Street, Springfield, IL 62701',
          manager: 'John Smith',
          phone: '(217) 555-0123',
          email: 'manager@mainstreetgas.com'
        }
      ]);

    if (stationError) {
      console.log(`   ❌ Failed to insert sample gas station: ${stationError.message}`);
      return false;
    } else {
      console.log('   ✅ Sample gas station inserted');
    }

    // Insert sample user
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          username: 'admin',
          email: 'admin@dfsportal.com',
          password_hash: '$2a$10$dummy_hash_for_demo_purposes',
          role: 'admin'
        }
      ]);

    if (userError) {
      console.log(`   ❌ Failed to insert sample user: ${userError.message}`);
      return false;
    } else {
      console.log('   ✅ Sample user inserted');
    }

    console.log('✅ Sample data inserted successfully');
    return true;
  } catch (error) {
    console.log(`❌ Failed to insert sample data: ${error.message}`);
    return false;
  }
}

async function runMigration() {
  console.log('🚀 Starting Complete Migration Process...\n');
  
  // Step 1: Test connection
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.log('\n❌ Migration failed: Cannot connect to Supabase');
    process.exit(1);
  }

  console.log('');

  // Step 2: Create tables
  const tablesSuccess = await createTables();
  if (!tablesSuccess) {
    console.log('\n⚠️  No tables were created. Check errors above.');
  }

  console.log('');

  // Step 3: Verify tables
  const verificationSuccess = await verifyTables();

  console.log('');

  // Step 4: Insert sample data (only if verification succeeded)
  if (verificationSuccess) {
    await insertSampleData();
  }

  console.log('\n🎉 Migration process completed!');
  console.log('\nNext steps:');
  console.log('1. Navigate to http://localhost:8080/admin/supabase-test');
  console.log('2. Test the connection to verify everything is working');
  console.log('3. Check your application functionality');
  
  if (!verificationSuccess) {
    console.log('\n⚠️  Some tables may not have been created properly.');
    console.log('You may need to run the SQL schema manually in Supabase dashboard.');
  }
}

// Execute migration
runMigration().catch(error => {
  console.error('❌ Migration failed with error:', error);
  process.exit(1);
});