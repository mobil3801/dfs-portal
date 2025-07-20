import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  Users,
  Database,
  FileText,
  Package,
  Truck,
  DollarSign,
  UserCheck,
  Settings,
  BarChart3,
  Building2,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Plus,
  Trash2,
  Save } from
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

interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  print: boolean;
}

interface DetailedPermissions {
  dashboard: Permission;
  products: Permission;
  employees: Permission;
  sales_reports: Permission;
  vendors: Permission;
  orders: Permission;
  licenses: Permission;
  salary: Permission;
  inventory: Permission;
  delivery: Permission;
  settings: Permission;
  user_management: Permission;
  site_management: Permission;
  system_logs: Permission;
  security_settings: Permission;
}

const defaultPermissions: Permission = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  export: false,
  print: false
};

const defaultDetailedPermissions: DetailedPermissions = {
  dashboard: { ...defaultPermissions, view: true },
  products: { ...defaultPermissions },
  employees: { ...defaultPermissions },
  sales_reports: { ...defaultPermissions },
  vendors: { ...defaultPermissions },
  orders: { ...defaultPermissions },
  licenses: { ...defaultPermissions },
  salary: { ...defaultPermissions },
  inventory: { ...defaultPermissions },
  delivery: { ...defaultPermissions },
  settings: { ...defaultPermissions },
  user_management: { ...defaultPermissions },
  site_management: { ...defaultPermissions },
  system_logs: { ...defaultPermissions },
  security_settings: { ...defaultPermissions }
};

const contentAreas = [
{ key: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-blue-600' },
{ key: 'products', label: 'Products', icon: Package, color: 'text-green-600' },
{ key: 'employees', label: 'Employees', icon: Users, color: 'text-purple-600' },
{ key: 'sales_reports', label: 'Sales Reports', icon: FileText, color: 'text-orange-600' },
{ key: 'vendors', label: 'Vendors', icon: Building2, color: 'text-teal-600' },
{ key: 'orders', label: 'Orders', icon: Truck, color: 'text-indigo-600' },
{ key: 'licenses', label: 'Licenses', icon: Shield, color: 'text-red-600' },
{ key: 'salary', label: 'Salary Management', icon: DollarSign, color: 'text-yellow-600' },
{ key: 'inventory', label: 'Inventory', icon: Database, color: 'text-cyan-600' },
{ key: 'delivery', label: 'Delivery', icon: Truck, color: 'text-pink-600' },
{ key: 'settings', label: 'App Settings', icon: Settings, color: 'text-gray-600' },
{ key: 'user_management', label: 'User Management', icon: UserCheck, color: 'text-red-600' },
{ key: 'site_management', label: 'Site Management', icon: Building2, color: 'text-blue-600' },
{ key: 'system_logs', label: 'System Logs', icon: FileText, color: 'text-gray-600' },
{ key: 'security_settings', label: 'Security Settings', icon: Shield, color: 'text-red-600' }];


const permissionTypes = [
{ key: 'view', label: 'View', icon: Eye, description: 'Can view and access the content' },
{ key: 'create', label: 'Create', icon: Plus, description: 'Can create new records' },
{ key: 'edit', label: 'Edit', icon: Edit, description: 'Can modify existing records' },
{ key: 'delete', label: 'Delete', icon: Trash2, description: 'Can delete records' },
{ key: 'export', label: 'Export', icon: FileText, description: 'Can export data' },
{ key: 'print', label: 'Print', icon: FileText, description: 'Can print reports' }];


const UserPermissionManager: React.FC = () => {
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<DetailedPermissions>(defaultDetailedPermissions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfiles();
  }, []);

  const fetchUserProfiles = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "id",
        IsAsc: false,
        Filters: []
      });

      if (error) throw error;

      setUserProfiles(data?.List || []);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      toast({
        title: "Error",
        description: `Failed to fetch user profiles: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = userProfiles.find((u) => u.id.toString() === userId);
    if (user) {
      setSelectedUser(user);
      // Parse existing permissions or use defaults
      try {
        const existingPermissions = user.detailed_permissions ?
        JSON.parse(user.detailed_permissions) :
        defaultDetailedPermissions;
        setPermissions(existingPermissions);
      } catch (error) {
        console.error('Error parsing permissions:', error);
        setPermissions(defaultDetailedPermissions);
      }
    }
  };

  const handlePermissionChange = (contentArea: string, permissionType: string, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [contentArea]: {
        ...prev[contentArea as keyof DetailedPermissions],
        [permissionType]: value
      }
    }));
  };

  const handleBulkPermissionChange = (contentArea: string, action: 'grant_all' | 'revoke_all') => {
    const allTrue = permissionTypes.reduce((acc, type) => ({ ...acc, [type.key]: true }), {});
    const allFalse = permissionTypes.reduce((acc, type) => ({ ...acc, [type.key]: false }), {});

    setPermissions((prev) => ({
      ...prev,
      [contentArea]: action === 'grant_all' ? allTrue as Permission : allFalse as Permission
    }));
  };

  const applyRoleTemplate = (role: string) => {
    let newPermissions: DetailedPermissions;

    switch (role) {
      case 'Administrator':
        // Administrators get full access to everything
        newPermissions = Object.keys(defaultDetailedPermissions).reduce((acc, area) => ({
          ...acc,
          [area]: permissionTypes.reduce((perms, type) => ({ ...perms, [type.key]: true }), {})
        }), {} as DetailedPermissions);
        break;

      case 'Management':
        // Management gets most permissions except admin functions
        newPermissions = Object.keys(defaultDetailedPermissions).reduce((acc, area) => {
          const isAdminArea = ['user_management', 'site_management', 'system_logs', 'security_settings'].includes(area);
          return {
            ...acc,
            [area]: isAdminArea ?
            { ...defaultPermissions, view: true } :
            permissionTypes.reduce((perms, type) => ({ ...perms, [type.key]: true }), {})
          };
        }, {} as DetailedPermissions);
        break;

      case 'Employee':
        // Employees get basic access to operational areas
        newPermissions = {
          ...defaultDetailedPermissions,
          dashboard: { ...defaultPermissions, view: true },
          products: { ...defaultPermissions, view: true },
          sales_reports: { ...defaultPermissions, view: true, create: true, edit: true },
          inventory: { ...defaultPermissions, view: true },
          delivery: { ...defaultPermissions, view: true, create: true, edit: true }
        };
        break;

      default:
        newPermissions = defaultDetailedPermissions;
    }

    setPermissions(newPermissions);
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const { error } = await window.ezsite.apis.tableUpdate(11725, {
        id: selectedUser.id,
        detailed_permissions: JSON.stringify(permissions)
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User permissions updated successfully"
      });

      // Update the local state
      setUserProfiles((prev) => prev.map((user) =>
      user.id === selectedUser.id ?
      { ...user, detailed_permissions: JSON.stringify(permissions) } :
      user
      ));
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: `Failed to save permissions: ${error}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getPermissionSummary = (user: UserProfile) => {
    try {
      const userPermissions = user.detailed_permissions ?
      JSON.parse(user.detailed_permissions) :
      defaultDetailedPermissions;

      const totalAreas = contentAreas.length;
      const areasWithAccess = contentAreas.filter((area) =>
      userPermissions[area.key]?.view
      ).length;

      return `${areasWithAccess}/${totalAreas} areas`;
    } catch {
      return '0/15 areas';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading permission management...</div>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">User Permission Management</h1>
        </div>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Select User to Manage Permissions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>User to Manage</Label>
              <Select onValueChange={handleUserSelect} value={selectedUser?.id.toString() || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user to manage permissions" />
                </SelectTrigger>
                <SelectContent>
                  {userProfiles.map((user) =>
                  <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{user.employee_id} - {user.role}</span>
                        <Badge variant="outline" className="ml-2">
                          {getPermissionSummary(user)}
                        </Badge>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedUser &&
            <div>
                <Label>Apply Role Template</Label>
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyRoleTemplate('Administrator')}
                    className="flex-1">
                      Admin Template
                    </Button>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyRoleTemplate('Management')}
                    className="flex-1">
                      Manager Template
                    </Button>
                  </div>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyRoleTemplate('Employee')}
                  className="w-full">
                    Employee Template
                  </Button>
                </div>
              </div>
            }
          </div>

          {selectedUser &&
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.employee_id}</h3>
                  <p className="text-sm text-gray-600">
                    Role: {selectedUser.role} | Station: {selectedUser.station}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    User ID: {selectedUser.user_id} | Phone: {selectedUser.phone}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          }
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      {selectedUser &&
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Detailed Permissions for {selectedUser.employee_id}</span>
              </CardTitle>
              <Button
              onClick={savePermissions}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700">

                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Permissions'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold bg-white">Content Area</th>
                      {permissionTypes.map((type) =>
                    <th key={type.key} className="text-center p-3 font-semibold min-w-20 bg-white">
                          <div className="flex flex-col items-center space-y-1">
                            <type.icon className="w-4 h-4" />
                            <span className="text-xs">{type.label}</span>
                          </div>
                        </th>
                    )}
                      <th className="text-center p-3 font-semibold bg-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentAreas.map((area) => {
                    const areaPermissions = permissions[area.key as keyof DetailedPermissions];
                    return (
                      <tr key={area.key} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              <area.icon className={`w-5 h-5 ${area.color}`} />
                              <span className="font-medium">{area.label}</span>
                            </div>
                          </td>
                          {permissionTypes.map((type) =>
                        <td key={type.key} className="text-center p-3">
                              <Switch
                            checked={areaPermissions[type.key as keyof Permission]}
                            onCheckedChange={(checked) =>
                            handlePermissionChange(area.key, type.key, checked)
                            } />
                            </td>
                        )}
                          <td className="text-center p-3">
                            <div className="flex space-x-1 justify-center">
                              <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBulkPermissionChange(area.key, 'grant_all')}
                              className="text-green-600 hover:text-green-700"
                              title="Grant all permissions">
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
                              <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBulkPermissionChange(area.key, 'revoke_all')}
                              className="text-red-600 hover:text-red-700"
                              title="Revoke all permissions">
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>);
                  })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>

            {/* Permission Types Legend */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-3">Permission Types:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {permissionTypes.map((type) =>
              <div key={type.key} className="flex items-center space-x-2">
                    <type.icon className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{type.label}:</span>
                    <span className="text-sm text-gray-600">{type.description}</span>
                  </div>
              )}
              </div>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default UserPermissionManager;