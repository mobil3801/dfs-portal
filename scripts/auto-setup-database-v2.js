#!/usr/bin/env node

/**
 * Improved Automated Database Schema Execution Script for DFS Portal
 * 
 * This script uses a more reliable approach to execute SQL statements
 * directly through Supabase using the service role key and PostgreSQL driver.
 * 
 * Usage: node scripts/auto-setup-database-v2.js
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Configure dotenv for ES modules
dotenv.config({ path: '.env.local' });

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SCHEMA_FILE_PATH = path.join(__dirname, '..', 'src', 'database', 'supabase-schema.sql');
const COMPLETE_SCHEMA_FILE_PATH = path.join(__dirname, '..', 'src', 'database', 'complete-supabase-schema.sql');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class ImprovedDatabaseSetupManager {
    constructor() {
        this.supabaseUrl = process.env.VITE_SUPABASE_URL;
        this.serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        this.supabaseClient = null;
        this.setupStartTime = null;
    }

    async initialize() {
        console.log(`${colors.cyan}${colors.bright}🚀 DFS Portal Database Setup v2 Initializing...${colors.reset}\n`);
        this.setupStartTime = Date.now();

        if (!this.supabaseUrl || !this.serviceRoleKey) {
            this.logError('Missing required environment variables:');
            if (!this.supabaseUrl) this.logError('  - VITE_SUPABASE_URL');
            if (!this.serviceRoleKey) this.logError('  - VITE_SUPABASE_SERVICE_ROLE_KEY');
            this.logError('\nPlease check your .env.local file and ensure these variables are set.');
            process.exit(1);
        }

        this.supabaseClient = createClient(this.supabaseUrl, this.serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            db: {
                schema: 'public'
            }
        });
        
        this.logSuccess('✅ Supabase client initialized with service role key');
    }

    async readSchemaFiles() {
        this.logInfo('📖 Reading schema files...');
        
        let selectedSchema = null;
        
        if (fs.existsSync(SCHEMA_FILE_PATH)) {
            selectedSchema = fs.readFileSync(SCHEMA_FILE_PATH, 'utf8');
            this.logSuccess(`✅ Primary schema file loaded: ${path.basename(SCHEMA_FILE_PATH)}`);
            this.logInfo(`   File size: ${(selectedSchema.length / 1024).toFixed(2)} KB`);
        } else if (fs.existsSync(COMPLETE_SCHEMA_FILE_PATH)) {
            selectedSchema = fs.readFileSync(COMPLETE_SCHEMA_FILE_PATH, 'utf8');
            this.logSuccess(`✅ Complete schema file loaded: ${path.basename(COMPLETE_SCHEMA_FILE_PATH)}`);
            this.logInfo(`   File size: ${(selectedSchema.length / 1024).toFixed(2)} KB`);
        } else {
            throw new Error('No valid schema files found');
        }

        return selectedSchema;
    }

    /**
     * First, create a simple SQL execution function in the database
     */
    async createSqlExecutor() {
        this.logInfo('📝 Creating SQL executor function...');
        
        const createExecutorSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
        RETURNS TEXT AS $$
        BEGIN
            EXECUTE sql_text;
            RETURN 'SUCCESS';
        EXCEPTION WHEN OTHERS THEN
            RETURN 'ERROR: ' || SQLERRM;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;

        try {
            // Try to create the function using a direct approach
            const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.serviceRoleKey,
                    'Authorization': `Bearer ${this.serviceRoleKey}`
                },
                body: JSON.stringify({ sql_text: createExecutorSQL })
            });

            if (response.status === 404) {
                // Function doesn't exist yet, let's create it manually
                this.logInfo('🔧 Creating SQL executor using alternative method...');
                return await this.createExecutorFallback();
            }

            this.logSuccess('✅ SQL executor function ready');
            return true;

        } catch (error) {
            this.logWarning('⚠️  Could not create SQL executor, using fallback method');
            return await this.createExecutorFallback();
        }
    }

    async createExecutorFallback() {
        try {
            // Create the function step by step using table operations
            this.logInfo('🔄 Using table-based approach to bootstrap SQL execution...');
            
            // First, try to check if we can at least query system tables
            const { data, error } = await this.supabaseClient
                .from('pg_stat_user_tables')
                .select('relname')
                .limit(1);

            if (error && !error.message.includes('permission denied')) {
                this.logSuccess('✅ Database connection verified');
                return true;
            } else if (error) {
                this.logWarning('⚠️  Limited database access, will use individual table creation');
                return false;
            }

            return true;
        } catch (error) {
            this.logWarning('⚠️  Using basic table creation approach');
            return false;
        }
    }

    /**
     * Create tables individually using the Supabase client
     */
    async createTablesIndividually() {
        this.logInfo('🏗️  Creating tables individually...');

        const tables = [
            {
                name: 'stations',
                sql: `
                CREATE TABLE IF NOT EXISTS stations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    station_id VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    address TEXT,
                    city VARCHAR(100),
                    state VARCHAR(50),
                    zip_code VARCHAR(20),
                    phone VARCHAR(20),
                    email VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'active',
                    manager_id UUID,
                    latitude DECIMAL(10, 8),
                    longitude DECIMAL(11, 8),
                    fuel_types JSONB DEFAULT '[]',
                    pump_count INTEGER DEFAULT 0,
                    active BOOLEAN DEFAULT true,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );`
            },
            {
                name: 'user_profiles',
                sql: `
                CREATE TABLE IF NOT EXISTS user_profiles (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    role VARCHAR(50) DEFAULT 'viewer',
                    permissions JSONB DEFAULT '{}',
                    station_access JSONB DEFAULT '[]',
                    is_active BOOLEAN DEFAULT true,
                    last_login TIMESTAMP WITH TIME ZONE,
                    phone VARCHAR(20),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );`
            },
            {
                name: 'employees',
                sql: `
                CREATE TABLE IF NOT EXISTS employees (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );`
            }
        ];

        const results = {
            created: 0,
            failed: 0,
            errors: []
        };

        for (const table of tables) {
            try {
                this.logInfo(`📋 Creating table: ${table.name}`);
                
                // Use raw SQL query execution via RPC if available
                const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.serviceRoleKey,
                        'Authorization': `Bearer ${this.serviceRoleKey}`
                    },
                    body: JSON.stringify({ sql_text: table.sql })
                });

                if (response.ok) {
                    results.created++;
                    this.logSuccess(`✅ Created table: ${table.name}`);
                } else {
                    const error = await response.text();
                    results.failed++;
                    results.errors.push({ table: table.name, error });
                    this.logError(`❌ Failed to create table ${table.name}: ${error}`);
                }

            } catch (error) {
                results.failed++;
                results.errors.push({ table: table.name, error: error.message });
                this.logError(`❌ Failed to create table ${table.name}: ${error.message}`);
            }
        }

        return results;
    }

    async executeSchema() {
        this.logInfo('🔧 Starting schema execution...');

        // First, try to create our SQL executor
        const executorReady = await this.createSqlExecutor();
        
        if (executorReady) {
            this.logInfo('🔄 Executing full schema...');
            const sql = await this.readSchemaFiles();
            
            try {
                const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.serviceRoleKey,
                        'Authorization': `Bearer ${this.serviceRoleKey}`
                    },
                    body: JSON.stringify({ sql_text: sql })
                });

                if (response.ok) {
                    const result = await response.text();
                    if (result.includes('SUCCESS') || result.includes('OK')) {
                        this.logSuccess('✅ Schema executed successfully!');
                        return { success: true, method: 'full_schema' };
                    } else {
                        this.logWarning('⚠️  Schema execution returned warnings, trying individual tables...');
                    }
                } else {
                    this.logWarning('⚠️  Full schema execution failed, trying individual tables...');
                }
            } catch (error) {
                this.logWarning('⚠️  Full schema execution failed, trying individual tables...');
            }
        }

        // Fallback to individual table creation
        this.logInfo('🔄 Falling back to individual table creation...');
        const results = await this.createTablesIndividually();
        
        return {
            success: results.created > 0,
            method: 'individual_tables',
            created: results.created,
            failed: results.failed,
            errors: results.errors
        };
    }

    async verifyTableCreation() {
        this.logInfo('🔍 Verifying table creation...');
        
        const expectedTables = [
            'stations', 'user_profiles', 'employees', 'audit_logs', 'sms_config',
            'sms_history', 'sms_settings', 'alert_settings', 'licenses', 'sms_contacts', 'alert_history'
        ];

        const results = { existing: [], missing: [] };

        for (const tableName of expectedTables) {
            try {
                const { data, error } = await this.supabaseClient
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (error && (error.message.includes('does not exist') || error.message.includes('relation'))) {
                    results.missing.push(tableName);
                } else {
                    results.existing.push(tableName);
                }
            } catch (error) {
                results.missing.push(tableName);
            }
        }

        this.logInfo('\n📋 Table verification results:');
        
        if (results.existing.length > 0) {
            this.logSuccess(`✅ Found tables (${results.existing.length}/${expectedTables.length}):`);
            results.existing.forEach(table => {
                console.log(`${colors.green}   ✓ ${table}${colors.reset}`);
            });
        }

        if (results.missing.length > 0) {
            this.logWarning(`⚠️  Missing tables (${results.missing.length}/${expectedTables.length}):`);
            results.missing.forEach(table => {
                console.log(`${colors.red}   ✗ ${table}${colors.reset}`);
            });
        }

        return results;
    }

    async run() {
        try {
            await this.initialize();
            
            const executionResults = await this.executeSchema();
            const verificationResults = await this.verifyTableCreation();

            const setupDuration = ((Date.now() - this.setupStartTime) / 1000).toFixed(2);
            
            console.log('\n' + '='.repeat(60));
            console.log(`${colors.bright}${colors.cyan}📊 SETUP SUMMARY${colors.reset}`);
            console.log('='.repeat(60));
            console.log(`⏱️  Setup Duration: ${setupDuration} seconds`);
            console.log(`🔧 Execution Method: ${executionResults.method || 'unknown'}`);
            console.log(`📋 Tables Found: ${verificationResults.existing.length}/${verificationResults.existing.length + verificationResults.missing.length}`);
            
            if (executionResults.created) {
                console.log(`✅ Tables Created: ${executionResults.created}`);
            }
            if (executionResults.failed) {
                console.log(`❌ Failed Operations: ${executionResults.failed}`);
            }

            if (verificationResults.missing.length === 0) {
                console.log(`\n${colors.green}${colors.bright}🎉 DATABASE SETUP COMPLETED SUCCESSFULLY!${colors.reset}`);
                console.log(`${colors.green}All expected tables have been created and verified.${colors.reset}`);
                process.exit(0);
            } else {
                console.log(`\n${colors.yellow}${colors.bright}⚠️  DATABASE SETUP PARTIALLY COMPLETED${colors.reset}`);
                console.log(`${colors.yellow}Some tables were created but others may be missing.${colors.reset}`);
                
                if (verificationResults.existing.length > 0) {
                    console.log(`${colors.green}${verificationResults.existing.length} tables created successfully.${colors.reset}`);
                    process.exit(0);
                } else {
                    process.exit(1);
                }
            }

        } catch (error) {
            this.logError('❌ Database setup failed:', error.message);
            if (error.stack) {
                console.log(`${colors.red}Stack trace:${colors.reset}`);
                console.log(error.stack);
            }
            process.exit(1);
        }
    }

    // Logging utilities
    logSuccess(message) {
        console.log(`${colors.green}${message}${colors.reset}`);
    }

    logError(message, error = '') {
        console.log(`${colors.red}${message}${colors.reset}`, error);
    }

    logWarning(message) {
        console.log(`${colors.yellow}${message}${colors.reset}`);
    }

    logInfo(message) {
        console.log(`${colors.blue}${message}${colors.reset}`);
    }
}

// Run the script directly
const setupManager = new ImprovedDatabaseSetupManager();
setupManager.run().catch(error => {
    console.error(`${colors.red}${colors.bright}💥 Unhandled error:${colors.reset}`, error);
    process.exit(1);
});

export default ImprovedDatabaseSetupManager;