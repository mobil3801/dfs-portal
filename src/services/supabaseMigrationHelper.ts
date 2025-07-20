import { supabaseAdapter } from './supabase/supabaseAdapter';
import { supabaseStationService } from './supabaseStationService';
import { supabaseUserValidationService } from './supabaseUserValidationService';
import { supabaseAuditLogger } from './supabaseAuditLogger';
import { supabaseOptimizedDataService } from './supabaseOptimizedDataService';

/**
 * Migration helper to replace window.ezsite.apis with Supabase equivalents
 * This provides a centralized way to handle the migration process
 */
export class SupabaseMigrationHelper {
  private static instance: SupabaseMigrationHelper;

  static getInstance(): SupabaseMigrationHelper {
    if (!SupabaseMigrationHelper.instance) {
      SupabaseMigrationHelper.instance = new SupabaseMigrationHelper();
    }
    return SupabaseMigrationHelper.instance;
  }

  /**
   * Replace window.ezsite.apis globally with Supabase adapter
   */
  replaceGlobalEzsiteApis(): void {
    if (typeof window !== 'undefined') {
      // Create the ezsite object structure if it doesn't exist
      if (!window.ezsite) {
        (window as any).ezsite = {};
      }

      // Replace the apis object with our Supabase adapter
      (window as any).ezsite.apis = {
        tablePage: supabaseAdapter.tablePage.bind(supabaseAdapter),
        tableCreate: supabaseAdapter.tableCreate.bind(supabaseAdapter),
        tableUpdate: supabaseAdapter.tableUpdate.bind(supabaseAdapter),
        tableDelete: supabaseAdapter.tableDelete.bind(supabaseAdapter),
        sendEmail: supabaseAdapter.sendEmail.bind(supabaseAdapter)
      };

      console.log('✅ Global window.ezsite.apis replaced with Supabase adapter');
    }
  }

  /**
   * Get the appropriate Supabase service based on table ID or name
   */
  getSupabaseService(tableId: string | number): any {
    const normalizedTableId = String(tableId);

    switch (normalizedTableId) {
      case '12599': // stations
        return supabaseStationService;
      case '11725': // user_profiles  
        return supabaseUserValidationService;
      case '12706': // audit_logs
        return supabaseAuditLogger;
      case '11727': // employees
      case '24201': // sms_config
      case '24202': // sms_history
      case '12611': // alert_settings
      case '11731': // licenses
      case '12612': // sms_contacts
      case '12613': // alert_history
      case '24061': // enhanced_sms_config
      case '24062': // enhanced_sms_history
      case '14605': // email_automation_configs
      default:
        // Return the general adapter for tables without specific services
        return supabaseAdapter;
    }
  }

  /**
   * Migration wrapper for tablePage calls
   */
  async migrateTablePage(
    tableId: string | number, 
    params: any,
    useOptimizedService: boolean = false
  ): Promise<any> {
    if (useOptimizedService) {
      return await supabaseOptimizedDataService.fetchData(
        tableId,
        params,
        { priority: 'medium', cache: true }
      );
    }

    const service = this.getSupabaseService(tableId);
    if (service === supabaseAdapter) {
      return await service.tablePage(tableId, params);
    }

    // For specialized services, use their methods if available
    if (tableId === 12599 && service === supabaseStationService) {
      // Use station-specific methods when possible
      return await service.getStations();
    }

    // Fallback to adapter
    return await supabaseAdapter.tablePage(tableId, params);
  }

  /**
   * Migration wrapper for tableCreate calls
   */
  async migrateTableCreate(
    tableId: string | number, 
    data: any
  ): Promise<any> {
    const service = this.getSupabaseService(tableId);
    
    if (service === supabaseAdapter) {
      return await service.tableCreate(tableId, data);
    }

    // For specialized services, use their create methods if available
    if (tableId === 12599 && service === supabaseStationService) {
      return await service.addStation(data);
    }

    if (tableId === 12706 && service === supabaseAuditLogger) {
      // For audit logs, use the specialized logging method
      await service.logEvent(
        data.event_type || 'Generic Event',
        data.event_status || 'Success',
        data
      );
      return { error: null };
    }

    // Fallback to adapter
    return await supabaseAdapter.tableCreate(tableId, data);
  }

  /**
   * Migration wrapper for tableUpdate calls
   */
  async migrateTableUpdate(
    tableId: string | number, 
    data: any
  ): Promise<any> {
    const service = this.getSupabaseService(tableId);
    
    if (service === supabaseAdapter) {
      return await service.tableUpdate(tableId, data);
    }

    // For specialized services, use their update methods if available
    if (tableId === 12599 && service === supabaseStationService) {
      return await service.updateStation(data);
    }

    // Fallback to adapter
    return await supabaseAdapter.tableUpdate(tableId, data);
  }

  /**
   * Migration wrapper for tableDelete calls
   */
  async migrateTableDelete(
    tableId: string | number, 
    data: any
  ): Promise<any> {
    const service = this.getSupabaseService(tableId);
    
    if (service === supabaseAdapter) {
      return await service.tableDelete(tableId, data);
    }

    // For specialized services, use their delete methods if available
    if (tableId === 12599 && service === supabaseStationService) {
      return await service.deleteStation(data.id);
    }

    // Fallback to adapter
    return await supabaseAdapter.tableDelete(tableId, data);
  }

  /**
   * Migration wrapper for sendEmail calls
   */
  async migrateSendEmail(emailData: any): Promise<any> {
    return await supabaseAdapter.sendEmail(emailData);
  }

  /**
   * Get migration status for all services
   */
  getMigrationStatus(): {
    serviceName: string;
    tableId?: string;
    status: 'completed' | 'in-progress' | 'pending';
    migrationNotes?: string;
  }[] {
    return [
      {
        serviceName: 'StationService',
        tableId: '12599',
        status: 'completed',
        migrationNotes: 'Migrated to supabaseStationService.ts'
      },
      {
        serviceName: 'UserValidationService', 
        tableId: '11725',
        status: 'completed',
        migrationNotes: 'Migrated to supabaseUserValidationService.ts'
      },
      {
        serviceName: 'AuditLogger',
        tableId: '12706', 
        status: 'completed',
        migrationNotes: 'Migrated to supabaseAuditLogger.ts'
      },
      {
        serviceName: 'SMS Services',
        tableId: '24201,24202',
        status: 'pending',
        migrationNotes: 'clickSendSmsService, enhancedSmsService need migration'
      },
      {
        serviceName: 'License Alert Service',
        tableId: '12611,11731,12612,12613',
        status: 'pending',
        migrationNotes: 'licenseAlertService needs migration'
      },
      {
        serviceName: 'Permission Hooks',
        tableId: '11725',
        status: 'pending', 
        migrationNotes: 'use-page-permissions, use-realtime-permissions need update'
      },
      {
        serviceName: 'Analytics Utils',
        tableId: 'multiple',
        status: 'pending',
        migrationNotes: 'analytics-* utils need migration'
      },
      {
        serviceName: 'OptimizedDataService',
        status: 'completed',
        migrationNotes: 'Migrated to supabaseOptimizedDataService.ts'
      }
    ];
  }

  /**
   * Validate migration by checking if all services are working
   */
  async validateMigration(): Promise<{
    success: boolean;
    results: Array<{
      service: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const results = [];

    try {
      // Test Station Service
      const stations = await supabaseStationService.getStations();
      results.push({
        service: 'StationService',
        success: true
      });
    } catch (error) {
      results.push({
        service: 'StationService',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    try {
      // Test User Validation Service
      const validationResult = await supabaseUserValidationService.validateUser({
        email: 'test@example.com',
        role: 'Employee'
      });
      results.push({
        service: 'UserValidationService',
        success: true
      });
    } catch (error) {
      results.push({
        service: 'UserValidationService',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    try {
      // Test Audit Logger
      await supabaseAuditLogger.logEvent('Test Event', 'Success', {
        additional_data: { test: true }
      });
      results.push({
        service: 'AuditLogger',
        success: true
      });
    } catch (error) {
      results.push({
        service: 'AuditLogger',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    try {
      // Test Supabase Adapter
      const testResult = await supabaseAdapter.tablePage(12599, {
        PageNo: 1,
        PageSize: 1
      });
      results.push({
        service: 'SupabaseAdapter',
        success: !testResult.error
      });
    } catch (error) {
      results.push({
        service: 'SupabaseAdapter',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const allSuccessful = results.every(result => result.success);

    return {
      success: allSuccessful,
      results
    };
  }

  /**
   * Create migration instructions for remaining services
   */
  getNextMigrationSteps(): string[] {
    return [
      '1. Replace window.ezsite.apis calls in SMS services with supabaseAdapter',
      '2. Update license alert service to use supabaseAdapter', 
      '3. Update permission hooks to use supabaseAdapter',
      '4. Update analytics utilities to use supabaseAdapter',
      '5. Update all import statements to use new Supabase services',
      '6. Remove old service files once migration is verified',
      '7. Test all functionality end-to-end',
      '8. Verify data integrity after migration'
    ];
  }

  /**
   * Log migration progress
   */
  logMigrationProgress(): void {
    const status = this.getMigrationStatus();
    const completed = status.filter(s => s.status === 'completed').length;
    const total = status.length;
    const percentage = Math.round((completed / total) * 100);

    console.log('\n🔄 Supabase Migration Progress');
    console.log('================================');
    console.log(`Progress: ${completed}/${total} services (${percentage}%)`);
    console.log('\n📊 Service Status:');
    
    status.forEach(service => {
      const statusIcon = service.status === 'completed' ? '✅' : 
                        service.status === 'in-progress' ? '🔄' : '⏳';
      console.log(`${statusIcon} ${service.serviceName} - ${service.status}`);
      if (service.migrationNotes) {
        console.log(`   └─ ${service.migrationNotes}`);
      }
    });

    console.log('\n🔧 Next Steps:');
    this.getNextMigrationSteps().forEach(step => {
      console.log(`   ${step}`);
    });
  }
}

// Export singleton instance
export const supabaseMigrationHelper = SupabaseMigrationHelper.getInstance();

// Export initialization function
export const initializeSupabaseMigration = (): void => {
  const helper = SupabaseMigrationHelper.getInstance();
  
  // Replace global APIs
  helper.replaceGlobalEzsiteApis();
  
  // Log progress
  helper.logMigrationProgress();
  
  console.log('\n🚀 Supabase migration helper initialized');
  console.log('Use supabaseMigrationHelper.validateMigration() to test services');
};

export default SupabaseMigrationHelper;