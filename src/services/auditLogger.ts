import { supabase } from '@/lib/supabase';

interface AuditLogEntry {
  event_type: string;
  user_id?: string;
  username?: string;
  ip_address?: string;
  user_agent?: string;
  event_timestamp?: string;
  event_status: 'Success' | 'Failed' | 'Blocked' | 'Suspicious';
  resource_accessed?: string;
  action_performed: string;
  failure_reason?: string;
  session_id?: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  additional_data?: any;
  station?: string;
  geo_location?: string;
}

interface AuditLogFilters {
  event_type?: string;
  user_id?: string;
  event_status?: string;
  risk_level?: string;
  date_from?: string;
  date_to?: string;
  station?: string;
}

class AuditLoggerService {
  private static instance: AuditLoggerService;

  static getInstance(): AuditLoggerService {
    if (!AuditLoggerService.instance) {
      AuditLoggerService.instance = new AuditLoggerService();
    }
    return AuditLoggerService.instance;
  }

  // Get browser and system information
  private getBrowserInfo(): {ip_address: string;user_agent: string;session_id: string;} {
    return {
      ip_address: 'Unknown', // In a real app, this would come from server
      user_agent: navigator.userAgent,
      session_id: this.generateSessionId()
    };
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Assess risk level based on event characteristics
  private assessRiskLevel(eventType: string, status: string, additionalFactors: any): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (status === 'Failed' && eventType === 'Login') {
      return 'Medium';
    }
    if (status === 'Blocked') {
      return 'High';
    }
    if (status === 'Suspicious') {
      return 'Critical';
    }
    if (eventType === 'Permission Change' || eventType === 'Admin Action') {
      return 'High';
    }
    if (eventType === 'Data Modification') {
      return 'Medium';
    }
    return 'Low';
  }

  // Log an audit event using Supabase with fallback mechanism
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
    additional_data?: any;
  } = {})
  : Promise<void> {
    try {
      const browserInfo = this.getBrowserInfo();
      const timestamp = new Date().toISOString();
      const riskLevel = this.assessRiskLevel(eventType, status, details.additional_data);

      // First try using the RPC function
      try {
        const { data, error } = await supabase.rpc('insert_audit_log', {
          p_event_type: eventType,
          p_event_status: status,
          p_action_performed: details.action_performed || 'unknown',
          p_username: details.username || null,
          p_user_id: details.user_id || null,
          p_failure_reason: details.failure_reason || null,
          p_additional_data: details.additional_data ? JSON.stringify(details.additional_data) : null,
          p_ip_address: browserInfo.ip_address,
          p_user_agent: browserInfo.user_agent,
          p_session_id: browserInfo.session_id
        });

        if (error) {
          throw error;
        }
        return; // Success, exit early
      } catch (rpcError) {
        console.warn('RPC audit logging failed, trying direct insert:', rpcError);
        
        // Fallback: Direct table insert
        const auditEntry = {
          event_type: eventType,
          event_status: status,
          action_performed: details.action_performed || 'unknown',
          username: details.username || null,
          user_id: details.user_id || null,
          failure_reason: details.failure_reason || null,
          additional_data: details.additional_data || null,
          ip_address: browserInfo.ip_address,
          user_agent: browserInfo.user_agent,
          session_id: browserInfo.session_id,
          risk_level: riskLevel,
          resource_accessed: details.resource_accessed || null,
          station: details.station || null,
          created_at: timestamp
        };

        const { error: insertError } = await supabase
          .from('audit_logs')
          .insert([auditEntry]);

        if (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      // Enhanced error logging with more context
      const errorDetails = {
        eventType,
        status,
        details,
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      };
      
      console.error('🔥 Audit logging completely failed:', errorDetails);
      
      // Store failed audit logs in localStorage as emergency backup
      try {
        const failedLogs = JSON.parse(localStorage.getItem('failed_audit_logs') || '[]');
        failedLogs.push(errorDetails);
        // Keep only last 100 failed logs to prevent storage overflow
        if (failedLogs.length > 100) {
          failedLogs.splice(0, failedLogs.length - 100);
        }
        localStorage.setItem('failed_audit_logs', JSON.stringify(failedLogs));
      } catch (storageError) {
        console.error('Failed to store audit log backup:', storageError);
      }
      
      // Don't throw error to avoid breaking main functionality
    }
  }

  // Convenience methods for common events
  async logLogin(username: string, success: boolean, userId?: string, failureReason?: string): Promise<void> {
    await this.logEvent(
      'Login',
      success ? 'Success' : 'Failed',
      {
        username,
        user_id: userId,
        action_performed: 'authenticate',
        failure_reason: failureReason,
        additional_data: { timestamp: new Date().toISOString() }
      }
    );
  }

  async logLogout(username: string, userId?: string): Promise<void> {
    await this.logEvent(
      'Logout',
      'Success',
      {
        username,
        user_id: userId,
        action_performed: 'logout'
      }
    );
  }

  async logRegistration(username: string, success: boolean, failureReason?: string): Promise<void> {
    await this.logEvent(
      'Registration',
      success ? 'Success' : 'Failed',
      {
        username,
        action_performed: 'register',
        failure_reason: failureReason
      }
    );
  }

  async logPasswordReset(username: string, success: boolean, failureReason?: string): Promise<void> {
    await this.logEvent(
      'Password Reset',
      success ? 'Success' : 'Failed',
      {
        username,
        action_performed: 'reset_password',
        failure_reason: failureReason
      }
    );
  }

  async logDataAccess(
  resource: string,
  action: string,
  userId?: string,
  username?: string,
  station?: string)
  : Promise<void> {
    await this.logEvent(
      'Data Access',
      'Success',
      {
        user_id: userId,
        username,
        resource_accessed: resource,
        action_performed: action,
        station
      }
    );
  }

  async logDataModification(
  resource: string,
  action: string,
  userId?: string,
  username?: string,
  station?: string,
  changes?: any)
  : Promise<void> {
    await this.logEvent(
      'Data Modification',
      'Success',
      {
        user_id: userId,
        username,
        resource_accessed: resource,
        action_performed: action,
        station,
        additional_data: { changes }
      }
    );
  }

  async logPermissionChange(
  targetUserId: string,
  changedBy: string,
  changes: any)
  : Promise<void> {
    await this.logEvent(
      'Permission Change',
      'Success',
      {
        user_id: changedBy,
        resource_accessed: `user_${targetUserId}`,
        action_performed: 'modify_permissions',
        additional_data: { target_user_id: targetUserId, changes }
      }
    );
  }

  async logAdminAction(
  action: string,
  userId: string,
  details?: any)
  : Promise<void> {
    await this.logEvent(
      'Admin Action',
      'Success',
      {
        user_id: userId,
        action_performed: action,
        additional_data: details
      }
    );
  }

  async logSuspiciousActivity(
  description: string,
  userId?: string,
  username?: string,
  details?: any)
  : Promise<void> {
    await this.logEvent(
      'Suspicious Activity',
      'Suspicious',
      {
        user_id: userId,
        username,
        action_performed: 'suspicious_behavior',
        failure_reason: description,
        additional_data: details
      }
    );
  }

  // Retrieve audit logs with filtering and pagination using Supabase
  async getLogs(
  pageNo: number = 1,
  pageSize: number = 50,
  filters: AuditLogFilters = {})
  : Promise<{data: any;error: string | null;}> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.event_status) {
        query = query.eq('event_status', filters.event_status);
      }

      if (filters.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply pagination
      const from = (pageNo - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      // Format response to match expected structure
      return { 
        data: { 
          List: data || [],
          TotalCount: data?.length || 0
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get audit log statistics
  async getStatistics(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalEvents: number;
    failedAttempts: number;
    suspiciousActivity: number;
    topEventTypes: Array<{type: string;count: number;}>;
    riskDistribution: Array<{level: string;count: number;}>;
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

      const { data } = await this.getLogs(1, 1000, {
        date_from: startDate.toISOString(),
        date_to: endDate.toISOString()
      });

      if (!data?.List) {
        return {
          totalEvents: 0,
          failedAttempts: 0,
          suspiciousActivity: 0,
          topEventTypes: [],
          riskDistribution: []
        };
      }

      const logs = data.List;
      const totalEvents = logs.length;
      const failedAttempts = logs.filter((log: any) => log.event_status === 'Failed').length;
      const suspiciousActivity = logs.filter((log: any) =>
      log.event_status === 'Suspicious' || log.risk_level === 'Critical'
      ).length;

      // Event type distribution
      const eventTypeCounts: Record<string, number> = {};
      const riskLevelCounts: Record<string, number> = {};

      logs.forEach((log: any) => {
        eventTypeCounts[log.event_type] = (eventTypeCounts[log.event_type] || 0) + 1;
        riskLevelCounts[log.risk_level] = (riskLevelCounts[log.risk_level] || 0) + 1;
      });

      const topEventTypes = Object.entries(eventTypeCounts).
      map(([type, count]) => ({ type, count })).
      sort((a, b) => b.count - a.count).
      slice(0, 5);

      const riskDistribution = Object.entries(riskLevelCounts).
      map(([level, count]) => ({ level, count }));

      return {
        totalEvents,
        failedAttempts,
        suspiciousActivity,
        topEventTypes,
        riskDistribution
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      return {
        totalEvents: 0,
        failedAttempts: 0,
        suspiciousActivity: 0,
        topEventTypes: [],
        riskDistribution: []
      };
    }
  }
}

export default AuditLoggerService;