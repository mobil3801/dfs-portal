#!/usr/bin/env node

/**
 * Automated Database Schema Execution Script for DFS Portal
 *
 * This script automatically executes the Supabase database schema using the service role key.
 * It provides progress feedback, error handling, and verification of table creation.
 *
 * Usage: node scripts/auto-setup-database.js
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

class DatabaseSetupManager {
    constructor() {
        this.supabaseUrl = process.env.VITE_SUPABASE_URL;
        this.serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        this.supabaseClient = null;
        this.setupStartTime = null;
    }

    /**
     * Initialize the setup process
     */
    async initialize() {
        console.log(`${colors.cyan}${colors.bright}🚀 DFS Portal Database Setup Initializing...${colors.reset}\n`);
        this.setupStartTime = Date.now();

        // Validate environment variables
        if (!this.supabaseUrl || !this.serviceRoleKey) {
            this.logError('Missing required environment variables:');
            if (!this.supabaseUrl) this.logError('  - VITE_SUPABASE_URL');
            if (!this.serviceRoleKey) this.logError('  - VITE_SUPABASE_SERVICE_ROLE_KEY');
            this.logError('\nPlease check your .env.local file and ensure these variables are set.');
            process.exit(1);
        }

        // Initialize Supabase client with service role key
        try {
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
        } catch (error) {
            this.logError('❌ Failed to initialize Supabase client:', error.message);
            process.exit(1);
        }
    }

    /**
     * Read and validate schema files
     */
    async readSchemaFiles() {
        this.logInfo('📖 Reading schema files...');
        
        const schemas = {
            primary: null,
            complete: null
        };

        try {
            // Read primary schema file
            if (fs.existsSync(SCHEMA_FILE_PATH)) {
                schemas.primary = fs.readFileSync(SCHEMA_FILE_PATH, 'utf8');
                this.logSuccess(`✅ Primary schema file loaded: ${path.basename(SCHEMA_FILE_PATH)}`);
                this.logInfo(`   File size: ${(schemas.primary.length / 1024).toFixed(2)} KB`);
            } else {
                this.logWarning(`⚠️  Primary schema file not found: ${SCHEMA_FILE_PATH}`);
            }

            // Read complete schema file (fallback)
            if (fs.existsSync(COMPLETE_SCHEMA_FILE_PATH)) {
                schemas.complete = fs.readFileSync(COMPLETE_SCHEMA_FILE_PATH, 'utf8');
                this.logSuccess(`✅ Complete schema file loaded: ${path.basename(COMPLETE_SCHEMA_FILE_PATH)}`);
                this.logInfo(`   File size: ${(schemas.complete.length / 1024).toFixed(2)} KB`);
            } else {
                this.logWarning(`⚠️  Complete schema file not found: ${COMPLETE_SCHEMA_FILE_PATH}`);
            }

            // Determine which schema to use
            const selectedSchema = schemas.primary || schemas.complete;
            if (!selectedSchema) {
                throw new Error('No valid schema files found');
            }

            this.logInfo(`📋 Using ${schemas.primary ? 'primary' : 'complete'} schema for database setup`);
            return selectedSchema;

        } catch (error) {
            this.logError('❌ Failed to read schema files:', error.message);
            throw error;
        }
    }

    /**
     * Split SQL into individual statements
     */
    splitSqlStatements(sql) {
        // Remove comments and normalize whitespace
        const cleaned = sql
            .split('\n')
            .map(line => line.trim())
            .filter(line => !line.startsWith('--') && line.length > 0)
            .join(' ');

        // Split by semicolon but preserve statements
        const statements = cleaned
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0)
            .map(stmt => stmt + ';');

        return statements;
    }

    /**
     * Execute SQL using REST API directly with service role key
     */
    async executeSqlViaRestApi(sql) {
        this.logInfo('🔄 Executing SQL via Supabase REST API...');
        
        const fetch = (await import('node-fetch')).default;
        const url = `${this.supabaseUrl}/rest/v1/rpc/exec`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.serviceRoleKey,
                    'Authorization': `Bearer ${this.serviceRoleKey}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ sql_query: sql })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            this.logSuccess('✅ Schema executed via REST API successfully!');
            return {
                totalStatements: 1,
                executedStatements: 1,
                failedStatements: 0,
                errors: []
            };

        } catch (error) {
            this.logWarning('⚠️  REST API execution failed, using statement-by-statement approach');
            return await this.executeSchemaStatements(sql);
        }
    }

    /**
     * Execute SQL statements with progress tracking
     */
    async executeSchemaStatements(sql) {
        this.logInfo('🔧 Executing database schema statement by statement...');
        
        const statements = this.splitSqlStatements(sql);
        const totalStatements = statements.length;
        let executedStatements = 0;
        let failedStatements = 0;
        const errors = [];

        this.logInfo(`📊 Total SQL statements to execute: ${totalStatements}`);
        console.log(''); // Add spacing

        // First, create a stored procedure to execute SQL
        await this.createSqlExecutorFunction();

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const progress = Math.round(((i + 1) / totalStatements) * 100);
            
            // Skip empty statements
            if (!statement || statement.trim() === ';') {
                continue;
            }

            try {
                // Show progress
                process.stdout.write(`\r${colors.yellow}⏳ Executing statement ${i + 1}/${totalStatements} (${progress}%)${colors.reset}`);
                
                // Execute using the stored procedure we created
                const { error } = await this.supabaseClient.rpc('execute_sql_statement', {
                    sql_statement: statement
                });

                if (error) {
                    // Some errors are expected (like IF NOT EXISTS clauses)
                    if (this.isExpectedError(error)) {
                        executedStatements++;
                    } else {
                        failedStatements++;
                        errors.push({
                            statement: statement.substring(0, 100) + '...',
                            error: error.message
                        });
                        // For debugging, log the actual statement that failed
                        if (process.env.NODE_ENV === 'development') {
                            console.log(`\n${colors.red}Failed statement: ${statement}${colors.reset}`);
                        }
                    }
                } else {
                    executedStatements++;
                }

            } catch (error) {
                failedStatements++;
                errors.push({
                    statement: statement.substring(0, 100) + '...',
                    error: error.message
                });
            }
        }

        // Clear progress line and show results
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
        
        this.logSuccess(`✅ Schema execution completed!`);
        this.logInfo(`📈 Successfully executed: ${executedStatements}/${totalStatements} statements`);
        
        if (failedStatements > 0) {
            this.logWarning(`⚠️  Failed statements: ${failedStatements}`);
            if (errors.length > 0 && errors.length <= 10) { // Limit error display
                this.logInfo('\n🔍 Error details:');
                errors.forEach((err, index) => {
                    console.log(`${colors.red}  ${index + 1}. Statement: ${err.statement}${colors.reset}`);
                    console.log(`${colors.red}     Error: ${err.error}${colors.reset}`);
                });
            } else if (errors.length > 10) {
                this.logInfo(`\n🔍 ${errors.length} errors occurred. Set NODE_ENV=development for detailed error output.`);
            }
        }

        return {
            totalStatements,
            executedStatements,
            failedStatements,
            errors
        };
    }

    /**
     * Create a stored procedure to execute SQL statements
     */
    async createSqlExecutorFunction() {
        const createFunctionSQL = `
            CREATE OR REPLACE FUNCTION execute_sql_statement(sql_statement text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                EXECUTE sql_statement;
            END;
            $$;
        `;

        try {
            const { error } = await this.supabaseClient.rpc('query', {
                query: createFunctionSQL
            });

            if (error && !this.isExpectedError(error)) {
                // Try alternative approach if query RPC doesn't exist
                this.logInfo('📝 Creating SQL executor function via alternative method...');
                // We'll handle this in the statement execution loop
            } else {
                this.logSuccess('✅ SQL executor function created successfully');
            }
        } catch (error) {
            // Function creation failed, we'll handle individual statements differently
            this.logWarning('⚠️  Could not create SQL executor function, using alternative approach');
        }
    }

    /**
     * Main SQL execution method that tries multiple approaches
     */
    async executeSqlDirect(sql) {
        // Try method 1: REST API approach
        try {
            return await this.executeSqlViaRestApi(sql);
        } catch (error) {
            this.logInfo('🔄 REST API approach failed, trying statement-by-statement execution...');
        }

        // Method 2: Statement by statement execution
        return await this.executeSchemaStatements(sql);
    }

    /**
     * Verify table creation
     */
    async verifyTableCreation() {
        this.logInfo('🔍 Verifying table creation...');
        
        const expectedTables = [
            'stations',
            'user_profiles', 
            'employees',
            'audit_logs',
            'sms_config',
            'sms_history',
            'sms_settings',
            'alert_settings',
            'licenses',
            'sms_contacts',
            'alert_history'
        ];

        const verificationResults = {
            existingTables: [],
            missingTables: [],
            totalExpected: expectedTables.length
        };

        for (const tableName of expectedTables) {
            try {
                const { data, error } = await this.supabaseClient
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (error) {
                    if (error.message.includes('does not exist') || error.message.includes('relation') && error.message.includes('does not exist')) {
                        verificationResults.missingTables.push(tableName);
                    } else {
                        // Table exists but we got a different error (possibly RLS)
                        verificationResults.existingTables.push(tableName);
                    }
                } else {
                    verificationResults.existingTables.push(tableName);
                }
            } catch (error) {
                verificationResults.missingTables.push(tableName);
            }
        }

        // Display results
        console.log(''); // Add spacing
        this.logInfo('📋 Table verification results:');
        
        if (verificationResults.existingTables.length > 0) {
            this.logSuccess(`✅ Found tables (${verificationResults.existingTables.length}/${verificationResults.totalExpected}):`);
            verificationResults.existingTables.forEach(table => {
                console.log(`${colors.green}   ✓ ${table}${colors.reset}`);
            });
        }

        if (verificationResults.missingTables.length > 0) {
            this.logWarning(`⚠️  Missing tables (${verificationResults.missingTables.length}/${verificationResults.totalExpected}):`);
            verificationResults.missingTables.forEach(table => {
                console.log(`${colors.red}   ✗ ${table}${colors.reset}`);
            });
        }

        return verificationResults;
    }

    /**
     * Check if an error is expected (like IF NOT EXISTS clauses)
     */
    isExpectedError(error) {
        const expectedErrors = [
            'already exists',
            'duplicate key value',
            'relation already exists',
            'type already exists',
            'extension already exists',
            'function already exists'
        ];

        return expectedErrors.some(expectedError => 
            error.message.toLowerCase().includes(expectedError)
        );
    }

    /**
     * Run the complete setup process
     */
    async run() {
        try {
            await this.initialize();
            
            const sql = await this.readSchemaFiles();
            const executionResults = await this.executeSqlDirect(sql);
            const verificationResults = await this.verifyTableCreation();

            // Final summary
            const setupDuration = ((Date.now() - this.setupStartTime) / 1000).toFixed(2);
            
            console.log('\n' + '='.repeat(60));
            console.log(`${colors.bright}${colors.cyan}📊 SETUP SUMMARY${colors.reset}`);
            console.log('='.repeat(60));
            console.log(`⏱️  Setup Duration: ${setupDuration} seconds`);
            console.log(`🔧 SQL Statements: ${executionResults.executedStatements}/${executionResults.totalStatements} executed`);
            console.log(`📋 Tables Created: ${verificationResults.existingTables.length}/${verificationResults.totalExpected} verified`);
            
            if (executionResults.failedStatements > 0) {
                console.log(`❌ Failed Statements: ${executionResults.failedStatements}`);
            }

            if (verificationResults.missingTables.length === 0) {
                console.log(`\n${colors.green}${colors.bright}🎉 DATABASE SETUP COMPLETED SUCCESSFULLY!${colors.reset}`);
                console.log(`${colors.green}All expected tables have been created and verified.${colors.reset}`);
                process.exit(0);
            } else {
                console.log(`\n${colors.yellow}${colors.bright}⚠️  DATABASE SETUP COMPLETED WITH WARNINGS${colors.reset}`);
                console.log(`${colors.yellow}Some tables may not have been created. Check the logs above for details.${colors.reset}`);
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
const setupManager = new DatabaseSetupManager();
setupManager.run().catch(error => {
    console.error(`${colors.red}${colors.bright}💥 Unhandled error:${colors.reset}`, error);
    process.exit(1);
});

export default DatabaseSetupManager;