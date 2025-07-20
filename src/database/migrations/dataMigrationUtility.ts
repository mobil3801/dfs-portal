import { supabase } from '@/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'

// Table ID to table name mapping (same as in supabaseAdapter)
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
  'User': 'user_profiles' // Map User table to user_profiles
}

// Data transformation mapping for different tables
const FIELD_TRANSFORMATIONS: Record<string, Record<string, string | ((value: any) => any)>> = {
  stations: {
    StationId: 'station_id',
    Name: 'name',
    Address: 'address',
    City: 'city',
    State: 'state',
    ZipCode: 'zip_code',
    Phone: 'phone',
    Email: 'email',
    Status: (value: any) => value?.toLowerCase() || 'active',
    ManagerId: 'manager_id',
    Latitude: 'latitude',
    Longitude: 'longitude',
    Active: 'active',
    Notes: 'notes',
    CreatedDate: 'created_at',
    ModifiedDate: 'updated_at'
  },
  user_profiles: {
    UserId: 'user_id',
    Email: 'email',
    FirstName: 'first_name',
    LastName: 'last_name',
    Role: (value: any) => value?.toLowerCase() || 'viewer',
    Permissions: (value: any) => typeof value === 'string' ? JSON.parse(value || '{}') : value,
    StationAccess: (value: any) => typeof value === 'string' ? JSON.parse(value || '[]') : value,
    IsActive: 'is_active',
    LastLogin: 'last_login',
    Phone: 'phone',
    CreatedDate: 'created_at',
    ModifiedDate: 'updated_at'
  },
  employees: {
    EmployeeId: 'employee_id',
    FirstName: 'first_name',
    LastName: 'last_name',
    Email: 'email',
    Phone: 'phone',
    Position: 'position',
    Department: 'department',
    StationId: 'station_id',
    HireDate: 'hire_date',
    TerminationDate: 'termination_date',
    Salary: 'salary',
    HourlyRate: 'hourly_rate',
    IsActive: 'is_active',
    EmergencyContact: (value: any) => typeof value === 'string' ? JSON.parse(value || '{}') : value,
    Notes: 'notes',
    CreatedDate: 'created_at',
    ModifiedDate: 'updated_at'
  },
  audit_logs: {
    UserId: 'user_id',
    UserEmail: 'user_email',
    Action: 'action',
    TableName: 'table_name',
    RecordId: 'record_id',
    OldValues: (value: any) => typeof value === 'string' ? JSON.parse(value || 'null') : value,
    NewValues: (value: any) => typeof value === 'string' ? JSON.parse(value || 'null') : value,
    IpAddress: 'ip_address',
    UserAgent: 'user_agent',
    SessionId: 'session_id',
    Severity: (value: any) => value?.toLowerCase() || 'low',
    Success: 'success',
    ErrorMessage: 'error_message',
    CreatedDate: 'created_at'
  }
}

export interface MigrationResult {
  success: boolean
  totalRecords: number
  successfulRecords: number
  failedRecords: number
  errors: string[]
  tableName: string
  duration: number
}

export interface MigrationOptions {
  batchSize?: number
  validateData?: boolean
  skipDuplicates?: boolean
  logErrors?: boolean
}

export class DataMigrationUtility {
  private defaultOptions: MigrationOptions = {
    batchSize: 100,
    validateData: true,
    skipDuplicates: true,
    logErrors: true
  }

  /**
   * Migrate data from CSV file
   */
  async migrateFromCSV(
    filePath: string, 
    tableId: string | number, 
    options: MigrationOptions = {}
  ): Promise<MigrationResult> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }
    const tableName = TABLE_ID_MAPPING[tableId]
    
    if (!tableName) {
      throw new Error(`Unknown table ID: ${tableId}`)
    }

    try {
      // Read and parse CSV file
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      })

      if (parseResult.errors.length > 0) {
        throw new Error(`CSV parsing errors: ${parseResult.errors.map(e => e.message).join(', ')}`)
      }

      return await this.processRecords(parseResult.data, tableName, tableId, opts, startTime)

    } catch (error: any) {
      return {
        success: false,
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        errors: [error.message],
        tableName,
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Migrate data from JSON file
   */
  async migrateFromJSON(
    filePath: string, 
    tableId: string | number, 
    options: MigrationOptions = {}
  ): Promise<MigrationResult> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }
    const tableName = TABLE_ID_MAPPING[tableId]
    
    if (!tableName) {
      throw new Error(`Unknown table ID: ${tableId}`)
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const jsonData = JSON.parse(fileContent)
      
      // Handle different JSON structures
      let records = Array.isArray(jsonData) ? jsonData : 
                   jsonData.data ? jsonData.data : 
                   jsonData.List ? jsonData.List : 
                   [jsonData]

      return await this.processRecords(records, tableName, tableId, opts, startTime)

    } catch (error: any) {
      return {
        success: false,
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        errors: [error.message],
        tableName,
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Process records in batches
   */
  private async processRecords(
    records: any[], 
    tableName: string, 
    tableId: string | number,
    options: MigrationOptions, 
    startTime: number
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      totalRecords: records.length,
      successfulRecords: 0,
      failedRecords: 0,
      errors: [],
      tableName,
      duration: 0
    }

    console.log(`Starting migration for ${tableName}: ${records.length} records`)

    // Process records in batches
    const batchSize = options.batchSize || 100
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`)

      try {
        const transformedBatch = batch
          .map(record => this.transformRecord(record, tableName))
          .filter(record => record !== null)

        if (transformedBatch.length === 0) {
          continue
        }

        // Insert batch into Supabase
        const { data, error } = await supabase
          .from(tableName)
          .insert(transformedBatch)

        if (error) {
          result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
          result.failedRecords += batch.length
        } else {
          result.successfulRecords += transformedBatch.length
        }

      } catch (error: any) {
        result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        result.failedRecords += batch.length
      }

      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    result.duration = Date.now() - startTime
    result.success = result.failedRecords === 0

    console.log(`Migration completed for ${tableName}:`)
    console.log(`- Total: ${result.totalRecords}`)
    console.log(`- Successful: ${result.successfulRecords}`)
    console.log(`- Failed: ${result.failedRecords}`)
    console.log(`- Duration: ${result.duration}ms`)

    if (options.logErrors && result.errors.length > 0) {
      this.logErrors(tableName, result.errors)
    }

    return result
  }

  /**
   * Transform record from old format to new schema
   */
  private transformRecord(record: any, tableName: string): any | null {
    if (!record || typeof record !== 'object') {
      return null
    }

    const transformations = FIELD_TRANSFORMATIONS[tableName]
    if (!transformations) {
      // No specific transformations, return as-is with lowercase keys
      const transformed: any = {}
      for (const [key, value] of Object.entries(record)) {
        transformed[key.toLowerCase()] = value
      }
      return transformed
    }

    const transformed: any = {}
    
    for (const [oldField, transformation] of Object.entries(transformations)) {
      const value = record[oldField]
      
      if (value !== undefined && value !== null && value !== '') {
        if (typeof transformation === 'function') {
          transformed[oldField.toLowerCase()] = transformation(value)
        } else if (typeof transformation === 'string') {
          transformed[transformation] = value
        }
      }
    }

    // Add any additional fields that don't need transformation
    for (const [key, value] of Object.entries(record)) {
      if (!transformations[key] && value !== undefined && value !== null && value !== '') {
        transformed[key.toLowerCase()] = value
      }
    }

    // Add standard timestamps if not present
    if (!transformed.created_at) {
      transformed.created_at = new Date().toISOString()
    }
    if (!transformed.updated_at && tableName !== 'audit_logs') {
      transformed.updated_at = new Date().toISOString()
    }

    return transformed
  }

  /**
   * Validate record data
   */
  private validateRecord(record: any, tableName: string): boolean {
    // Basic validation - can be extended with specific rules per table
    if (!record || typeof record !== 'object') {
      return false
    }

    // Table-specific validations
    switch (tableName) {
      case 'stations':
        return !!record.station_id && !!record.name
      case 'user_profiles':
        return !!record.email
      case 'employees':
        return !!record.employee_id && !!record.first_name && !!record.last_name
      case 'audit_logs':
        return !!record.action
      default:
        return true
    }
  }

  /**
   * Log migration errors to file
   */
  private logErrors(tableName: string, errors: string[]): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const logFile = path.join(process.cwd(), 'src/database/migrations/logs', `${tableName}_errors_${timestamp}.log`)
    
    // Ensure logs directory exists
    const logDir = path.dirname(logFile)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    const logContent = [
      `Migration Errors for ${tableName}`,
      `Timestamp: ${new Date().toISOString()}`,
      '='.repeat(50),
      ...errors,
      ''
    ].join('\n')

    fs.writeFileSync(logFile, logContent)
    console.log(`Errors logged to: ${logFile}`)
  }

  /**
   * Get migration summary for all tables
   */
  async getMigrationStatus(): Promise<Record<string, number>> {
    const status: Record<string, number> = {}
    
    for (const tableName of Object.values(TABLE_ID_MAPPING)) {
      if (tableName === 'auth.users') continue // Skip auth table
      
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        status[tableName] = error ? -1 : count || 0
      } catch (error) {
        status[tableName] = -1
      }
    }
    
    return status
  }
}

export default DataMigrationUtility