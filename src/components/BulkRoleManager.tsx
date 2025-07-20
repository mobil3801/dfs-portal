import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  Filter,
  UserCheck,
  RefreshCw,
  ArrowRight,
  Zap,
  Target } from
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

const ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Employee', 'Read Only'];

const ROLE_COLORS = {
  'Super Admin': 'bg-red-100 text-red-800',
  'Manager': 'bg-blue-100 text-blue-800',
  'Supervisor': 'bg-purple-100 text-purple-800',
  'Employee': 'bg-green-100 text-green-800',
  'Read Only': 'bg-gray-100 text-gray-800'
};

interface BulkRoleManagerProps {
  trigger?: React.ReactNode;
  onRolesAssigned?: () => void;
}

const BulkRoleManager: React.FC<BulkRoleManagerProps> = ({
  trigger,
  onRolesAssigned
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [targetRole, setTargetRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

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

  const stations = Array.from(new Set(users.map((u) => u.station))).filter(Boolean);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
    user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStation = stationFilter === 'All' || user.station === stationFilter;
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;

    return matchesSearch && matchesStation && matchesRole;
  });

  const handleUserToggle = (userId: number) => {
    setSelectedUsers((prev) =>
    prev.includes(userId) ?
    prev.filter((id) => id !== userId) :
    [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  const getRolePermissions = (role: string) => {
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

  const handleBulkAssignment = async () => {
    if (selectedUsers.length === 0 || !targetRole) {
      toast({
        title: "Error",
        description: "Please select users and a target role",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const rolePermissions = getRolePermissions(targetRole);
      let successCount = 0;
      let failedCount = 0;

      for (const userId of selectedUsers) {
        try {
          const { error } = await window.ezsite.apis.tableUpdate(11725, {
            id: userId,
            role: targetRole,
            detailed_permissions: JSON.stringify(rolePermissions)
          });

          if (error) {
            console.error(`Failed to update user ${userId}:`, error);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Error updating user ${userId}:`, error);
          failedCount++;
        }
      }

      // Update local state
      setUsers((prev) => prev.map((user) =>
      selectedUsers.includes(user.id) ?
      { ...user, role: targetRole, detailed_permissions: JSON.stringify(rolePermissions) } :
      user
      ));

      if (successCount > 0) {
        toast({
          title: "Bulk Assignment Complete",
          description: `Successfully assigned ${targetRole} role to ${successCount} users${failedCount > 0 ? `. ${failedCount} failed.` : ''}`
        });
      }

      if (failedCount === 0) {
        setSelectedUsers([]);
        setTargetRole('');
        onRolesAssigned?.();
      }

    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to process bulk assignment: ${error}`,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getSelectedRoleSummary = () => {
    const roleCount: Record<string, number> = {};
    selectedUsers.forEach((userId) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        roleCount[user.role] = (roleCount[user.role] || 0) + 1;
      }
    });
    return roleCount;
  };

  const defaultTrigger =
  <Button className="bg-orange-600 hover:bg-orange-700">
      <Zap className="w-4 h-4 mr-2" />
      Bulk Role Manager
    </Button>;


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-orange-600" />
            <span>Bulk Role Manager</span>
            <Badge className="bg-orange-100 text-orange-800">
              Mass Assignment
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filter Users</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10" />

                  </div>
                  <Select value={stationFilter} onValueChange={setStationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Stations</SelectItem>
                      {stations.map((station) =>
                      <SelectItem key={station} value={station}>{station}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by current role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Roles</SelectItem>
                      {ROLES.map((role) =>
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStationFilter('All');
                      setRoleFilter('All');
                    }}>

                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Target Role Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Target Role</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3">
                  {ROLES.map((role) =>
                  <Button
                    key={role}
                    variant={targetRole === role ? "default" : "outline"}
                    className={`h-auto p-3 ${targetRole === role ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    onClick={() => setTargetRole(role)}>

                      <div className="text-center">
                        <div className="font-medium">{role}</div>
                      </div>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User List */}
            <Card className="flex-1 overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5" />
                    <span>Select Users ({filteredUsers.length})</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {selectedUsers.length} selected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}>

                      {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUsers}
                      disabled={loading}>

                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                {loading ?
                <div className="text-center py-8">Loading users...</div> :

                <div className="h-full overflow-y-auto">
                    <div className="space-y-2">
                      {filteredUsers.map((user) =>
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedUsers.includes(user.id) ?
                      'border-blue-500 bg-blue-50' :
                      'border-gray-200 hover:border-gray-300'}`
                      }
                      onClick={() => handleUserToggle(user.id)}>

                          <div className="flex items-center space-x-3">
                            <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => {}} />

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{user.employee_id}</div>
                                  <div className="text-sm text-gray-500">{user.phone} • {user.station}</div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge className={ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] || 'bg-gray-100 text-gray-800'}>
                                    {user.role}
                                  </Badge>
                                  {targetRole && targetRole !== user.role &&
                              <>
                                      <ArrowRight className="w-3 h-3 text-gray-400" />
                                      <Badge className={ROLE_COLORS[targetRole as keyof typeof ROLE_COLORS]}>
                                        {targetRole}
                                      </Badge>
                                    </>
                              }
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                    )}
                    </div>
                  </div>
                }
              </CardContent>
            </Card>

            {/* Assignment Summary */}
            {selectedUsers.length > 0 && targetRole &&
            <Card>
                <CardContent className="pt-6">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <strong>Ready to assign {targetRole} role to {selectedUsers.length} users</strong>
                        </div>
                        <div className="text-sm text-gray-600">
                          Current roles: {Object.entries(getSelectedRoleSummary()).map(([role, count]) =>
                        `${count} ${role}`
                        ).join(', ')}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                  <div className="mt-4 flex space-x-3">
                    <Button
                    onClick={handleBulkAssignment}
                    disabled={processing}
                    className="bg-orange-600 hover:bg-orange-700 flex-1">

                      <Zap className="w-4 h-4 mr-2" />
                      {processing ? `Processing ${selectedUsers.length} users...` : `Assign ${targetRole} to All Selected`}
                    </Button>
                    <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUsers([]);
                      setTargetRole('');
                    }}>

                      Clear Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>);

};

export default BulkRoleManager;