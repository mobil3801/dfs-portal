// Supabase Connection Test Utility
import { supabase } from '@/lib/supabase';

export interface ConnectionTestResult {
  connected: boolean;
  error?: string;
  details: {
    clientConfigured: boolean;
    databaseReachable: boolean;
    tablesExist: boolean;
    tableCount: number;
  };
}

export class SupabaseConnectionTest {
  
  /**
   * Test Supabase connection and database setup
   */
  static async testConnection(): Promise<ConnectionTestResult> {
    const result: ConnectionTestResult = {
      connected: false,
      details: {
        clientConfigured: false,
        databaseReachable: false,
        tablesExist: false,
        tableCount: 0
      }
    };

    try {
      // Test 1: Check if Supabase client is configured
      if (!supabase) {
        result.error = 'Supabase client not initialized';
        return result;
      }
      result.details.clientConfigured = true;
      console.log('Supabase client is configured');

      // Test 2: Check if we can reach the database
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1);

      if (error) {
        result.error = `Database connection failed: ${error.message}`;
        return result;
      }
      result.details.databaseReachable = true;
      console.log('Database is reachable');

      // Test 3: Check if our tables exist
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', [
          'stations', 'user_profiles', 'products', 'employees', 
          'sales_reports', 'vendors', 'orders', 'licenses',
          'sms_settings', 'sms_contacts', 'sms_history'
        ]);

      if (tablesError) {
        result.error = `Error checking tables: ${tablesError.message}`;
        return result;
      }

      result.details.tableCount = tables?.length || 0;
      result.details.tablesExist = (tables?.length || 0) > 0;
      
      if (result.details.tablesExist) {
        console.log(`Found ${result.details.tableCount} of our tables`);
        result.connected = true;
      } else {
        result.error = 'No application tables found - database schema not set up yet';
        console.log('No application tables found - run the database schema setup');
      }

    } catch (error) {
      result.error = `Connection test failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('Supabase connection test failed:', error);
    }

    return result;
  }

  /**
   * Test a specific table operation
   */
  static async testTableOperation(tableName: string = 'stations'): Promise<{success: boolean; error?: string; count?: number}> {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Get connection status for display
   */
  static async getConnectionStatus(): Promise<string> {
    const test = await this.testConnection();
    
    if (test.connected) {
      return `🟢 SUPABASE CONNECTED - ${test.details.tableCount} tables found`;
    } else if (test.details.databaseReachable) {
      return `🟡 SUPABASE REACHABLE - Database setup needed`;
    } else if (test.details.clientConfigured) {
      return `🟠 SUPABASE CLIENT OK - Database connection failed`;
    } else {
      return `🔴 SUPABASE NOT CONFIGURED`;
    }
  }

  /**
   * Log detailed connection status to console
   */
  static async logConnectionStatus(): Promise<void> {
    console.log('\n=== SUPABASE CONNECTION TEST ===');
    const result = await this.testConnection();
    
    console.log(`Client Configured: ${result.details.clientConfigured ? 'YES' : 'NO'}`);
    console.log(`Database Reachable: ${result.details.databaseReachable ? 'YES' : 'NO'}`);
    console.log(`Tables Exist: ${result.details.tablesExist ? 'YES' : 'NO'} (${result.details.tableCount}/11)`);
    console.log(`Overall Status: ${result.connected ? 'CONNECTED' : 'NOT READY'}`);
    
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }

    if (!result.connected && result.details.clientConfigured) {
      console.log('\n💡 NEXT STEPS:');
      console.log('1. Set up database tables: Run the SQL schema in Supabase dashboard');
      console.log('2. Import your existing data');
      console.log('3. Test the connection again');
    }
    console.log('================================\n');
  }
}

export default SupabaseConnectionTest;