import { createEzsiteApiReplacement } from '@/services/supabase/supabaseAdapter';
import { supabase } from '@/lib/supabase';

// Declare global window interface for TypeScript
declare global {
  interface Window {
    ezsite: {
      apis: {
        tablePage: (tableId: string | number, params: any) => Promise<{data: any, error: string | null}>;
        tableCreate: (tableId: string | number, data: any) => Promise<{error: string | null}>;
        tableUpdate: (tableId: string | number, data: any) => Promise<{error: string | null}>;
        tableDelete: (tableId: string | number, data: any) => Promise<{error: string | null}>;
        sendEmail: (emailData: any) => Promise<{error: string | null}>;
        upload: (uploadData: any) => Promise<{data: string | null, error: string | null}>;
        getUserInfo: () => Promise<{data: any, error: string | null}>;
        login: (credentials: {email: string, password: string}) => Promise<{error: string | null}>;
        logout: () => Promise<{error: string | null}>;
        register: (userData: {email: string, password: string}) => Promise<{error: string | null}>;
        resetPassword: (data: {token: string, password: string}) => Promise<{error: string | null}>;
        sendResetPwdEmail: (data: {email: string}) => Promise<{error: string | null}>;
      };
    };
  }
}

// Enhanced API replacement with additional EZSite methods
function createEnhancedEzsiteApiReplacement() {
  const baseApis = createEzsiteApiReplacement();
  
  return {
    ...baseApis,
    
    // File upload functionality
    upload: async (uploadData: { filename: string, content?: any, file?: File }) => {
      try {
        if (!uploadData.file) {
          return { data: null, error: 'No file provided' };
        }
        const file = uploadData.file;
        const filePath = `public/${uploadData.filename}`;
        const { data, error } = await supabase.storage.from('uploads').upload(filePath, file);

        if (error) {
          return { data: null, error: error.message };
        }

        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);

        return {
          data: publicUrlData.publicUrl,
          error: null
        };
      } catch (error: any) {
        return {
          data: null,
          error: error.message || 'Upload failed'
        };
      }
    },

    // User authentication methods using Supabase Auth
    getUserInfo: async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
          return {
            data: null,
            error: authError?.message || 'User not authenticated'
          };
        }

        // Convert Supabase user to EZSite format
        const userData = {
          ID: parseInt(user.id.replace(/\D/g, '').slice(-8)), // Convert UUID to number
          Name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
          Email: user.email || '',
          CreateTime: user.created_at || new Date().toISOString()
        };

        return {
          data: userData,
          error: null
        };
      } catch (error: any) {
        return {
          data: null,
          error: error.message || 'Failed to get user info'
        };
      }
    },

    login: async (credentials: {email: string, password: string}) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        });

        if (error) {
          return { error: error.message };
        }

        return { error: null };
      } catch (error: any) {
        return { error: error.message || 'Login failed' };
      }
    },

    logout: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          return { error: error.message };
        }

        return { error: null };
      } catch (error: any) {
        return { error: error.message || 'Logout failed' };
      }
    },

    register: async (userData: {email: string, password: string, name?: string}) => {
      try {
        const { error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              name: userData.name
            }
          }
        });

        if (error) {
          return { error: error.message };
        }

        return { error: null };
      } catch (error: any) {
        return { error: error.message || 'Registration failed' };
      }
    },

    resetPassword: async (data: {token: string, password: string}) => {
      try {
        const { error } = await supabase.auth.updateUser({ password: data.password });

        if (error) {
          return { error: error.message };
        }
        
        return { error: null };
      } catch (error: any) {
        return { error: error.message || 'Password reset failed' };
      }
    },

    sendResetPwdEmail: async (data: {email: string}) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) {
          return { error: error.message };
        }

        return { error: null };
      } catch (error: any) {
        return { error: error.message || 'Failed to send reset email' };
      }
    }
  };
}

// Initialize the global replacement
export function initializeGlobalApiReplacement() {
  console.log('Initializing global EZSite API replacement with Supabase...');
  
  // Create the window.ezsite object if it doesn't exist
  if (!window.ezsite) {
    window.ezsite = {
      apis: createEnhancedEzsiteApiReplacement()
    };
  } else {
    // Replace existing APIs
    window.ezsite.apis = createEnhancedEzsiteApiReplacement();
  }

  console.log('Global EZSite API replacement initialized - all existing code now uses Supabase');
}

// Auto-initialize when this module is imported
initializeGlobalApiReplacement();

export default initializeGlobalApiReplacement;