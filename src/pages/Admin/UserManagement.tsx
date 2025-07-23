import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useBatchSelection } from '@/hooks/use-batch-selection';
import BatchActionBar from '@/components/BatchActionBar';
import BatchDeleteDialog from '@/components/BatchDeleteDialog';
import BatchEditDialog from '@/components/BatchEditDialog';
import RealTimePermissionManager from '@/components/RealTimePermissionManager';
import ComprehensivePermissionDialog from '@/components/ComprehensivePermissionDialog';
import AccessDenied from '@/components/AccessDenied';
import useAdminAccess from '@/hooks/use-admin-access';
import CreateUserDialog from '@/components/CreateUserDialog';
import SimpleRoleAssignment from '@/components/SimpleRoleAssignment';
import BulkRoleManager from '@/components/BulkRoleManager';
import RoleOverview from '@/components/RoleOverview';
import {
  Users,
  Plus,
  UserPlus,
  Edit3,
  Trash2,
  Search,
  UserCheck,
  Shield,
  Settings,
  RefreshCw,
  Database } from
'lucide-react';

interface UserProfile {
  id: string; // UUID
  user_id: string; // UUID
  role: string;
  station_access: string[]; // Array of station UUIDs
  employee_id: string;
  phone: string;
  hire_date: string;
  is_active: boolean;
  // detailed_permissions is not a real column, removing for now
}

const UserManagement: React.FC = () => {
  const { isAdmin } = useAdminAccess();
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStation, setSelectedStation] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBatchEditDialogOpen, setIsBatchEditDialogOpen] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const { toast } = useToast();

  // Batch selection hook
  const batchSelection = useBatchSelection<UserProfile>();

  // Batch edit form data
  const [batchEditData, setBatchEditData] = useState({
    role: '',
    station: '',
    is_active: true
  });

  const roles = ['admin', 'manager', 'employee'];
  const [stations, setStations] = useState<any[]>([]);

  interface FormData {
    user_id: number;
    role: string;
    station_access: string[];
    employee_id: string;
    phone: string;
    hire_date: string;
    is_active: boolean;
  }

  const [formData, setFormData] = useState<FormData>({
    user_id: 0,
    role: 'employee',
    station_access: [],
    employee_id: '',
    phone: '',
    hire_date: '',
    is_active: true
  });

  // Generate random user ID
  const generateRandomUserId = () => {
    const randomId = Math.floor(Math.random() * 1000000) + 100000; // 6-digit random number
    return randomId;
  };

  useEffect(() => {
    fetchData();
    fetchStations();
    // Set up real-time refresh interval
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);
const fetchStations = async () => {
      try {
        const { data, error } = await window.ezsite.apis.tablePage(12599, {
          PageNo: 1,
          PageSize: 100, // Assuming max 100 stations, adjust if needed
        });
        if (error) {
          throw new Error(error);
        }
        setStations(data?.List || []);
      } catch (error) {
        console.error('Error fetching stations:', error);
        toast({
          title: "Database Error",
          description: `Failed to fetch stations`,
          variant: "destructive"
        });
      }
    };

  const fetchData = async () => {
    setLoading(true);
    await fetchUserProfiles();
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast({
      title: "Success",
      description: "Real-time data refreshed successfully"
    });
  };


  const fetchUserProfiles = async () => {
    try {
      
      const { data, error } = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "id",
        IsAsc: false,
        Filters: []
      });

      if (error) {
        console.error('Database API returned error:', error);
        throw error;
      }

      
      setUserProfiles(data?.List || []);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      toast({
        title: "Database Error",
        description: `Failed to fetch user profiles: ${error}`,
        variant: "destructive"
      });
      setUserProfiles([]);
    }
  };


  const handleCreateProfile = async () => {
    if (!formData.employee_id || !formData.phone) {
      toast({
        title: "Validation Error",
        description: "Employee ID and Phone are required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      
      const { error } = await window.ezsite.apis.tableCreate(11725, formData);
      if (error) throw error;

      toast({
        title: "Success",
        description: "User profile created successfully"
      });

      setIsAddDialogOpen(false);
      setFormData({
        user_id: generateRandomUserId(),
        role: 'employee',
        station: 'MOBIL',
        employee_id: '',
        phone: '',
        hire_date: '',
        is_active: true
      });
      fetchUserProfiles();
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Database Error",
        description: `Failed to create user profile: ${error}`,
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedUserProfile) return;

    if (!formData.employee_id || !formData.phone) {
      toast({
        title: "Validation Error",
        description: "Employee ID and Phone are required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      
      const { error } = await window.ezsite.apis.tableUpdate(11725, {
        id: selectedUserProfile.id,
        ...formData
      });
      if (error) throw error;

      toast({
        title: "Success",
        description: "User profile updated successfully"
      });

      setIsEditDialogOpen(false);
      setSelectedUserProfile(null);
      fetchUserProfiles();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Database Error",
        description: `Failed to update user profile: ${error}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    if (!confirm('Are you sure you want to delete this user profile? This action cannot be undone.')) return;

    try {
      
      const { error } = await window.ezsite.apis.tableDelete(11725, { id: profileId });
      if (error) throw error;

      toast({
        title: "Success",
        description: "User profile deleted successfully"
      });

      fetchUserProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Database Error",
        description: `Failed to delete user profile: ${error}`,
        variant: "destructive"
      });
    }
  };

  // Batch operations with real database operations
  const handleBatchEdit = () => {
    const selectedData = batchSelection.getSelectedData(filteredProfiles, (profile) => profile.id);
    if (selectedData.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select profiles to edit",
        variant: "destructive"
      });
      return;
    }
    setIsBatchEditDialogOpen(true);
  };

  const handleBatchDelete = () => {
    const selectedData = batchSelection.getSelectedData(filteredProfiles, (profile) => profile.id);
    if (selectedData.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select profiles to delete",
        variant: "destructive"
      });
      return;
    }
    setIsBatchDeleteDialogOpen(true);
  };

  const confirmBatchEdit = async () => {
    setBatchActionLoading(true);
    try {
      const selectedData = batchSelection.getSelectedData(filteredProfiles, (profile) => profile.id);
      

      const updates = selectedData.map((profile) => ({
        id: profile.id,
        ...(batchEditData.role && { role: batchEditData.role }),
        ...(batchEditData.station_access && { station_access: batchEditData.station_access }),
        is_active: batchEditData.is_active
      }));

      for (const update of updates) {
        const { error } = await window.ezsite.apis.tableUpdate(11725, update);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Updated ${selectedData.length} user profiles successfully`
      });

      setIsBatchEditDialogOpen(false);
      batchSelection.clearSelection();
      fetchUserProfiles();
    } catch (error) {
      console.error('Error in batch edit:', error);
      toast({
        title: "Database Error",
        description: `Failed to update profiles: ${error}`,
        variant: "destructive"
      });
    } finally {
      setBatchActionLoading(false);
    }
  };

  const confirmBatchDelete = async () => {
    setBatchActionLoading(true);
    try {
      const selectedData = batchSelection.getSelectedData(filteredProfiles, (profile) => profile.id);
      

      for (const profile of selectedData) {
        const { error } = await window.ezsite.apis.tableDelete(11725, { id: profile.id });
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Deleted ${selectedData.length} user profiles successfully`
      });

      setIsBatchDeleteDialogOpen(false);
      batchSelection.clearSelection();
      fetchUserProfiles();
    } catch (error) {
      console.error('Error in batch delete:', error);
      toast({
        title: "Database Error",
        description: `Failed to delete profiles: ${error}`,
        variant: "destructive"
      });
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleEditProfile = (profile: UserProfile) => {
    setSelectedUserProfile(profile);
    setFormData({
      user_id: profile.user_id,
      role: profile.role,
      station_access: profile.station_access || [],
      employee_id: profile.employee_id,
      phone: profile.phone,
      hire_date: profile.hire_date || '',
      is_active: profile.is_active
    });
    setIsEditDialogOpen(true);
  };

  const filteredProfiles = userProfiles.filter((profile) => {
    // Enhanced helper function to safely convert to string and handle all edge cases
    const safeString = (value: any): string => {
      if (value === null || value === undefined || value === '') return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      if (typeof value === 'boolean') return String(value);
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };

    // Safe toLowerCase function that handles undefined/null values
    const safeToLowerCase = (value: any): string => {
      const str = safeString(value);
      return str ? str.toLowerCase() : '';
    };

    // Safe search term handling
    const searchTermLower = searchTerm ? searchTerm.toLowerCase() : '';

    const matchesSearch = !searchTermLower || (
      safeToLowerCase(profile.employee_id).includes(searchTermLower) ||
      safeToLowerCase(profile.phone).includes(searchTermLower)
    );
    
    const matchesRole = selectedRole === 'All' || profile.role === selectedRole;
    // Temporarily disable station filtering until it's properly implemented
    // const matchesStation = selectedStation === 'All' || profile.station_access?.includes(selectedStation);
    const matchesStation = true;

    return matchesSearch && matchesRole && matchesStation;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':return 'bg-red-100 text-red-800';
      case 'manager':return 'bg-blue-100 text-blue-800';
      case 'employee':return 'bg-green-100 text-green-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  const getStationBadgeColor = (stationName: string | undefined | null) => {
    if (!stationName || typeof stationName !== 'string') return 'bg-gray-100 text-gray-800';
    const station = stations.find(s => s?.name === stationName);
    if (!station || !station.id) return 'bg-gray-100 text-gray-800';

    // Logic to return a color based on station name/id - can be expanded
    const hash = String(station.id).split('').reduce((acc: number, char: string) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-teal-100 text-teal-800',
      'bg-pink-100 text-pink-800',
    ];
    return colors[Math.abs(hash) % colors.length];
  };


  // Check admin access first
  if (!isAdmin) {
    return (
      <AccessDenied
        feature="User Management"
        requiredRole="Administrator" />);


  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading real-time user management...</div>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Real-Time User Management</h1>
            <p className="text-sm text-green-600 font-medium">✓ Production Database Connected - Live Data & Permissions</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Database className="w-3 h-3 mr-1" />
            {userProfiles.length} Users
          </Badge>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            className="flex items-center space-x-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </Button>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profiles" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>User Profiles</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Real-Time Permission Management</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-6">
          {/* Easy Role Assignment Section */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Shield className="w-5 h-5" />
                <span>Easy Role Assignment</span>
                <Badge className="bg-blue-100 text-blue-800">Simplified</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <SimpleRoleAssignment
                  onRoleAssigned={() => {
                    fetchUserProfiles();
                    toast({
                      title: "Success",
                      description: "Role assignment completed successfully"
                    });
                  }} />

                <BulkRoleManager
                  onRolesAssigned={() => {
                    fetchUserProfiles();
                    toast({
                      title: "Success",
                      description: "Bulk role assignment completed successfully"
                    });
                  }} />

                <RoleOverview />
                <div className="text-sm text-blue-700 max-w-md">
                  Use these simplified tools to quickly assign roles without dealing with complex permission settings.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <Button
              onClick={() => setIsCreateUserDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Create New User
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              if (open) {
                // Generate new random user ID when opening dialog
                const newUserId = generateRandomUserId();
                setFormData((prev) => ({ ...prev, user_id: newUserId }));
              }
              setIsAddDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User Profile Only
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh]">
                <DialogHeader>
                  <DialogTitle>Create User Profile</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(85vh-120px)] pr-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user_id">User ID (Auto-generated)</Label>
                      <div className="relative">
                        <Input
                          id="user_id"
                          type="number"
                          value={formData.user_id}
                          readOnly
                          disabled
                          className="bg-gray-50 text-gray-700 cursor-not-allowed"
                          placeholder="Auto-generated ID" />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200"
                          onClick={() => {
                            const newUserId = generateRandomUserId();
                            setFormData((prev) => ({ ...prev, user_id: newUserId }));
                            toast({
                              title: "Success",
                              description: `New User ID generated: ${newUserId}`
                            });
                          }}
                          title="Generate new random User ID">
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        User ID is automatically generated. Click the refresh icon to generate a new one.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
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
                      <Label htmlFor="station">Station</Label>
                      <Select onValueChange={(value) => setFormData({ ...formData, station_access: [value] })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a station" />
                        </SelectTrigger>
                        <SelectContent>
                          {stations.map((station) =>
                          <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="employee_id">Employee ID *</Label>
                      <Input
                        id="employee_id"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        placeholder="Enter employee ID"
                        required />

                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter phone number"
                        required />

                    </div>
                    <div>
                      <Label htmlFor="hire_date">Hire Date</Label>
                      <Input
                        id="hire_date"
                        type="date"
                        value={formData.hire_date}
                        onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} />

                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />

                      <Label htmlFor="is_active">Active User</Label>
                    </div>
                    <Button onClick={handleCreateProfile} className="w-full">
                      Create Profile
                    </Button>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{userProfiles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Administrators</p>
                    <p className="text-2xl font-bold">
                      {userProfiles.filter((p) => p.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <UserCheck className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold">
                      {userProfiles.filter((p) => p.is_active).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Database className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Managers</p>
                    <p className="text-2xl font-bold">
                      {userProfiles.filter((p) => p.role === 'manager').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by employee ID or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10" />

                </div>
                
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    {roles.map((role) =>
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by station" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Stations</SelectItem>
                    {stations.map((station) =>
                    <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRole('All');
                    setSelectedStation('All');
                  }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Batch Action Bar */}
          <BatchActionBar
            selectedCount={batchSelection.selectedCount}
            onBatchEdit={handleBatchEdit}
            onBatchDelete={handleBatchDelete}
            onClearSelection={batchSelection.clearSelection}
            isLoading={batchActionLoading} />


          {/* User Profiles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Real-Time User Profiles ({filteredProfiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={filteredProfiles.length > 0 && batchSelection.selectedCount === filteredProfiles.length}
                          onCheckedChange={() => batchSelection.toggleSelectAll(filteredProfiles, (profile) => profile.id)}
                          aria-label="Select all profiles" />
                
                      </TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Station Access</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.length === 0 ?
                    <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-3">
                            {userProfiles.length === 0 ?
                          <>
                                <Database className="w-12 h-12 text-gray-300" />
                                <div>
                                  <p className="text-gray-500 font-medium">No User Profiles in Database</p>
                                  <p className="text-sm text-gray-400">Create your first user profile to get started</p>
                                </div>
                                <Button
                              onClick={() => setIsCreateUserDialogOpen(true)}
                              className="bg-blue-600 hover:bg-blue-700">
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Create First User
                                </Button>
                              </> :

                          <>
                                <Search className="w-12 h-12 text-gray-300" />
                                <div>
                                  <p className="text-gray-500 font-medium">No Profiles Match Current Filters</p>
                                  <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                                </div>
                                <Button
                              variant="outline"
                              onClick={() => {
                                setSearchTerm('');
                                setSelectedRole('All');
                                setSelectedStation('All');
                              }}>
                                  Clear All Filters
                                </Button>
                              </>
                          }
                          </div>
                        </TableCell>
                      </TableRow> :

                    filteredProfiles.map((profile) =>
                    <TableRow key={profile.id} className={batchSelection.isSelected(profile.id) ? "bg-blue-50" : ""}>
                          <TableCell>
                            <Checkbox
                          checked={batchSelection.isSelected(profile.id)}
                          onCheckedChange={() => batchSelection.toggleItem(profile.id)}
                          aria-label={`Select profile ${profile.employee_id}`} />

                          </TableCell>
                          <TableCell className="font-medium">{profile.employee_id}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(profile.role)}>
                              {profile.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStationBadgeColor(profile.station_access?.[0])}>
                              {Array.isArray(profile.station_access) && profile.station_access.length > 0 
                                ? profile.station_access.join(', ') 
                                : 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{profile.phone}</TableCell>
                          <TableCell>{profile.hire_date ? new Date(profile.hire_date).toLocaleDateString() : 'N/A'}</TableCell>
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
                            onClick={() => handleEditProfile(profile)}>
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <SimpleRoleAssignment
                            selectedUserId={profile.id}
                            trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              title="Quick Role Assignment">
                                    <Shield className="w-4 h-4" />
                                  </Button>
                            }
                            onRoleAssigned={() => {
                              fetchUserProfiles();
                              toast({
                                title: "Success",
                                description: "Role updated successfully"
                              });
                            }} />

                              <ComprehensivePermissionDialog
                            selectedUserId={profile.id}
                            trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700"
                              title="Advanced Permission Management">
                                    <Settings className="w-4 h-4" />
                                  </Button>
                            } />

                              <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                    )
                    }
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit User Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
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
                    <Label htmlFor="edit_station">Station</Label>
                    <Select value={formData.station} onValueChange={(value) => setFormData({ ...formData, station: value })}>
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
                    <Label htmlFor="edit_employee_id">Employee ID *</Label>
                    <Input
                      id="edit_employee_id"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      required />

                  </div>
                  <div>
                    <Label htmlFor="edit_phone">Phone *</Label>
                    <Input
                      id="edit_phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required />

                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_hire_date">Hire Date</Label>
                  <Input
                    id="edit_hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} />

                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />

                  <Label htmlFor="edit_is_active">Active User</Label>
                </div>
                <Button onClick={handleUpdateProfile} className="w-full">
                  Update Profile
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="permissions">
          <RealTimePermissionManager />
        </TabsContent>
      </Tabs>

      {/* Batch Edit Dialog */}
      <BatchEditDialog
        isOpen={isBatchEditDialogOpen}
        onClose={() => setIsBatchEditDialogOpen(false)}
        onSave={confirmBatchEdit}
        selectedCount={batchSelection.selectedCount}
        isLoading={batchActionLoading}
        itemName="user profiles">
        <div className="space-y-4">
          <div>
            <Label htmlFor="batch_role">Role</Label>
            <Select value={batchEditData.role} onValueChange={(value) => setBatchEditData({ ...batchEditData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role to update" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Keep existing roles</SelectItem>
                {roles.map((role) =>
                <SelectItem key={role} value={role}>{role}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="batch_station">Station</Label>
            <Select onValueChange={(value) => setBatchEditData({ ...batchEditData, station_access: [value] })}>
              <SelectTrigger>
                <SelectValue placeholder="Select station to update" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Keep existing stations</SelectItem>
                {stations.map((station) =>
                <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="batch_is_active"
              checked={batchEditData.is_active}
              onCheckedChange={(checked) => setBatchEditData({ ...batchEditData, is_active: checked as boolean })} />

            <Label htmlFor="batch_is_active">Set all selected users as active</Label>
          </div>
        </div>
      </BatchEditDialog>

      {/* Batch Delete Dialog */}
      <BatchDeleteDialog
        isOpen={isBatchDeleteDialogOpen}
        onClose={() => setIsBatchDeleteDialogOpen(false)}
        onConfirm={confirmBatchDelete}
        selectedCount={batchSelection.selectedCount}
        isLoading={batchActionLoading}
        itemName="user profiles"
        selectedItems={batchSelection.getSelectedData(filteredProfiles, (profile) => profile.id).map((profile) => ({
          id: profile.id,
          name: `${profile.employee_id} - ${profile.role}`
        }))} />


      {/* Create New User Dialog */}
      <CreateUserDialog
        isOpen={isCreateUserDialogOpen}
        onClose={() => setIsCreateUserDialogOpen(false)}
        onUserCreated={() => {
          fetchData(); // Refresh user profiles
          toast({
            title: "Success",
            description: "New user account and profile created successfully in production database"
          });
        }} />

    </div>);

};

export default UserManagement;