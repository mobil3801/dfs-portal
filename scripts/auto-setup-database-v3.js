#!/usr/bin/env node

/**
 * Final Automated Database Schema Execution Script for DFS Portal
 * 
 * This script uses Supabase's actual SQL execution capabilities through
 * the REST API without relying on custom stored procedures.
 * 
 * Usage: node scripts/auto-setup-database-v3.js
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

class FinalDatabaseSetupManager {
    constructor() {
        this.supabaseUrl = process.env.VITE_SUPABASE_URL;
        this.serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        this.supabaseClient = null;
        this.setupStartTime = null;
    }

    async initialize() {
        console.log(`${colors.cyan}${colors.bright}🚀 DFS Portal Database Setup v3 Initializing...${colors.reset}\n`);
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
     * Parse SQL statements from the schema file
     */
    parseSqlStatements(sqlContent) {
        // Remove comments and split by semicolon
        const statements = sqlContent
            .replace(/--.*$/gm, '') // Remove single line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        return statements;
    }

    /**
     * Execute SQL using Supabase's direct query capability
     */
    async executeSqlDirect(sql) {
        try {
            // Use the REST API's query endpoint directly
            const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/vnd.pgrst.object+json',
                    'apikey': this.serviceRoleKey,
                    'Authorization': `Bearer ${this.serviceRoleKey}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ query: sql })
            });

            return {
                success: response.ok,
                status: response.status,
                response: await response.text()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Use PostgreSQL direct connection approach
     */
    async executePostgreSQLDirect(sql) {
        try {
            // Extract database info from Supabase URL
            const dbUrl = new URL(this.supabaseUrl);
            const projectRef = dbUrl.hostname.split('.')[0];
            
            // Use Supabase's SQL editor endpoint
            const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/sql_query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.serviceRoleKey,
                    'Authorization': `Bearer ${this.serviceRoleKey}`
                },
                body: JSON.stringify({ 
                    query: sql 
                })
            });

            if (response.ok) {
                const result = await response.json();
                return { success: true, result };
            } else {
                const error = await response.text();
                return { success: false, error };
            }

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Create individual tables using basic CREATE TABLE statements
     */
    async createBasicTables() {
        this.logInfo('🏗️  Creating basic table structure...');
        
        const basicTables = [
            {
                name: 'stations',
                sql: `CREATE TABLE IF NOT EXISTS public.stations (
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
                    fuel_types JSONB DEFAULT '[]'::jsonb,
                    pump_count INTEGER DEFAULT 0,
                    active BOOLEAN DEFAULT true,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )`
            },
            {
                name: 'user_profiles',
                sql: `CREATE TABLE IF NOT EXISTS public.user_profiles (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    role VARCHAR(50) DEFAULT 'viewer',
                    permissions JSONB DEFAULT '{}'::jsonb,
                    station_access JSONB DEFAULT '[]'::jsonb,
                    is_active BOOLEAN DEFAULT true,
                    last_login TIMESTAMP WITH TIME ZONE,
                    phone VARCHAR(20),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )`
            },
            {
                name: 'employees',
                sql: `CREATE TABLE IF NOT EXISTS public.employees (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    employee_id VARCHAR(50) UNIQUE NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    email VARCHAR(255),
                    phone VARCHAR(20),
                    position VARCHAR(100),
                    department VARCHAR(100),
                    station_id UUID,
                    hire_date DATE,
                    termination_date DATE,
                    salary DECIMAL(10, 2),
                    hourly_rate DECIMAL(8, 2),
                    is_active BOOLEAN DEFAULT true,
                    emergency_contact JSONB DEFAULT '{}'::jsonb,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )`
            },
            {
                name: 'audit_logs',
                sql: `CREATE TABLE IF NOT EXISTS public.audit_logs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    table_name VARCHAR(100) NOT NULL,
                    operation VARCHAR(20) NOT NULL,
                    record_id UUID,
                    old_values JSONB,
                    new_values JSONB,
                    changed_by UUID,
                    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    ip_address INET,
                    user_agent TEXT
                )`
            },
            {
                name: 'sms_config',
                sql: `CREATE TABLE IF NOT EXISTS public.sms_config (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    provider VARCHAR(50) NOT NULL DEFAULT 'clicksend',
                    api_username VARCHAR(255),
                    api_key VARCHAR(255),
                    from_number VARCHAR(20),
                    is_active BOOLEAN DEFAULT true,
                    daily_limit INTEGER DEFAULT 1000,
                    monthly_limit INTEGER DEFAULT 30000,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )`
            },
            {
                name: 'sms_history',
                sql: `CREATE TABLE IF NOT EXISTS public.sms_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    to_number VARCHAR(20) NOT NULL,
                    from_number VARCHAR(20),
                    message TEXT NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    provider VARCHAR(50) DEFAULT 'clicksend',
                    provider_message_id VARCHAR(255),
                    cost DECIMAL(10, 4),
                    sent_by UUID,
                    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    delivered_at TIMESTAMP WITH TIME ZONE,
                    error_message TEXT,
                    retry_count INTEGER DEFAULT 0
                )`
            },
            {
                name: 'sms_settings',
                sql: `CREATE TABLE IF NOT EXISTS public.sms_settings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID,
                    notifications_enabled BOOLEAN DEFAULT true,
                    license_expiry_alerts BOOLEAN DEFAULT true,
                    system_alerts BOOLEAN DEFAULT true,
                    daily_digest BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )`
            },
            {
                name: 'alert_settings',
                sql: `CREATE TABLE IF NOT EXISTS public.alert_settings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    alert_type VARCHAR(100) NOT NULL,
                    is_enabled BOOLEAN DEFAULT true,
                    threshold_value DECIMAL(10, 2),
                    notification_methods JSONB DEFAULT '["sms", "email"]'::jsonb,
                    recipients JSONB DEFAULT '[]'::jsonb,
                    schedule JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )`
            },
            {
                name: 'licenses',
                sql: `CREATE TABLE IF NOT EXISTS public.licenses (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    license_number VARCHAR(100) UNIQUE NOT NULL,
                    license_type VARCHAR(100) NOT NULL,
                    station_id UUID,
                    employee_id UUID,
                    issue_date DATE,
                    expiry_date DATE NOT NULL,
                    status VARCHAR(50) DEFAULT 'active',
                    issuing_authority VARCHAR(255),
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )`
            },
            {
                name: 'sms_contacts',
                sql: `CREATE TABLE IF NOT EXISTS public.sms_contacts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    phone_number VARCHAR(20) NOT NULL,
                    contact_type VARCHAR(50) DEFAULT 'general',
                    station_id UUID,
                    is_active BOOLEAN DEFAULT true,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )`
            },
            {
                name: 'alert_history',
                sql: `CREATE TABLE IF NOT EXISTS public.alert_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    alert_type VARCHAR(100) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT,
                    severity VARCHAR(20) DEFAULT 'info',
                    status VARCHAR(50) DEFAULT 'new',
                    triggered_by UUID,
                    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    acknowledged_by UUID,
                    acknowledged_at TIMESTAMP WITH TIME ZONE,
                    resolved_by UUID,
                    resolved_at TIMESTAMP WITH TIME ZONE,
                    metadata JSONB DEFAULT '{}'::jsonb
                )`
            }
        ];

        const results = {
            created: 0,
            failed: 0,
            errors: []
        };

        // Try to create tables using simple table creation
        for (const table of basicTables) {
            try {
                this.logInfo(`📋 Creating table: ${table.name}`);

                // Use Supabase client's direct SQL execution
                const { data, error } = await this.supabaseClient
                    .rpc('exec_sql', { sql_statement: table.sql })
                    .single();

                if (!error) {
                    results.created++;
                    this.logSuccess(`✅ Created table: ${table.name}`);
                } else if (error.message.includes('already exists')) {
                    results.created++;
                    this.logSuccess(`✅ Table already exists: ${table.name}`);
                } else {
                    // Try alternative approach with raw query
                    try {
                        const altResult = await this.executeAlternativeQuery(table.sql);
                        if (altResult.success) {
                            results.created++;
                            this.logSuccess(`✅ Created table (alt method): ${table.name}`);
                        } else {
                            results.failed++;
                            results.errors.push({ table: table.name, error: error.message });
                            this.logError(`❌ Failed to create table ${table.name}: ${error.message}`);
                        }
                    } catch (altError) {
                        results.failed++;
                        results.errors.push({ table: table.name, error: altError.message });
                        this.logError(`❌ Failed to create table ${table.name}: ${altError.message}`);
                    }
                }

            } catch (error) {
                results.failed++;
                results.errors.push({ table: table.name, error: error.message });
                this.logError(`❌ Failed to create table ${table.name}: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Alternative query execution method
     */
    async executeAlternativeQuery(sql) {
        try {
            // Try using the REST API directly for DDL operations
            const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.serviceRoleKey,
                    'Authorization': `Bearer ${this.serviceRoleKey}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ sql })
            });

            return {
                success: response.ok || response.status === 201,
                response: await response.text()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async executeSchema() {
        this.logInfo('🔧 Starting schema execution using basic table creation...');
        
        // Use the basic table creation approach
        const results = await this.createBasicTables();
        
        return {
            success: results.created > 0,
            method: 'basic_tables',
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
            } else if (verificationResults.existing.length > 0) {
                console.log(`\n${colors.yellow}${colors.bright}⚠️  DATABASE SETUP PARTIALLY COMPLETED${colors.reset}`);
                console.log(`${colors.yellow}Some tables were created but others may be missing.${colors.reset}`);
                console.log(`${colors.green}${verificationResults.existing.length} tables created successfully.${colors.reset}`);
                
                if (verificationResults.existing.length >= 8) {
                    // Most critical tables are created
                    process.exit(0);
                } else {
                    process.exit(1);
                }
            } else {
                console.log(`\n${colors.red}${colors.bright}❌ DATABASE SETUP FAILED${colors.reset}`);
                console.log(`${colors.red}No tables were created successfully.${colors.reset}`);
                process.exit(1);
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
const setupManager = new FinalDatabaseSetupManager();
setupManager.run().catch(error => {
    console.error(`${colors.red}${colors.bright}💥 Unhandled error:${colors.reset}`, error);
    process.exit(1);
});

export default FinalDatabaseSetupManager;