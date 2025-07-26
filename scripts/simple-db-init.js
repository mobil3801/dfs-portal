#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
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

async function executeSQL(sql, description) {
    console.log(`📊 ${description}...`);
    try {
        const { data, error } = await supabase.rpc('query', { 
            query_text: sql 
        });
        
        if (error) {
            console.error(`❌ ${description} failed:`, error.message);
            return false;
        } else {
            console.log(`✅ ${description} completed`);
            return true;
        }
    } catch (err) {
        console.error(`💥 ${description} error:`, err.message);
        return false;
    }
}

async function initializeDatabase() {
    console.log('🚀 Initializing DFS Portal Database Schema...');
    console.log('===========================================\n');

    // 1. Enable extensions and create types
    await executeSQL(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        DO $$ BEGIN
            CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee', 'viewer');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `, 'Creating extensions and types');

    // 2. Create user_profiles table (most critical)
    await executeSQL(`
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
        );
    `, 'Creating user_profiles table');

    // 3. Create stations table
    await executeSQL(`
        DO $$ BEGIN
            CREATE TYPE station_status AS ENUM ('active', 'inactive', 'maintenance');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        
        CREATE TABLE IF NOT EXISTS stations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            station_id VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            station_name VARCHAR(255),
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
    `, 'Creating stations table');

    // 4. Create audit_logs table
    await executeSQL(`
        DO $$ BEGIN
            CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        
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
        );
    `, 'Creating audit_logs table');

    // 5. Enable RLS and create basic policies
    await executeSQL(`
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
        CREATE POLICY "Users can view own profile" ON user_profiles 
            FOR SELECT USING (auth.uid() = user_id);
            
        DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
        CREATE POLICY "Users can update own profile" ON user_profiles 
            FOR UPDATE USING (auth.uid() = user_id);
            
        DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
        CREATE POLICY "Admins can manage all profiles" ON user_profiles 
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_profiles up 
                    WHERE up.user_id = auth.uid() 
                    AND up.role = 'admin'
                )
            );
    `, 'Setting up Row Level Security');

    console.log('\n🔍 Verifying table creation...');
    try {
        const { data: userProfiles, error: upError } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1);
            
        if (upError) {
            console.error('❌ user_profiles verification failed:', upError.message);
        } else {
            console.log('✅ user_profiles table is accessible');
        }
    } catch (error) {
        console.error('❌ Verification error:', error.message);
    }

    console.log('\n🎉 Basic database schema initialization completed!');
}

// Execute
initializeDatabase().then(() => {
    console.log('\n🏁 Database initialization process complete.');
}).catch(error => {
    console.error('💥 Process failed:', error.message);
    process.exit(1);
});