import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, User, Users, Settings, Eye, Edit, Plus, Trash2, Download, Upload, BarChart3, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedRoleAccess } from '@/hooks/use-enhanced-role-access';
import { toast } from '@/hooks/use-toast';

interface RoleTestScenario {
  id: string;
  name: string;
  description: string;
  feature: string;
  action: string;
  expectedResult: 'allow' | 'deny';
  role: 'Administrator' | 'Management' | 'Employee';
}

const TEST_SCENARIOS: RoleTestScenario[] = [
{
  id: '1',
  name: 'Admin Dashboard Access',
  description: 'Administrator accessing admin dashboard',
  feature: 'admin',
  action: 'canView',
  expectedResult: 'allow',
  role: 'Administrator'
},
{
  id: '2',
  name: 'Employee Admin Restriction',
  description: 'Employee trying to access admin area',
  feature: 'admin',
  action: 'canView',
  expectedResult: 'deny',
  role: 'Employee'
},
{
  id: '3',
  name: 'Management User Management',
  description: 'Management trying to manage users',
  feature: 'employees',
  action: 'canManageUsers',
  expectedResult: 'deny',
  role: 'Management'
},
{
  id: '4',
  name: 'Employee Product Creation',
  description: 'Employee trying to create products',
  feature: 'products',
  action: 'canCreate',
  expectedResult: 'deny',
  role: 'Employee'
},
{
  id: '5',
  name: 'Management Sales Report',
  description: 'Management viewing sales reports',
  feature: 'sales',
  action: 'canViewReports',
  expectedResult: 'allow',
  role: 'Management'
},
{
  id: '6',
  name: 'Employee Salary Access',
  description: 'Employee trying to view salary information',
  feature: 'salary',
  action: 'canView',
  expectedResult: 'deny',
  role: 'Employee'
},
{
  id: '7',
  name: 'Admin Monitoring Access',
  description: 'Administrator accessing monitoring features',
  feature: 'monitoring',
  action: 'canAccessMonitoring',
  expectedResult: 'allow',
  role: 'Administrator'
},
{
  id: '8',
  name: 'Management Delete Restriction',
  description: 'Management trying to delete records',
  feature: 'products',
  action: 'canDelete',
  expectedResult: 'deny',
  role: 'Management'
}];


const RoleTestingDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const roleAccess = useEnhancedRoleAccess();
  const [selectedRole, setSelectedRole] = useState<'Administrator' | 'Management' | 'Employee'>('Employee');
  const [testResults, setTestResults] = useState<Record<string, 'pass' | 'fail' | 'pending'>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  const runRoleTest = (scenario: RoleTestScenario) => {
    const hasAccess = roleAccess.hasFeatureAccess(
      scenario.feature as any,
      scenario.action as any
    );

    const result = scenario.expectedResult === 'allow' && hasAccess ||
    scenario.expectedResult === 'deny' && !hasAccess ? 'pass' : 'fail';

    setTestResults((prev) => ({ ...prev, [scenario.id]: result }));

    toast({
      title: result === 'pass' ? 'Test Passed' : 'Test Failed',
      description: `${scenario.name}: ${result === 'pass' ? 'Behaving as expected' : 'Unexpected behavior'}`,
      variant: result === 'pass' ? 'default' : 'destructive'
    });

    return result;
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults({});

    for (const scenario of TEST_SCENARIOS) {
      if (scenario.role === roleAccess.userRole) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate test delay
        runRoleTest(scenario);
      }
    }

    setIsRunningTests(false);

    const passedTests = Object.values(testResults).filter((result) => result === 'pass').length;
    const totalTests = Object.keys(testResults).length;

    toast({
      title: 'Test Suite Complete',
      description: `${passedTests}/${totalTests} tests passed`,
      variant: passedTests === totalTests ? 'default' : 'destructive'
    });
  };

  const getFeatureMatrix = () => {
    const features = ['dashboard', 'products', 'employees', 'sales', 'vendors', 'orders', 'licenses', 'salary', 'inventory', 'delivery', 'settings', 'admin', 'monitoring'];
    const actions = ['canView', 'canEdit', 'canCreate', 'canDelete', 'canExport', 'canManageUsers', 'canViewReports', 'canAccessMonitoring'];

    return features.map((feature) => ({
      feature,
      permissions: actions.reduce((acc, action) => {
        acc[action] = roleAccess.hasFeatureAccess(feature as any, action as any);
        return acc;
      }, {} as Record<string, boolean>)
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-red-500';
      case 'Management':
        return 'bg-blue-500';
      case 'Employee':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTestResultIcon = (result: 'pass' | 'fail' | 'pending') => {
    switch (result) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const currentRoleScenarios = TEST_SCENARIOS.filter((scenario) => scenario.role === roleAccess.userRole);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Testing Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Label>Current Role:</Label>
              <Badge className={getRoleColor(roleAccess.userRole || 'Unknown')}>
                {roleAccess.userRole || 'No Role'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Label>Station Access:</Label>
              <Badge variant="outline">{roleAccess.stationAccess}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Label>Admin Access:</Label>
              <Badge variant={roleAccess.canAccessAdminArea ? 'default' : 'destructive'}>
                {roleAccess.canAccessAdminArea ? 'Granted' : 'Restricted'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="tests">Automated Tests</TabsTrigger>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Permission Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>View</TableHead>
                      <TableHead>Edit</TableHead>
                      <TableHead>Create</TableHead>
                      <TableHead>Delete</TableHead>
                      <TableHead>Export</TableHead>
                      <TableHead>Manage Users</TableHead>
                      <TableHead>View Reports</TableHead>
                      <TableHead>Monitoring</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFeatureMatrix().map(({ feature, permissions }) =>
                    <TableRow key={feature}>
                        <TableCell className="font-medium capitalize">{feature}</TableCell>
                        <TableCell>
                          <Badge variant={permissions.canView ? 'default' : 'destructive'}>
                            {permissions.canView ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={permissions.canEdit ? 'default' : 'destructive'}>
                            {permissions.canEdit ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={permissions.canCreate ? 'default' : 'destructive'}>
                            {permissions.canCreate ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={permissions.canDelete ? 'default' : 'destructive'}>
                            {permissions.canDelete ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={permissions.canExport ? 'default' : 'destructive'}>
                            {permissions.canExport ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={permissions.canManageUsers ? 'default' : 'destructive'}>
                            {permissions.canManageUsers ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={permissions.canViewReports ? 'default' : 'destructive'}>
                            {permissions.canViewReports ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={permissions.canAccessMonitoring ? 'default' : 'destructive'}>
                            {permissions.canAccessMonitoring ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Automated Role Tests
                <Button
                  onClick={runAllTests}
                  disabled={isRunningTests}
                  className="flex items-center gap-2">

                  <BarChart3 className="h-4 w-4" />
                  {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentRoleScenarios.map((scenario) =>
                <div key={scenario.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getTestResultIcon(testResults[scenario.id] || 'pending')}
                        <span className="font-medium">{scenario.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {scenario.expectedResult === 'allow' ? 'Should Allow' : 'Should Deny'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                    </div>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runRoleTest(scenario)}
                    disabled={isRunningTests}>

                      Test
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Scenarios by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Administrator', 'Management', 'Employee'].map((role) =>
                <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getRoleColor(role)}>{role}</Badge>
                      <span className="text-sm text-gray-600">
                        ({TEST_SCENARIOS.filter((s) => s.role === role).length} scenarios)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {TEST_SCENARIOS.filter((s) => s.role === role).map((scenario) =>
                    <div key={scenario.id} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="font-medium">{scenario.name}</div>
                          <div className="text-gray-600">{scenario.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {scenario.feature}
                            </Badge>
                            <Badge variant={scenario.expectedResult === 'allow' ? 'default' : 'destructive'} className="text-xs">
                              {scenario.expectedResult}
                            </Badge>
                          </div>
                        </div>
                    )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          This testing dashboard verifies that role-based access controls are working correctly. 
          Test results are based on your current role: <strong>{roleAccess.userRole}</strong>. 
          To test different roles, ask an administrator to temporarily change your role or use different user accounts.
        </AlertDescription>
      </Alert>
    </div>);

};

export default RoleTestingDashboard;