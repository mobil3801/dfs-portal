const { Client } = require('pg');
const fs = require('fs');

async function fixDatabaseSchema() {
    console.log('🔄 Starting database schema fix...');
    
    const connectionString = 'postgresql://postgres.nehhjsiuhthflfwkfequ:Dreamframe123@@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
    const client = new Client({ connectionString });
    
    try {
        console.log('📡 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
        console.log('📖 Reading SQL file...');
        const sqlContent = fs.readFileSync('database/fix-production-schema.sql', 'utf8');
        console.log(`📏 File size: ${sqlContent.length} characters`);
        
        console.log('🔧 Executing schema fixes...');
        await client.query(sqlContent);
        console.log('✅ Schema fixes completed!');
        
        // Verify the fixes
        console.log('🔍 Verifying created tables...');
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('products', 'sales_reports', 'deliveries', 'module_access')
            ORDER BY table_name
        `);
        
        console.log('📋 Tables created:', tableCheck.rows.map(row => row.table_name).join(', '));
        
        // Check missing column
        console.log('🔍 Checking licenses.expiry_date column...');
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'licenses' 
            AND column_name = 'expiry_date'
        `);
        
        const columnExists = columnCheck.rows.length > 0;
        console.log(`📋 licenses.expiry_date: ${columnExists ? 'EXISTS ✅' : 'MISSING ❌'}`);
        
        console.log('🎉 Database schema fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Code:', error.code);
        console.error('Detail:', error.detail);
        throw error;
    } finally {
        await client.end();
        console.log('👋 Database connection closed');
    }
}

// Run the fix
fixDatabaseSchema()
    .then(() => {
        console.log('✅ All done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    });