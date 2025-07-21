import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { AdminRoute } from '@/components/AdminRoute';
import { RoleManager } from '@/components/RoleManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  ShieldCheck,
  User,
  Settings,
  RefreshCw,
  Sync,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

/**
 * Protected component to demonstrate admin access control
 */
const ProtectedComponent: React.FC = () => (
  <Card className="border-green-200 bg-green-50">
    <CardHeader>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-green-600" />
        <CardTitle className="text-green-800">Protected Content</CardTitle>
      </div>
      <CardDescription className="text-green-700">
        This content is only visible to users with admin access.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-green-800">
        🎉 Congratulations! You have successfully accessed admin-protected content.
        This demonstrates that the admin access control system is working correctly.
      </p>
    </CardContent>
  </Card>
);

/**
 * Comprehensive demo page showcasing the admin access control system
 * Demonstrates dual role checking, synchronization, and UI protection
 */
const AdminAccessControlDemo: React.FC = () => {
  const { 
    user, 
    userProfile, 
    isAuthenticated, 
    isAdmin: legacyIsAdmin,
    isManager,
    checkRoleFromBothSources,
    synchronizeRoles
  } = useAuth();
  
  const {
    isAdmin: hookIsAdmin,
    isLoading: hookLoading,
    error: hookError,
    checkAdminStatus,
    synchronizeRoles: hookSyncRoles
  } = useAdminRole();

  const [demoResults, setDemoResults] = useState<any>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  /**
   * Run comprehensive role checking tests
   */
  const runRoleTests = async () => {
    setIsRunningTests(true);
    
    try {
      const results = {
        timestamp: new Date().toISOString(),
        user: user ? {
          id: user.ID,
          name: user.Name,
          email: user.Email
        } : null,
        userProfile: userProfile ? {
          id: userProfile.id,
          role: userProfile.role,
          station: userProfile.station,
          is_active: userProfile.is_active
        } : null,
        roleChecks: {
          legacyIsAdmin: legacyIsAdmin(),
          hookIsAdmin: hookIsAdmin,
          checkAdminStatus: checkAdminStatus(),
          dualRoleCheck: checkRoleFromBothSources('admin'),
          isManager: isManager()
        },
        authenticationState: {
          isAuthenticated,
          hookLoading,
          hookError
        }
      };

      setDemoResults(results);
      
      
    } catch (error) {
      console.error('❌ Error running role tests:', error);
      setDemoResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  /**
   * Test role synchronization
   */
  const testSynchronization = async () => {
    try {
      
      await synchronizeRoles();
      await hookSyncRoles();
      await runRoleTests();
      
    } catch (error) {
      console.error('❌ Synchronization test failed:', error);
    }
  };

  // Run initial tests when component mounts
  useEffect(() => {
    if (isAuthenticated && user && userProfile) {
      runRoleTests();
    }
  }, [isAuthenticated, user, userProfile]);

  /**
   * Render the test results content
   */
  const renderTestResults = () => {
    if (demoResults.error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Test Error</AlertTitle>
          <AlertDescription>{demoResults.error}</AlertDescription>
        </Alert>
      );
    }

    if (demoResults.roleChecks) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(demoResults.roleChecks).map(([method, result]) => (
              <div key={method} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {result ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">{method}</span>
                </div>
                <Badge variant={result ? "default" : "destructive"}>
                  {result ? 'ADMIN' : 'NOT ADMIN'}
                </Badge>
              </div>
            ))}
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Test Results</AlertTitle>
            <AlertDescription>
              All admin checks should return the same result. If they differ,
              there may be a synchronization issue between role storage sources.
            </AlertDescription>
          </Alert>
          
          <details className="p-4 border rounded-lg">
            <summary className="cursor-pointer font-medium">Raw Test Data</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(demoResults, null, 2)}
            </pre>
          </details>
        </div>
      );
    }

    return (
      <p className="text-muted-foreground">No test results yet. Click "Run Tests" to start.</p>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Admin Access Control Demo</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive demonstration of the admin access control system featuring dual role checking,
          real-time synchronization, and UI protection components.
        </p>
      </div>

      {/* Current User Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Current User Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated && user && userProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">User Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {user.Name}</p>
                  <p><span className="font-medium">Email:</span> {user.Email}</p>
                  <p><span className="font-medium">ID:</span> {user.ID}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Profile Information</h4>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Role:</span>
                    <Badge variant="default">{userProfile.role}</Badge>
                  </p>
                  <p><span className="font-medium">Station:</span> {userProfile.station}</p>
                  <p><span className="font-medium">Active:</span> {userProfile.is_active ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Authenticated</AlertTitle>
              <AlertDescription>Please log in to test the admin access control system.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Demo Content Tabs */}
      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests">Role Tests</TabsTrigger>
          <TabsTrigger value="protection">UI Protection</TabsTrigger>
          <TabsTrigger value="management">Role Management</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        {/* Role Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>Role Verification Tests</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={runRoleTests}
                    disabled={isRunningTests}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRunningTests ? 'animate-spin' : ''}`} />
                    Run Tests
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={testSynchronization}
                    disabled={isRunningTests}
                    className="flex items-center gap-2"
                  >
                    <Sync className="h-4 w-4" />
                    Test Sync
                  </Button>
                </div>
              </div>
              <CardDescription>
                Test different role checking methods and synchronization functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTestResults()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI Protection Tab */}
        <TabsContent value="protection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AdminRoute Component Demo</CardTitle>
              <CardDescription>
                The AdminRoute component protects content and shows appropriate fallbacks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Protected Content (Admin Only)</h4>
                <AdminRoute 
                  showDebugInfo={true}
                  fallback={
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <p className="text-red-800">
                          🚫 This is the fallback content shown when admin access is denied.
                        </p>
                      </CardContent>
                    </Card>
                  }
                >
                  <ProtectedComponent />
                </AdminRoute>
              </div>

              <div>
                <h4 className="font-semibold mb-2">useAdminRole Hook Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Admin Status</span>
                    </div>
                    <Badge variant={hookIsAdmin ? "default" : "destructive"}>
                      {hookIsAdmin ? 'ADMIN' : 'NOT ADMIN'}
                    </Badge>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Loading</span>
                    </div>
                    <Badge variant={hookLoading ? "secondary" : "outline"}>
                      {hookLoading ? 'LOADING' : 'READY'}
                    </Badge>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Error Status</span>
                    </div>
                    <Badge variant={hookError ? "destructive" : "default"}>
                      {hookError ? 'ERROR' : 'OK'}
                    </Badge>
                  </div>
                </div>
                {hookError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hook Error</AlertTitle>
                    <AlertDescription>{hookError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Management Tab */}
        <TabsContent value="management" className="space-y-4">
          <AdminRoute>
            <RoleManager />
          </AdminRoute>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Access Control System Documentation</CardTitle>
              <CardDescription>
                Complete implementation guide and component reference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">System Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">AuthContext Enhancement</h4>
                    <p className="text-sm text-muted-foreground">
                      Enhanced authentication context with dual role checking from both 
                      Supabase auth metadata and database profiles.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">useAdminRole Hook</h4>
                    <p className="text-sm text-muted-foreground">
                      Custom hook providing comprehensive admin access verification with 
                      loading states and error handling.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">AdminRoute Component</h4>
                    <p className="text-sm text-muted-foreground">
                      Route protection component with customizable fallbacks and 
                      detailed error states for access control.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">RoleManager Component</h4>
                    <p className="text-sm text-muted-foreground">
                      Administrative interface for managing user roles with 
                      dual storage synchronization support.
                    </p>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Dual Role Storage</p>
                      <p className="text-sm text-muted-foreground">
                        Roles stored in both Supabase auth metadata and database for redundancy
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Real-time Synchronization</p>
                      <p className="text-sm text-muted-foreground">
                        Automatic role synchronization between storage sources
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Backward Compatibility</p>
                      <p className="text-sm text-muted-foreground">
                        Supports both legacy role formats and new standardized roles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Comprehensive Logging</p>
                      <p className="text-sm text-muted-foreground">
                        Detailed debug logging for troubleshooting access issues
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Usage Examples</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Basic Route Protection</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<AdminRoute>
  <AdminDashboard />
</AdminRoute>`}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Using the Admin Hook</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const { isAdmin, isLoading, synchronizeRoles } = useAdminRole();

if (isAdmin) {
  return <AdminContent />;
}`}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Database Schema Setup</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Run the SQL schema file to set up the roles management system:
                    </p>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`-- Execute: database/roles-schema.sql
-- Creates roles table, permissions, and RLS policies`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAccessControlDemo;