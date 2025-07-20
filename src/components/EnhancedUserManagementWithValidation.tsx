import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Settings } from
"lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  UserValidationDisplay,
  RoleConflictChecker,
  EmailUniquenessChecker,
  AdminProtectionAlert,
  useUserValidation } from
'@/components/UserValidation';

interface User {
  ID: number;
  Name: string;
  Email: string;
  CreateTime: string;
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

interface UserFormData {
  name: string;
  email: string;
  role: string;
  station: string;
  employee_id: string;
  phone: string;
  hire_date: string;
  is_active: boolean;
}

const EnhancedUserManagementWithValidation: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'Employee',
    station: '',
    employee_id: '',
    phone: '',
    hire_date: new Date().toISOString().split('T')[0],
    is_active: true
  });

  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const {
    validateUser,
    validationErrors,
    hasValidationErrors,
    isValidating,
    clearErrors
  } = useUserValidation();

  const roles = ['Administrator', 'Management', 'Employee'];
  const stations = ['MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'];

  // Load users and profiles
  const loadUsers = async () => {
    try {
      setIsLoading(true);

      // Load users
      const usersResponse = await window.ezsite.apis.tablePage('User', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'CreateTime',
        IsAsc: false
      });

      if (usersResponse.error) throw new Error(usersResponse.error);
      setUsers(usersResponse.data?.List || []);

      // Load user profiles
      const profilesResponse = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false
      });

      if (profilesResponse.error) throw new Error(profilesResponse.error);
      setUserProfiles(profilesResponse.data?.List || []);

    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Get user profile by user ID
  const getUserProfile = (userId: number): UserProfile | undefined => {
    return userProfiles.find((profile) => profile.user_id === userId);
  };

  // Handle form submission
  const handleSubmit = async () => {
    const userData = {
      email: formData.email,
      role: formData.role,
      station: formData.station,
      user_id: selectedUser?.ID,
      id: selectedProfile?.id,
      is_active: formData.is_active
    };

    // Validate user data
    const isValid = await validateUser(userData, !!selectedUser);
    if (!isValid) {
      return;
    }

    try {
      setIsLoading(true);

      if (selectedUser) {
        // Update existing user profile
        const updateData = {
          id: selectedProfile!.id,
          role: formData.role,
          station: formData.station,
          employee_id: formData.employee_id,
          phone: formData.phone,
          hire_date: formData.hire_date,
          is_active: formData.is_active
        };

        const response = await window.ezsite.apis.tableUpdate(11725, updateData);
        if (response.error) throw new Error(response.error);

        toast({
          title: "Success",
          description: "User updated successfully in production database"
        });

      } else {
        // Create new user (this would typically involve user registration)
        toast({
          title: "Info",
          description: "User creation requires registration process"
        });
      }

      // Reload data and close dialogs
      await loadUsers();
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      resetForm();

    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save user",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Employee',
      station: '',
      employee_id: '',
      phone: '',
      hire_date: new Date().toISOString().split('T')[0],
      is_active: true
    });
    setSelectedUser(null);
    setSelectedProfile(null);
    clearErrors();
  };

  const handleEdit = (user: User) => {
    const profile = getUserProfile(user.ID);
    if (profile) {
      setSelectedUser(user);
      setSelectedProfile(profile);
      setFormData({
        name: user.Name,
        email: user.Email,
        role: profile.role,
        station: profile.station,
        employee_id: profile.employee_id,
        phone: profile.phone,
        hire_date: profile.hire_date?.split('T')[0] || '',
        is_active: profile.is_active
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = async (user: User) => {
    // Check if user can be deleted (admin protection)
    if (user.Email === 'admin@dfs-portal.com') {
      toast({
        title: "Cannot Delete",
        description: "Admin account cannot be deleted for security reasons",
        variant: "destructive"
      });
      return;
    }

    try {
      const profile = getUserProfile(user.ID);
      if (profile) {
        const response = await window.ezsite.apis.tableDelete(11725, { ID: profile.id });
        if (response.error) throw new Error(response.error);

        toast({
          title: "Success",
          description: "User profile deleted successfully"
        });

        await loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Administrator':return 'destructive';
      case 'Management':return 'default';
      case 'Employee':return 'secondary';
      default:return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Enhanced User Management System
            <Badge variant="outline" className="ml-2">
              With Validation & Protection
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
            <Button variant="outline" onClick={loadUsers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="validation">Validation Tools</TabsTrigger>
          <TabsTrigger value="protection">Admin Protection</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users & Profiles ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ?
              <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading users...
                </div> :

              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Protection</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                    const profile = getUserProfile(user.ID);
                    const isProtected = user.Email === 'admin@dfs-portal.com';

                    return (
                      <TableRow key={user.ID}>
                          <TableCell className="font-medium">{user.Name}</TableCell>
                          <TableCell>{user.Email}</TableCell>
                          <TableCell>
                            {profile ?
                          <Badge variant={getRoleBadgeVariant(profile.role)}>
                                {profile.role}
                              </Badge> :

                          <Badge variant="outline">No Profile</Badge>
                          }
                          </TableCell>
                          <TableCell>{profile?.station || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={profile?.is_active ? "default" : "secondary"}>
                              {profile?.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isProtected &&
                          <Badge variant="destructive" className="gap-1">
                                <Shield className="h-3 w-3" />
                                Protected
                              </Badge>
                          }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(user)}
                              disabled={!profile}>

                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(user)}
                              disabled={!profile || isProtected}>

                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>);

                  })}
                  </TableBody>
                </Table>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tools Tab */}
        <TabsContent value="validation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmailUniquenessChecker />
            <RoleConflictChecker />
          </div>
        </TabsContent>

        {/* Admin Protection Tab */}
        <TabsContent value="protection" className="space-y-4">
          <AdminProtectionAlert
            userEmail="admin@dfs-portal.com"
            showDetails={true} />

        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit User: {selectedUser?.Name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Admin Protection Alert */}
            {selectedUser?.Email === 'admin@dfs-portal.com' &&
            <AdminProtectionAlert
              userEmail={selectedUser.Email}
              showDetails={true} />

            }

            {/* Validation Errors */}
            {hasValidationErrors &&
            <UserValidationDisplay errors={validationErrors} />
            }

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled />

              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={selectedUser?.Email === 'admin@dfs-portal.com'} />

              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                  disabled={selectedUser?.Email === 'admin@dfs-portal.com'}>

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

              <div className="space-y-2">
                <Label htmlFor="station">Station</Label>
                <Select
                  value={formData.station}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, station: value }))}>

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

              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, employee_id: e.target.value }))} />

              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />

              </div>

              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hire_date: e.target.value }))} />

              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Active Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                    disabled={selectedUser?.Email === 'admin@dfs-portal.com'} />

                  <span className="text-sm text-gray-600">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time validation */}
            {formData.role && formData.station &&
            <RoleConflictChecker
              selectedRole={formData.role}
              selectedStation={formData.station}
              excludeUserId={selectedUser?.ID}
              autoCheck={true} />

            }

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}>

                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || isValidating || hasValidationErrors}>

                {isLoading ?
                <RefreshCw className="h-4 w-4 animate-spin mr-2" /> :

                <CheckCircle className="h-4 w-4 mr-2" />
                }
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default EnhancedUserManagementWithValidation;