import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  User,
  Eye,
  Plus,
  Edit,
  Trash2,
  Download,
  Printer,
  Save,
  RotateCcw,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
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

interface RealTimePermissionToggleProps {
  userId?: number;
  module: string;
  onPermissionChange?: (permissions: ModulePermissions) => void;
  showUserSelector?: boolean;
  className?: string;
  autoSave?: boolean;
}

const RealTimePermissionToggle: React.FC<RealTimePermissionToggleProps> = ({
  userId,
  module,
  onPermissionChange,
  showUserSelector = false,
  className = '',
  autoSave = false
}) => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(userId);
  const [permissions, setPermissions] = useState<ModulePermissions>({
    view: true,
    create: false,
    edit: false,
    delete: false,
    export: false,
    print: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if current user is admin
  const isAdmin = userProfile?.role === 'Administrator';

  useEffect(() => {
    if (showUserSelector && isAdmin) {
      loadUsers();
    }
  }, [showUserSelector, isAdmin]);

  useEffect(() => {
    if (selectedUserId) {
      loadUserPermissions(selectedUserId);
    }
  }, [selectedUserId, module]);

  useEffect(() => {
    setSelectedUserId(userId);
  }, [userId]);

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

  const loadUserPermissions = async (targetUserId: number) => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage('11725', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [
        { name: 'user_id', op: 'Equal', value: targetUserId }]

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

        const modulePermissions = userPermissions[module] || {
          view: true,
          create: false,
          edit: false,
          delete: false,
          export: false,
          print: false
        };

        setPermissions(modulePermissions);
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

  const handlePermissionChange = useCallback(async (permission: keyof ModulePermissions, enabled: boolean) => {
    const newPermissions = { ...permissions, [permission]: enabled };
    setPermissions(newPermissions);
    setHasChanges(true);

    // Immediate visual feedback
    toast({
      title: "Permission Updated",
      description: `${module} ${permission} permission ${enabled ? 'enabled' : 'disabled'}`,
      duration: 2000
    });

    if (onPermissionChange) {
      onPermissionChange(newPermissions);
    }

    // Auto-save if enabled
    if (autoSave && selectedUserId) {
      await savePermissionToDatabase(permission, enabled, newPermissions);
    }
  }, [permissions, module, onPermissionChange, autoSave, selectedUserId]);

  const savePermissionToDatabase = async (permission: keyof ModulePermissions, enabled: boolean, newPermissions: ModulePermissions) => {
    if (!selectedUserId) return;

    try {
      setSaving(true);

      // Get current user data
      const { data, error } = await window.ezsite.apis.tablePage('11725', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [
        { name: 'user_id', op: 'Equal', value: selectedUserId }]

      });

      if (error) throw error;

      const user = data?.List?.[0];
      if (!user) {
        throw new Error('User not found');
      }

      // Parse existing permissions
      let existingPermissions = {};
      if (user.detailed_permissions) {
        try {
          existingPermissions = JSON.parse(user.detailed_permissions);
        } catch (parseError) {
          console.warn('Failed to parse existing permissions:', parseError);
        }
      }

      // Update module permissions
      const updatedPermissions = {
        ...existingPermissions,
        [module]: newPermissions
      };

      // Save updated permissions using correct field name
      const updateResult = await window.ezsite.apis.tableUpdate('11725', {
        id: user.id,
        detailed_permissions: JSON.stringify(updatedPermissions)
      });

      if (updateResult.error) throw updateResult.error;

      setHasChanges(false);
      toast({
        title: "Auto-saved",
        description: `${module} permissions saved successfully`,
        duration: 2000
      });

    } catch (error) {
      console.error('Error auto-saving permissions:', error);
      toast({
        title: "Auto-save Failed",
        description: "Permission change saved locally but not to database",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

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
        { name: 'user_id', op: 'Equal', value: selectedUserId }]

      });

      if (error) throw error;

      const user = data?.List?.[0];
      if (!user) {
        throw new Error('User not found');
      }

      // Parse existing permissions
      let existingPermissions = {};
      if (user.detailed_permissions) {
        try {
          existingPermissions = JSON.parse(user.detailed_permissions);
        } catch (parseError) {
          console.warn('Failed to parse existing permissions:', parseError);
        }
      }

      // Update module permissions
      const updatedPermissions = {
        ...existingPermissions,
        [module]: permissions
      };

      // Save updated permissions using correct field name
      const updateResult = await window.ezsite.apis.tableUpdate('11725', {
        id: user.id,
        detailed_permissions: JSON.stringify(updatedPermissions)
      });

      if (updateResult.error) throw updateResult.error;

      setHasChanges(false);
      toast({
        title: "Success",
        description: `${module} permissions updated successfully`,
        duration: 3000
      });

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
  }, [selectedUserId, module]);

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

  const getPermissionLabel = (type: keyof ModulePermissions) => {
    const labels = {
      view: 'View',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      export: 'Export',
      print: 'Print'
    };
    return labels[type];
  };

  const getPermissionDescription = (type: keyof ModulePermissions) => {
    const descriptions = {
      view: `View ${module} data`,
      create: `Create new ${module}`,
      edit: `Edit existing ${module}`,
      delete: `Delete ${module}`,
      export: `Export ${module} data`,
      print: `Print ${module} reports`
    };
    return descriptions[type];
  };

  const getPermissionSummary = () => {
    const enabled = Object.values(permissions).filter(Boolean).length;
    const total = Object.keys(permissions).length;
    return { enabled, total };
  };

  if (!isAdmin) {
    return (
      <Card className={`border-orange-200 bg-orange-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-900">Permission Management</p>
              <p className="text-sm text-orange-700">
                Administrator access required to manage permissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>);

  }

  const { enabled, total } = getPermissionSummary();

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-blue-900">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>{module.charAt(0).toUpperCase() + module.slice(1)} Permissions</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Real-Time
            </Badge>
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
            <span className="text-sm text-blue-700">{enabled}/{total}</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Selector */}
        {showUserSelector &&
        <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Select User</span>
            </Label>
            <Select
            value={selectedUserId?.toString() || ''}
            onValueChange={(value) => setSelectedUserId(parseInt(value))}>

              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a user to manage permissions" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) =>
              <SelectItem key={user.id} value={user.user_id.toString()}>
                    <div className="flex items-center space-x-2">
                      <span>{user.employee_id}</span>
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
        }

        {/* Loading State */}
        {loading &&
        <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading permissions...</span>
          </div>
        }

        {/* Permission Toggles */}
        {!loading && selectedUserId &&
        <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Module Permissions</span>
              {autoSave &&
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  Auto-save enabled
                </Badge>
            }
            </h4>

            <div className="grid gap-3">
              {(Object.keys(permissions) as Array<keyof ModulePermissions>).map((permission) => {
              const Icon = getPermissionIcon(permission);
              const isEnabled = permissions[permission];

              return (
                <div
                  key={permission}
                  className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-all duration-200">

                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200
                        ${isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {getPermissionLabel(permission)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {getPermissionDescription(permission)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {saving &&
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    }
                      <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handlePermissionChange(permission, checked)}
                      className="data-[state=checked]:bg-green-500"
                      disabled={saving} />

                    </div>
                  </div>);

            })}
            </div>

            {/* Action Buttons */}
            {hasChanges && !autoSave &&
          <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Unsaved Changes
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                variant="outline"
                size="sm"
                onClick={resetPermissions}
                disabled={saving}
                className="flex items-center space-x-2">

                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </Button>
                  <Button
                size="sm"
                onClick={savePermissions}
                disabled={saving}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700">

                    {saving ?
                <Loader2 className="w-4 h-4 animate-spin" /> :

                <Save className="w-4 h-4" />
                }
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                </div>
              </div>
          }
          </div>
        }

        {/* No User Selected */}
        {!loading && !selectedUserId && showUserSelector &&
        <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Select a user to manage their permissions</p>
          </div>
        }
      </CardContent>
    </Card>);

};

export default RealTimePermissionToggle;