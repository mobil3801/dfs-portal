import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useModuleAccess } from '@/contexts/ModuleAccessContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, RefreshCw, Bug } from 'lucide-react';
import NavigationDebugger from '@/components/NavigationDebugger';
import EnhancedNavigationDebugger from '@/components/EnhancedNavigationDebugger';

const NavigationDiagnosticPage: React.FC = () => {
  const { user, userProfile, isAuthenticated, isAdmin, isManager, refreshUserData } = useAuth();
  const { moduleAccess, loading: moduleLoading, error: moduleError } = useModuleAccess();
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);

  // Enable console logging for debugging with enhanced details
  useEffect(() => {
    // Always log basic diagnostic info regardless of showDetailedLogs setting
    console.log('🔍 DIAGNOSTIC: Navigation diagnostic page loaded');
    console.log('👤 DIAGNOSTIC: User information', {
      isAuthenticated,
      user: user ? {
        id: user.ID,
        name: user.Name,
        email: user.Email
      } : null,
      userProfile: userProfile ? {
        id: userProfile.id,
        role: userProfile.role,
        roleType: typeof userProfile.role,
        hasDetailedPermissions: !!userProfile.detailed_permissions,
        detailedPermissionsType: typeof userProfile.detailed_permissions,
        detailedPermissionsPreview: typeof userProfile.detailed_permissions === 'string'
          ? userProfile.detailed_permissions.substring(0, 100) + '...'
          : JSON.stringify(userProfile.detailed_permissions).substring(0, 100) + '...'
      } : null,
      isAdmin: isAdmin(),
      isManager: isManager()
    });

    // Test permission checks for common actions and resources
    console.log('🔑 DIAGNOSTIC: Permission check results', {
      'view_products': hasPermission('view', 'products'),
      'create_products': hasPermission('create', 'products'),
      'edit_products': hasPermission('edit', 'products'),
      'delete_products': hasPermission('delete', 'products'),
      'view_employees': hasPermission('view', 'employees'),
      'create_employees': hasPermission('create', 'employees'),
      'edit_employees': hasPermission('edit', 'employees'),
      'delete_employees': hasPermission('delete', 'employees')
    });

    if (showDetailedLogs) {
      console.log('📋 DIAGNOSTIC: Module access information', {
        moduleCount: moduleAccess.length,
        moduleError: moduleError,
        moduleLoading: moduleLoading,
        modules: moduleAccess.map(m => ({
          name: m.module_name,
          display: m.display_name,
          create: m.create_enabled,
          edit: m.edit_enabled,
          delete: m.delete_enabled
        }))
      });
      
      // Log auth context implementation details
      console.log('🔒 DIAGNOSTIC: Auth implementation details', {
        isAdminImplementation: 'userProfile?.role === "Administrator" || userProfile?.role === "Admin"',
        isManagerImplementation: 'userProfile?.role === "Management" || userProfile?.role === "Manager" || isAdmin()',
        authContextState: {
          isInitialized,
          isLoading,
          isAuthenticated,
          hasAuthError: !!authError,
          authErrorMessage: authError
        }
      });
    }
  }, [showDetailedLogs, user, userProfile, isAuthenticated, isAdmin, isManager, moduleAccess, hasPermission, moduleError, moduleLoading, isInitialized, isLoading, authError]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
      console.log('🔄 DIAGNOSTIC: User data refreshed');
    } catch (error) {
      console.error('❌ DIAGNOSTIC: Failed to refresh user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Navigation Diagnostic</h1>
          <p className="text-gray-500">Troubleshoot navigation and permission issues</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="debug-mode"
              checked={showDetailedLogs}
              onCheckedChange={setShowDetailedLogs}
            />
            <Label htmlFor="debug-mode">Detailed Console Logs</Label>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
        <Bug className="h-4 w-4" />
        <AlertDescription>
          This page is designed to help diagnose navigation and permission issues. Check the browser console for detailed logs.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="user" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="user">User & Permissions</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="modules">Module Access</TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Current user details and authentication status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                  <p className="text-lg font-medium">{user?.ID || 'Not authenticated'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="text-lg font-medium">{user?.Name || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="text-lg font-medium">{user?.Email || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Role</h3>
                  <p className="text-lg font-medium">{userProfile?.role || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Role Checks</h3>
                <div className="flex space-x-2">
                  <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
                    {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                  </Badge>
                  <Badge variant={isAdmin() ? 'default' : 'outline'}>
                    {isAdmin() ? 'Is Admin' : 'Not Admin'}
                  </Badge>
                  <Badge variant={isManager() ? 'default' : 'outline'}>
                    {isManager() ? 'Is Manager' : 'Not Manager'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Permission Tests</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['view', 'create', 'edit', 'delete'].map(action => (
                    <div key={action} className="p-2 bg-gray-50 rounded">
                      <h4 className="font-medium capitalize">{action}</h4>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">products</Badge>
                        <Badge variant="outline" className="text-xs">employees</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-4">
          <NavigationDebugger />
          <EnhancedNavigationDebugger />
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Module Access</CardTitle>
              <CardDescription>Module permissions from the database</CardDescription>
            </CardHeader>
            <CardContent>
              {moduleLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : moduleError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{moduleError}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {moduleAccess.map(module => (
                      <div key={module.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{module.display_name}</h3>
                          <Badge>{module.module_name}</Badge>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <Badge variant={module.create_enabled ? 'default' : 'outline'}>
                            {module.create_enabled ? 'Create' : 'No Create'}
                          </Badge>
                          <Badge variant={module.edit_enabled ? 'default' : 'outline'}>
                            {module.edit_enabled ? 'Edit' : 'No Edit'}
                          </Badge>
                          <Badge variant={module.delete_enabled ? 'default' : 'outline'}>
                            {module.delete_enabled ? 'Delete' : 'No Delete'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NavigationDiagnosticPage;