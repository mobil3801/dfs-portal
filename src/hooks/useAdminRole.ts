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
      console.log('🔍 DEBUG - useAdminRole checkAdminStatus called');
      
      if (!isAuthenticated || !user || !userProfile) {
        console.log('❌ DEBUG - Not authenticated or missing user data');
        return false;
      }

      // Use legacy isAdmin() method first for backward compatibility
      const legacyAdminCheck = isAdmin();
      console.log('🔍 DEBUG - Legacy admin check result:', legacyAdminCheck);

      // Use new dual role checking for enhanced verification
      const dualRoleAdminCheck = checkRoleFromBothSources('admin');
      console.log('🔍 DEBUG - Dual role admin check result:', dualRoleAdminCheck);

      // Admin if either method returns true (backward compatibility)
      const finalResult = legacyAdminCheck || dualRoleAdminCheck;
      
      console.log('✅ DEBUG - Final admin status:', {
        legacyAdminCheck,
        dualRoleAdminCheck,
        finalResult,
        userRole: userProfile?.role,
        userId: user?.ID
      });

      return finalResult;
    } catch (err) {
      console.error('❌ Error checking admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
      return false;
    }
  }, [isAuthenticated, user, userProfile, isAdmin, checkRoleFromBothSources]);

  /**
   * Refresh admin status and update internal state
   */
  const refreshAdminStatus = useCallback(() => {
    console.log('🔄 Refreshing admin status...');
    setError(null);
    
    try {
      const newAdminStatus = checkAdminStatus();
      setAdminStatus(newAdminStatus);
      console.log('✅ Admin status refreshed:', newAdminStatus);
    } catch (err) {
      console.error('❌ Error refreshing admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh admin status');
      setAdminStatus(false);
    }
  }, [checkAdminStatus]);

  /**
   * Synchronize roles between sources with loading state
   */
  const handleSynchronizeRoles = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      console.log('⚠️ Cannot synchronize roles: Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Starting role synchronization from useAdminRole...');
      await synchronizeRoles();
      
      // Refresh admin status after synchronization
      refreshAdminStatus();
      
      console.log('✅ Role synchronization completed successfully');
    } catch (err) {
      console.error('❌ Role synchronization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to synchronize roles');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, synchronizeRoles, refreshAdminStatus]);

  /**
   * Update admin status when authentication or user data changes
   */
  useEffect(() => {
    console.log('🔄 useAdminRole: Auth state changed, updating admin status');
    refreshAdminStatus();
  }, [refreshAdminStatus, isAuthenticated, user, userProfile]);

  /**
   * Auto-synchronize roles on initial load if user is authenticated
   */
  useEffect(() => {
    if (isAuthenticated && user && userProfile && !authLoading) {
      console.log('🔄 useAdminRole: Auto-synchronizing roles on load');
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