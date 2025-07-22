#!/usr/bin/env node

/**
 * Apply schema fixes to create missing tables like module_access
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Configure dotenv
dotenv.config({ path: '.env.local' });

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SCHEMA_FIXES_PATH = path.join(__dirname, '..', 'src', 'database', 'schema-fixes.sql');

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

async function applySchemaFixes() {
    console.log(`${colors.cyan}${colors.bright}🔧 Applying Schema Fixes${colors.reset}\n`);

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error(`${colors.red}❌ Missing required environment variables${colors.reset}`);
        process.exit(1);
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // Read schema fixes
        console.log(`${colors.blue}📖 Reading schema fixes file...${colors.reset}`);
        const schemaFixes = fs.readFileSync(SCHEMA_FIXES_PATH, 'utf8');
        
        // Split into individual statements
        const statements = schemaFixes
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
            .map(stmt => stmt + ';');

        console.log(`${colors.blue}📊 Found ${statements.length} SQL statements to execute${colors.reset}\n`);

        let successCount = 0;
        let errorCount = 0;

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const progress = Math.round(((i + 1) / statements.length) * 100);
            
            process.stdout.write(`\r${colors.yellow}⏳ Executing statement ${i + 1}/${statements.length} (${progress}%)${colors.reset}`);

            try {
                // Use raw SQL execution
                const { error } = await supabase.rpc('query', { query: statement }).catch(async (rpcError) => {
                    // If query RPC doesn't exist, try direct execution
                    const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': serviceRoleKey,
                            'Authorization': `Bearer ${serviceRoleKey}`,
                        },
                        body: JSON.stringify({
                            query: statement
                        })
                    });
                    
                    if (!response.ok) {
                        return { error: { message: await response.text() } };
                    }
                    return { error: null };
                });

                if (error) {
                    // Check if it's an expected error (already exists)
                    if (error.message?.includes('already exists') || 
                        error.message?.includes('duplicate')) {
                        successCount++;
                    } else {
                        errorCount++;
                        console.log(`\n${colors.red}❌ Error: ${error.message}${colors.reset}`);
                    }
                } else {
                    successCount++;
                }
            } catch (err) {
                errorCount++;
                console.log(`\n${colors.red}❌ Error: ${err.message}${colors.reset}`);
            }
        }

        // Clear progress line
        process.stdout.write('\r' + ' '.repeat(80) + '\r');

        // Check if module_access table exists now
        console.log(`\n${colors.blue}🔍 Verifying module_access table...${colors.reset}`);
        const { data, error } = await supabase
            .from('module_access')
            .select('*')
            .limit(1);

        if (!error || error.message?.includes('permission')) {
            console.log(`${colors.green}✅ module_access table is accessible${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ module_access table check failed: ${error.message}${colors.reset}`);
        }

        // Summary
        console.log(`\n${colors.cyan}${colors.bright}📊 Summary${colors.reset}`);
        console.log(`${colors.green}✅ Successful: ${successCount}${colors.reset}`);
        console.log(`${colors.red}❌ Failed: ${errorCount}${colors.reset}`);

        if (errorCount === 0) {
            console.log(`\n${colors.green}${colors.bright}🎉 Schema fixes applied successfully!${colors.reset}`);
        } else {
            console.log(`\n${colors.yellow}${colors.bright}⚠️  Schema fixes completed with some errors${colors.reset}`);
        }

    } catch (error) {
        console.error(`\n${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Run the script
applySchemaFixes().catch(console.error);
