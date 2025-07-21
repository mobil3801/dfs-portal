import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  redirectTo?: string;
  showDebugInfo?: boolean;
}

/**
 * AdminRoute component that protects routes and components for admin access only
 * Uses dual role checking from both Supabase auth metadata and database
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  fallback,
  loadingComponent,
  redirectTo = '/login',
  showDebugInfo = false
}) => {
  const location = useLocation();
  const { isAuthenticated, user, userProfile } = useAuth();
  const { 
    isAdmin, 
    isLoading, 
    error, 
    refreshAdminStatus, 
    synchronizeRoles 
  } = useAdminRole();

  // Show custom loading component or default loader
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <CardTitle>Verifying Access</CardTitle>
            <CardDescription>
              Checking admin permissions...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('🚫 AdminRoute: User not authenticated, redirecting to login');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Show error state if there's an error checking admin status
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Access Verification Error</CardTitle>
            <CardDescription>
              Failed to verify admin permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={refreshAdminStatus}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button 
                variant="outline" 
                onClick={synchronizeRoles}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Sync Roles
              </Button>
            </div>

            {showDebugInfo && (
              <Alert>
                <AlertTitle>Debug Info</AlertTitle>
                <AlertDescription className="text-xs">
                  <pre>{JSON.stringify({ 
                    user: user ? { id: user.ID, email: user.Email } : null,
                    userProfile: userProfile ? { id: userProfile.id, role: userProfile.role } : null,
                    error 
                  }, null, 2)}</pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    console.log('🚫 AdminRoute: Access denied - user is not admin');
    
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <ShieldAlert className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-amber-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this resource
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Admin Access Required</AlertTitle>
              <AlertDescription>
                This area is restricted to administrators only. Please contact your system administrator if you believe you should have access.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={refreshAdminStatus}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
            </div>

            {showDebugInfo && (
              <Alert>
                <AlertTitle>Debug Info</AlertTitle>
                <AlertDescription className="text-xs">
                  <pre>{JSON.stringify({ 
                    user: user ? { id: user.ID, email: user.Email } : null,
                    userProfile: userProfile ? { id: userProfile.id, role: userProfile.role } : null,
                    isAuthenticated,
                    isAdmin,
                    location: location.pathname
                  }, null, 2)}</pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is admin - render protected content
  console.log('✅ AdminRoute: Access granted - user is admin');
  return <>{children}</>;
};

/**
 * Higher-order component version for easier use with route components
 */
export const withAdminRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AdminRouteProps, 'children'>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <AdminRoute {...options}>
      <Component {...props} ref={ref} />
    </AdminRoute>
  ));
};

export default AdminRoute;