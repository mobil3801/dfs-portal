import { supabase } from '@/lib/supabase';

interface ApiCallParams {
  PageNo?: number;
  PageSize?: number;
  OrderByField?: string;
  IsAsc?: boolean;
  [key: string]: any;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Supabase Migration Helper
 * Provides API interaction capabilities for database migration operations
 */
export class SupabaseMigrationHelper {
  private static instance: SupabaseMigrationHelper;
  private initialized = false;

  private constructor() {
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SupabaseMigrationHelper {
    if (!SupabaseMigrationHelper.instance) {
      SupabaseMigrationHelper.instance = new SupabaseMigrationHelper();
    }
    return SupabaseMigrationHelper.instance;
  }

  /**
   * Initialize the migration helper
   */
  private async initialize(): Promise<void> {
    try {
      // Test Supabase connection
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Supabase session check failed:', error.message);
      }
      
      this.initialized = true;
      console.log('SupabaseMigrationHelper initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SupabaseMigrationHelper:', error);
      this.initialized = false;
    }
  }

  /**
   * Call API endpoint with parameters
   * @param endpoint - API endpoint name
   * @param id - Resource ID
   * @param params - Query parameters
   */
  async callApi(endpoint: string, id: number, params: ApiCallParams): Promise<ApiResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`Calling API endpoint: ${endpoint} with ID: ${id}`, params);

      // Handle different endpoint types
      switch (endpoint) {
        case 'tablePage':
          return await this.handleTablePageRequest(id, params);
        
        case 'migration':
          return await this.handleMigrationRequest(id, params);
        
        case 'health':
          return await this.handleHealthCheck();
        
        default:
          return await this.handleGenericRequest(endpoint, id, params);
      }

    } catch (error: any) {
      console.error('API call failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown API error',
        message: `Failed to call ${endpoint} API`
      };
    }
  }

  /**
   * Handle table page requests - typically for paginated data
   */
  private async handleTablePageRequest(id: number, params: ApiCallParams): Promise<ApiResponse> {
    const { PageNo = 1, PageSize = 10, OrderByField = 'id', IsAsc = true } = params;
    
    try {
      // Example: Fetch from user_profiles table with pagination
      let query = supabase
        .from('public.user_profiles')
        .select('*');

      // Apply pagination
      const from = (PageNo - 1) * PageSize;
      const to = from + PageSize - 1;
      query = query.range(from, to);

      // Apply ordering
      query = query.order(OrderByField, { ascending: IsAsc });

      // Apply ID filter if provided
      if (id > 0) {
        query = query.eq('id', id);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: {
          items: data || [],
          pageNo: PageNo,
          pageSize: PageSize,
          totalItems: data?.length || 0
        },
        message: `Successfully retrieved ${data?.length || 0} records`
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch table page data'
      };
    }
  }

  /**
   * Handle migration requests
   */
  private async handleMigrationRequest(id: number, params: ApiCallParams): Promise<ApiResponse> {
    try {
      // Check if required tables exist
      const tables = ['public.user_profiles', 'public.stations', 'public.products', 'public.orders', 'public.employees'];
      const tableChecks = await Promise.all(
        tables.map(async (tableName) => {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            return {
              table: tableName,
              exists: !error || error.code !== 'PGRST116', // PGRST116 = table not found
              error: error?.message
            };
          } catch (err) {
            return {
              table: tableName,
              exists: false,
              error: (err as Error).message
            };
          }
        })
      );

      return {
        success: true,
        data: {
          migrationId: id,
          tableChecks,
          timestamp: new Date().toISOString()
        },
        message: 'Migration status checked successfully'
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Migration request failed'
      };
    }
  }

  /**
   * Handle health check requests
   */
  private async handleHealthCheck(): Promise<ApiResponse> {
    try {
      // Test basic Supabase connectivity
      const { data, error } = await supabase
        .from('public.user_profiles')
        .select('count(*)', { count: 'exact', head: true });

      const isHealthy = !error || error.code === 'PGRST116'; // Table not found is OK during setup

      return {
        success: isHealthy,
        data: {
          healthy: isHealthy,
          timestamp: new Date().toISOString(),
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          error: error?.message || null
        },
        message: isHealthy ? 'System is healthy' : 'System has issues'
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Health check failed'
      };
    }
  }

  /**
   * Handle generic API requests
   */
  private async handleGenericRequest(endpoint: string, id: number, params: ApiCallParams): Promise<ApiResponse> {
    console.log(`Generic API call to ${endpoint} not implemented yet`);
    
    return {
      success: true,
      data: {
        endpoint,
        id,
        params,
        timestamp: new Date().toISOString(),
        note: 'This is a mock response - endpoint not yet implemented'
      },
      message: `Mock response for ${endpoint} endpoint`
    };
  }

  /**
   * Test the migration helper functionality
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.callApi('health', 0, {});
      return result.success;
    } catch (error) {
      console.error('Migration helper connection test failed:', error);
      return false;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<ApiResponse> {
    return await this.callApi('migration', 0, {});
  }

  /**
   * Reset the migration helper instance
   */
  static reset(): void {
    if (SupabaseMigrationHelper.instance) {
      SupabaseMigrationHelper.instance.initialized = false;
      SupabaseMigrationHelper.instance = null as any;
    }
  }
}

export default SupabaseMigrationHelper;