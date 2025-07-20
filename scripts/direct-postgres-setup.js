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
        console.log(`📄 Schema file loaded (${sqlSchema.length} characters)`);
        
        // Split the schema into individual statements
        const statements = sqlSchema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            
        console.log(`🔧 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (!statement) continue;
            
            try {
                console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
                await client.query(statement + ';');
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                console.error(`Statement: ${statement.substring(0, 100)}...`);
            }
        }
        
        console.log(`\n📊 Execution Summary:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        
        // Verify tables were created
        console.log('\n🔍 Verifying table creation...');
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;
        
        const result = await client.query(tablesQuery);
        const createdTables = result.rows.map(row => row.table_name);
        
        const expectedTables = [
            'stations', 'user_profiles', 'employees', 'audit_logs', 
            'sms_config', 'sms_history', 'sms_settings', 'alert_settings', 
            'licenses', 'sms_contacts', 'alert_history'
        ];
        
        console.log(`\n📋 Table Verification (${createdTables.length} tables found):`);
        expectedTables.forEach(table => {
            const exists = createdTables.includes(table);
            console.log(`   ${exists ? '✅' : '❌'} ${table}`);
        });
        
        const allTablesCreated = expectedTables.every(table => createdTables.includes(table));
        
        if (allTablesCreated) {
            console.log('\n🎉 SUCCESS! All 11 tables have been created successfully!');
        } else {
            const missingTables = expectedTables.filter(table => !createdTables.includes(table));
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