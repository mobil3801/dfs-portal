import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { supabaseAdapter } from '@/services/supabase/supabaseAdapter';
import AuditLoggerService from '@/services/auditLogger';
import { safeToLowerCase, errorLog } from '@/utils/safe-string-utils';

const auditLogger = AuditLoggerService.getInstance();

interface User {
  ID: string; // Changed to UUID string
  Name: string;
  Email: string;
  CreateTime: string;
  user_metadata?: {
    role?: string;
    name?: string;
    [key: string]: any;
  };
  app_metadata?: {
    role?: string;
    [key: string]: any;
  };
}

interface UserProfile {
  id: string; // Changed to UUID string
  user_id: string; // Changed to UUID string
  role: string;
  station: string;
  employee_id: string;
  phone: string;
  hire_date: string;
  is_active: boolean;
  detailed_permissions: any;
  profile_image_id?: string | null; // Changed to UUID string
  permissions?: string[] | any; // Added for station access control
  stationAccess?: string[]; // Added for station access control
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  hasPermission: (action: string, resource?: string) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  clearError: () => void;
  // Dual role checking methods
  checkRoleFromBothSources: (roleToCheck: string) => boolean;
  synchronizeRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default guest user profile for non-authenticated users
const GUEST_PROFILE: UserProfile = {
  id: '00000000-0000-0000-0000-000000000000',
  user_id: '00000000-0000-0000-0000-000000000000',
  role: 'Guest',
  station: '',
  employee_id: '',
  phone: '',
  hire_date: '',
  is_active: false,
  detailed_permissions: {},
  profile_image_id: null
};

export const AuthProvider: React.FC<{children: React.ReactNode;}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false); // Prevent multiple concurrent logins
  const { toast } = useToast();

  const isAuthenticated = !!user && !!userProfile;

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const safeFetchUserData = async (showErrors = false): Promise<{success: boolean;userData?: User;}> => {
    try {
      // Get current user from Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Handle response with no data (user not authenticated)
      if (!user || authError) {
        setUser(null);
        setUserProfile(GUEST_PROFILE);
        setAuthError(null);
        return { success: false };
      }

      // Extract role from Supabase auth metadata (dual role storage)
      const authMetadataRole = user.user_metadata?.role || user.app_metadata?.role;

      // Convert Supabase user to our User interface (now UUID-based)
      const userData: User = {
        ID: user.id, // Use actual UUID from Supabase Auth - no conversion!
        Name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        Email: user.email || '',
        CreateTime: user.created_at || new Date().toISOString()
      };

      setUser(userData);

      // Fetch user profile with retries using proper UUID
      try {

        const profileResponse = await supabaseAdapter.tablePage(11725, {
          PageNo: 1,
          PageSize: 1,
          Filters: [
          { name: "user_id", op: "Equal", value: userData.ID }] // Now using actual UUID

        });

        if (profileResponse.error) {
          // Use default profile for authenticated user without profile
          setUserProfile({
            id: userData.ID, // Use user's UUID as profile ID
            user_id: userData.ID,
            role: 'employee',
            station: 'MOBIL',
            employee_id: '',
            phone: '',
            hire_date: new Date().toISOString(),
            is_active: true,
            detailed_permissions: {},
            profile_image_id: null
          });
        } else if (profileResponse.data?.List?.length > 0) {
          const profile = profileResponse.data.List[0];
          setUserProfile(profile);
        } else {
          // Create default profile for user without one
          setUserProfile({
            id: userData.ID, // Use user's UUID as profile ID
            user_id: userData.ID,
            role: 'employee',
            station: 'MOBIL',
            employee_id: '',
            phone: '',
            hire_date: new Date().toISOString(),
            is_active: true,
            detailed_permissions: {},
            profile_image_id: null
          });
        }
      } catch (profileError) {
        // Use default profile if profile fetch fails
        setUserProfile({
          id: userData.ID, // Use user's UUID as profile ID
          user_id: userData.ID,
          role: 'employee',
          station: 'MOBIL',
          employee_id: '',
          phone: '',
          hire_date: new Date().toISOString(),
          is_active: true,
          detailed_permissions: {},
          profile_image_id: null
        });
      }

      setAuthError(null);
      return { success: true, userData };

    } catch (error) {
      console.error('Error fetching user data:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Only show error for critical failures
      if (showErrors && !errorMessage.includes('not authenticated')) {
        setAuthError(`Failed to load user data: ${errorMessage}`);
      }

      // Set guest state for any error
      setUser(null);
      setUserProfile(GUEST_PROFILE);
      return { success: false };
    }
  };

  const refreshUserData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await safeFetchUserData(true);
    setIsLoading(false);
  }, [safeFetchUserData]);

  const initializeAuth = async () => {
    setIsLoading(true);

    try {
      await safeFetchUserData(false);

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await safeFetchUserData(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(GUEST_PROFILE);
          setAuthError(null);
        }
      });

    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthError(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      setUser(null);
      setUserProfile(GUEST_PROFILE);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Prevent multiple concurrent login attempts
    if (loginInProgress) {
      return false;
    }

    try {
      setLoginInProgress(true);
      setIsLoading(true);
      setAuthError(null); // Clear any previous errors

      // Small delay to prevent rapid successive calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Try to log failed login, but don't fail login if audit logging fails
        try {
          await auditLogger.logLogin(email, false, undefined, error.message);
        } catch (auditError) {
          console.warn('Failed to log login attempt:', auditError);
        }
        setAuthError(error.message);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Add delay to ensure server state is updated
      await new Promise((resolve) => setTimeout(resolve, 200));

      const userDataResult = await safeFetchUserData(true);

      if (userDataResult.success && userDataResult.userData) {
        // Try to log successful login, but don't fail login if audit logging fails
        try {
          await auditLogger.logLogin(email, true, userDataResult.userData.ID);
        } catch (auditError) {
          console.warn('Failed to log successful login:', auditError);
        }
        toast({
          title: "Login Successful",
          description: "Welcome back!"
        });
        return true;
      } else {
        throw new Error('Failed to load user information after login');
      }

    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setAuthError(errorMessage);
      // Try to log failed login, but don't fail login if audit logging fails
      try {
        await auditLogger.logLogin(email, false, undefined, errorMessage);
      } catch (auditError) {
        console.warn('Failed to log login failure:', auditError);
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
      setLoginInProgress(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Log logout before clearing user data
      if (user) {
        try {
          await auditLogger.logLogout(user.Email, user.ID);
        } catch (auditError) {
          console.warn('Failed to log logout:', auditError);
        }
      }

      await supabase.auth.signOut();

      setUser(null);
      setUserProfile(GUEST_PROFILE);
      setAuthError(null);

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out"
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setUserProfile(GUEST_PROFILE);
      setAuthError(null);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) {
        try {
          await auditLogger.logRegistration(email, false, error.message);
        } catch (auditError) {
          console.warn('Failed to log registration failure:', auditError);
        }
        setAuthError(error.message);
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      try {
        await auditLogger.logRegistration(email, true);
      } catch (auditError) {
        console.warn('Failed to log registration success:', auditError);
      }
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account"
      });

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setAuthError(errorMessage);
      try {
        await auditLogger.logRegistration(email, false, errorMessage);
      } catch (auditError) {
        console.warn('Failed to log registration failure:', auditError);
      }
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = useCallback((action: string, resource?: string): boolean => {
    if (!userProfile) {
      return false;
    }
    
    if (userProfile.role === 'Guest') {
      return false;
    }

    // Admins have all permissions - standardized to lowercase
    if (userProfile.role === 'admin') {
      return true;
    }

    // Parse detailed permissions if they exist
    if (userProfile.detailed_permissions) {
      try {
        let permissions;
        if (typeof userProfile.detailed_permissions === 'string') {
          // Only try to parse if it's a valid JSON string
          if (userProfile.detailed_permissions.trim().startsWith('{') || userProfile.detailed_permissions.trim().startsWith('[')) {
            permissions = JSON.parse(userProfile.detailed_permissions);
          } else {
            // Invalid JSON string, skip detailed permissions
            permissions = {};
          }
        } else {
          permissions = userProfile.detailed_permissions;
        }

        if (resource && permissions[resource]) {
          if (permissions[resource][action]) {
            return true;
          }
        }
      } catch (error) {
        console.warn('Error parsing permissions, using default role-based permissions:', error);
      }
    }

    // Default permissions for managers - check case variations
    const managerRoles = ['manager'];
    if (managerRoles.some(role => userProfile.role === role)) {
      const managerActions = ['view', 'create', 'edit'];
      return managerActions.includes(action);
    }

    // Default permissions for employees
    if (userProfile.role === 'Employee') {
      return action === 'view';
    }

    return false;
  }, [userProfile]);

  const isAdmin = useCallback((): boolean => {
    // Check both database enum value 'admin' and legacy values for backward compatibility
    return userProfile?.role === 'admin';
  }, [userProfile]);

  // Dual role checking - verify role from both Supabase auth metadata and database
  const checkRoleFromBothSources = (roleToCheck: string): boolean => {
    // Check if user is authenticated
    if (!user || !userProfile) {
      return false;
    }

    // Get role from Supabase auth metadata
    const authMetadataRole = user.user_metadata?.role || user.app_metadata?.role;
    
    // Get role from database profile
    const profileRole = userProfile.role;

    // Normalize roles for comparison (handle both lowercase and capitalized variants)
    const normalizeRole = (role: string) => safeToLowerCase(role).trim();
    const normalizedRoleToCheck = normalizeRole(roleToCheck);
    
    const authRoleMatches = normalizeRole(authMetadataRole) === normalizedRoleToCheck;
    const profileRoleMatches = normalizeRole(profileRole) === normalizedRoleToCheck;

    // Return true if role matches in either source
    return authRoleMatches || profileRoleMatches;
  };

  // Synchronize roles between Supabase auth metadata and database
  const synchronizeRoles = async (): Promise<void> => {
    if (!user || !userProfile) {
      return;
    }

    try {
      // Get current roles from both sources
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const authMetadataRole = currentUser?.user_metadata?.role || currentUser?.app_metadata?.role;
      const profileRole = userProfile.role;

      // If roles don't match, update auth metadata to match database role
      if (authMetadataRole !== profileRole) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: profileRole }
        });

        if (updateError) {
          console.error('Failed to synchronize roles:', updateError);
        }
      }
    } catch (error) {
      console.error('Role synchronization failed:', error);
    }
  };

  const isManager = useCallback((): boolean => {
    // Check both database enum values and legacy values for backward compatibility
    return userProfile?.role === 'manager' ||
           userProfile?.role === 'admin';
  }, [userProfile]);

  const value: AuthContextType = useMemo(() => ({
    user,
    userProfile,
    isAuthenticated,
    isLoading,
    authError,
    isInitialized,
    login,
    logout,
    register,
    refreshUserData,
    hasPermission,
    isAdmin,
    isManager,
    clearError,
    checkRoleFromBothSources,
    synchronizeRoles
  }), [
    user,
    userProfile,
    isAuthenticated,
    isLoading,
    authError,
    isInitialized,
    login,
    logout,
    register,
    refreshUserData,
    hasPermission,
    isAdmin,
    isManager,
    clearError,
    checkRoleFromBothSources,
    synchronizeRoles
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
