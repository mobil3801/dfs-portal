import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  Settings,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Edit,
  Trash2,
  Download,
  Printer,
  Loader2 } from
'lucide-react';
import RealTimePermissionToggle from './RealTimePermissionToggle';

interface ProductPermissionManagerProps {
  className?: string;
}

interface UserProfile {
  ID: number;
  user_id: number;
  role: string;
  station: string;
  employee_id: string;
  detailed_permissions: string;
  is_active: boolean;
}

interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  print: boolean;
}

const ProductPermissionManager: React.FC<ProductPermissionManagerProps> = ({
  className = ''
}) => {
  const { userProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userPermissions, setUserPermissions] = useState<{[key: number]: ModulePermissions;}>({});

  // Check if current user is admin
  const isAdmin = userProfile?.role === 'Administrator';

  useEffect(() => {
    if (isExpanded && isAdmin) {
      loadUsers();
    }
  }, [isExpanded, isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage('11725', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'ID',
        IsAsc: true,
        Filters: [
        { name: 'is_active', op: 'Equal', value: true }]

      });

      if (error) throw error;

      const userList = data?.List || [];
      setUsers(userList);

      // Load permissions for all users
      const permissionsMap: {[key: number]: ModulePermissions;} = {};

      for (const user of userList) {
        try {
          let userPerms = {};
          if (user.detailed_permissions) {
            userPerms = JSON.parse(user.detailed_permissions);
          }

          const productPermissions = userPerms.products || {
            view: true,
            create: false,
            edit: false,
            delete: false,
            export: false,
            print: false
          };

          permissionsMap[user.user_id] = productPermissions;
        } catch (parseError) {
          console.warn(`Failed to parse permissions for user ${user.user_id}`);
          permissionsMap[user.user_id] = {
            view: true,
            create: false,
            edit: false,
            delete: false,
            export: false,
            print: false
          };
        }
      }

      setUserPermissions(permissionsMap);

    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users and permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permissions: ModulePermissions) => {
    if (selectedUserId) {
      setUserPermissions((prev) => ({
        ...prev,
        [selectedUserId]: permissions
      }));
    }
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

  const getPermissionSummary = (permissions: ModulePermissions) => {
    const enabled = Object.entries(permissions).filter(([_, value]) => value).length;
    const total = Object.keys(permissions).length;
    return { enabled, total };
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Management':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Employee':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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
                Administrator access required to manage user permissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <div className={className}>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Shield className="w-5 h-5" />
              <span>Product Permission Management</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Real-Time
              </Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2">

              <Settings className="w-4 h-4" />
              <span>{isExpanded ? 'Hide' : 'Manage'} Permissions</span>
              {isExpanded ?
              <ChevronUp className="w-4 h-4" /> :

              <ChevronDown className="w-4 h-4" />
              }
            </Button>
          </div>
        </CardHeader>

        {isExpanded &&
        <CardContent className="pt-0 space-y-6">
            {/* User Selection and Permission Toggles */}
            <div className="space-y-4">
              <RealTimePermissionToggle
              userId={selectedUserId || undefined}
              module="products"
              onPermissionChange={handlePermissionChange}
              showUserSelector={true} />

            </div>

            {/* Users Overview */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Users Overview</span>
              </h4>
              
              {loading ?
            <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Loading users...</span>
                </div> :

            <div className="grid gap-3">
                  {users.map((user) => {
                const permissions = userPermissions[user.user_id] || {};
                const { enabled, total } = getPermissionSummary(permissions);

                return (
                  <div
                    key={user.ID}
                    className={`
                          p-4 border rounded-lg transition-all duration-200 cursor-pointer
                          ${selectedUserId === user.user_id ?
                    'border-blue-300 bg-blue-50 shadow-sm' :
                    'border-gray-200 bg-white hover:border-gray-300'}
                        `
                    }
                    onClick={() => setSelectedUserId(
                      selectedUserId === user.user_id ? null : user.user_id
                    )}>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {user.employee_id?.substring(0, 2) || 'U'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Employee ID: {user.employee_id}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge
                              variant="outline"
                              className={`text-xs ${getRoleColor(user.role)}`}>

                                  {user.role}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {user.station}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                Permissions: {enabled}/{total}
                              </p>
                              <div className="flex items-center space-x-1 mt-1">
                                {(Object.keys(permissions) as Array<keyof ModulePermissions>).
                            slice(0, 4).
                            map((permType) => {
                              const Icon = getPermissionIcon(permType);
                              const isEnabled = permissions[permType];
                              return (
                                <div
                                  key={permType}
                                  className={`
                                          w-6 h-6 rounded-full flex items-center justify-center
                                          ${isEnabled ?
                                  'bg-green-100 text-green-600' :
                                  'bg-gray-100 text-gray-400'}
                                        `
                                  }
                                  title={`${permType}: ${isEnabled ? 'Enabled' : 'Disabled'}`}>

                                        <Icon className="w-3 h-3" />
                                      </div>);

                            })
                            }
                                {enabled > 4 &&
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                                    +{enabled - 4}
                                  </div>
                            }
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0">
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
                        </div>
                        
                        {selectedUserId === user.user_id &&
                    <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Click permission toggles above to modify access</p>
                            <div className="flex flex-wrap gap-1">
                              {(Object.entries(permissions) as Array<[keyof ModulePermissions, boolean]>).
                        map(([permission, enabled]) =>
                        <Badge
                          key={permission}
                          variant={enabled ? "default" : "secondary"}
                          className="text-xs">

                                    {permission}: {enabled ? 'Yes' : 'No'}
                                  </Badge>
                        )
                        }
                            </div>
                          </div>
                    }
                      </div>);

              })}
                </div>
            }
            </div>
          </CardContent>
        }
      </Card>
    </div>);

};

export default ProductPermissionManager;