import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import SimpleRoleAssignment from '@/components/SimpleRoleAssignment';
import BulkRoleManager from '@/components/BulkRoleManager';
import RoleOverview from '@/components/RoleOverview';
import AccessDenied from '@/components/AccessDenied';
import useAdminAccess from '@/hooks/use-admin-access';
import {
  Shield,
  Users,
  Zap,
  Star,
  Info,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Settings,
  Database,
  RefreshCw } from
'lucide-react';

interface UserProfile {
  id: number;
  user_id: number;
  role: string;
  station: string;
  employee_id: string;
  phone: string;
  hire_date: string;
  is_active: boolean;
  detailed_permissions: string;
}

const EasyRoleManagement: React.FC = () => {
  const { isAdmin } = useAdminAccess();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "employee_id",
        IsAsc: true,
        Filters: []
      });

      if (error) throw error;
      setUsers(data?.List || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: `Failed to load users: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
    toast({
      title: "Success",
      description: "User data refreshed successfully"
    });
  };

  const getRoleStats = () => {
    const roleCounts: Record<string, number> = {};
    users.forEach((user) => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    return roleCounts;
  };

  const ROLE_COLORS = {
    'Super Admin': 'bg-red-100 text-red-800',
    'Administrator': 'bg-red-100 text-red-800',
    'Manager': 'bg-blue-100 text-blue-800',
    'Management': 'bg-blue-100 text-blue-800',
    'Supervisor': 'bg-purple-100 text-purple-800',
    'Employee': 'bg-green-100 text-green-800',
    'Read Only': 'bg-gray-100 text-gray-800'
  };

  if (!isAdmin) {
    return (
      <AccessDenied
        feature="Easy Role Management"
        requiredRole="Administrator" />);


  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading role management system...</div>
      </div>);

  }

  const roleStats = getRoleStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Easy Role Management</h1>
            <p className="text-sm text-blue-600 font-medium">✓ Simplified role assignment without complex permissions</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Users className="w-3 h-3 mr-1" />
            {users.length} Users
          </Badge>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            className="flex items-center space-x-2">

            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Introduction Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <div className="font-semibold">Welcome to Easy Role Management!</div>
            <div>This simplified system makes role assignment quick and straightforward. No more complex permission matrices - just choose a role and we'll handle the rest.</div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(roleStats).map(([role, count]) =>
        <Card key={role}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <Badge className={ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'bg-gray-100 text-gray-800'}>
                  {role}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Single Role Assignment */}
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <UserCheck className="w-5 h-5" />
              <span>Single User Assignment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Perfect for assigning roles to individual users. Quick, simple, and straightforward.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Choose user from dropdown</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Select role template</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Permissions applied automatically</span>
                </div>
              </div>
              <SimpleRoleAssignment
                trigger={
                <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Shield className="w-4 h-4 mr-2" />
                    Assign Single Role
                  </Button>
                }
                onRoleAssigned={() => {
                  refreshData();
                  toast({
                    title: "Success",
                    description: "Role assignment completed successfully"
                  });
                }} />

            </div>
          </CardContent>
        </Card>

        {/* Bulk Role Assignment */}
        <Card className="border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Zap className="w-5 h-5" />
              <span>Bulk Assignment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Assign roles to multiple users at once. Great for onboarding new teams or role changes.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  <span>Select multiple users</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  <span>Filter by station or role</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  <span>Mass role update</span>
                </div>
              </div>
              <BulkRoleManager
                trigger={
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Bulk Assignment
                  </Button>
                }
                onRolesAssigned={() => {
                  refreshData();
                  toast({
                    title: "Success",
                    description: "Bulk role assignment completed successfully"
                  });
                }} />

            </div>
          </CardContent>
        </Card>

        {/* Role Guide */}
        <Card className="border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Star className="w-5 h-5" />
              <span>Role Reference</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Not sure which role to assign? View detailed explanations and permissions for each role.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Role descriptions</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Permission breakdown</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Usage recommendations</span>
                </div>
              </div>
              <RoleOverview
                trigger={
                <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                    <Info className="w-4 h-4 mr-2" />
                    View Role Guide
                  </Button>
                } />

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Workflow Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            <span>Simple 3-Step Workflow</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Choose Users</h3>
              <p className="text-sm text-gray-600">Select individual users or multiple users for bulk assignment</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Pick Role</h3>
              <p className="text-sm text-gray-600">Select from predefined roles like Manager, Employee, or Read Only</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Done!</h3>
              <p className="text-sm text-gray-600">Permissions are automatically configured based on the role</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong>Need Advanced Permissions?</strong>
              <p className="text-sm mt-1">
                For custom permission configurations, you can still use the advanced permission manager in the full User Management page.
              </p>
            </div>
            <Button variant="outline" className="ml-4">
              <Database className="w-4 h-4 mr-2" />
              Advanced Mode
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>);

};

export default EasyRoleManagement;