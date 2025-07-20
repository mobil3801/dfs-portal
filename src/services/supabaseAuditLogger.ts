import { supabaseAdapter } from './supabase/supabaseAdapter';

interface AuditLogEntry {
  event_type: string;
  user_id?: string; // UUID in Supabase
  username?: string;
  ip_address?: string;
  user_agent?: string;
  event_timestamp: string;
  event_status: 'Success' | 'Failed' | 'Blocked' | 'Suspicious';
  resource_accessed?: string;
  action_performed?: string;
  failure_reason?: string;
  session_id?: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  additional_data?: any; // JSON field in Supabase
  station?: string;
  station_id?: string; // UUID reference
  geo_location?: string;
  
  // Supabase fields
  id?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuditLogFilters {
  event_type?: string;
  user_id?: string;
  event_status?: string;
  risk_level?: string;
  date_from?: string;
  date_to?: string;
  station?: string;
  station_id?: string;
}

class SupabaseAuditLoggerService {
  private static instance: SupabaseAuditLoggerService;
  private readonly tableId = 12706; // audit_logs table ID (mapped in adapter)

  static getInstance(): SupabaseAuditLoggerService {
    if (!SupabaseAuditLoggerService.instance) {
      SupabaseAuditLoggerService.instance = new SupabaseAuditLoggerService();
    }
    return SupabaseAuditLoggerService.instance;
  }

  // Get browser and system information
  private getBrowserInfo(): {
    ip_address: string;
    user_agent: string;
    session_id: string;
  } {
    return {
      ip_address: this.getClientIP(),
      user_agent: navigator.userAgent,
      session_id: this.generateSessionId()
    };
  }

  private getClientIP(): string {
    // In a real implementation, this would be obtained from server-side or a service
    // For now, we'll use a placeholder
    try {
      // Check if we have access to connection info (some browsers provide this)
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        return `client_${connection.effectiveType}`;
      }
    } catch (error) {
      // Ignore errors
    }
    
    return 'client_unknown';
  }

  private generateSessionId(): string {
    // Generate more robust session ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 12);
    const browserFingerprint = this.getBrowserFingerprint();
    
    return `sess_${timestamp}_${random}_${browserFingerprint}`;
  }

  private getBrowserFingerprint(): string {
    // Simple browser fingerprint for session tracking
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    return btoa(`${screen}_${timezone}_${language}`).substr(0, 8);
  }

  // Assess risk level based on event characteristics
  private assessRiskLevel(
    eventType: string, 
    status: string, 
    additionalFactors: any
  ): 'Low' | 'Medium' | 'High' | 'Critical' {
    // Failed login attempts
    if (status === 'Failed' && eventType === 'Login') {
      return 'Medium';
    }
    
    // Blocked actions
    if (status === 'Blocked') {
      return 'High';
    }
    
    // Suspicious activity
    if (status === 'Suspicious') {
      return 'Critical';
    }
    
    // High-privilege operations
    if (eventType === 'Permission Change' || 
        eventType === 'Admin Action' || 
        eventType === 'User Role Change') {
      return 'High';
    }
    
    // Data modifications
    if (eventType === 'Data Modification' || 
        eventType === 'Data Deletion') {
      return 'Medium';
    }
    
    // Multiple failed attempts or unusual patterns
    if (additionalFactors?.failedAttempts > 3) {
      return 'High';
    }
    
    if (additionalFactors?.unusualActivity) {
      return 'Critical';
    }
    
    // System configuration changes
    if (eventType.includes('Configuration') || 
        eventType.includes('Settings')) {
      return 'Medium';
    }
    
    return 'Low';
  }

  // Log an audit event
  async logEvent(
    eventType: string,
    status: 'Success' | 'Failed' | 'Blocked' | 'Suspicious',
    details: {
      user_id?: string;
      username?: string;
      resource_accessed?: string;
      action_performed?: string;
      failure_reason?: string;
      station?: string;
      station_id?: string;
      additional_data?: any;
      geo_location?: string;
    } = {}
  ): Promise<void> {
    try {
      const browserInfo = this.getBrowserInfo();
      const timestamp = new Date().toISOString();
      const riskLevel = this.assessRiskLevel(eventType, status, details.additional_data);

      const logEntry: Omit<AuditLogEntry, 'id' | 'created_at' | 'updated_at'> = {
        event_type: eventType,
        event_status: status,
        event_timestamp: timestamp,
        risk_level: riskLevel,
        ...browserInfo,
        ...details,
        // Ensure additional_data is properly formatted for JSON storage
        additional_data: details.additional_data ? 
          (typeof details.additional_data === 'string' ? 
            details.additional_data : 
            JSON.stringify(details.additional_data)
          ) : null
      };

      const { error } = await supabaseAdapter.tableCreate(this.tableId, logEntry);
      
      if (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error to avoid breaking main functionality
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Silently fail to avoid disrupting user experience
    }
  }

  // Convenience methods for common events
  async logLogin(
    username: string, 
    success: boolean, 
    userId?: string, 
    failureReason?: string,
    stationId?: string
  ): Promise<void> {
    await this.logEvent(
      'Login',
      success ? 'Success' : 'Failed',
      {
        username,
        user_id: userId,
        action_performed: 'authenticate',
        failure_reason: failureReason,
        station_id: stationId,
        additional_data: { 
          timestamp: new Date().toISOString(),
          login_method: 'password'
        }
      }
    );
  }

  async logLogout(username: string, userId?: string, stationId?: string): Promise<void> {
    await this.logEvent(
      'Logout',
      'Success',
      {
        username,
        user_id: userId,
        station_id: stationId,
        action_performed: 'logout',
        additional_data: {
          session_duration: this.calculateSessionDuration()
        }
      }
    );
  }

  async logRegistration(
    username: string, 
    success: boolean, 
    failureReason?: string,
    userId?: string
  ): Promise<void> {
    await this.logEvent(
      'Registration',
      success ? 'Success' : 'Failed',
      {
        username,
        user_id: userId,
        action_performed: 'register',
        failure_reason: failureReason,
        additional_data: {
          registration_method: 'email'
        }
      }
    );
  }

  async logPasswordReset(
    username: string, 
    success: boolean, 
    failureReason?: string,
    userId?: string
  ): Promise<void> {
    await this.logEvent(
      'Password Reset',
      success ? 'Success' : 'Failed',
      {
        username,
        user_id: userId,
        action_performed: 'reset_password',
        failure_reason: failureReason,
        additional_data: {
          reset_method: 'email_link'
        }
      }
    );
  }

  async logDataAccess(
    resource: string,
    action: string,
    userId?: string,
    username?: string,
    stationId?: string,
    additionalData?: any
  ): Promise<void> {
    await this.logEvent(
      'Data Access',
      'Success',
      {
        user_id: userId,
        username,
        resource_accessed: resource,
        action_performed: action,
        station_id: stationId,
        additional_data: additionalData
      }
    );
  }

  async logDataModification(
    resource: string,
    action: string,
    userId?: string,
    username?: string,
    stationId?: string,
    changes?: any
  ): Promise<void> {
    await this.logEvent(
      'Data Modification',
      'Success',
      {
        user_id: userId,
        username,
        resource_accessed: resource,
        action_performed: action,
        station_id: stationId,
        additional_data: { 
          changes,
          timestamp: new Date().toISOString()
        }
      }
    );
  }

  async logDataDeletion(
    resource: string,
    resourceId: string,
    userId?: string,
    username?: string,
    stationId?: string,
    deletedData?: any
  ): Promise<void> {
    await this.logEvent(
      'Data Deletion',
      'Success',
      {
        user_id: userId,
        username,
        resource_accessed: resource,
        action_performed: 'delete',
        station_id: stationId,
        additional_data: { 
          resource_id: resourceId,
          deleted_data: deletedData,
          timestamp: new Date().toISOString()
        }
      }
    );
  }

  async logPermissionChange(
    targetUserId: string,
    changedBy: string,
    changes: any,
    stationId?: string
  ): Promise<void> {
    await this.logEvent(
      'Permission Change',
      'Success',
      {
        user_id: changedBy,
        resource_accessed: `user_${targetUserId}`,
        action_performed: 'modify_permissions',
        station_id: stationId,
        additional_data: { 
          target_user_id: targetUserId, 
          changes,
          change_timestamp: new Date().toISOString()
        }
      }
    );
  }

  async logUserRoleChange(
    targetUserId: string,
    oldRole: string,
    newRole: string,
    changedBy: string,
    stationId?: string
  ): Promise<void> {
    await this.logEvent(
      'User Role Change',
      'Success',
      {
        user_id: changedBy,
        resource_accessed: `user_${targetUserId}`,
        action_performed: 'change_role',
        station_id: stationId,
        additional_data: {
          target_user_id: targetUserId,
          old_role: oldRole,
          new_role: newRole,
          change_timestamp: new Date().toISOString()
        }
      }
    );
  }

  async logAdminAction(
    action: string,
    userId: string,
    details?: any,
    stationId?: string
  ): Promise<void> {
    await this.logEvent(
      'Admin Action',
      'Success',
      {
        user_id: userId,
        action_performed: action,
        station_id: stationId,
        additional_data: {
          ...details,
          admin_action_timestamp: new Date().toISOString()
        }
      }
    );
  }

  async logSuspiciousActivity(
    description: string,
    userId?: string,
    username?: string,
    details?: any,
    stationId?: string
  ): Promise<void> {
    await this.logEvent(
      'Suspicious Activity',
      'Suspicious',
      {
        user_id: userId,
        username,
        action_performed: 'suspicious_behavior',
        failure_reason: description,
        station_id: stationId,
        additional_data: {
          ...details,
          detection_timestamp: new Date().toISOString(),
          severity: 'high'
        }
      }
    );
  }

  async logSecurityIncident(
    incidentType: string,
    description: string,
    userId?: string,
    username?: string,
    details?: any,
    stationId?: string
  ): Promise<void> {
    await this.logEvent(
      'Security Incident',
      'Critical',
      {
        user_id: userId,
        username,
        action_performed: incidentType,
        failure_reason: description,
        station_id: stationId,
        additional_data: {
          ...details,
          incident_id: this.generateIncidentId(),
          incident_timestamp: new Date().toISOString(),
          requires_investigation: true
        }
      }
    );
  }

  // Calculate session duration helper
  private calculateSessionDuration(): number {
    // This would typically track from login time
    // For now, return a placeholder
    return 0;
  }

  // Generate incident ID for security incidents
  private generateIncidentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `INC_${timestamp}_${random}`;
  }

  // Retrieve audit logs with filtering and pagination
  async getLogs(
    pageNo: number = 1,
    pageSize: number = 50,
    filters: AuditLogFilters = {}
  ): Promise<{ data: any; error: string | null }> {
    try {
      const queryFilters = [];

      if (filters.event_type) {
        queryFilters.push({
          name: 'event_type',
          op: 'Equal',
          value: filters.event_type
        });
      }

      if (filters.user_id) {
        queryFilters.push({
          name: 'user_id',
          op: 'Equal',
          value: filters.user_id
        });
      }

      if (filters.event_status) {
        queryFilters.push({
          name: 'event_status',
          op: 'Equal',
          value: filters.event_status
        });
      }

      if (filters.risk_level) {
        queryFilters.push({
          name: 'risk_level',
          op: 'Equal',
          value: filters.risk_level
        });
      }

      if (filters.station) {
        queryFilters.push({
          name: 'station',
          op: 'Equal',
          value: filters.station
        });
      }

      if (filters.station_id) {
        queryFilters.push({
          name: 'station_id',
          op: 'Equal',
          value: filters.station_id
        });
      }

      if (filters.date_from) {
        queryFilters.push({
          name: 'event_timestamp',
          op: 'GreaterThanOrEqual',
          value: filters.date_from
        });
      }

      if (filters.date_to) {
        queryFilters.push({
          name: 'event_timestamp',
          op: 'LessThanOrEqual',
          value: filters.date_to
        });
      }

      const { data, error } = await supabaseAdapter.tablePage(this.tableId, {
        PageNo: pageNo,
        PageSize: pageSize,
        OrderByField: 'event_timestamp',
        IsAsc: false, // Most recent first
        Filters: queryFilters
      });

      // Parse additional_data JSON strings back to objects
      if (data?.List) {
        data.List = data.List.map((log: any) => ({
          ...log,
          additional_data: log.additional_data ? 
            (typeof log.additional_data === 'string' ? 
              JSON.parse(log.additional_data) : 
              log.additional_data
            ) : null
        }));
      }

      return { data, error };
    } catch (error) {
      console.error('Error retrieving audit logs:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get audit log statistics
  async getStatistics(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalEvents: number;
    failedAttempts: number;
    suspiciousActivity: number;
    securityIncidents: number;
    topEventTypes: Array<{ type: string; count: number }>;
    riskDistribution: Array<{ level: string; count: number }>;
    userActivity: Array<{ user_id: string; username: string; event_count: number }>;
    stationActivity: Array<{ station_id: string; station: string; event_count: number }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
      }

      const { data } = await this.getLogs(1, 2000, {
        date_from: startDate.toISOString(),
        date_to: endDate.toISOString()
      });

      if (!data?.List) {
        return {
          totalEvents: 0,
          failedAttempts: 0,
          suspiciousActivity: 0,
          securityIncidents: 0,
          topEventTypes: [],
          riskDistribution: [],
          userActivity: [],
          stationActivity: []
        };
      }

      const logs = data.List;
      const totalEvents = logs.length;
      const failedAttempts = logs.filter((log: any) => log.event_status === 'Failed').length;
      const suspiciousActivity = logs.filter((log: any) =>
        log.event_status === 'Suspicious' || log.risk_level === 'Critical'
      ).length;
      const securityIncidents = logs.filter((log: any) => 
        log.event_type === 'Security Incident'
      ).length;

      // Event type distribution
      const eventTypeCounts: Record<string, number> = {};
      const riskLevelCounts: Record<string, number> = {};
      const userActivityCounts: Record<string, { username: string; count: number }> = {};
      const stationActivityCounts: Record<string, { station: string; count: number }> = {};

      logs.forEach((log: any) => {
        // Event types
        eventTypeCounts[log.event_type] = (eventTypeCounts[log.event_type] || 0) + 1;
        
        // Risk levels
        riskLevelCounts[log.risk_level] = (riskLevelCounts[log.risk_level] || 0) + 1;
        
        // User activity
        if (log.user_id) {
          if (!userActivityCounts[log.user_id]) {
            userActivityCounts[log.user_id] = { username: log.username || 'Unknown', count: 0 };
          }
          userActivityCounts[log.user_id].count++;
        }
        
        // Station activity
        if (log.station_id || log.station) {
          const stationKey = log.station_id || log.station;
          if (!stationActivityCounts[stationKey]) {
            stationActivityCounts[stationKey] = { 
              station: log.station || log.station_id || 'Unknown', 
              count: 0 
            };
          }
          stationActivityCounts[stationKey].count++;
        }
      });

      const topEventTypes = Object.entries(eventTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const riskDistribution = Object.entries(riskLevelCounts)
        .map(([level, count]) => ({ level, count }));

      const userActivity = Object.entries(userActivityCounts)
        .map(([user_id, { username, count }]) => ({ user_id, username, event_count: count }))
        .sort((a, b) => b.event_count - a.event_count)
        .slice(0, 10);

      const stationActivity = Object.entries(stationActivityCounts)
        .map(([station_id, { station, count }]) => ({ station_id, station, event_count: count }))
        .sort((a, b) => b.event_count - a.event_count)
        .slice(0, 10);

      return {
        totalEvents,
        failedAttempts,
        suspiciousActivity,
        securityIncidents,
        topEventTypes,
        riskDistribution,
        userActivity,
        stationActivity
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      return {
        totalEvents: 0,
        failedAttempts: 0,
        suspiciousActivity: 0,
        securityIncidents: 0,
        topEventTypes: [],
        riskDistribution: [],
        userActivity: [],
        stationActivity: []
      };
    }
  }

  // Search logs by text content
  async searchLogs(
    searchTerm: string,
    pageNo: number = 1,
    pageSize: number = 50
  ): Promise<{ data: any; error: string | null }> {
    try {
      const { data, error } = await supabaseAdapter.tablePage(this.tableId, {
        PageNo: pageNo,
        PageSize: pageSize,
        OrderByField: 'event_timestamp',
        IsAsc: false,
        Filters: [
          {
            name: 'event_type',
            op: 'Like',
            value: searchTerm
          },
          {
            name: 'username',
            op: 'Like',
            value: searchTerm
          },
          {
            name: 'resource_accessed',
            op: 'Like',
            value: searchTerm
          },
          {
            name: 'action_performed',
            op: 'Like',
            value: searchTerm
          }
        ]
      });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Export logs to CSV format
  async exportLogs(filters: AuditLogFilters = {}): Promise<string> {
    try {
      const { data } = await this.getLogs(1, 5000, filters);
      
      if (!data?.List) {
        return 'No data available for export';
      }

      const logs = data.List;
      const headers = [
        'Event Type',
        'Status',
        'Timestamp',
        'User ID',
        'Username',
        'Resource',
        'Action',
        'Station',
        'Risk Level',
        'IP Address',
        'User Agent',
        'Failure Reason'
      ];

      const csvRows = [headers.join(',')];

      logs.forEach((log: any) => {
        const row = [
          log.event_type || '',
          log.event_status || '',
          log.event_timestamp || '',
          log.user_id || '',
          log.username || '',
          log.resource_accessed || '',
          log.action_performed || '',
          log.station || '',
          log.risk_level || '',
          log.ip_address || '',
          log.user_agent || '',
          log.failure_reason || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`);
        
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting logs:', error);
      return 'Error occurred during export';
    }
  }
}

export default SupabaseAuditLoggerService;
export { SupabaseAuditLoggerService };

// Export singleton instance
export const supabaseAuditLogger = SupabaseAuditLoggerService.getInstance();