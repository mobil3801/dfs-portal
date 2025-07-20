#!/usr/bin/env node

/**
 * Supabase Database Setup Guide for DFS Portal
 * 
 * This script provides instructions for setting up the database schema
 * using the proper Supabase methods, as direct SQL execution from
 * client applications is restricted for security reasons.
 * 
 * Usage: node scripts/supabase-setup-guide.js
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
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class SupabaseSetupGuide {
    constructor() {
        this.supabaseUrl = process.env.VITE_SUPABASE_URL;
        this.serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        this.supabaseClient = null;
    }

    async initialize() {
        console.log(`${colors.cyan}${colors.bright}📋 DFS Portal Database Setup Guide${colors.reset}\n`);

        if (!this.supabaseUrl || !this.serviceRoleKey) {
            this.logError('Missing required environment variables:');
            if (!this.supabaseUrl) this.logError('  - VITE_SUPABASE_URL');
            if (!this.serviceRoleKey) this.logError('  - VITE_SUPABASE_SERVICE_ROLE_KEY');
            this.logError('\nPlease check your .env.local file and ensure these variables are set.');
            return false;
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
        
        this.logSuccess('✅ Environment configuration verified');
        return true;
    }

    async checkCurrentState() {
        this.logInfo('🔍 Checking current database state...');

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

        this.logInfo('\n📊 Current Database State:');
        
        if (results.existing.length > 0) {
            this.logSuccess(`✅ Existing tables (${results.existing.length}/${expectedTables.length}):`);
            results.existing.forEach(table => {
                console.log(`${colors.green}   ✓ ${table}${colors.reset}`);
            });
        }

        if (results.missing.length > 0) {
            this.logWarning(`❌ Missing tables (${results.missing.length}/${expectedTables.length}):`);
            results.missing.forEach(table => {
                console.log(`${colors.red}   ✗ ${table}${colors.reset}`);
            });
        }

        return results;
    }

    displaySetupInstructions() {
        console.log(`\n${colors.cyan}${colors.bright}📋 DATABASE SETUP INSTRUCTIONS${colors.reset}`);
        console.log('='.repeat(60));

        console.log(`\n${colors.yellow}${colors.bright}Why automated execution doesn't work:${colors.reset}`);
        console.log('• Supabase restricts direct SQL execution from client applications for security');
        console.log('• The schema contains complex features (custom types, RLS policies, triggers)');
        console.log('• Schema changes should be done through official Supabase tools\n');

        console.log(`${colors.green}${colors.bright}✅ RECOMMENDED APPROACH - Supabase Dashboard:${colors.reset}`);
        console.log(`\n${colors.bright}Step 1: Open Supabase Dashboard${colors.reset}`);
        console.log(`1. Go to: ${colors.cyan}https://supabase.com/dashboard${colors.reset}`);
        console.log(`2. Select your DFS Portal project`);

        console.log(`\n${colors.bright}Step 2: Access SQL Editor${colors.reset}`);
        console.log(`1. Click "SQL Editor" in the left sidebar`);
        console.log(`2. Click "New query" to create a new SQL editor tab`);

        console.log(`\n${colors.bright}Step 3: Copy and Execute Schema${colors.reset}`);
        console.log(`1. Copy the contents of: ${colors.cyan}src/database/supabase-schema.sql${colors.reset}`);
        console.log(`2. Paste it into the SQL editor`);
        console.log(`3. Click "RUN" to execute the schema`);

        console.log(`\n${colors.bright}Step 4: Verify Results${colors.reset}`);
        console.log(`1. Check the "Table Editor" to see your new tables`);
        console.log(`2. Run this script again to verify: ${colors.cyan}node scripts/supabase-setup-guide.js${colors.reset}`);

        console.log(`\n${colors.blue}${colors.bright}🔧 ALTERNATIVE APPROACH - Supabase CLI:${colors.reset}`);
        console.log(`\n${colors.bright}If you have Supabase CLI installed:${colors.reset}`);
        console.log(`1. ${colors.cyan}supabase login${colors.reset}`);
        console.log(`2. ${colors.cyan}supabase link --project-ref YOUR_PROJECT_REF${colors.reset}`);
        console.log(`3. ${colors.cyan}supabase db reset${colors.reset} (if starting fresh)`);
        console.log(`4. Create a migration file and apply it`);

        console.log(`\n${colors.magenta}${colors.bright}📄 Schema File Information:${colors.reset}`);
        
        if (fs.existsSync(SCHEMA_FILE_PATH)) {
            const schemaContent = fs.readFileSync(SCHEMA_FILE_PATH, 'utf8');
            const fileSize = (schemaContent.length / 1024).toFixed(2);
            const lineCount = schemaContent.split('\n').length;
            
            console.log(`• File: ${colors.cyan}${SCHEMA_FILE_PATH}${colors.reset}`);
            console.log(`• Size: ${fileSize} KB`);
            console.log(`• Lines: ${lineCount}`);
            console.log(`• Contains: Custom types, tables, indexes, RLS policies, triggers`);

            // Show table count
            const tableMatches = schemaContent.match(/CREATE TABLE /g);
            const tableCount = tableMatches ? tableMatches.length : 0;
            console.log(`• Tables to create: ${tableCount}`);
        } else {
            this.logError(`❌ Schema file not found: ${SCHEMA_FILE_PATH}`);
        }

        console.log(`\n${colors.yellow}${colors.bright}⚠️  IMPORTANT NOTES:${colors.reset}`);
        console.log('• Always backup your database before running schema changes');
        console.log('• Test in a development environment first');
        console.log('• The schema includes Row Level Security (RLS) policies');
        console.log('• Some tables reference auth.users (Supabase\'s built-in auth table)');

        console.log(`\n${colors.cyan}${colors.bright}🔗 Helpful Links:${colors.reset}`);
        console.log(`• Supabase Dashboard: ${colors.cyan}https://supabase.com/dashboard${colors.reset}`);
        console.log(`• SQL Editor Docs: ${colors.cyan}https://supabase.com/docs/guides/database/sql-editor${colors.reset}`);
        console.log(`• Supabase CLI: ${colors.cyan}https://supabase.com/docs/guides/cli${colors.reset}`);
    }

    async createSetupHTML() {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DFS Portal Database Setup Guide</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; line-height: 1.6; }
        .header { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .step { background: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .code { background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; overflow-x: auto; }
        .success { color: #10b981; }
        .error { color: #ef4444; }
        .info { color: #3b82f6; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 DFS Portal Database Setup Guide</h1>
        <p>Complete instructions for setting up your Supabase database schema</p>
    </div>

    <div class="warning">
        <h3>⚠️ Why Automated Scripts Don't Work</h3>
        <ul>
            <li>Supabase restricts direct SQL execution from client applications for security</li>
            <li>Schema changes require admin-level database access</li>
            <li>Complex features like RLS policies need proper database context</li>
        </ul>
    </div>

    <div class="step">
        <h2>✅ Method 1: Supabase Dashboard (Recommended)</h2>
        
        <h3>Step 1: Access Your Project</h3>
        <ul>
            <li>Go to <a href="https://supabase.com/dashboard" target="_blank">https://supabase.com/dashboard</a></li>
            <li>Select your DFS Portal project</li>
        </ul>

        <h3>Step 2: Open SQL Editor</h3>
        <ul>
            <li>Click "SQL Editor" in the left sidebar</li>
            <li>Click "New query" to create a new editor tab</li>
        </ul>

        <h3>Step 3: Execute Schema</h3>
        <ul>
            <li>Copy the entire contents of <code>src/database/supabase-schema.sql</code></li>
            <li>Paste it into the SQL editor</li>
            <li>Click the "RUN" button</li>
        </ul>

        <h3>Step 4: Verify Success</h3>
        <ul>
            <li>Check the "Table Editor" to see your new tables</li>
            <li>Run the verification script: <code>node scripts/supabase-setup-guide.js</code></li>
        </ul>
    </div>

    <div class="step">
        <h2>🔧 Method 2: Supabase CLI (Advanced)</h2>
        
        <div class="code">
# Install Supabase CLI
npm install supabase --save-dev

# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Create a migration (optional)
npx supabase migration new setup_dfs_schema

# Apply changes
npx supabase db push
        </div>
    </div>

    <div class="warning">
        <h3>🔍 Important Notes</h3>
        <ul>
            <li><strong>Backup First:</strong> Always backup your database before schema changes</li>
            <li><strong>Test Environment:</strong> Test in development before production</li>
            <li><strong>RLS Policies:</strong> The schema includes Row Level Security</li>
            <li><strong>Auth Integration:</strong> Some tables reference Supabase's auth.users table</li>
        </ul>
    </div>

    <div class="step">
        <h2>📊 Schema Overview</h2>
        <p>The schema creates the following tables:</p>
        <ul>
            <li><strong>stations</strong> - Gas station locations and info</li>
            <li><strong>user_profiles</strong> - User roles and permissions</li>
            <li><strong>employees</strong> - Employee records</li>
            <li><strong>audit_logs</strong> - System audit trail</li>
            <li><strong>sms_config</strong> - SMS service configuration</li>
            <li><strong>sms_history</strong> - SMS message history</li>
            <li><strong>sms_settings</strong> - SMS system settings</li>
            <li><strong>alert_settings</strong> - Alert configuration</li>
            <li><strong>licenses</strong> - License tracking</li>
            <li><strong>sms_contacts</strong> - SMS contact list</li>
            <li><strong>alert_history</strong> - Alert history log</li>
        </ul>
    </div>

    <div class="step">
        <h2>🔗 Helpful Resources</h2>
        <ul>
            <li><a href="https://supabase.com/dashboard" target="_blank">Supabase Dashboard</a></li>
            <li><a href="https://supabase.com/docs/guides/database/sql-editor" target="_blank">SQL Editor Documentation</a></li>
            <li><a href="https://supabase.com/docs/guides/cli" target="_blank">Supabase CLI Guide</a></li>
            <li><a href="https://supabase.com/docs/guides/auth/row-level-security" target="_blank">Row Level Security</a></li>
        </ul>
    </div>
</body>
</html>`;

        const htmlPath = path.join(__dirname, '..', 'database-setup-guide.html');
        fs.writeFileSync(htmlPath, htmlContent);
        this.logSuccess(`✅ HTML guide created: ${htmlPath}`);
        
        return htmlPath;
    }

    async run() {
        try {
            const initialized = await this.initialize();
            if (!initialized) return;

            const databaseState = await this.checkCurrentState();
            
            if (databaseState.missing.length === 0) {
                console.log(`\n${colors.green}${colors.bright}🎉 DATABASE ALREADY SET UP!${colors.reset}`);
                console.log(`${colors.green}All expected tables are present and accessible.${colors.reset}`);
                return;
            }

            this.displaySetupInstructions();
            
            const htmlPath = await this.createSetupHTML();
            
            console.log('\n' + '='.repeat(60));
            console.log(`${colors.bright}${colors.cyan}📋 NEXT STEPS${colors.reset}`);
            console.log('='.repeat(60));
            console.log(`1. Open the HTML guide: ${colors.cyan}${htmlPath}${colors.reset}`);
            console.log(`2. Follow the Supabase Dashboard method (easiest)`);
            console.log(`3. Run this script again to verify: ${colors.cyan}node scripts/supabase-setup-guide.js${colors.reset}`);
            
            console.log(`\n${colors.yellow}This approach ensures proper security and follows Supabase best practices.${colors.reset}`);

        } catch (error) {
            this.logError('❌ Setup guide failed:', error.message);
            if (error.stack) {
                console.log(`${colors.red}Stack trace:${colors.reset}`);
                console.log(error.stack);
            }
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
const setupGuide = new SupabaseSetupGuide();
setupGuide.run().catch(error => {
    console.error(`${colors.red}${colors.bright}💥 Unhandled error:${colors.reset}`, error);
    process.exit(1);
});

export default SupabaseSetupGuide;