import { supabase } from '@/lib/supabase'

// Table ID to table name mapping
const TABLE_ID_MAPPING: Record<string | number, string> = {
  12599: 'stations',
  11725: 'user_profiles',
  11727: 'employees', 
  12706: 'audit_logs',
  24201: 'sms_config',
  24202: 'sms_history',
  24062: 'sms_history', // Both SMS history tables map to the same Supabase table
  24061: 'sms_settings',
  12611: 'alert_settings',
  11731: 'licenses',
  12612: 'sms_contacts',
  12613: 'alert_history',
  'User': 'auth.users' // Built-in users table
}

// Interface matching the existing window.ezsite.apis
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

// Supabase Adapter Implementation
class SupabaseAdapter implements EzsiteApiAdapter {
  private getTableName(tableId: string | number): string {
    const tableName = TABLE_ID_MAPPING[tableId]
    if (!tableName) {
      throw new Error(`Unknown table ID: ${tableId}`)
    }
    return tableName
  }

  async tablePage(tableId: string | number, params: any): Promise<{data: any, error: string | null}> {
    try {
      const tableName = this.getTableName(tableId)
      
      // Handle special case for auth.users table
      if (tableName === 'auth.users') {
        // For auth.users, we need to use the auth admin API or handle differently
        // For now, return empty result as this requires admin privileges
        return {
          data: { List: [], VirtualCount: 0 },
          error: null
        }
      }

      let query = supabase.from(tableName).select('*', { count: 'exact' })

      // Apply filters
      if (params.Filters) {
        query = convertFiltersToSupabaseQuery(query, params.Filters)
      }

      // Apply ordering
      if (params.OrderByField) {
        query = query.order(params.OrderByField, { 
          ascending: params.IsAsc !== false 
        })
      }

      // Apply pagination
      if (params.PageNo && params.PageSize) {
        const from = (params.PageNo - 1) * params.PageSize
        const to = from + params.PageSize - 1
        query = query.range(from, to)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Supabase query error:', error)
        return {
          data: null,
          error: error.message
        }
      }

      // Format response to match Easysite format
      return {
        data: {
          List: data || [],
          VirtualCount: count || 0
        },
        error: null
      }

    } catch (error: any) {
      console.error('SupabaseAdapter.tablePage error:', error)
      return {
        data: null,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  async tableCreate(tableId: string | number, data: any): Promise<{error: string | null}> {
    try {
      const tableName = this.getTableName(tableId)
      
      // Handle special case for auth.users table
      if (tableName === 'auth.users') {
        return {
          error: 'Cannot create users directly in auth.users table'
        }
      }

      // Add created_at timestamp if not present
      if (!data.created_at) {
        data.created_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from(tableName)
        .insert(data)

      if (error) {
        console.error('Supabase insert error:', error)
        return { error: error.message }
      }

      return { error: null }

    } catch (error: any) {
      console.error('SupabaseAdapter.tableCreate error:', error)
      return { error: error.message || 'Unknown error occurred' }
    }
  }

  async tableUpdate(tableId: string | number, data: any): Promise<{error: string | null}> {
    try {
      const tableName = this.getTableName(tableId)
      
      // Handle special case for auth.users table
      if (tableName === 'auth.users') {
        return {
          error: 'Cannot update users directly in auth.users table'
        }
      }

      if (!data.id) {
        return { error: 'Record ID is required for update operations' }
      }

      // Add updated_at timestamp
      data.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', data.id)

      if (error) {
        console.error('Supabase update error:', error)
        return { error: error.message }
      }

      return { error: null }

    } catch (error: any) {
      console.error('SupabaseAdapter.tableUpdate error:', error)
      return { error: error.message || 'Unknown error occurred' }
    }
  }

  async tableDelete(tableId: string | number, data: any): Promise<{error: string | null}> {
    try {
      const tableName = this.getTableName(tableId)
      
      // Handle special case for auth.users table
      if (tableName === 'auth.users') {
        return {
          error: 'Cannot delete users directly from auth.users table'
        }
      }

      if (!data.id) {
        return { error: 'Record ID is required for delete operations' }
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', data.id)

      if (error) {
        console.error('Supabase delete error:', error)
        return { error: error.message }
      }

      return { error: null }

    } catch (error: any) {
      console.error('SupabaseAdapter.tableDelete error:', error)
      return { error: error.message || 'Unknown error occurred' }
    }
  }

  async sendEmail(emailData: any): Promise<{error: string | null}> {
    try {
      // For now, log the email data as Supabase doesn't have built-in email service
      // This would need to be implemented using a service like Resend, SendGrid, etc.
      console.log('Email would be sent:', emailData)
      
      // TODO: Implement actual email sending service
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