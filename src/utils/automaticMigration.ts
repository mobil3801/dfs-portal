/**
 * Automatic Supabase Migration Utility
 * Executes database migration using the service role key
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create admin client with service role
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface MigrationStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  error?: string;
}

export class AutomaticMigration {
  private steps: MigrationStep[] = [];
  private onProgress?: (steps: MigrationStep[]) => void;

  constructor(onProgress?: (steps: MigrationStep[]) => void) {
    this.onProgress = onProgress;
  }

  private updateStep(stepName: string, status: MigrationStep['status'], message: string, error?: string) {
    const existingStepIndex = this.steps.findIndex(s => s.step === stepName);
    
    if (existingStepIndex >= 0) {
      this.steps[existingStepIndex] = { step: stepName, status, message, error };
    } else {
      this.steps.push({ step: stepName, status, message, error });
    }
    
    console.log(`${status === 'completed' ? '✅' : status === 'failed' ? '❌' : '🔄'} ${stepName}: ${message}`);
    
    if (this.onProgress) {
      this.onProgress([...this.steps]);
    }
  }

  /**
   * Test connection to Supabase
   */
  async testConnection(): Promise<boolean> {
    this.updateStep('Connection Test', 'running', 'Testing Supabase connection...');
    
    try {
      // Test with a simple query
      const { error } = await supabaseAdmin
        .from('nonexistent_table')
        .select('*')
        .limit(1);
      
      // If we get a "relation does not exist" error, that means connection is working
      if (error && error.message.includes('does not exist')) {
        this.updateStep('Connection Test', 'completed', 'Connection successful');
        return true;
      } else if (!error) {
        this.updateStep('Connection Test', 'completed', 'Connection successful');
        return true;
      } else {
        this.updateStep('Connection Test', 'failed', 'Connection failed', error.message);
        return false;
      }
    } catch (error) {
      this.updateStep('Connection Test', 'failed', 'Connection failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Create database tables one by one
   */
  async createTables(): Promise<boolean> {
    this.updateStep('Table Creation', 'running', 'Creating database tables...');
    
    const tableDefinitions = [
      {
        name: 'stations',
        sql: `
          CREATE TABLE IF NOT EXISTS public.stations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
          CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      },
      {
        name: 'employees',
        sql: `
          CREATE TABLE IF NOT EXISTS public.employees (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            employee_id VARCHAR(50) UNIQUE NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            position VARCHAR(100),
            department VARCHAR(100),
            station_id UUID REFERENCES public.stations(id),
            hire_date DATE,
            termination_date DATE,
            salary DECIMAL(10, 2),
            hourly_rate DECIMAL(8, 2),
            is_active BOOLEAN DEFAULT true,
            emergency_contact JSONB DEFAULT '{}',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'audit_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS public.audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            user_email VARCHAR(255),
            action VARCHAR(100) NOT NULL,
            table_name VARCHAR(100),
            record_id VARCHAR(100),
            old_values JSONB,
            new_values JSONB,
            ip_address INET,
            user_agent TEXT,
            session_id VARCHAR(255),
            severity VARCHAR(20) DEFAULT 'low',
            success BOOLEAN DEFAULT true,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ];

    let createdTables = 0;
    let failedTables = 0;

    for (const table of tableDefinitions) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { query: table.sql });
        
        if (error) {
          console.error(`Failed to create table ${table.name}:`, error);
          failedTables++;
        } else {
          createdTables++;
        }
      } catch (error) {
        console.error(`Error creating table ${table.name}:`, error);
        failedTables++;
      }
    }

    if (failedTables === 0) {
      this.updateStep('Table Creation', 'completed', `Successfully created ${createdTables} core tables`);
      return true;
    } else {
      this.updateStep('Table Creation', 'failed', `Created ${createdTables}, failed ${failedTables}`, 'Some tables failed to create');
      return false;
    }
  }

  /**
   * Alternative: Execute full schema using direct SQL
   */
  async executeFullSchema(): Promise<boolean> {
    this.updateStep('Schema Execution', 'running', 'Executing complete database schema...');
    
    const schemaSql = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Create stations table
      CREATE TABLE IF NOT EXISTS public.stations (
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

      -- Create user_profiles table
      CREATE TABLE IF NOT EXISTS public.user_profiles (
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

      -- Create employees table
      CREATE TABLE IF NOT EXISTS public.employees (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        position VARCHAR(100),
        department VARCHAR(100),
        station_id UUID REFERENCES public.stations(id),
        hire_date DATE,
        termination_date DATE,
        salary DECIMAL(10, 2),
        hourly_rate DECIMAL(8, 2),
        is_active BOOLEAN DEFAULT true,
        emergency_contact JSONB DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create audit_logs table
      CREATE TABLE IF NOT EXISTS public.audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        user_email VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100),
        record_id VARCHAR(100),
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(255),
        severity VARCHAR(20) DEFAULT 'low',
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create SMS tables
      CREATE TABLE IF NOT EXISTS public.sms_config (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider VARCHAR(50) NOT NULL DEFAULT 'twilio',
        api_key VARCHAR(255),
        api_secret VARCHAR(255),
        from_number VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        settings JSONB DEFAULT '{}',
        rate_limit INTEGER DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.sms_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        to_number VARCHAR(20) NOT NULL,
        from_number VARCHAR(20),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        provider VARCHAR(50) DEFAULT 'twilio',
        provider_id VARCHAR(255),
        cost DECIMAL(8, 4),
        error_message TEXT,
        sent_at TIMESTAMP WITH TIME ZONE,
        delivered_at TIMESTAMP WITH TIME ZONE,
        station_id UUID REFERENCES public.stations(id),
        user_id UUID,
        campaign_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_stations_station_id ON public.stations(station_id);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
      CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON public.employees(employee_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
    `;

    try {
      // Try to execute using the SQL editor endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({ query: schemaSql })
      });

      if (response.ok) {
        this.updateStep('Schema Execution', 'completed', 'Database schema executed successfully');
        return true;
      } else {
        const errorText = await response.text();
        this.updateStep('Schema Execution', 'failed', 'Schema execution failed', errorText);
        return false;
      }
    } catch (error) {
      this.updateStep('Schema Execution', 'failed', 'Schema execution failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Verify that tables were created
   */
  async verifyTables(): Promise<{ success: boolean; tablesFound: number; totalTables: number }> {
    this.updateStep('Table Verification', 'running', 'Verifying created tables...');
    
    const expectedTables = ['stations', 'user_profiles', 'employees', 'audit_logs', 'sms_config', 'sms_history'];
    let tablesFound = 0;

    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabaseAdmin.from(tableName).select('*').limit(1);
        
        if (!error || error.message.includes('Results contain 0 rows')) {
          tablesFound++;
        }
      } catch (error) {
        // Table might not exist, which is expected if creation failed
      }
    }

    const success = tablesFound === expectedTables.length;
    this.updateStep(
      'Table Verification', 
      success ? 'completed' : 'failed',
      `Found ${tablesFound}/${expectedTables.length} tables`,
      success ? undefined : 'Some tables are missing'
    );

    return { success, tablesFound, totalTables: expectedTables.length };
  }

  /**
   * Insert sample data for testing
   */
  async insertSampleData(): Promise<boolean> {
    this.updateStep('Sample Data', 'running', 'Inserting sample data...');
    
    try {
      // Insert a sample station
      const { error: stationError } = await supabaseAdmin
        .from('stations')
        .insert([
          {
            station_id: 'STATION_001',
            name: 'Main Street Gas Station',
            address: '123 Main Street',
            city: 'Springfield',
            state: 'IL',
            zip_code: '62701',
            phone: '(217) 555-0123',
            email: 'manager@mainstreetgas.com',
            status: 'active'
          }
        ]);

      if (stationError) {
        this.updateStep('Sample Data', 'failed', 'Failed to insert sample station', stationError.message);
        return false;
      }

      // Insert a sample user profile
      const { error: userError } = await supabaseAdmin
        .from('user_profiles')
        .insert([
          {
            email: 'admin@dfsportal.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            permissions: { all: true },
            station_access: ['STATION_001'],
            is_active: true
          }
        ]);

      if (userError) {
        this.updateStep('Sample Data', 'failed', 'Failed to insert sample user', userError.message);
        return false;
      }

      this.updateStep('Sample Data', 'completed', 'Sample data inserted successfully');
      return true;
    } catch (error) {
      this.updateStep('Sample Data', 'failed', 'Failed to insert sample data', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Run the complete migration process
   */
  async runCompleteMigration(): Promise<boolean> {
    console.log('🚀 Starting Automatic Supabase Migration...');
    
    // Step 1: Test connection
    const connectionSuccess = await this.testConnection();
    if (!connectionSuccess) {
      return false;
    }

    // Step 2: Execute schema
    const schemaSuccess = await this.executeFullSchema();
    if (!schemaSuccess) {
      // Try alternative method
      const tablesSuccess = await this.createTables();
      if (!tablesSuccess) {
        return false;
      }
    }

    // Step 3: Verify tables
    const verification = await this.verifyTables();
    if (!verification.success) {
      return false;
    }

    // Step 4: Insert sample data
    const sampleDataSuccess = await this.insertSampleData();

    console.log('✅ Migration completed successfully!');
    return true;
  }

  /**
   * Get current migration progress
   */
  getProgress(): MigrationStep[] {
    return [...this.steps];
  }
}

export default AutomaticMigration;