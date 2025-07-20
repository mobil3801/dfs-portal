import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Shield,
  UserCheck,
  Search,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Settings,
  Eye,
  Edit,
  Plus,
  Database,
  Star } from
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

// Simplified role definitions with clear descriptions and icons
const ROLE_DEFINITIONS = {
  'Super Admin': {
    icon: Shield,
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Complete system access - Can manage everything including users, settings, and all data',
    permissions: ['All Pages', 'All Operations', 'User Management', 'System Settings', 'Security'],
    level: 5
  },
  'Manager': {
    icon: UserCheck,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Full operational access - Can view, create, edit all business data (except admin features)',
    permissions: ['Sales Reports', 'Products', 'Employees', 'Orders', 'Inventory', 'Print & Export'],
    level: 4
  },
  'Supervisor': {
    icon: Star,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Department oversight - Can manage specific areas and view reports',
    permissions: ['View All', 'Edit Some', 'Create Reports', 'Approve Requests'],
    level: 3
  },
  'Employee': {
    icon: Users,
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Daily operations - Can handle routine tasks like sales, basic inventory, and delivery',
    permissions: ['Sales Entry', 'View Products', 'Basic Reports', 'Delivery Records'],
    level: 2
  },
  'Read Only': {
    icon: Eye,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'View only access - Can see reports and data but cannot make changes',
    permissions: ['View Reports', 'View Data', 'Export Only'],
    level: 1
  }
};

// Quick assignment templates for common scenarios
const QUICK_TEMPLATES = {
  'New Employee': {
    description: 'Perfect for new staff members who need basic access',
    role: 'Employee',
    icon: Plus
  },
  'Department Head': {
    description: 'For department managers who oversee operations',
    role: 'Manager',
    icon: UserCheck
  },
  'Auditor/Viewer': {
    description: 'For external auditors or read-only access',
    role: 'Read Only',
    icon: Eye
  },
  'System Admin': {
    description: 'For IT administrators who need full access',
    role: 'Super Admin',
    icon: Shield
  }
};

interface SimpleRoleAssignmentProps {
  trigger?: React.ReactNode;
  selectedUserId?: number;
  onRoleAssigned?: () => void;
}

const SimpleRoleAssignment: React.FC<SimpleRoleAssignmentProps> = ({
  trigger,
  selectedUserId,
  onRoleAssigned
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        setSelectedUser(user);
        setSelectedRole(user.role);
      }
    }
  }, [selectedUserId, users]);

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

  const assignRole = async (userId: number, newRole: string) => {
    try {
      // Get the role template permissions
      const roleTemplate = getRolePermissions(newRole);

      const { error } = await window.ezsite.apis.tableUpdate(11725, {
        id: userId,
        role: newRole,
        detailed_permissions: JSON.stringify(roleTemplate)
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  };

  const handleSingleAssignment = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a user and role",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await assignRole(selectedUser.id, selectedRole);

      toast({
        title: "Success",
        description: `${selectedUser.employee_id} assigned ${selectedRole} role successfully`
      });

      // Update local state
      setUsers((prev) => prev.map((user) =>
      user.id === selectedUser.id ?
      { ...user, role: selectedRole, detailed_permissions: JSON.stringify(getRolePermissions(selectedRole)) } :
      user
      ));

      onRoleAssigned?.();
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to assign role: ${error}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAssignment = async () => {
    if (selectedUsers.length === 0 || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select users and a role",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      let successCount = 0;
      for (const userId of selectedUsers) {
        await assignRole(userId, selectedRole);
        successCount++;
      }

      toast({
        title: "Success",
        description: `${successCount} users assigned ${selectedRole} role successfully`
      });

      // Update local state
      setUsers((prev) => prev.map((user) =>
      selectedUsers.includes(user.id) ?
      { ...user, role: selectedRole, detailed_permissions: JSON.stringify(getRolePermissions(selectedRole)) } :
      user
      ));

      setSelectedUsers([]);
      setBulkMode(false);
      onRoleAssigned?.();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to assign roles: ${error}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getRolePermissions = (role: string) => {
    // This creates the detailed permissions based on role
    // Simplified version that maps to the existing system
    const basePermissions = {
      'Super Admin': {
        dashboard: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        products: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        employees: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        sales_reports: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        vendors: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        orders: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        licenses: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        salary: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        inventory: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        delivery: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        settings: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        user_management: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        site_management: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        system_logs: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        security_settings: { view: true, create: true, edit: true, delete: true, export: true, print: true }
      },
      'Manager': {
        dashboard: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        products: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        employees: { view: true, create: true, edit: true, delete: false, export: true, print: true },
        sales_reports: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        vendors: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        orders: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        licenses: { view: true, create: false, edit: false, delete: false, export: true, print: true },
        salary: { view: true, create: true, edit: true, delete: false, export: true, print: true },
        inventory: { view: true, create: true, edit: true, delete: false, export: true, print: true },
        delivery: { view: true, create: true, edit: true, delete: true, export: true, print: true },
        settings: { view: true, create: false, edit: true, delete: false, export: false, print: false },
        user_management: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        site_management: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        system_logs: { view: true, create: false, edit: false, delete: false, export: true, print: false },
        security_settings: { view: false, create: false, edit: false, delete: false, export: false, print: false }
      },
      'Employee': {
        dashboard: { view: true, create: false, edit: false, delete: false, export: false, print: false },
        products: { view: true, create: false, edit: false, delete: false, export: false, print: false },
        employees: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        sales_reports: { view: true, create: true, edit: true, delete: false, export: false, print: true },
        vendors: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        orders: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        licenses: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        salary: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        inventory: { view: true, create: false, edit: false, delete: false, export: false, print: false },
        delivery: { view: true, create: true, edit: true, delete: false, export: false, print: true },
        settings: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        user_management: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        site_management: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        system_logs: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        security_settings: { view: false, create: false, edit: false, delete: false, export: false, print: false }
      },
      'Read Only': {
        dashboard: { view: true, create: false, edit: false, delete: false, export: true, print: true },
        products: { view: true, create: false, edit: false, delete: false, export: true, print: true },
        employees: { view: true, create: false, edit: false, delete: false, export: true, print: true },
        sales_reports: { view: true, create: false, edit: false, delete: false, export: true, print: true },
        vendors: { view: true, create: false, edit: false, delete: false, export: true, print: true },
        orders: { view: true, create: false, edit: false, delete: false, export: true, print: true },
        licenses: { view: true, create: false, edit: false, delete: false, export: true, print: true },
        salary: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        inventory: { view: true, create: false, edit: false, delete: false, export: true, print: true },
        delivery: { view: true, create: false, edit: false, delete: false, export: true, print: true },
        settings: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        user_management: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        site_management: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        system_logs: { view: false, create: false, edit: false, delete: false, export: false, print: false },
        security_settings: { view: false, create: false, edit: false, delete: false, export: false, print: false }
      }
    };

    return basePermissions[role as keyof typeof basePermissions] || basePermissions['Employee'];
  };

  const filteredUsers = users.filter((user) =>
  user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
  user.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
  user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const defaultTrigger =
  <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
      <Shield className="w-4 h-4 mr-2" />
      Easy Role Assignment
    </Button>;


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Simple Role Assignment</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Easy Mode
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* Quick Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>Quick Assignment Templates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(QUICK_TEMPLATES).map(([name, template]) =>
                  <Button
                    key={name}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center space-y-2"
                    onClick={() => setSelectedRole(template.role)}>

                      <template.icon className="w-5 h-5 text-blue-600" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{name}</div>
                        <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                      </div>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Role Definitions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Available Roles</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(ROLE_DEFINITIONS).map(([role, definition]) =>
                  <div
                    key={role}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRole === role ?
                    'border-blue-500 bg-blue-50' :
                    'border-gray-200 hover:border-gray-300'}`
                    }
                    onClick={() => setSelectedRole(role)}>

                      <div className="flex items-start space-x-3">
                        <definition.icon className="w-6 h-6 text-gray-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{role}</h3>
                            <Badge className={definition.color}>
                              Level {definition.level}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{definition.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {definition.permissions.map((permission, index) =>
                          <Badge key={index} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                          )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5" />
                    <span>Select Users</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkMode(!bulkMode)}>

                      {bulkMode ? 'Single Mode' : 'Bulk Mode'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUsers}
                      disabled={loading}>

                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ?
                <div className="text-center py-8">Loading users...</div> :

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10" />

                    </div>

                    {/* User List */}
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredUsers.map((user) =>
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      bulkMode ?
                      selectedUsers.includes(user.id) ?
                      'border-blue-500 bg-blue-50' :
                      'border-gray-200 hover:border-gray-300' :
                      selectedUser?.id === user.id ?
                      'border-blue-500 bg-blue-50' :
                      'border-gray-200 hover:border-gray-300'}`
                      }
                      onClick={() => {
                        if (bulkMode) {
                          setSelectedUsers((prev) =>
                          prev.includes(user.id) ?
                          prev.filter((id) => id !== user.id) :
                          [...prev, user.id]
                          );
                        } else {
                          setSelectedUser(user);
                          setSelectedRole(user.role);
                        }
                      }}>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {bulkMode &&
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {}} />

                          }
                              <div>
                                <div className="font-medium">{user.employee_id}</div>
                                <div className="text-sm text-gray-500">{user.phone}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={ROLE_DEFINITIONS[user.role as keyof typeof ROLE_DEFINITIONS]?.color || 'bg-gray-100 text-gray-800'}>
                                {user.role}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">{user.station}</div>
                            </div>
                          </div>
                        </div>
                    )}
                    </div>

                    {filteredUsers.length === 0 &&
                  <div className="text-center py-8 text-gray-500">
                        No users found matching your search
                      </div>
                  }
                  </div>
                }
              </CardContent>
            </Card>

            {/* Assignment Summary & Action */}
            {(selectedUser && !bulkMode || selectedUsers.length > 0 && bulkMode) && selectedRole &&
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span>Assignment Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <strong>Selected Role:</strong> {selectedRole}
                        </div>
                        <div>
                          <strong>Target Users:</strong> {bulkMode ? `${selectedUsers.length} users` : selectedUser?.employee_id}
                        </div>
                        <div>
                          <strong>Permissions:</strong> {ROLE_DEFINITIONS[selectedRole as keyof typeof ROLE_DEFINITIONS]?.description}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="mt-4 flex space-x-3">
                    <Button
                    onClick={bulkMode ? handleBulkAssignment : handleSingleAssignment}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 flex-1">

                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Assigning...' : `Assign ${selectedRole} Role`}
                    </Button>
                    <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      setSelectedUsers([]);
                      setSelectedRole('');
                    }}>

                      Clear Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            }
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>);

};

export default SimpleRoleAssignment;