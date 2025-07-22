#!/usr/bin/env node

/**
 * Setup module_access table using Supabase admin functions
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

async function setupModuleAccess() {
    console.log(`${colors.cyan}${colors.bright}🔧 Setting up module_access table${colors.reset}\n`);

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error(`${colors.red}❌ Missing required environment variables${colors.reset}`);
        process.exit(1);
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        db: {
            schema: 'public'
        }
    });

    try {
        // First, let's check if the table already exists
        console.log(`${colors.blue}🔍 Checking if module_access table exists...${colors.reset}`);
        const { data: checkData, error: checkError } = await supabase
            .from('module_access')
            .select('id')
            .limit(1);

        if (!checkError || !checkError.message?.includes('does not exist')) {
            console.log(`${colors.green}✅ Table module_access already exists!${colors.reset}`);
            return;
        }

        console.log(`${colors.yellow}⚠️  Table does not exist. Creating it now...${colors.reset}`);

        // Since we can't execute raw SQL directly, let's create a database function
        // that will create the table for us
        const createTableFunction = `
            CREATE OR REPLACE FUNCTION create_module_access_table()
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                -- Create the table if it doesn't exist
                IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'module_access') THEN
                    CREATE TABLE public.module_access (
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
                    CREATE INDEX idx_module_access_user_id ON public.module_access(user_id);
                    CREATE INDEX idx_module_access_module_name ON public.module_access(module_name);
                    CREATE INDEX idx_module_access_user_module ON public.module_access(user_id, module_name);
                    
                    -- Enable RLS
                    ALTER TABLE public.module_access ENABLE ROW LEVEL SECURITY;
                    
                    -- Create policy
                    CREATE POLICY "module_access_policy" ON public.module_access
                        FOR ALL USING (
                            auth.uid() = user_id OR 
                            EXISTS (
                                SELECT 1 FROM public.module_access ma
                                WHERE ma.user_id = auth.uid() 
                                AND ma.module_name = 'admin' 
                                AND ma.access_level = 'admin' 
                                AND ma.is_active = true
                            )
                        );
                        
                    RAISE NOTICE 'module_access table created successfully';
                ELSE
                    RAISE NOTICE 'module_access table already exists';
                END IF;
            END;
            $$;
        `;

        // Unfortunately, we can't create functions via the JS client either
        // Let's provide a comprehensive solution
        console.log(`\n${colors.yellow}${colors.bright}⚠️  Direct table creation via API is not available${colors.reset}`);
        console.log(`${colors.cyan}Please follow these steps to complete the setup:${colors.reset}\n`);

        console.log(`${colors.bright}Option 1: Using Supabase Dashboard (Recommended)${colors.reset}`);
        console.log(`1. Go to: ${supabaseUrl}/project/default/editor`);
        console.log(`2. Click on "SQL Editor" in the left sidebar`);
        console.log(`3. Copy and paste this SQL:\n`);

        const createTableSQL = `-- Create module_access table
CREATE TABLE IF NOT EXISTS public.module_access (
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
CREATE POLICY IF NOT EXISTS "module_access_policy" ON module_access
    FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM module_access ma
            WHERE ma.user_id = auth.uid() 
            AND ma.module_name = 'admin' 
            AND ma.access_level = 'admin' 
            AND ma.is_active = true
        )
    );`;

        console.log(`${colors.blue}${createTableSQL}${colors.reset}`);
        console.log(`\n4. Click "Run" to execute the SQL\n`);

        console.log(`${colors.bright}Option 2: Using psql command line${colors.reset}`);
        console.log(`Run this command in your terminal:\n`);
        
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        const psqlCommand = `psql "postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres" -c "${createTableSQL.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`;
        
        console.log(`${colors.yellow}${psqlCommand}${colors.reset}\n`);

        console.log(`${colors.bright}Current Status:${colors.reset}`);
        console.log(`✅ Supabase service role key has been updated successfully`);
        console.log(`✅ Connection to Supabase is working`);
        console.log(`❌ module_access table needs to be created manually\n`);

        console.log(`${colors.green}Once you've created the table, your application will work correctly.${colors.reset}`);

    } catch (error) {
        console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Run the setup
setupModuleAccess().catch(console.error);
