import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseAdminRoleReturn {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  checkAdminStatus: () => boolean;
  synchronizeRoles: () => Promise<void>;
  refreshAdminStatus: () => void;
}

/**
 * Custom hook for admin role verification with dual source checking
 * Provides comprehensive admin access control with role synchronization
 */
export const useAdminRole = (): UseAdminRoleReturn => {
  const { 
    isAdmin, 
    checkRoleFromBothSources, 
    synchronizeRoles,
    isAuthenticated,
    isLoading: authLoading,
    user,
    userProfile
  } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<boolean>(false);

  /**
   * Check admin status using both legacy isAdmin() and new dual role checking
   */
  const checkAdminStatus = useCallback((): boolean => {
    try {
      if (!isAuthenticated || !user || !userProfile) {
        return false;
      }

      // Use legacy isAdmin() method first for backward compatibility
      const legacyAdminCheck = isAdmin();

      // Use new dual role checking for enhanced verification
      const dualRoleAdminCheck = checkRoleFromBothSources('admin');

      // Admin if either method returns true (backward compatibility)
      const finalResult = legacyAdminCheck || dualRoleAdminCheck;

      return finalResult;
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
      return false;
    }
  }, [isAuthenticated, user, userProfile, isAdmin, checkRoleFromBothSources]);

  /**
   * Refresh admin status and update internal state
   */
  const refreshAdminStatus = useCallback(() => {
    setError(null);
    
    try {
      const newAdminStatus = checkAdminStatus();
      setAdminStatus(newAdminStatus);
    } catch (err) {
      console.error('Error refreshing admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh admin status');
      setAdminStatus(false);
    }
  }, [checkAdminStatus]);

  /**
   * Synchronize roles between sources with loading state
   */
  const handleSynchronizeRoles = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      console.warn('Cannot synchronize roles: Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await synchronizeRoles();
      
      // Refresh admin status after synchronization
      refreshAdminStatus();
      
    } catch (err) {
      console.error('Role synchronization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to synchronize roles');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, synchronizeRoles, refreshAdminStatus]);

  /**
   * Update admin status when authentication or user data changes
   */
  useEffect(() => {
    refreshAdminStatus();
  }, [refreshAdminStatus, isAuthenticated, user, userProfile]);

  /**
   * Auto-synchronize roles on initial load if user is authenticated
   */
  useEffect(() => {
    if (isAuthenticated && user && userProfile && !authLoading) {
      handleSynchronizeRoles();
    }
  }, [isAuthenticated, user, userProfile, authLoading]); // Only run when these dependencies change

  return {
    isAdmin: adminStatus,
    isLoading: isLoading || authLoading,
    error,
    checkAdminStatus,
    synchronizeRoles: handleSynchronizeRoles,
    refreshAdminStatus
  };
};

export default useAdminRole;