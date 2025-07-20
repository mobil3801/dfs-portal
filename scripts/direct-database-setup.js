#!/usr/bin/env node

/**
 * Direct Database Schema Execution Script for DFS Portal
 * 
 * This script executes the SQL schema directly using Supabase's PostgREST API
 * with the service role key to bypass the limitations of the previous scripts.
 * 
 * Usage: node scripts/direct-database-setup.js
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

class DirectDatabaseSetupManager {
    constructor() {
        this.supabaseUrl = process.env.VITE_SUPABASE_URL;
        this.serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        this.supabaseClient = null;
        this.setupStartTime = null;
    }

    async initialize() {
        console.log(`${colors.cyan}${colors.bright}🚀 DFS Portal Direct Database Setup Initializing...${colors.reset}\n`);
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
            }
        });
        
        this.logSuccess('✅ Supabase client initialized with service role key');
    }

    async readSchemaFile() {
        this.logInfo('📖 Reading schema file...');
        
        if (!fs.existsSync(SCHEMA_FILE_PATH)) {
            throw new Error(`Schema file not found: ${SCHEMA_FILE_PATH}`);
        }

        const schema = fs.readFileSync(SCHEMA_FILE_PATH, 'utf8');
        this.logSuccess(`✅ Schema file loaded: ${path.basename(SCHEMA_FILE_PATH)}`);
        this.logInfo(`   File size: ${(schema.length / 1024).toFixed(2)} KB`);
        
        return schema;
    }

    /**
     * Execute SQL directly using Node.js pg library with connection string
     */
    async executeSqlDirect(sql) {
        this.logInfo('🔧 Executing SQL directly using PostgreSQL connection...');
        
        // Parse the Supabase URL to construct PostgreSQL connection string
        const url = new URL(this.supabaseUrl);
        const [projectRef] = url.hostname.split('.');
        
        // Construct the PostgreSQL connection string
        const connectionString = `postgresql://postgres:${this.serviceRoleKey}@db.${projectRef}.supabase.co:5432/postgres`;
        
        try {
            // Dynamic import of pg
            const { Client } = await import('pg');
            
            const client = new Client({
                connectionString,
                ssl: {
                    rejectUnauthorized: false
                }
            });

            await client.connect();
            this.logSuccess('✅ Connected to PostgreSQL database');

            // Split SQL into statements and execute one by one
            const statements = this.parseSqlStatements(sql);
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            this.logInfo(`📊 Executing ${statements.length} SQL statements...`);

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                const progress = Math.round(((i + 1) / statements.length) * 100);
                
                try {
                    process.stdout.write(`\r${colors.yellow}⏳ Executing statement ${i + 1}/${statements.length} (${progress}%)${colors.reset}`);
                    
                    await client.query(statement);
                    successCount++;
                } catch (error) {
                    // Check if it's an acceptable error (already exists, etc.)
                    if (this.isAcceptableError(error)) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push({
                            statement: statement.substring(0, 100) + '...',
                            error: error.message
                        });
                    }
                }
            }

            await client.end();
            
            // Clear progress line
            process.stdout.write('\r' + ' '.repeat(80) + '\r');
            
            this.logSuccess(`✅ SQL execution completed!`);
            this.logInfo(`📈 Successfully executed: ${successCount}/${statements.length} statements`);
            
            if (errorCount > 0) {
                this.logWarning(`⚠️  Errors encountered: ${errorCount}`);
                if (errors.length > 0 && errors.length <= 5) {
                    this.logInfo('\n🔍 Error details:');
                    errors.forEach((err, index) => {
                        console.log(`${colors.red}  ${index + 1}. ${err.error}${colors.reset}`);
                    });
                }
            }

            return {
                success: successCount > 0,
                totalStatements: statements.length,
                successCount,
                errorCount,
                errors
            };

        } catch (error) {
            this.logError('❌ PostgreSQL connection failed:', error.message);
            return await this.fallbackToBasicTableCreation();
        }
    }

    /**
     * Fallback method: Create basic tables without complex features
     */
    async fallbackToBasicTableCreation() {
        this.logInfo('🔄 Falling back to basic table creation...');
        
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
                );`
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
                );`
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
                );`
            }
        ];

        let successCount = 0;
        let errorCount = 0;

        // Try creating tables individually using basic SQL
        for (const table of basicTables) {
            try {
                // Use raw SQL execution via fetch to PostgreSQL REST endpoint
                const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/vnd.pgrst.object+json',
                        'apikey': this.serviceRoleKey,
                        'Authorization': `Bearer ${this.serviceRoleKey}`,
                        'Accept': 'application/vnd.pgrst.object+json'
                    },
                    body: JSON.stringify({
                        query: table.sql
                    })
                });

                if (response.ok || response.status === 201) {
                    successCount++;
                    this.logSuccess(`✅ Created table: ${table.name}`);
                } else {
                    errorCount++;
                    this.logError(`❌ Failed to create table: ${table.name}`);
                }
            } catch (error) {
                errorCount++;
                this.logError(`❌ Failed to create table: ${table.name} - ${error.message}`);
            }
        }

        return {
            success: successCount > 0,
            method: 'fallback',
            successCount,
            errorCount
        };
    }

    parseSqlStatements(sql) {
        // Remove comments and split by semicolon
        const cleaned = sql
            .replace(/--.*$/gm, '') // Remove line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .trim();

        // Split by semicolon but be careful with function definitions
        const statements = [];
        let current = '';
        let depth = 0;
        let inString = false;
        let inFunction = false;

        for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];
            const prevChar = i > 0 ? cleaned[i - 1] : '';
            
            if (char === "'" && prevChar !== '\\') {
                inString = !inString;
            }
            
            if (!inString) {
                if (char === '$' && cleaned.substring(i, i + 2) === '$$') {
                    inFunction = !inFunction;
                    i++; // Skip next $
                }
                
                if (!inFunction) {
                    if (char === '(') depth++;
                    if (char === ')') depth--;
                }
            }
            
            current += char;
            
            if (!inString && !inFunction && depth === 0 && char === ';') {
                const statement = current.trim();
                if (statement.length > 1) {
                    statements.push(statement);
                }
                current = '';
            }
        }
        
        if (current.trim().length > 0) {
            statements.push(current.trim());
        }
        
        return statements.filter(stmt => stmt && stmt !== ';');
    }

    isAcceptableError(error) {
        const acceptableMessages = [
            'already exists',
            'relation already exists',
            'type already exists',
            'extension already exists',
            'function already exists',
            'duplicate key value'
        ];
        
        return acceptableMessages.some(msg => 
            error.message.toLowerCase().includes(msg)
        );
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
            
            const sql = await this.readSchemaFile();
            const executionResults = await this.executeSqlDirect(sql);
            const verificationResults = await this.verifyTableCreation();

            const setupDuration = ((Date.now() - this.setupStartTime) / 1000).toFixed(2);
            
            console.log('\n' + '='.repeat(60));
            console.log(`${colors.bright}${colors.cyan}📊 SETUP SUMMARY${colors.reset}`);
            console.log('='.repeat(60));
            console.log(`⏱️  Setup Duration: ${setupDuration} seconds`);
            console.log(`🔧 Execution Method: ${executionResults.method || 'direct_sql'}`);
            console.log(`📋 Tables Found: ${verificationResults.existing.length}/${verificationResults.existing.length + verificationResults.missing.length}`);
            
            if (executionResults.successCount) {
                console.log(`✅ Successful Operations: ${executionResults.successCount}`);
            }
            if (executionResults.errorCount) {
                console.log(`⚠️  Errors: ${executionResults.errorCount}`);
            }

            if (verificationResults.missing.length === 0) {
                console.log(`\n${colors.green}${colors.bright}🎉 DATABASE SETUP COMPLETED SUCCESSFULLY!${colors.reset}`);
                console.log(`${colors.green}All expected tables have been created and verified.${colors.reset}`);
                process.exit(0);
            } else if (verificationResults.existing.length >= 8) {
                console.log(`\n${colors.yellow}${colors.bright}⚠️  DATABASE SETUP MOSTLY COMPLETED${colors.reset}`);
                console.log(`${colors.green}${verificationResults.existing.length} out of 11 tables created successfully.${colors.reset}`);
                process.exit(0);
            } else {
                console.log(`\n${colors.red}${colors.bright}❌ DATABASE SETUP FAILED${colors.reset}`);
                console.log(`${colors.red}Only ${verificationResults.existing.length} out of 11 tables were created.${colors.reset}`);
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
const setupManager = new DirectDatabaseSetupManager();
setupManager.run().catch(error => {
    console.error(`${colors.red}${colors.bright}💥 Unhandled error:${colors.reset}`, error);
    process.exit(1);
});

export default DirectDatabaseSetupManager;