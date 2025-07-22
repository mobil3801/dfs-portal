#!/usr/bin/env node

/**
 * Create module_access table in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config({ path: '.env.local' });

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

async function createModuleAccessTable() {
    console.log(`${colors.cyan}${colors.bright}🔧 Creating module_access table${colors.reset}\n`);

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error(`${colors.red}❌ Missing required environment variables${colors.reset}`);
        process.exit(1);
    }

    console.log(`${colors.blue}📌 Supabase URL: ${supabaseUrl}${colors.reset}`);
    console.log(`${colors.blue}🔑 Using service role key${colors.reset}\n`);

    // Since direct SQL execution is challenging, let's provide the SQL for manual execution
    const createTableSQL = `
-- Create module_access table
CREATE TABLE IF NOT EXISTS module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    access_level VARCHAR(50) NOT NULL DEFAULT 'read',
    is_active BOOLEAN DEFAULT true,
    granted_by UUID,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_module_access_user_id ON module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_module_access_module_name ON module_access(module_name);
CREATE INDEX IF NOT EXISTS idx_module_access_user_module ON module_access(user_id, module_name);

-- Enable RLS
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "module_access_policy" ON module_access
    FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM module_access ma
            WHERE ma.user_id = auth.uid() 
            AND ma.module_name = 'admin' 
            AND ma.access_level = 'admin' 
            AND ma.is_active = true
        )
    );
`;

    console.log(`${colors.yellow}${colors.bright}📋 SQL to create module_access table:${colors.reset}\n`);
    console.log('```sql');
    console.log(createTableSQL);
    console.log('```\n');

    console.log(`${colors.cyan}${colors.bright}Instructions:${colors.reset}`);
    console.log(`1. Go to your Supabase dashboard: ${supabaseUrl}`);
    console.log(`2. Navigate to the SQL Editor`);
    console.log(`3. Copy and paste the SQL above`);
    console.log(`4. Click "Run" to execute the SQL`);
    console.log(`\n${colors.green}This will create the module_access table with proper indexes and RLS policies.${colors.reset}`);

    // Try to check if table exists
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    console.log(`\n${colors.blue}🔍 Checking current table status...${colors.reset}`);
    const { data, error } = await supabase
        .from('module_access')
        .select('*')
        .limit(1);

    if (!error) {
        console.log(`${colors.green}✅ Table already exists and is accessible!${colors.reset}`);
    } else if (error.message?.includes('does not exist')) {
        console.log(`${colors.red}❌ Table does not exist yet. Please run the SQL above in Supabase.${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  Table might exist but has access issues: ${error.message}${colors.reset}`);
    }
}

// Run the script
createModuleAccessTable().catch(console.error);
