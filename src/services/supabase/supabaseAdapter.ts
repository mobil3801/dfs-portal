import { supabase } from '@/lib/supabase'
import { translateError, getErrorMessage } from '@/utils/errorMessageTranslations'

// Debug flag to enable verbose logging
const DEBUG_MODE = true;

// PostgreSQL error codes and their meanings
const PG_ERROR_CODES = {
  '42P01': 'Relation (table) does not exist',
  '42703': 'Column does not exist',
  '42P02': 'Parameter does not exist',
  '23505': 'Unique violation (duplicate key)',
  '23503': 'Foreign key violation',
  '22P02': 'Invalid text representation',
  '22003': 'Numeric value out of range',
  '08P01': 'Protocol violation',
  '08001': 'Connection exception',
  '08006': 'Connection failure',
  '25P02': 'Transaction state error',
  '40P01': 'Deadlock detected',
  '53100': 'Disk full',
  '53200': 'Out of memory',
  '53300': 'Too many connections',
  '57P01': 'Admin shutdown',
  '57P02': 'Crash shutdown',
  '57P03': 'Cannot connect now',
  '57P04': 'Database dropped',
  '57P05': 'Idle session timeout',
};

// Table ID to table name mapping - Updated with compatibility views
// The Supabase client automatically handles schema resolution via db.schema config
const TABLE_ID_MAPPING: Record<string | number, string> = {
  11725: 'user_profiles',     // User profiles with UUID foreign keys
  11726: 'products',          // Products management
  11727: 'employees_view',    // Employee management (using compatibility view)
  11731: 'licenses',          // License tracking
  12196: 'deliveries',        // Delivery management
  12356: 'sales_reports',     // Sales reporting
  12599: 'stations',          // Station management
  12611: 'alert_settings',    // Alert configuration
  12612: 'sms_contacts',      // SMS contact management
  12613: 'alert_history',     // Alert history
  12706: 'audit_logs',        // Audit logging
  24061: 'sms_settings',      // SMS provider settings
  24062: 'sms_history',       // SMS delivery history
  24201: 'sms_config',        // SMS configuration
  24202: 'sms_history',       // Alternative SMS history mapping
  25712: 'module_access',     // Module permissions
  26928: 'file_uploads',      // File upload tracking
  'User': 'auth.users'        // Supabase auth users (explicitly qualified)
}

// Special handling for tables that need write operations on base tables
const WRITE_TABLE_MAPPING: Record<string | number, string> = {
  11727: 'employees',         // Write operations go to base table
}

// Interface matching the existing window.ezsite.apis
// cspell:ignore ezsite
export interface EzsiteApiAdapter {
  tablePage(tableId: string | number, params: any): Promise<{data: any, error: string | null}>
  tableCreate(tableId: string | number, data: any): Promise<{error: string | null}>
  tableUpdate(tableId: string | number, data: any): Promise<{error: string | null}>
  tableDelete(tableId: string | number, data: any): Promise<{error: string | null}>
  sendEmail?(emailData: any): Promise<{error: string | null}>
}

// Convert Easysite filter format to Supabase query format
function convertFiltersToSupabaseQuery(query: any, filters: any[] = []) {
  if (!filters || filters.length === 0) {
    return query
  }

  for (const filter of filters) {
    const { name, op, value } = filter

    switch (op) {
      case 'Equal':
        query = query.eq(name, value)
        break
      case 'NotEqual':
        query = query.neq(name, value)
        break
      case 'GreaterThan':
        query = query.gt(name, value)
        break
      case 'GreaterThanOrEqual':
        query = query.gte(name, value)
        break
      case 'LessThan':
        query = query.lt(name, value)
        break
      case 'LessThanOrEqual':
        query = query.lte(name, value)
        break
      case 'Like':
        query = query.like(name, `%${value}%`)
        break
      case 'StringStartsWith':
        query = query.like(name, `${value}%`)
        break
      case 'StringEndsWith':
        query = query.like(name, `%${value}`)
        break
      case 'In':
        query = query.in(name, Array.isArray(value) ? value : [value])
        break
      case 'IsNull':
        query = query.is(name, null)
        break
      case 'IsNotNull':
        query = query.not(name, 'is', null)
        break
      default:
        console.warn(`Unknown filter operation: ${op}`)
        break
    }
  }

  return query
}

/**
 * Logs detailed database error information
 * @param error The database error object
 * @param context Additional context about the operation
 */
function logDatabaseError(error: any, context: Record<string, any> = {}) {
  const errorCode = error?.code;
  const errorMessage = error?.message || 'Unknown error';
  const errorDetail = error?.details || '';
  const errorHint = error?.hint || '';
  
  console.error('========== DATABASE ERROR ==========');
  console.error(`Error code: ${errorCode} - ${PG_ERROR_CODES[errorCode] || 'Unknown error code'}`);
  console.error(`Message: ${errorMessage}`);
  
  if (errorDetail) console.error(`Detail: ${errorDetail}`);
  if (errorHint) console.error(`Hint: ${errorHint}`);
  
  // Log additional context
  console.error('Context:', JSON.stringify(context, null, 2));
  console.error('Stack trace:', error?.stack || new Error().stack);
  console.error('====================================');
}

/**
 * Logs SQL query information for debugging
 * @param tableName The table being queried
 * @param operation The operation being performed (select, insert, update, delete)
 * @param params Query parameters or filters
 */
function logSqlQuery(tableName: string, operation: string, params: any = {}) {
  if (!DEBUG_MODE) return;
  
  console.log('========== SQL QUERY ==========');
  console.log(`Operation: ${operation.toUpperCase()} on table "${tableName}"`);
  console.log('Parameters:', JSON.stringify(params, null, 2));
  console.log('Timestamp:', new Date().toISOString());
  console.log('===============================');
}

/**
 * Checks if a table exists in any schema in the database
 * @param tableName The table name to check
 * @returns Promise resolving to an object with found flag and schema name if found
 */
async function checkTableInAllSchemas(tableName: string): Promise<{found: boolean, schema?: string}> {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_schema')
      .eq('table_name', tableName);
    
    if (error) {
      logDatabaseError(error, { operation: 'schema_check', tableName });
      return { found: false };
    }
    
    if (data && data.length > 0) {
      const schema = data[0].table_schema;
      console.log(`Table "${tableName}" found in schema "${schema}"`);
      return { found: true, schema };
    }
    
    console.log(`Table "${tableName}" not found in any schema`);
    return { found: false };
  } catch (error) {
    logDatabaseError(error, { operation: 'schema_check', tableName });
    return { found: false };
  }
}

// Supabase Adapter Implementation
// cspell:ignore Ezsite
class SupabaseAdapter implements EzsiteApiAdapter {
  private getTableName(tableId: string | number, forWrite: boolean = false): string {
    // For write operations, use the base table if a special mapping exists
    const tableName = forWrite && WRITE_TABLE_MAPPING[tableId]
      ? WRITE_TABLE_MAPPING[tableId]
      : TABLE_ID_MAPPING[tableId];
      
    if (!tableName) {
      console.error('Table ID mapping failed')
      console.error('Requested table ID:', tableId)
      console.error('Available mappings:', Object.keys(TABLE_ID_MAPPING))
      console.error('Mapping values:', Object.values(TABLE_ID_MAPPING))
      throw new Error(`Unknown table ID: ${tableId}`)
    }
    return tableName
  }

  async tablePage(tableId: string | number, params: any): Promise<{data: any, error: string | null}> {
    const context: {
      operation: string;
      tableId: string | number;
      params: any;
      tableName?: string;
    } = {
      operation: 'tablePage',
      tableId,
      params
    };
    
    try {
      const tableName = this.getTableName(tableId);
      context.tableName = tableName;
      
      // Schema naming issue resolved: Table names now properly resolved via Supabase client schema config
      
      // Handle special case for auth.users table
      if (tableName === 'auth.users') {
        // For auth.users, we need to use the auth admin API or handle differently
        // For now, return empty result as this requires admin privileges
        return {
          data: { List: [], VirtualCount: 0 },
          error: null
        };
      }

      // Log the query being executed
      logSqlQuery(tableName, 'select', params);

      let query = supabase.from(tableName).select('*', { count: 'exact' });

      // Apply filters
      if (params.Filters) {
        query = convertFiltersToSupabaseQuery(query, params.Filters);
      }

      // Apply ordering
      if (params.OrderByField) {
        query = query.order(params.OrderByField, {
          ascending: params.IsAsc !== false
        });
      }

      // Apply pagination
      if (params.PageNo && params.PageSize) {
        const from = (params.PageNo - 1) * params.PageSize;
        const to = from + params.PageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        // Enhanced error logging
        logDatabaseError(error, context);
        
        // Use user-friendly error messages
        const userFriendlyMessage = getErrorMessage(error, `loading data from ${tableName}`);
        
        return {
          data: null,
          error: userFriendlyMessage
        };
      }

      // Format response to match Easysite format
      return {
        data: {
          List: data || [],
          VirtualCount: count || 0
        },
        error: null
      };

    } catch (error: any) {
      // Enhanced error logging for unexpected errors
      console.error('========== UNEXPECTED ERROR ==========');
      console.error('SupabaseAdapter.tablePage error:', error);
      console.error('Context:', JSON.stringify(context, null, 2));
      console.error('Stack trace:', error?.stack || new Error().stack);
      console.error('======================================');
      
      // Use user-friendly error messages for unexpected errors
      const userFriendlyMessage = getErrorMessage(error, `loading data from ${context.tableName || 'table'}`);
      
      return {
        data: null,
        error: userFriendlyMessage
      };
    }
  }

  async tableCreate(tableId: string | number, data: any): Promise<{error: string | null}> {
    const context: {
      operation: string;
      tableId: string | number;
      data: any;
      tableName?: string;
    } = {
      operation: 'tableCreate',
      tableId,
      data: { ...data, sensitive_fields_removed: true } // Don't log sensitive data
    };
    
    try {
      const tableName = this.getTableName(tableId, true); // Use base table for writes
      context.tableName = tableName;
      
      // Handle special case for auth.users table
      if (tableName === 'auth.users') {
        return {
          error: 'Cannot create users directly in auth.users table'
        };
      }

      // Add created_at timestamp if not present
      if (!data.created_at) {
        data.created_at = new Date().toISOString();
      }

      // Log the insert operation
      logSqlQuery(tableName, 'insert', { recordCount: 1 });

      const { error } = await supabase
        .from(tableName)
        .insert(data);

      if (error) {
        // Enhanced error logging
        logDatabaseError(error, context);
        
        // Use user-friendly error messages
        const userFriendlyMessage = getErrorMessage(error, `creating record in ${tableName}`);
        return { error: userFriendlyMessage };
      }

      return { error: null };

    } catch (error: any) {
      // Enhanced error logging for unexpected errors
      console.error('========== UNEXPECTED ERROR ==========');
      console.error('SupabaseAdapter.tableCreate error:', error);
      console.error('Context:', JSON.stringify(context, null, 2));
      console.error('Stack trace:', error?.stack || new Error().stack);
      console.error('======================================');
      
      // Use user-friendly error messages for unexpected errors
      const userFriendlyMessage = getErrorMessage(error, `creating record in ${context.tableName || 'table'}`);
      return { error: userFriendlyMessage };
    }
  }

  async tableUpdate(tableId: string | number, data: any): Promise<{error: string | null}> {
    const context: {
      operation: string;
      tableId: string | number;
      data: { id: any; sensitive_fields_removed: boolean; };
      tableName?: string;
    } = {
      operation: 'tableUpdate',
      tableId,
      data: { id: data.ID || data.id, sensitive_fields_removed: true } // Only log the ID
    };
    
    try {
      const tableName = this.getTableName(tableId, true); // Use base table for writes
      context.tableName = tableName;
      
      // Handle special case for auth.users table
      if (tableName === 'auth.users') {
        return {
          error: 'Cannot update users directly in auth.users table'
        };
      }

      // Handle both ID and id for compatibility
      const recordId = data.ID || data.id;
      if (!recordId) {
        return { error: 'Record ID is required for update operations' };
      }

      // Add updated_at timestamp
      data.updated_at = new Date().toISOString();

      // Remove ID from data to avoid column conflicts, keep id
      if (data.ID) {
        data.id = data.ID;
        delete data.ID;
      }

      // Log the update operation
      logSqlQuery(tableName, 'update', { id: recordId });

      const { error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', recordId);

      if (error) {
        // Enhanced error logging
        logDatabaseError(error, context);
        
        // Use user-friendly error messages
        const userFriendlyMessage = getErrorMessage(error, `updating record in ${tableName}`);
        return { error: userFriendlyMessage };
      }

      return { error: null };

    } catch (error: any) {
      // Enhanced error logging for unexpected errors
      console.error('========== UNEXPECTED ERROR ==========');
      console.error('SupabaseAdapter.tableUpdate error:', error);
      console.error('Context:', JSON.stringify(context, null, 2));
      console.error('Stack trace:', error?.stack || new Error().stack);
      console.error('======================================');
      
      // Use user-friendly error messages for unexpected errors
      const userFriendlyMessage = getErrorMessage(error, `updating record in ${context.tableName || 'table'}`);
      return { error: userFriendlyMessage };
    }
  }

  async tableDelete(tableId: string | number, data: any): Promise<{error: string | null}> {
    const context: {
      operation: string;
      tableId: string | number;
      recordId: any;
      tableName?: string;
    } = {
      operation: 'tableDelete',
      tableId,
      recordId: data.ID || data.id
    };
    
    try {
      const tableName = this.getTableName(tableId, true); // Use base table for writes
      context.tableName = tableName;
      
      // Handle special case for auth.users table
      if (tableName === 'auth.users') {
        return {
          error: 'Cannot delete users directly from auth.users table'
        };
      }

      // Handle both ID and id for compatibility
      const recordId = data.ID || data.id;
      if (!recordId) {
        return { error: 'Record ID is required for delete operations' };
      }

      // Log the delete operation
      logSqlQuery(tableName, 'delete', { id: recordId });

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) {
        // Enhanced error logging
        logDatabaseError(error, context);
        
        // Use user-friendly error messages
        const userFriendlyMessage = getErrorMessage(error, `deleting record from ${tableName}`);
        return { error: userFriendlyMessage };
      }

      return { error: null };

    } catch (error: any) {
      // Enhanced error logging for unexpected errors
      console.error('========== UNEXPECTED ERROR ==========');
      console.error('SupabaseAdapter.tableDelete error:', error);
      console.error('Context:', JSON.stringify(context, null, 2));
      console.error('Stack trace:', error?.stack || new Error().stack);
      console.error('======================================');
      
      // Use user-friendly error messages for unexpected errors
      const userFriendlyMessage = getErrorMessage(error, `deleting record from ${context.tableName || 'table'}`);
      return { error: userFriendlyMessage };
    }
  }

  async sendEmail(emailData: any): Promise<{error: string | null}> {
    try {
      // For now, log the email data as Supabase doesn't have built-in email service
      // This would need to be implemented using a service like Resend, SendGrid, etc.
      console.log('Email would be sent:', emailData)
      
      // NOTE: Email service implementation requires external service integration
      // Consider using Resend, SendGrid, or Supabase Edge Functions for production
      return {
        error: 'Email service not yet implemented in Supabase migration'
      }

    } catch (error: any) {
      console.error('SupabaseAdapter.sendEmail error:', error)
      return { error: error.message || 'Unknown error occurred' }
    }
  }
}

// Create singleton instance
export const supabaseAdapter = new SupabaseAdapter()

// Create global replacement for window.ezsite.apis
// cspell:ignore ezsite Ezsite
export const createEzsiteApiReplacement = () => {
  return {
    tablePage: supabaseAdapter.tablePage.bind(supabaseAdapter),
    tableCreate: supabaseAdapter.tableCreate.bind(supabaseAdapter),
    tableUpdate: supabaseAdapter.tableUpdate.bind(supabaseAdapter),
    tableDelete: supabaseAdapter.tableDelete.bind(supabaseAdapter),
    sendEmail: supabaseAdapter.sendEmail.bind(supabaseAdapter)
  }
}

export default supabaseAdapter