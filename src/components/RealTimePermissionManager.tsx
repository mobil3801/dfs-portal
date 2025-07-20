import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  Users,
  Settings,
  User,
  Eye,
  Plus,
  Edit,
  Trash2,
  Download,
  Printer,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle,
  XCircle,
  Database,
  Activity,
  AlertCircle,
  RefreshCw } from
'lucide-react';

interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  print: boolean;
}

interface UserProfile {
  id: number;
  user_id: number;
  role: string;
  station: string;
  employee_id: string;
  detailed_permissions: string;
  is_active: boolean;
}

interface PermissionTemplate {
  [module: string]: ModulePermissions;
}

const RealTimePermissionManager: React.FC = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<PermissionTemplate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check if current user is admin
  const isAdmin = userProfile?.role === 'Administrator';

  // Available modules
  const modules = [
  'dashboard',
  'products',
  'employees',
  'sales_reports',
  'vendors',
  'orders',
  'licenses',
  'salary',
  'delivery',
  'settings',
  'user_management',
  'site_management',
  'system_logs',
  'security_settings'];


  // Permission templates for quick assignment
  const permissionTemplates = {
    Administrator: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      export: true,
      print: true
    },
    Management: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      export: true,
      print: true
    },
    Employee: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      export: false,
      print: false
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedUserId) {
      loadUserPermissions(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage('11725', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [
        { name: 'is_active', op: 'Equal', value: true }]

      });

      if (error) throw error;
      setUsers(data?.List || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async (userId: number) => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage('11725', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [
        { name: 'id', op: 'Equal', value: userId }]

      });

      if (error) throw error;

      const user = data?.List?.[0];
      if (user) {
        let userPermissions = {};
        if (user.detailed_permissions) {
          try {
            userPermissions = JSON.parse(user.detailed_permissions);
          } catch (parseError) {
            console.warn('Failed to parse user permissions:', parseError);
          }
        }

        // Initialize permissions for all modules
        const fullPermissions: PermissionTemplate = {};
        modules.forEach((module) => {
          fullPermissions[module] = userPermissions[module] || {
            view: false,
            create: false,
            edit: false,
            delete: false,
            export: false,
            print: false
          };
        });

        setPermissions(fullPermissions);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
      toast({
        title: "Error",
        description: "Failed to load user permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = useCallback((module: string, permission: keyof ModulePermissions, enabled: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: enabled
      }
    }));
    setHasChanges(true);

    // Immediate visual feedback
    toast({
      title: "Permission Updated",
      description: `${module} ${permission} permission ${enabled ? 'enabled' : 'disabled'}`,
      duration: 2000
    });
  }, []);

  const applyRoleTemplate = useCallback((role: string) => {
    const template = permissionTemplates[role];
    if (!template) return;

    const newPermissions: PermissionTemplate = {};
    modules.forEach((module) => {
      newPermissions[module] = { ...template };
    });

    setPermissions(newPermissions);
    setHasChanges(true);

    toast({
      title: "Template Applied",
      description: `${role} permission template applied to all modules`,
      duration: 3000
    });
  }, [modules]);

  const savePermissions = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user first",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      // Get current user data
      const { data, error } = await window.ezsite.apis.tablePage('11725', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [
        { name: 'id', op: 'Equal', value: selectedUserId }]

      });

      if (error) throw error;

      const user = data?.List?.[0];
      if (!user) {
        throw new Error('User not found');
      }

      // Save updated permissions using correct field name
      const updateResult = await window.ezsite.apis.tableUpdate('11725', {
        id: user.id,
        detailed_permissions: JSON.stringify(permissions)
      });

      if (updateResult.error) throw updateResult.error;

      setHasChanges(false);

      // Show success message
      toast({
        title: "Success",
        description: "User permissions updated successfully",
        duration: 3000
      });

      // Refresh permissions to ensure they were saved correctly
      setTimeout(() => {
        loadUserPermissions(selectedUserId);
      }, 500);

    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : "Failed to save permissions",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetPermissions = useCallback(() => {
    if (selectedUserId) {
      loadUserPermissions(selectedUserId);
      toast({
        title: "Permissions Reset",
        description: "All changes have been reverted",
        duration: 2000
      });
    }
  }, [selectedUserId]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadUsers();
      if (selectedUserId) {
        await loadUserPermissions(selectedUserId);
      }
      toast({
        title: "Data Refreshed",
        description: "User data and permissions have been refreshed",
        duration: 2000
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getModuleDisplayName = (module: string) => {
    const displayNames = {
      dashboard: 'Dashboard',
      products: 'Products',
      employees: 'Employees',
      sales_reports: 'Sales Reports',
      vendors: 'Vendors',
      orders: 'Orders',
      licenses: 'Licenses',
      salary: 'Salary',
      delivery: 'Delivery',
      settings: 'Settings',
      user_management: 'User Management',
      site_management: 'Site Management',
      system_logs: 'System Logs',
      security_settings: 'Security Settings'
    };
    return displayNames[module] || module;
  };

  const getPermissionIcon = (type: keyof ModulePermissions) => {
    const icons = {
      view: Eye,
      create: Plus,
      edit: Edit,
      delete: Trash2,
      export: Download,
      print: Printer
    };
    return icons[type];
  };

  const getPermissionSummary = (modulePermissions: ModulePermissions) => {
    const enabled = Object.values(modulePermissions).filter(Boolean).length;
    const total = Object.keys(modulePermissions).length;
    return { enabled, total };
  };

  const getSelectedUserInfo = () => {
    if (!selectedUserId) return null;
    return users.find((user) => user.id === selectedUserId);
  };

  if (!isAdmin) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-900">Permission Management</h3>
              <p className="text-sm text-orange-700">
                Administrator access required to manage user permissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-blue-900">
            <div className="flex items-center space-x-2">
              <Database className="w-6 h-6" />
              <span>Real-Time Permission Management</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Live System
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center space-x-2">

              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Select User</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Choose User to Manage</Label>
              <Select
                value={selectedUserId?.toString() || ''}
                onValueChange={(value) => setSelectedUserId(parseInt(value))}>

                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user to manage their permissions" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) =>
                  <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.employee_id}</span>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {user.station}
                        </Badge>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedUserId &&
            <div className="flex items-center space-x-2">
                <Label>Quick Role Templates:</Label>
                {Object.keys(permissionTemplates).map((role) =>
              <Button
                key={role}
                variant="outline"
                size="sm"
                onClick={() => applyRoleTemplate(role)}
                className="text-xs">

                    Apply {role}
                  </Button>
              )}
              </div>
            }

            {getSelectedUserInfo() &&
            <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  Managing permissions for: <strong>{getSelectedUserInfo()?.employee_id}</strong> 
                  ({getSelectedUserInfo()?.role} at {getSelectedUserInfo()?.station})
                </AlertDescription>
              </Alert>
            }
          </div>
        </CardContent>
      </Card>

      {/* Permission Management */}
      {selectedUserId &&
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Module Permissions</span>
              </CardTitle>
              {hasChanges &&
            <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                  <Button
                variant="outline"
                size="sm"
                onClick={resetPermissions}
                disabled={saving}>

                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  <Button
                size="sm"
                onClick={savePermissions}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700">

                    {saving ?
                <Loader2 className="w-4 h-4 mr-1 animate-spin" /> :

                <Save className="w-4 h-4 mr-1" />
                }
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
            }
            </div>
          </CardHeader>
          <CardContent>
            {loading ?
          <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading permissions...</span>
              </div> :

          <div className="space-y-6">
                {modules.map((module) => {
              const modulePermissions = permissions[module] || {};
              const { enabled, total } = getPermissionSummary(modulePermissions);

              return (
                <Card key={module} className="border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-medium">{getModuleDisplayName(module)}</h4>
                              <p className="text-sm text-gray-600">
                                {enabled}/{total} permissions enabled
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {enabled === total ?
                        <CheckCircle className="w-5 h-5 text-green-500" /> :
                        enabled === 0 ?
                        <XCircle className="w-5 h-5 text-red-500" /> :

                        <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                                <span className="text-xs font-medium text-yellow-800">
                                  {enabled}
                                </span>
                              </div>
                        }
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(Object.keys(modulePermissions) as Array<keyof ModulePermissions>).map((permission) => {
                        const Icon = getPermissionIcon(permission);
                        const isEnabled = modulePermissions[permission];

                        return (
                          <div
                            key={permission}
                            className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">

                                <div className="flex items-center space-x-3">
                                  <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center
                                    ${isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}
                                  `}>
                                    <Icon className="w-3 h-3" />
                                  </div>
                                  <span className="text-sm font-medium capitalize">
                                    {permission}
                                  </span>
                                </div>
                                <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) =>
                              handlePermissionChange(module, permission, checked)
                              }
                              className="data-[state=checked]:bg-green-500" />

                              </div>);

                      })}
                        </div>
                      </CardContent>
                    </Card>);

            })}
              </div>
          }
          </CardContent>
        </Card>
      }

      {/* No User Selected */}
      {!selectedUserId && !loading &&
      <Card className="border-gray-200">
          <CardContent className="p-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a User to Manage Permissions
              </h3>
              <p className="text-gray-600">
                Choose a user from the dropdown above to view and modify their module permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default RealTimePermissionManager;