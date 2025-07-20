import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { supabaseAdapter } from '@/services/supabase/supabaseAdapter';
import AuditLoggerService from '@/services/auditLogger';

const auditLogger = AuditLoggerService.getInstance();

interface User {
  ID: number;
  Name: string;
  Email: string;
  CreateTime: string;
}

interface UserProfile {
  id: number;
  user_id: number;
  role: string;
  station: string;
  employee_id: string;
  phone: string;
  hire_date: string;
  is_active: boolean;
  detailed_permissions: any;
  profile_image_id?: number | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default guest user profile for non-authenticated users
const GUEST_PROFILE: UserProfile = {
  id: 0,
  user_id: 0,
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

  const clearError = () => {
    setAuthError(null);
  };

  const safeFetchUserData = async (showErrors = false): Promise<{success: boolean;userData?: User;}> => {
    try {
      console.log('🔄 Attempting to fetch user data...');

      // Get current user from Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Handle response with no data (user not authenticated)
      if (!user || authError) {
        console.log('👤 No user data - user not authenticated');
        setUser(null);
        setUserProfile(GUEST_PROFILE);
        setAuthError(null);
        return { success: false };
      }

      // Convert Supabase user to our User interface
      const userData: User = {
        ID: parseInt(user.id.replace(/[^0-9]/g, '').slice(-8)), // Convert UUID to number for compatibility
        Name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        Email: user.email || '',
        CreateTime: user.created_at || new Date().toISOString()
      };

      console.log('✅ User data fetched successfully:', userData);
      setUser(userData);

      // Fetch user profile with retries
      try {
        console.log('🔄 Fetching user profile for user ID:', userData.ID);

        const profileResponse = await supabaseAdapter.tablePage(11725, {
          PageNo: 1,
          PageSize: 1,
          Filters: [
          { name: "user_id", op: "Equal", value: userData.ID }]

        });

        if (profileResponse.error) {
          console.log('⚠️ Profile fetch error:', profileResponse.error);
          // Use default profile for authenticated user without profile
          setUserProfile({
            id: 0,
            user_id: userData.ID,
            role: 'Employee',
            station: 'MOBIL',
            employee_id: '',
            phone: '',
            hire_date: new Date().toISOString(),
            is_active: true,
            detailed_permissions: {},
            profile_image_id: null
          });
        } else if (profileResponse.data?.List?.length > 0) {
          console.log('✅ User profile found:', profileResponse.data.List[0]);
          setUserProfile(profileResponse.data.List[0]);
        } else {
          console.log('⚠️ No profile found, creating default profile');
          // Create default profile for user without one
          setUserProfile({
            id: 0,
            user_id: userData.ID,
            role: 'Employee',
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
        console.log('⚠️ Profile fetch failed, using default:', profileError);
        // Use default profile if profile fetch fails
        setUserProfile({
          id: 0,
          user_id: userData.ID,
          role: 'Employee',
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
      console.error('❌ Error fetching user data:', error);

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

  const refreshUserData = async (): Promise<void> => {
    console.log('🔄 Refreshing user data...');
    setIsLoading(true);
    await safeFetchUserData(true);
    setIsLoading(false);
  };

  const initializeAuth = async () => {
    console.log('🚀 Initializing authentication...');
    setIsLoading(true);

    try {
      console.log('✅ Supabase client ready, fetching user data...');
      await safeFetchUserData(false);

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await safeFetchUserData(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(GUEST_PROFILE);
          setAuthError(null);
        }
      });

    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      setAuthError(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      setUser(null);
      setUserProfile(GUEST_PROFILE);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      console.log('✅ Authentication initialization complete');
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Prevent multiple concurrent login attempts
    if (loginInProgress) {
      console.log('⏳ Login already in progress, ignoring duplicate request');
      return false;
    }

    try {
      setLoginInProgress(true);
      setIsLoading(true);
      setAuthError(null); // Clear any previous errors

      console.log('🔑 Attempting login for:', email);

      // Small delay to prevent rapid successive calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log('❌ Login API failed:', error.message);
        await auditLogger.logLogin(email, false, undefined, error.message);
        setAuthError(error.message);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Login API successful, fetching user data...');

      // Add delay to ensure server state is updated
      await new Promise((resolve) => setTimeout(resolve, 200));

      const userDataResult = await safeFetchUserData(true);

      if (userDataResult.success && userDataResult.userData) {
        console.log('✅ User data fetched successfully after login');
        await auditLogger.logLogin(email, true, userDataResult.userData.ID);
        toast({
          title: "Login Successful",
          description: "Welcome back!"
        });
        return true;
      } else {
        console.log('❌ Failed to fetch user data after successful login');
        throw new Error('Failed to load user information after login');
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setAuthError(errorMessage);
      await auditLogger.logLogin(email, false, undefined, errorMessage);
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
      console.log('🚪 Logging out user...');

      // Log logout before clearing user data
      if (user) {
        await auditLogger.logLogout(user.Email, user.ID);
      }

      await supabase.auth.signOut();

      setUser(null);
      setUserProfile(GUEST_PROFILE);
      setAuthError(null);

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out"
      });

      console.log('✅ Logout successful');
    } catch (error) {
      console.error('⚠️ Logout error (non-critical):', error);
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

      console.log('📝 Attempting registration for:', email);

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
        console.log('❌ Registration failed:', error.message);
        await auditLogger.logRegistration(email, false, error.message);
        setAuthError(error.message);
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Registration successful');
      await auditLogger.logRegistration(email, true);
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account"
      });

      return true;
    } catch (error) {
      console.error('❌ Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setAuthError(errorMessage);
      await auditLogger.logRegistration(email, false, errorMessage);
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

  const hasPermission = (action: string, resource?: string): boolean => {
    if (!userProfile || userProfile.role === 'Guest') {
      return false;
    }

    // Admins have all permissions
    if (userProfile.role === 'Administrator' || userProfile.role === 'Admin') {
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

        if (resource && permissions[resource] && permissions[resource][action]) {
          return true;
        }
      } catch (error) {
        console.warn('Error parsing permissions, using default role-based permissions:', error);
      }
    }

    // Default permissions for managers
    if (userProfile.role === 'Management' || userProfile.role === 'Manager') {
      const managerActions = ['view', 'create', 'edit'];
      return managerActions.includes(action);
    }

    // Default permissions for employees
    if (userProfile.role === 'Employee') {
      return action === 'view';
    }

    return false;
  };

  const isAdmin = (): boolean => {
    return userProfile?.role === 'Administrator' || userProfile?.role === 'Admin';
  };

  const isManager = (): boolean => {
    return userProfile?.role === 'Management' || userProfile?.role === 'Manager' ||
    userProfile?.role === 'Administrator' || userProfile?.role === 'Admin';
  };

  const value: AuthContextType = {
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
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};