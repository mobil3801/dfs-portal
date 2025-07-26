#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function initializeDatabase() {
    console.log('🚀 Initializing DFS Portal Database Schema...');
    console.log('===========================================\n');

    try {
        // Read and execute the schema file in smaller chunks
        const schemaContent = readFileSync('database/init-schema.sql', 'utf8');
        
        // Split the schema into logical sections to avoid timeout issues
        const sections = [
            // 1. Extensions and Types
            `-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for better data integrity
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE station_status AS ENUM ('active', 'inactive', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sms_status AS ENUM ('pending', 'sent', 'failed', 'delivered');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('scheduled', 'in_transit', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;`,

            // 2. Core Tables Part 1
            `-- Stations table (Table ID: 12599)
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    station_name VARCHAR(255), -- Alias for compatibility
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    status station_status DEFAULT 'active',
    manager_id UUID,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    fuel_types JSONB DEFAULT '[]',
    pump_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (Table ID: 11725)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    station_access JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,

            // 3. Core Tables Part 2
            `-- Employees table (Table ID: 11727)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    position VARCHAR(100),
    department VARCHAR(100),
    station_id UUID REFERENCES stations(id),
    hire_date DATE,
    termination_date DATE,
    salary DECIMAL(10, 2),
    hourly_rate DECIMAL(8, 2),
    is_active BOOLEAN DEFAULT true,
    emergency_contact JSONB DEFAULT '{}',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (Table ID: 11726)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    barcode VARCHAR(100),
    price DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    category_id UUID,
    brand_id UUID,
    unit VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    station_id UUID REFERENCES stations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,

            // 4. Continue with remaining tables...
            `-- Sales reports table (Table ID: 12356)
CREATE TABLE IF NOT EXISTS public.sales_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(50) UNIQUE,
    station_id UUID REFERENCES stations(id),
    report_date DATE NOT NULL,
    shift VARCHAR(50),
    total_sales DECIMAL(12, 2),
    fuel_sales DECIMAL(12, 2),
    non_fuel_sales DECIMAL(12, 2),
    cash_sales DECIMAL(12, 2),
    card_sales DECIMAL(12, 2),
    fuel_volume DECIMAL(10, 2),
    transaction_count INTEGER DEFAULT 0,
    report_data JSONB,
    status report_status DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliveries table (Table ID: 12196)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id VARCHAR(50) UNIQUE,
    station_id UUID REFERENCES stations(id),
    supplier_id UUID,
    delivery_date DATE NOT NULL,
    expected_time TIME,
    actual_time TIME,
    fuel_type VARCHAR(50),
    quantity_ordered DECIMAL(10, 2),
    quantity_delivered DECIMAL(10, 2),
    price_per_gallon DECIMAL(10, 4),
    total_cost DECIMAL(12, 2),
    driver_name VARCHAR(255),
    truck_number VARCHAR(100),
    delivery_notes TEXT,
    status delivery_status DEFAULT 'scheduled',
    created_by UUID REFERENCES auth.users(id),
    received_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module access table (Table ID: 25712)
CREATE TABLE IF NOT EXISTS public.module_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    module_name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
        ];

        let sectionNumber = 1;
        for (const section of sections) {
            console.log(`📊 Executing Section ${sectionNumber}/${sections.length}...`);
            
            const { error } = await supabase.rpc('exec_sql', { sql: section });
            
            if (error) {
                console.error(`❌ Section ${sectionNumber} failed:`, error.message);
                // Continue with other sections
            } else {
                console.log(`✅ Section ${sectionNumber} completed successfully`);
            }
            sectionNumber++;
        }

        // Try to execute remaining parts of the schema
        console.log('\n📊 Creating audit_logs table...');
        const auditLogsSQL = `
-- Audit logs table (Table ID: 12706)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    action_performed VARCHAR(255),
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    severity alert_severity DEFAULT 'low',
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

        const { error: auditError } = await supabase.rpc('exec_sql', { sql: auditLogsSQL });
        if (auditError) {
            console.error('❌ audit_logs creation failed:', auditError.message);
        } else {
            console.log('✅ audit_logs table created');
        }

        // Enable RLS on critical tables
        console.log('\n🔒 Enabling Row Level Security...');
        const rlsSQL = `
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
`;

        const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
        if (rlsError) {
            console.error('⚠️  RLS setup had issues:', rlsError.message);
        } else {
            console.log('✅ RLS policies created');
        }

        // Verify tables were created
        console.log('\n🔍 Verifying table creation...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['user_profiles', 'stations', 'products', 'sales_reports', 'deliveries', 'module_access']);

        if (tablesError) {
            console.error('❌ Table verification failed:', tablesError.message);
        } else {
            console.log('✅ Tables verified:', tables.map(t => t.table_name).join(', '));
        }

        console.log('\n🎉 Database schema initialization completed!');
        console.log('Ready to create admin user...');

    } catch (error) {
        console.error('💥 Database initialization failed:', error.message);
        console.error(error.stack);
    }
}

// Execute if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    initializeDatabase().then(() => {
        console.log('\n🏁 Database initialization process complete.');
    }).catch(error => {
        console.error('💥 Process failed:', error.message);
        process.exit(1);
    });
}

export { initializeDatabase };
