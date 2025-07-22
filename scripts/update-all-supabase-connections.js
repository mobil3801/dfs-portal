#!/usr/bin/env node

/**
 * Update all Supabase connections with new credentials
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// New Supabase credentials
const NEW_CREDENTIALS = {
    url: 'https://nehhjsiuhthflfwkfequ.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGhqc2l1aHRoZmxmd2tmZXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxMzE3NSwiZXhwIjoyMDY4NTg5MTc1fQ.7naT6l_oNH8VI5MaEKgJ19PoYw1EErv6-ftkEin12wE',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGhqc2l1aHRoZmxmd2tmZXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxMzE3NSwiZXhwIjoyMDY4NTg5MTc1fQ.7naT6l_oNH8VI5MaEKgJ19PoYw1EErv6-ftkEin12wE',
    databaseUrl: 'postgresql://postgres.nehhjsiuhthflfwkfequ:Dreamframe123@@aws-0-us-east-2.pooler.supabase.com:6543/postgres',
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: '6543',
    database: 'postgres',
    user: 'postgres.nehhjsiuhthflfwkfequ',
    password: 'Dreamframe123@'
};

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

function updateEnvFile(filePath, fileName) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`${colors.yellow}⚠️  ${fileName} not found, creating new file...${colors.reset}`);
            
            // Create new env file with all credentials
            const newContent = `# Supabase Configuration
VITE_SUPABASE_URL=${NEW_CREDENTIALS.url}
VITE_SUPABASE_ANON_KEY=${NEW_CREDENTIALS.anonKey}
VITE_SUPABASE_SERVICE_ROLE_KEY=${NEW_CREDENTIALS.serviceRoleKey}

# Database Configuration
DATABASE_URL=${NEW_CREDENTIALS.databaseUrl}
SUPABASE_HOST=${NEW_CREDENTIALS.host}
SUPABASE_PORT=${NEW_CREDENTIALS.port}
SUPABASE_DATABASE=${NEW_CREDENTIALS.database}
SUPABASE_USER=${NEW_CREDENTIALS.user}
SUPABASE_PASSWORD=${NEW_CREDENTIALS.password}
`;
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`${colors.green}✅ Created ${fileName} with new credentials${colors.reset}`);
            return;
        }

        // Read existing file
        console.log(`${colors.blue}📖 Updating ${fileName}...${colors.reset}`);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Update or add each environment variable
        const updates = [
            { key: 'VITE_SUPABASE_URL', value: NEW_CREDENTIALS.url },
            { key: 'VITE_SUPABASE_ANON_KEY', value: NEW_CREDENTIALS.anonKey },
            { key: 'VITE_SUPABASE_SERVICE_ROLE_KEY', value: NEW_CREDENTIALS.serviceRoleKey },
            { key: 'DATABASE_URL', value: NEW_CREDENTIALS.databaseUrl },
            { key: 'SUPABASE_HOST', value: NEW_CREDENTIALS.host },
            { key: 'SUPABASE_PORT', value: NEW_CREDENTIALS.port },
            { key: 'SUPABASE_DATABASE', value: NEW_CREDENTIALS.database },
            { key: 'SUPABASE_USER', value: NEW_CREDENTIALS.user },
            { key: 'SUPABASE_PASSWORD', value: NEW_CREDENTIALS.password }
        ];

        updates.forEach(({ key, value }) => {
            const regex = new RegExp(`^${key}=.*$`, 'gm');
            if (content.match(regex)) {
                content = content.replace(regex, `${key}=${value}`);
                console.log(`   Updated: ${key}`);
            } else {
                content += `\n${key}=${value}`;
                console.log(`   Added: ${key}`);
            }
        });

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`${colors.green}✅ Updated ${fileName}${colors.reset}\n`);

    } catch (error) {
        console.error(`${colors.red}❌ Error updating ${fileName}: ${error.message}${colors.reset}`);
    }
}

function updateMCPSettings() {
    const mcpSettingsPath = 'c:/Users/MOBIN (Work)/AppData/Roaming/Code/User/globalStorage/blackboxapp.blackboxagent/settings/blackbox_mcp_settings.json';
    
    try {
        console.log(`${colors.blue}📖 Updating MCP settings...${colors.reset}`);
        
        if (!fs.existsSync(mcpSettingsPath)) {
            console.log(`${colors.yellow}⚠️  MCP settings file not found${colors.reset}`);
            return;
        }

        const settings = JSON.parse(fs.readFileSync(mcpSettingsPath, 'utf8'));
        
        // Update Supabase MCP server if it exists
        if (settings.mcpServers && settings.mcpServers['github.com/supabase-community/supabase-mcp']) {
            const supabaseServer = settings.mcpServers['github.com/supabase-community/supabase-mcp'];
            
            // Update the access token in args
            if (supabaseServer.args) {
                const tokenIndex = supabaseServer.args.indexOf('--access-token');
                if (tokenIndex !== -1 && tokenIndex + 1 < supabaseServer.args.length) {
                    supabaseServer.args[tokenIndex + 1] = NEW_CREDENTIALS.serviceRoleKey;
                    console.log(`   Updated: Supabase MCP access token`);
                }
            }
            
            // Update environment variables if they exist
            if (!supabaseServer.env) {
                supabaseServer.env = {};
            }
            supabaseServer.env.SUPABASE_URL = NEW_CREDENTIALS.url;
            supabaseServer.env.SUPABASE_SERVICE_ROLE_KEY = NEW_CREDENTIALS.serviceRoleKey;
            console.log(`   Updated: Supabase MCP environment variables`);
            
            fs.writeFileSync(mcpSettingsPath, JSON.stringify(settings, null, 2), 'utf8');
            console.log(`${colors.green}✅ Updated MCP settings${colors.reset}\n`);
        } else {
            console.log(`${colors.yellow}⚠️  Supabase MCP server not found in settings${colors.reset}`);
        }
        
    } catch (error) {
        console.error(`${colors.red}❌ Error updating MCP settings: ${error.message}${colors.reset}`);
    }
}

function createDatabaseConnectionScript() {
    const scriptPath = path.join(__dirname, 'test-new-connection.js');
    
    const testScript = `#!/usr/bin/env node

/**
 * Test new Supabase connection
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '${NEW_CREDENTIALS.url}';
const supabaseKey = '${NEW_CREDENTIALS.serviceRoleKey}';

async function testConnection() {
    console.log('Testing Supabase connection...');
    
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test connection by listing tables
        const { data, error } = await supabase
            .from('stations')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('Connection test failed:', error.message);
        } else {
            console.log('✅ Connection successful!');
            console.log('Sample data:', data);
        }
    } catch (error) {
        console.error('Connection error:', error.message);
    }
}

testConnection();
`;

    fs.writeFileSync(scriptPath, testScript, 'utf8');
    console.log(`${colors.green}✅ Created test script: ${scriptPath}${colors.reset}`);
}

async function main() {
    console.log(`${colors.cyan}${colors.bright}🔄 Updating all Supabase connections${colors.reset}\n`);

    // Update .env.local
    updateEnvFile(path.join(__dirname, '..', '.env.local'), '.env.local');
    
    // Update .env if it exists
    updateEnvFile(path.join(__dirname, '..', '.env'), '.env');
    
    // Update env.local if it exists
    updateEnvFile(path.join(__dirname, '..', 'env.local'), 'env.local');
    
    // Update env.production if it exists
    updateEnvFile(path.join(__dirname, '..', 'env.production'), 'env.production');
    
    // Update MCP settings
    updateMCPSettings();
    
    // Create test connection script
    createDatabaseConnectionScript();
    
    console.log(`\n${colors.cyan}${colors.bright}📊 Summary${colors.reset}`);
    console.log(`${colors.green}✅ Updated Supabase URL: ${NEW_CREDENTIALS.url}${colors.reset}`);
    console.log(`${colors.green}✅ Updated Service Role Key${colors.reset}`);
    console.log(`${colors.green}✅ Updated Database URL: ${NEW_CREDENTIALS.databaseUrl}${colors.reset}`);
    console.log(`${colors.green}✅ Updated Database Host: ${NEW_CREDENTIALS.host}${colors.reset}`);
    
    console.log(`\n${colors.yellow}${colors.bright}⚠️  Important Next Steps:${colors.reset}`);
    console.log(`1. Restart any running development servers to pick up the new credentials`);
    console.log(`2. Run 'node scripts/test-new-connection.js' to verify the connection`);
    console.log(`3. The service role key is now the same as the anon key (both are service role)`);
    console.log(`4. Database connection is now pointing to: ${NEW_CREDENTIALS.host}`);
}

main().catch(console.error);
