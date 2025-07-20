import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuditLoggerService from '@/services/auditLogger';

interface UseAuditLoggerReturn {
  logLogin: (username: string, success: boolean, failureReason?: string) => Promise<void>;
  logLogout: (username: string) => Promise<void>;
  logRegistration: (username: string, success: boolean, failureReason?: string) => Promise<void>;
  logPasswordReset: (username: string, success: boolean, failureReason?: string) => Promise<void>;
  logDataAccess: (resource: string, action: string, station?: string) => Promise<void>;
  logDataModification: (resource: string, action: string, station?: string, changes?: any) => Promise<void>;
  logPermissionChange: (targetUserId: number, changes: any) => Promise<void>;
  logAdminAction: (action: string, details?: any) => Promise<void>;
  logSuspiciousActivity: (description: string, details?: any) => Promise<void>;
  logEvent: (
  eventType: string,
  status: 'Success' | 'Failed' | 'Blocked' | 'Suspicious',
  details?: any)
  => Promise<void>;
}

export const useAuditLogger = (): UseAuditLoggerReturn => {
  const { user } = useAuth();
  const auditLogger = AuditLoggerService.getInstance();

  const logLogin = useCallback(async (username: string, success: boolean, failureReason?: string) => {
    await auditLogger.logLogin(username, success, user?.ID, failureReason);
  }, [user, auditLogger]);

  const logLogout = useCallback(async (username: string) => {
    await auditLogger.logLogout(username, user?.ID);
  }, [user, auditLogger]);

  const logRegistration = useCallback(async (username: string, success: boolean, failureReason?: string) => {
    await auditLogger.logRegistration(username, success, failureReason);
  }, [auditLogger]);

  const logPasswordReset = useCallback(async (username: string, success: boolean, failureReason?: string) => {
    await auditLogger.logPasswordReset(username, success, failureReason);
  }, [auditLogger]);

  const logDataAccess = useCallback(async (resource: string, action: string, station?: string) => {
    await auditLogger.logDataAccess(resource, action, user?.ID, user?.Email, station);
  }, [user, auditLogger]);

  const logDataModification = useCallback(async (
  resource: string,
  action: string,
  station?: string,
  changes?: any) =>
  {
    await auditLogger.logDataModification(resource, action, user?.ID, user?.Email, station, changes);
  }, [user, auditLogger]);

  const logPermissionChange = useCallback(async (targetUserId: number, changes: any) => {
    if (!user?.ID) return;
    await auditLogger.logPermissionChange(targetUserId, user.ID, changes);
  }, [user, auditLogger]);

  const logAdminAction = useCallback(async (action: string, details?: any) => {
    if (!user?.ID) return;
    await auditLogger.logAdminAction(action, user.ID, details);
  }, [user, auditLogger]);

  const logSuspiciousActivity = useCallback(async (description: string, details?: any) => {
    await auditLogger.logSuspiciousActivity(description, user?.ID, user?.Email, details);
  }, [user, auditLogger]);

  const logEvent = useCallback(async (
  eventType: string,
  status: 'Success' | 'Failed' | 'Blocked' | 'Suspicious',
  details: any = {}) =>
  {
    await auditLogger.logEvent(eventType, status, {
      user_id: user?.ID,
      username: user?.Email,
      ...details
    });
  }, [user, auditLogger]);

  return {
    logLogin,
    logLogout,
    logRegistration,
    logPasswordReset,
    logDataAccess,
    logDataModification,
    logPermissionChange,
    logAdminAction,
    logSuspiciousActivity,
    logEvent
  };
};

export default useAuditLogger;