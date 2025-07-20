import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, TestTube, Settings, Layout, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedRoleAccess } from '@/hooks/use-enhanced-role-access';
import RoleTestingDashboard from '@/components/RoleTesting/RoleTestingDashboard';
import RoleDashboardCustomizer from '@/components/RoleTesting/RoleDashboardCustomizer';
import RoleBasedDashboard from '@/components/RoleTesting/RoleBasedDashboard';
import UserRoleSwitcher from '@/components/RoleTesting/UserRoleSwitcher';
import { AccessDenied } from '@/components/AccessDenied';

const RoleTestingPage: React.FC = () => {
  const { userProfile } = useAuth();
  const roleAccess = useEnhancedRoleAccess();

  // Show access denied for non-administrators trying to access testing tools
  if (!roleAccess.canAccessAdminArea) {
    return (
      <div className="space-y-6">
        <RoleBasedDashboard />
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Role testing and customization tools are available to administrators only. 
            Above is your role-based dashboard view.
          </AlertDescription>
        </Alert>
      </div>);

  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Role Testing & Customization Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current Role:</span>
              <Badge className={`${
              roleAccess.userRole === 'Administrator' ? 'bg-red-500' :
              roleAccess.userRole === 'Management' ? 'bg-blue-500' : 'bg-green-500'}`
              }>
                {roleAccess.userRole}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Station Access:</span>
              <Badge variant="outline">{roleAccess.stationAccess}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Testing Access:</span>
              <Badge variant={roleAccess.canAccessAdminArea ? 'default' : 'destructive'}>
                {roleAccess.canAccessAdminArea ? 'Full Access' : 'Restricted'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard Preview</TabsTrigger>
          <TabsTrigger value="testing">Role Testing</TabsTrigger>
          <TabsTrigger value="customizer">Dashboard Customizer</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="info">Testing Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Role-Based Dashboard Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This shows how the dashboard appears for your current role: <strong>{roleAccess.userRole}</strong>
                </AlertDescription>
              </Alert>
              <RoleBasedDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <RoleTestingDashboard />
        </TabsContent>

        <TabsContent value="customizer" className="space-y-4">
          <RoleDashboardCustomizer />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserRoleSwitcher />
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Testing Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Testing Different Roles</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Administrator Role:</strong> Has full access to all features including user management, monitoring, and system configuration.</p>
                    <p><strong>Management Role:</strong> Can access most operational features but cannot manage users or access monitoring tools.</p>
                    <p><strong>Employee Role:</strong> Limited to basic operations like sales entry and product viewing. Cannot access sensitive areas.</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">How to Test Roles</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Use the "Role Testing" tab to run automated tests for your current role</li>
                    <li>Create additional user accounts with different roles for comprehensive testing</li>
                    <li>Use the "Dashboard Customizer" to preview how different roles see the interface</li>
                    <li>Check the permission matrix to understand what each role can access</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Expected Behaviors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-red-200">
                      <CardHeader className="pb-2">
                        <Badge className="bg-red-500 w-fit">Administrator</Badge>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p>✓ Can access all admin pages</p>
                        <p>✓ Can manage other users</p>
                        <p>✓ Can access monitoring tools</p>
                        <p>✓ Can customize dashboards</p>
                        <p>✓ Can export/import data</p>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200">
                      <CardHeader className="pb-2">
                        <Badge className="bg-blue-500 w-fit">Management</Badge>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p>✓ Can view reports and analytics</p>
                        <p>✓ Can manage operations</p>
                        <p>✗ Cannot access admin settings</p>
                        <p>✗ Cannot manage other users</p>
                        <p>✗ Limited delete permissions</p>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200">
                      <CardHeader className="pb-2">
                        <Badge className="bg-green-500 w-fit">Employee</Badge>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p>✓ Can enter sales data</p>
                        <p>✓ Can view basic inventory</p>
                        <p>✗ Cannot access financial data</p>
                        <p>✗ Cannot manage other employees</p>
                        <p>✗ Cannot access admin areas</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Troubleshooting</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>If tests fail:</strong> Check that the user profile has the correct role assigned and that permissions are properly configured.</p>
                    <p><strong>If access is denied unexpectedly:</strong> Verify the user's station assignment and ensure the feature is enabled for their role.</p>
                    <p><strong>For custom permissions:</strong> Check the detailed_permissions field in the user profile for specific overrides.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default RoleTestingPage;