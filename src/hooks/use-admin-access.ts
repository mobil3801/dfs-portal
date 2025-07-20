import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface AdminAccessState {
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  isGuest: boolean;
  hasAccess: boolean;
  role: string;
  station: string;
  loading: boolean;
  error: string | null;
}

export const useAdminAccess = (): AdminAccessState => {
  const { user, userProfile, isAuthenticated, isLoading, authError } = useAuth();
  const [state, setState] = useState<AdminAccessState>({
    isAdmin: false,
    isManager: false,
    isEmployee: false,
    isGuest: true,
    hasAccess: false,
    role: 'Guest',
    station: '',
    loading: true,
    error: null
  });

  useEffect(() => {
    console.log('🔍 Admin access check - User:', user?.Name, 'Profile:', userProfile?.role);

    if (isLoading) {
      setState((prev) => ({ ...prev, loading: true }));
      return;
    }

    if (authError) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: authError,
        hasAccess: false
      }));
      return;
    }

    if (!isAuthenticated || !user || !userProfile) {
      console.log('❌ Admin access denied - Not authenticated');
      setState({
        isAdmin: false,
        isManager: false,
        isEmployee: false,
        isGuest: true,
        hasAccess: false,
        role: 'Guest',
        station: '',
        loading: false,
        error: null
      });
      return;
    }

    // Check for both "Administrator" and "Admin" roles for backward compatibility
    const isAdmin = userProfile.role === 'Administrator' || userProfile.role === 'Admin';
    const isManager = userProfile.role === 'Management' || userProfile.role === 'Manager' || isAdmin;
    const isEmployee = userProfile.role === 'Employee';
    const hasAccess = isAdmin || isManager;

    console.log(`✅ Admin access determined - Role: ${userProfile.role}, HasAccess: ${hasAccess}`);

    setState({
      isAdmin,
      isManager,
      isEmployee,
      isGuest: false,
      hasAccess,
      role: userProfile.role,
      station: userProfile.station || '',
      loading: false,
      error: null
    });
  }, [user, userProfile, isAuthenticated, isLoading, authError]);

  return state;
};

// Hook specifically for admin access debugging
export const useAdminAccessDebug = () => {
  const { user, userProfile, isAuthenticated } = useAuth();
  const adminAccess = useAdminAccess();

  return {
    ...adminAccess,
    debugInfo: {
      user,
      userProfile,
      isAuthenticated,
      timestamp: new Date().toISOString()
    }
  };
};

export default useAdminAccess;