#!/usr/bin/env node

/**
 * Script to update Supabase service role key in .env.local
 * This script safely updates the VITE_SUPABASE_SERVICE_ROLE_KEY while preserving other environment variables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ENV_FILE_PATH = path.join(__dirname, '..', '.env.local');
const NEW_SERVICE_ROLE_KEY = 'sb_secret_uDPnn6A-MahxluyCf134Eg_ZaSTm42T';
const KEY_NAME = 'VITE_SUPABASE_SERVICE_ROLE_KEY';

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

function updateServiceRoleKey() {
    console.log(`${colors.cyan}${colors.bright}🔐 Updating Supabase Service Role Key${colors.reset}\n`);

    try {
        // Check if .env.local exists
        if (!fs.existsSync(ENV_FILE_PATH)) {
            console.log(`${colors.yellow}⚠️  .env.local file not found. Creating new file...${colors.reset}`);
            
            // Create new .env.local with the service role key
            const newContent = `# Supabase Service Role Key (Updated by script)\n${KEY_NAME}=${NEW_SERVICE_ROLE_KEY}\n`;
            fs.writeFileSync(ENV_FILE_PATH, newContent, 'utf8');
            
            console.log(`${colors.green}✅ Created .env.local with new service role key${colors.reset}`);
            console.log(`${colors.blue}📝 Key added: ${KEY_NAME}${colors.reset}`);
            return;
        }

        // Read existing .env.local
        console.log(`${colors.blue}📖 Reading existing .env.local file...${colors.reset}`);
        const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
        
        // Parse environment variables
        const lines = envContent.split('\n');
        let keyFound = false;
        let updatedLines = [];

        for (const line of lines) {
            // Skip empty lines and comments
            if (line.trim() === '' || line.trim().startsWith('#')) {
                updatedLines.push(line);
                continue;
            }

            // Check if this line contains our key
            if (line.startsWith(`${KEY_NAME}=`)) {
                keyFound = true;
                const oldValue = line.split('=')[1];
                updatedLines.push(`${KEY_NAME}=${NEW_SERVICE_ROLE_KEY}`);
                console.log(`${colors.yellow}🔄 Updating existing key:${colors.reset}`);
                console.log(`   Old value: ${oldValue.substring(0, 20)}...`);
                console.log(`   New value: ${NEW_SERVICE_ROLE_KEY.substring(0, 20)}...`);
            } else {
                updatedLines.push(line);
            }
        }

        // If key wasn't found, add it
        if (!keyFound) {
            console.log(`${colors.blue}➕ Key not found. Adding new key...${colors.reset}`);
            // Add a comment and the new key
            updatedLines.push('');
            updatedLines.push('# Supabase Service Role Key (Added by update script)');
            updatedLines.push(`${KEY_NAME}=${NEW_SERVICE_ROLE_KEY}`);
        }

        // Write updated content back to file
        const updatedContent = updatedLines.join('\n');
        fs.writeFileSync(ENV_FILE_PATH, updatedContent, 'utf8');

        console.log(`\n${colors.green}${colors.bright}✅ Successfully updated .env.local${colors.reset}`);
        console.log(`${colors.green}🔑 Service role key has been ${keyFound ? 'updated' : 'added'}${colors.reset}`);
        
        // Additional instructions
        console.log(`\n${colors.cyan}📌 Next steps:${colors.reset}`);
        console.log(`   1. Restart any running development servers to pick up the new key`);
        console.log(`   2. Run database setup scripts if needed`);
        console.log(`   3. Test your application to ensure the new key works correctly`);

    } catch (error) {
        console.error(`${colors.red}❌ Error updating service role key:${colors.reset}`, error.message);
        process.exit(1);
    }
}

// Run the update
updateServiceRoleKey();
