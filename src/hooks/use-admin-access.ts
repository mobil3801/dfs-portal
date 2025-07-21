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

    // Standardized to lowercase database enum values
    const isAdmin = userProfile.role === 'admin';
    const isManager = userProfile.role === 'manager' || isAdmin;
    const isEmployee = userProfile.role === 'employee';
    const hasAccess = isAdmin || isManager;

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