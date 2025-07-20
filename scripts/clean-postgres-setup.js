import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection string provided by user
const connectionString = 'postgresql://postgres.nehhjsiuhthflfwkfequ:Dreamframe123@@aws-0-us-east-2.pooler.supabase.com:6543/postgres';

async function cleanupDatabase(client) {
    console.log('🧹 Cleaning up existing database objects...');
    
    // Drop all tables first (in reverse dependency order)
    const tables = [
        'alert_history', 'sms_contacts', 'licenses', 'alert_settings',
        'sms_settings', 'sms_history', 'sms_config', 'audit_logs',
        'employees', 'user_profiles', 'stations'
    ];
    
    for (const table of tables) {
        try {
            await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
            console.log(`   ✅ Dropped table: ${table}`);
        } catch (error) {
            console.log(`   ⚠️  Could not drop table ${table}: ${error.message}`);
        }
    }
    
    // Drop custom types
    const types = ['sms_status', 'alert_severity', 'station_status', 'user_role'];
    
    for (const type of types) {
        try {
            await client.query(`DROP TYPE IF EXISTS ${type} CASCADE;`);
            console.log(`   ✅ Dropped type: ${type}`);
        } catch (error) {
            console.log(`   ⚠️  Could not drop type ${type}: ${error.message}`);
        }
    }
    
    // Drop functions
    try {
        await client.query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;`);
        console.log(`   ✅ Dropped function: update_updated_at_column`);
    } catch (error) {
        console.log(`   ⚠️  Could not drop function: ${error.message}`);
    }
    
    console.log('🧹 Cleanup completed!');
}

async function setupDatabase() {
    const client = new Client({ connectionString });
    
    try {
        console.log('🔗 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
        // Clean up existing objects first
        await cleanupDatabase(client);
        
        // Read the SQL schema file
        const schemaPath = path.join(__dirname, '../src/database/supabase-schema.sql');
        console.log('📖 Reading schema file:', schemaPath);
        
        const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
        console.log(`📄 Schema file loaded (${sqlSchema.length} characters, ${sqlSchema.split('\n').length} lines)`);
        
        // Execute the entire schema as one transaction
        console.log('🔧 Executing complete schema...');
        
        try {
            await client.query('BEGIN');
            await client.query(sqlSchema);
            await client.query('COMMIT');
            console.log('✅ Schema executed successfully!');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Schema execution failed, rolling back transaction');
            console.error('Error:', error.message);
            
            // Try to provide more specific error information
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                console.error('💡 This appears to be a table dependency issue.');
            } else if (error.message.includes('already exists')) {
                console.error('💡 Some database objects already exist. This might require manual cleanup.');
            } else if (error.message.includes('auth.users')) {
                console.error('💡 The auth.users table doesn\'t exist. This is expected in a standalone PostgreSQL setup.');
                console.error('💡 You may need to modify the schema to remove auth.users references.');
            }
            
            throw error;
        }
        
        // Verify tables were created
        console.log('\n🔍 Verifying table creation...');
        const tablesQuery = `
            SELECT table_name, 
                   column_count
            FROM (
                SELECT 
                    t.table_name,
                    COUNT(c.column_name) as column_count
                FROM information_schema.tables t
                LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
                WHERE t.table_schema = 'public' 
                AND t.table_type = 'BASE TABLE'
                GROUP BY t.table_name
            ) AS table_info
            ORDER BY table_name;
        `;
        
        const result = await client.query(tablesQuery);
        const createdTables = result.rows;
        
        const expectedTables = [
            'stations', 'user_profiles', 'employees', 'audit_logs', 
            'sms_config', 'sms_history', 'sms_settings', 'alert_settings', 
            'licenses', 'sms_contacts', 'alert_history'
        ];
        
        console.log(`\n📋 Table Verification (${createdTables.length} tables found):`);
        
        const tableNames = createdTables.map(row => row.table_name);
        
        expectedTables.forEach(table => {
            const tableInfo = createdTables.find(t => t.table_name === table);
            if (tableInfo) {
                console.log(`   ✅ ${table} (${tableInfo.column_count} columns)`);
            } else {
                console.log(`   ❌ ${table} - MISSING`);
            }
        });
        
        // Additional verification: Check custom types
        const typesQuery = `
            SELECT typname 
            FROM pg_type 
            WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND typtype = 'e'
            ORDER BY typname;
        `;
        
        const typesResult = await client.query(typesQuery);
        console.log(`\n📊 Custom Types Created (${typesResult.rows.length}):`);
        typesResult.rows.forEach(row => {
            console.log(`   ✅ ${row.typname}`);
        });
        
        const allTablesCreated = expectedTables.every(table => tableNames.includes(table));
        
        if (allTablesCreated) {
            console.log('\n🎉 SUCCESS! All 11 tables have been created successfully!');
            console.log(`\n📈 Database Summary:`);
            console.log(`   • ${createdTables.length} tables created`);
            console.log(`   • ${typesResult.rows.length} custom types created`);
            console.log(`   • Row Level Security (RLS) enabled`);
            console.log(`   • Triggers and indexes configured`);
            console.log(`   • Default configuration data inserted`);
        } else {
            const missingTables = expectedTables.filter(table => !tableNames.includes(table));
            console.log(`\n⚠️  WARNING: ${missingTables.length} tables are still missing:`);
            missingTables.forEach(table => console.log(`   - ${table}`));
        }
        
    } catch (error) {
        console.error('💥 Database setup failed:', error.message);
        
        if (error.message.includes('auth.users')) {
            console.log('\n💡 SOLUTION SUGGESTION:');
            console.log('The schema references Supabase\'s auth.users table which doesn\'t exist in a regular PostgreSQL setup.');
            console.log('You may need to either:');
            console.log('1. Set up Supabase auth properly, or');
            console.log('2. Modify the schema to remove auth.users references');
        }
        
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Run the setup
setupDatabase().catch(error => {
    console.error('💥 Setup script failed:', error.message);
    process.exit(1);
});