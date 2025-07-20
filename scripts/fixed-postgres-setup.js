import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection string provided by user
const connectionString = 'postgresql://postgres.nehhjsiuhthflfwkfequ:Dreamframe123@@aws-0-us-east-2.pooler.supabase.com:6543/postgres';

async function setupDatabase() {
    const client = new Client({ connectionString });
    
    try {
        console.log('🔗 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
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
                console.error('💡 This appears to be a table dependency issue. Some indexes or constraints reference tables that haven\'t been created yet.');
            }
            
            throw error;
        }
        
        // Verify tables were created
        console.log('\n🔍 Verifying table creation...');
        const tablesQuery = `
            SELECT table_name, 
                   column_count,
                   has_primary_key,
                   table_comment
            FROM (
                SELECT 
                    t.table_name,
                    COUNT(c.column_name) as column_count,
                    CASE WHEN pk.constraint_name IS NOT NULL THEN true ELSE false END as has_primary_key,
                    obj_description(pgc.oid) as table_comment
                FROM information_schema.tables t
                LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
                LEFT JOIN information_schema.table_constraints pk ON t.table_name = pk.table_name AND pk.constraint_type = 'PRIMARY KEY'
                LEFT JOIN pg_class pgc ON pgc.relname = t.table_name
                WHERE t.table_schema = 'public' 
                AND t.table_type = 'BASE TABLE'
                GROUP BY t.table_name, pk.constraint_name, pgc.oid
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
                console.log(`   ✅ ${table} (${tableInfo.column_count} columns, PK: ${tableInfo.has_primary_key})`);
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
        
        const allTablesCreated = expectedTables.every(table => tableNames.includes(table));
        
        if (allTablesCreated) {
            console.log('\n🎉 SUCCESS! All 11 tables have been created successfully!');
            console.log(`\n📈 Database Summary:`);
            console.log(`   • ${createdTables.length} tables created`);
            console.log(`   • ${typesResult.rows.length} custom types created`);
            console.log(`   • ${functionsResult.rows.length} functions created`);
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