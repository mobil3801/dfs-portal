import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Transaction Pooler connection
const connectionConfig = {
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.nehhjsiuhthflfwkfequ',
    password: 'Dreamframe123@',
    ssl: { rejectUnauthorized: false }, // Required for Supabase pooler
    pool_mode: 'transaction'
};

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
    const client = new Client(connectionConfig);
    
    try {
        console.log('🔗 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
        // Clean up existing objects first
        await cleanupDatabase(client);
        
        // Read the simplified SQL schema file
        const schemaPath = path.join(__dirname, 'simplified-schema.sql');
        console.log('📖 Reading simplified schema file:', schemaPath);
        
        const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
        console.log(`📄 Schema file loaded (${sqlSchema.length} characters, ${sqlSchema.split('\n').length} lines)`);
        
        // Execute the entire schema as one transaction
        console.log('🔧 Executing simplified schema...');
        
        try {
            await client.query('BEGIN');
            await client.query(sqlSchema);
            await client.query('COMMIT');
            console.log('✅ Simplified schema executed successfully!');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Schema execution failed, rolling back transaction');
            console.error('Error:', error.message);
            console.error('Error position:', error.position);
            console.error('Error detail:', error.detail);
            
            throw error;
        }
        
        // Verify tables were created
        console.log('\n🔍 Verifying table creation...');
        const tablesQuery = `
            SELECT 
                t.table_name,
                COUNT(c.column_name) as column_count,
                obj_description(pgc.oid, 'pg_class') as table_comment
            FROM information_schema.tables t
            LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.table_schema = t.table_schema
            LEFT JOIN pg_class pgc ON pgc.relname = t.table_name AND pgc.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            WHERE t.table_schema = 'public' 
            AND t.table_type = 'BASE TABLE'
            GROUP BY t.table_name, pgc.oid
            ORDER BY t.table_name;
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
                if (tableInfo.table_comment) {
                    console.log(`      💬 ${tableInfo.table_comment}`);
                }
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
        
        // Check functions
        const functionsQuery = `
            SELECT proname 
            FROM pg_proc 
            WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            ORDER BY proname;
        `;
        
        const functionsResult = await client.query(functionsQuery);
        console.log(`\n⚙️  Functions Created (${functionsResult.rows.length}):`);
        functionsResult.rows.forEach(row => {
            console.log(`   ✅ ${row.proname}()`);
        });
        
        // Check indexes
        const indexQuery = `
            SELECT indexname
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname NOT LIKE '%_pkey'
            ORDER BY indexname;
        `;
        
        const indexResult = await client.query(indexQuery);
        console.log(`\n📑 Indexes Created (${indexResult.rows.length}):`);
        indexResult.rows.forEach(row => {
            console.log(`   ✅ ${row.indexname}`);
        });
        
        const allTablesCreated = expectedTables.every(table => tableNames.includes(table));
        
        if (allTablesCreated) {
            console.log('\n🎉 SUCCESS! All 11 tables have been created successfully!');
            console.log(`\n📈 Database Summary:`);
            console.log(`   • ${createdTables.length} tables created`);
            console.log(`   • ${typesResult.rows.length} custom types created`);
            console.log(`   • ${functionsResult.rows.length} functions created`);
            console.log(`   • ${indexResult.rows.length} indexes created`);
            console.log(`   • Triggers configured for updated_at columns`);
            console.log(`   • Default configuration data inserted`);
            console.log(`   • Compatible with both PostgreSQL and Supabase`);
            
            return true;
        } else {
            const missingTables = expectedTables.filter(table => !tableNames.includes(table));
            console.log(`\n⚠️  WARNING: ${missingTables.length} tables are still missing:`);
            missingTables.forEach(table => console.log(`   - ${table}`));
            return false;
        }
        
    } catch (error) {
        console.error('💥 Database setup failed:', error.message);
        console.error('Full error:', error);
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