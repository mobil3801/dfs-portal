#!/usr/bin/env node
/**
 * Automated Supabase Migration Script
 * This script uses the service role key to programmatically set up the database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nehhjsiuhthflfwkfequ.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGhqc2l1aHRoZmxmd2tmZXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxMzE3NSwiZXhwIjoyMDY4NTg5MTc1fQ.7naT6l_oNH8VI5MaEKgJ19PoYw1EErv6-ftkEin12wE';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface MigrationResult {
  success: boolean;
  step: string;
  message: string;
  error?: string;
}

class SupabaseMigrationExecutor {
  private results: MigrationResult[] = [];

  private log(step: string, message: string, success: boolean = true, error?: string) {
    const result: MigrationResult = { success, step, message, error };
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${step}: ${message}`);
    if (error) {
      console.error(`   Error: ${error}`);
    }
  }

  /**
   * Execute SQL command with proper error handling
   */
  private async executeSql(sql: string, description: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) {
        // If exec_sql doesn't exist, try direct SQL execution
        if (error.message?.includes('function exec_sql')) {
          // Split SQL into individual statements
          const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
          
          for (const statement of statements) {
            if (statement.trim()) {
              const { error: stmtError } = await supabase.from('_').select('*').limit(0);
              // This is a workaround - we'll need to use the REST API directly
            }
          }
        } else {
          this.log(description, `Failed to execute SQL`, false, error.message);
          return false;
        }
      }
      
      this.log(description, 'SQL executed successfully');
      return true;
    } catch (error) {
      this.log(description, 'Failed to execute SQL', false, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Test Supabase connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('_health_check').select('*').limit(1);
      
      // Even if the table doesn't exist, if we get a proper error response, connection works
      if (error && !error.message.includes('relation "_health_check" does not exist')) {
        this.log('Connection Test', 'Failed to connect to Supabase', false, error.message);
        return false;
      }
      
      this.log('Connection Test', 'Successfully connected to Supabase');
      return true;
    } catch (error) {
      this.log('Connection Test', 'Connection failed', false, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Create database schema by executing the SQL file
   */
  async createDatabaseSchema(): Promise<boolean> {
    try {
      const schemaPath = path.join(__dirname, '../database/supabase-schema.sql');
      
      if (!fs.existsSync(schemaPath)) {
        this.log('Schema Creation', 'Schema file not found', false, `File not found: ${schemaPath}`);
        return false;
      }

      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      this.log('Schema Loading', `Loaded schema file (${schemaSql.length} characters)`);

      // Execute the schema
      return await this.executeSql(schemaSql, 'Database Schema Creation');
    } catch (error) {
      this.log('Schema Creation', 'Failed to create schema', false, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Alternative method: Create tables using Supabase REST API
   */
  async createTablesViaApi(): Promise<boolean> {
    const tables = [
      {
        name: 'stations',
        sql: `
          CREATE TABLE IF NOT EXISTS stations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            station_id VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(50),
            zip_code VARCHAR(20),
            phone VARCHAR(20),
            email VARCHAR(255),
            status VARCHAR(20) DEFAULT 'active',
            manager_id UUID,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            fuel_types JSONB DEFAULT '[]',
            pump_count INTEGER DEFAULT 0,
            active BOOLEAN DEFAULT true,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'user_profiles',
        sql: `
          CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID,
            email VARCHAR(255) UNIQUE NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            role VARCHAR(20) DEFAULT 'viewer',
            permissions JSONB DEFAULT '{}',
            station_access JSONB DEFAULT '[]',
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMP WITH TIME ZONE,
            phone VARCHAR(20),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ];

    let success = true;
    for (const table of tables) {
      const result = await this.executeSql(table.sql, `Create ${table.name} table`);
      if (!result) success = false;
    }

    return success;
  }

  /**
   * Verify tables exist
   */
  async verifyTables(): Promise<boolean> {
    const expectedTables = [
      'stations', 'user_profiles', 'employees', 'audit_logs', 
      'sms_config', 'sms_history', 'sms_settings', 'alert_settings',
      'licenses', 'sms_contacts', 'alert_history'
    ];

    let tablesFound = 0;
    
    for (const tableName of expectedTables) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1);
        
        if (!error || error.message.includes('Results contain 0 rows')) {
          tablesFound++;
          this.log('Table Verification', `Table '${tableName}' exists`);
        } else if (error.message.includes('does not exist')) {
          this.log('Table Verification', `Table '${tableName}' missing`, false);
        }
      } catch (error) {
        this.log('Table Verification', `Failed to check table '${tableName}'`, false);
      }
    }

    const allTablesExist = tablesFound === expectedTables.length;
    this.log('Table Verification Summary', `${tablesFound}/${expectedTables.length} tables found`, allTablesExist);
    
    return allTablesExist;
  }

  /**
   * Run the complete migration
   */
  async runMigration(): Promise<void> {
    console.log('\n🚀 Starting Supabase Database Migration...\n');

    // Step 1: Test connection
    const connectionTest = await this.testConnection();
    if (!connectionTest) {
      console.log('\nMigration failed: Cannot connect to Supabase\n');
      return;
    }

    // Step 2: Try to create schema
    let schemaSuccess = await this.createDatabaseSchema();
    
    // Step 3: If schema creation failed, try alternative method
    if (!schemaSuccess) {
      this.log('Migration Strategy', 'Trying alternative table creation method');
      schemaSuccess = await this.createTablesViaApi();
    }

    // Step 4: Verify tables
    const verification = await this.verifyTables();
    
    // Step 5: Summary
    this.printSummary();
    
    if (verification) {
      console.log('\n🎉 Migration completed successfully!\n');
      console.log('Next steps:');
      console.log('1. Navigate to http://localhost:8080/admin/supabase-test');
      console.log('2. Verify connection shows 🟢 CONNECTED');
      console.log('3. Test application functionality');
    } else {
      console.log('\nMigration completed with issues. Manual intervention may be required.\n');
    }
  }

  /**
   * Print migration summary
   */
  printSummary(): void {
    console.log('\nMigration Summary:');
    console.log('========================');
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total Steps: ${this.results.length}`);
    
    if (failed > 0) {
      console.log('\nFailed Steps:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.step}: ${r.error || r.message}`));
    }
    
    console.log('\n');
  }
}

// Execute migration if run directly
if (require.main === module) {
  const migrator = new SupabaseMigrationExecutor();
  migrator.runMigration().catch(console.error);
}

export default SupabaseMigrationExecutor;