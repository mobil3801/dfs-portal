import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users, Shield, User, Plus, Edit, Trash2,
  CheckCircle, XCircle, AlertTriangle, RefreshCw } from
'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedRoleAccess } from '@/hooks/use-enhanced-role-access';
import { toast } from '@/hooks/use-toast';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Management' | 'Employee';
  station: string;
  isActive: boolean;
  employeeId: string;
}

const DEMO_USERS: DemoUser[] = [
{
  id: '1',
  name: 'Admin User',
  email: 'admin@dfsmanager.com',
  role: 'Administrator',
  station: 'ALL',
  isActive: true,
  employeeId: 'EMP001'
},
{
  id: '2',
  name: 'Manager Smith',
  email: 'manager@dfsmanager.com',
  role: 'Management',
  station: 'MOBIL',
  isActive: true,
  employeeId: 'EMP002'
},
{
  id: '3',
  name: 'Employee Jones',
  email: 'employee@dfsmanager.com',
  role: 'Employee',
  station: 'AMOCO ROSEDALE',
  isActive: true,
  employeeId: 'EMP003'
},
{
  id: '4',
  name: 'Manager Davis',
  email: 'manager2@dfsmanager.com',
  role: 'Management',
  station: 'AMOCO BROOKLYN',
  isActive: true,
  employeeId: 'EMP004'
},
{
  id: '5',
  name: 'Employee Wilson',
  email: 'employee2@dfsmanager.com',
  role: 'Employee',
  station: 'MOBIL',
  isActive: false,
  employeeId: 'EMP005'
}];


const UserRoleSwitcher: React.FC = () => {
  const { userProfile } = useAuth();
  const roleAccess = useEnhancedRoleAccess();
  const [users, setUsers] = useState<DemoUser[]>(DEMO_USERS);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<DemoUser>>({
    name: '',
    email: '',
    role: 'Employee',
    station: 'MOBIL',
    isActive: true,
    employeeId: ''
  });

  const handleUserRoleUpdate = async (userId: string, newRole: 'Administrator' | 'Management' | 'Employee') => {
    if (!roleAccess.canAccessAdminArea) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can modify user roles.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // In a real application, this would call the API
      // For demo purposes, we'll simulate the API call
      setUsers((prev) => prev.map((user) =>
      user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: 'Role Updated',
        description: `User role has been changed to ${newRole}.`
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleUserStatusToggle = async (userId: string) => {
    if (!roleAccess.canAccessAdminArea) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can modify user status.',
        variant: 'destructive'
      });
      return;
    }

    setUsers((prev) => prev.map((user) =>
    user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));

    const user = users.find((u) => u.id === userId);
    toast({
      title: 'Status Updated',
      description: `User has been ${user?.isActive ? 'deactivated' : 'activated'}.`
    });
  };

  const handleCreateUser = async () => {
    if (!roleAccess.canAccessAdminArea) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can create users.',
        variant: 'destructive'
      });
      return;
    }

    if (!newUser.name || !newUser.email || !newUser.employeeId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    const user: DemoUser = {
      id: (users.length + 1).toString(),
      name: newUser.name!,
      email: newUser.email!,
      role: newUser.role || 'Employee',
      station: newUser.station || 'MOBIL',
      isActive: newUser.isActive !== false,
      employeeId: newUser.employeeId!
    };

    setUsers((prev) => [...prev, user]);
    setNewUser({
      name: '',
      email: '',
      role: 'Employee',
      station: 'MOBIL',
      isActive: true,
      employeeId: ''
    });
    setIsCreateDialogOpen(false);

    toast({
      title: 'User Created',
      description: `New ${user.role.toLowerCase()} user has been created.`
    });
  };

  const simulateRoleSwitch = (targetUserId: string) => {
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) return;

    toast({
      title: 'Demo Role Switch',
      description: `Simulating login as ${targetUser.name} (${targetUser.role}). In a real system, you would need to log in with different credentials.`,
      variant: 'default'
    });
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

  const getRoleStats = () => {
    const stats = users.reduce((acc, user) => {
      if (user.isActive) {
        acc[user.role] = (acc[user.role] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      Administrator: stats.Administrator || 0,
      Management: stats.Management || 0,
      Employee: stats.Employee || 0,
      Total: Object.values(stats).reduce((sum, count) => sum + count, 0)
    };
  };

  const stats = getRoleStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Role Management & Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.Administrator}</div>
              <div className="text-sm text-gray-600">Administrators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.Management}</div>
              <div className="text-sm text-gray-600">Management</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.Employee}</div>
              <div className="text-sm text-gray-600">Employees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.Total}</div>
              <div className="text-sm text-gray-600">Total Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Demo User Accounts</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="flex items-center gap-2"
                disabled={!roleAccess.canAccessAdminArea}>

                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name || ''}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name" />

                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email || ''}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address" />

                </div>
                <div>
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={newUser.employeeId || ''}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="Enter employee ID" />

                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: any) => setNewUser((prev) => ({ ...prev, role: value }))}>

                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="station">Station</Label>
                  <Select
                    value={newUser.station}
                    onValueChange={(value) => setNewUser((prev) => ({ ...prev, station: value }))}>

                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Stations</SelectItem>
                      <SelectItem value="MOBIL">MOBIL</SelectItem>
                      <SelectItem value="AMOCO ROSEDALE">AMOCO ROSEDALE</SelectItem>
                      <SelectItem value="AMOCO BROOKLYN">AMOCO BROOKLYN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateUser} className="flex-1">
                    Create User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1">

                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) =>
              <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.station}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.isActive ?
                  <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge> :

                  <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                  }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                      value={user.role}
                      onValueChange={(newRole: any) => handleUserRoleUpdate(user.id, newRole)}
                      disabled={!roleAccess.canAccessAdminArea}>

                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Employee">Employee</SelectItem>
                          <SelectItem value="Management">Management</SelectItem>
                          <SelectItem value="Administrator">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUserStatusToggle(user.id)}
                      disabled={!roleAccess.canAccessAdminArea}>

                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => simulateRoleSwitch(user.id)}
                      title="Simulate login as this user">

                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Testing Note:</strong> This is a demo interface for role testing. In a production environment, 
          users would need to log in with their respective credentials to test different access levels. 
          The "Simulate Role Switch" button shows what access each role would have.
        </AlertDescription>
      </Alert>
    </div>);

};

export default UserRoleSwitcher;