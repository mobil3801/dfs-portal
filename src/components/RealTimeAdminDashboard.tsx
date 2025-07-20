import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Database,
  Activity,
  Shield,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  Settings,
  Clock,
  Building2,
  Phone,
  Calendar,
  Globe,
  Loader2 } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import CreateUserDialog from '@/components/CreateUserDialog';

interface User {
  ID: number;
  Name: string;
  Email: string;
  CreateTime: string;
  Roles: string;
}

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

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalProfiles: number;
  administrators: number;
  managers: number;
  employees: number;
  lastUpdate: string;
}

const RealTimeAdminDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalProfiles: 0,
    administrators: 0,
    managers: 0,
    employees: 0,
    lastUpdate: new Date().toISOString()
  });
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStation, setFilterStation] = useState('All');

  const roles = ['Administrator', 'Management', 'Employee'];
  const stations = ['ALL', 'MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'];

  const [editFormData, setEditFormData] = useState({
    role: '',
    station: '',
    employee_id: '',
    phone: '',
    hire_date: '',
    is_active: true
  });

  // Real-time data fetching
  useEffect(() => {
    fetchAllData();

    // Set up real-time refresh (every 10 seconds)
    const interval = setInterval(() => {
      fetchAllData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    if (!loading) setRefreshing(true);

    try {
      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 500,
        OrderByField: "id",
        IsAsc: false,
        Filters: []
      });

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError}`);
      }

      const profiles = profilesData?.List || [];
      setUserProfiles(profiles);

      // Calculate statistics
      const activeUsers = profiles.filter((p) => p.is_active).length;
      const inactiveUsers = profiles.filter((p) => !p.is_active).length;
      const administrators = profiles.filter((p) => p.role === 'Administrator').length;
      const managers = profiles.filter((p) => p.role === 'Management').length;
      const employees = profiles.filter((p) => p.role === 'Employee').length;

      setStats({
        totalUsers: profiles.length,
        activeUsers,
        inactiveUsers,
        totalProfiles: profiles.length,
        administrators,
        managers,
        employees,
        lastUpdate: new Date().toISOString()
      });

      console.log('Real-time data updated:', {
        profiles: profiles.length,
        active: activeUsers,
        inactive: inactiveUsers
      });

    } catch (error) {
      console.error('Error fetching real-time data:', error);
      toast({
        title: "Database Error",
        description: `Failed to fetch real-time data: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    toast({
      title: "Success",
      description: "Real-time data refreshed successfully"
    });
  };

  const handleEditUser = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setEditFormData({
      role: profile.role,
      station: profile.station,
      employee_id: profile.employee_id,
      phone: profile.phone,
      hire_date: profile.hire_date?.split('T')[0] || '',
      is_active: profile.is_active
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedProfile) return;

    try {
      const { error } = await window.ezsite.apis.tableUpdate(11725, {
        id: selectedProfile.id,
        ...editFormData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully in production database"
      });

      setEditDialogOpen(false);
      setSelectedProfile(null);
      fetchAllData(); // Refresh data
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: `Failed to update user: ${error}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (profile: UserProfile) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const { error } = await window.ezsite.apis.tableDelete(11725, { id: profile.id });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully from production database"
      });

      fetchAllData(); // Refresh data
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error}`,
        variant: "destructive"
      });
    }
  };

  const filteredProfiles = userProfiles.filter((profile) => {
    const matchesSearch =
    profile.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'All' || profile.role === filterRole;
    const matchesStation = filterStation === 'All' || profile.station === filterStation;

    return matchesSearch && matchesRole && matchesStation;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Administrator':return 'bg-red-100 text-red-800';
      case 'Management':return 'bg-blue-100 text-blue-800';
      case 'Employee':return 'bg-green-100 text-green-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  const getStationBadgeColor = (station: string) => {
    switch (station) {
      case 'ALL':return 'bg-purple-100 text-purple-800';
      case 'MOBIL':return 'bg-blue-100 text-blue-800';
      case 'AMOCO ROSEDALE':return 'bg-orange-100 text-orange-800';
      case 'AMOCO BROOKLYN':return 'bg-teal-100 text-teal-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-semibold">Loading Real-Time Admin Dashboard...</p>
          <p className="text-sm text-gray-600">Connecting to production database</p>
        </div>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Real-Time Admin Dashboard</h1>
            <p className="opacity-90">
              Administrator: {user?.Name} • Live Database Integration
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Production Database Connected</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Last Updated</p>
            <p className="text-sm font-mono">{new Date(stats.lastUpdate).toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Real-time Status & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Connected & Active</span>
            </div>
            <Progress value={100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Auto-Refresh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Every 10 seconds</span>
            </div>
            <div className="mt-2 flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Real-time updates</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex-1">

                <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateUserDialogOpen(true)}
                className="flex-1">

                <UserPlus className="w-4 h-4 mr-1" />
                Add User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <AlertCircle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.inactiveUsers}</p>
              <p className="text-sm text-gray-600">Inactive</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Shield className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.administrators}</p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Settings className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.managers}</p>
              <p className="text-sm text-gray-600">Managers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.employees}</p>
              <p className="text-sm text-gray-600">Employees</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Database className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalProfiles}</p>
              <p className="text-sm text-gray-600">Profiles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Real-Time User Management</span>
            <Badge className="bg-green-100 text-green-800">
              <Database className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} />

            </div>
            <div>
              <Label>Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Roles</SelectItem>
                  {roles.map((role) =>
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Station</Label>
              <Select value={filterStation} onValueChange={setFilterStation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Stations</SelectItem>
                  {stations.map((station) =>
                  <SelectItem key={station} value={station}>{station}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('All');
                  setFilterStation('All');
                }}>

                Clear Filters
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) =>
                <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.employee_id}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(profile.role)}>
                        {profile.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStationBadgeColor(profile.station)}>
                        {profile.station === 'ALL' ?
                      <><Globe className="w-3 h-3 mr-1" />ALL</> :

                      <><Building2 className="w-3 h-3 mr-1" />{profile.station}</>
                      }
                      </Badge>
                    </TableCell>
                    <TableCell>{profile.phone}</TableCell>
                    <TableCell>
                      {profile.hire_date ? new Date(profile.hire_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {profile.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(profile)}>

                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(profile)}
                        className="text-red-600 hover:text-red-700">

                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredProfiles.length === 0 &&
          <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found matching your criteria</p>
            </div>
          }
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <CreateUserDialog
        isOpen={isCreateUserDialogOpen}
        onClose={() => setIsCreateUserDialogOpen(false)}
        onUserCreated={() => {
          fetchAllData();
          toast({
            title: "Success",
            description: "User created successfully in production database"
          });
        }} />


      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) =>
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Station</Label>
                <Select value={editFormData.station} onValueChange={(value) => setEditFormData({ ...editFormData, station: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) =>
                    <SelectItem key={station} value={station}>{station}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employee ID</Label>
                <Input
                  value={editFormData.employee_id}
                  onChange={(e) => setEditFormData({ ...editFormData, employee_id: e.target.value })} />

              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} />

              </div>
            </div>
            <div>
              <Label>Hire Date</Label>
              <Input
                type="date"
                value={editFormData.hire_date}
                onChange={(e) => setEditFormData({ ...editFormData, hire_date: e.target.value })} />

            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editFormData.is_active}
                onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })} />

              <Label htmlFor="is_active">Active User</Label>
            </div>
            <Button onClick={handleUpdateUser} className="w-full">
              Update User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default RealTimeAdminDashboard;