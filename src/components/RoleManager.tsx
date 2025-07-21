import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseAdapter } from '@/services/supabase/supabaseAdapter';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Shield, ShieldCheck, AlertCircle, RefreshCw, Sync } from 'lucide-react';

interface UserWithProfile {
  id: number;
  user_id: number;
  email: string;
  name: string;
  role: string;
  station: string;
  employee_id: string;
  is_active: boolean;
  authMetadataRole?: string;
  syncStatus: 'synced' | 'out_of_sync' | 'unknown';
}

// Available roles based on database enum
const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Administrator', color: 'destructive' },
  { value: 'manager', label: 'Manager', color: 'default' },
  { value: 'employee', label: 'Employee', color: 'secondary' },
  { value: 'viewer', label: 'Viewer', color: 'outline' }
];

/**
 * RoleManager component for assigning and changing user roles
 * Updates both database and Supabase auth metadata for dual role storage
 */
export const RoleManager: React.FC = () => {
  const { toast } = useToast();
  const { user: currentUser, refreshUserData } = useAuth();
  
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Fetch all users with their profiles
   */
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all user profiles
      const profileResponse = await supabaseAdapter.tablePage(11725, {
        PageNo: 1,
        PageSize: 100, // Adjust as needed
        Filters: [] // No filters to get all users
      });

      if (profileResponse.error) {
        throw new Error(`Failed to fetch user profiles: ${profileResponse.error}`);
      }

      const profiles = profileResponse.data?.List || [];

      // Get Supabase auth users to cross-reference
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.warn('Could not fetch auth users for role comparison:', authError);
      }

      // Create auth users lookup for role comparison
      const authUsersLookup = (authUsers?.users || []).reduce((acc, authUser) => {
        if (authUser.email) {
          acc[authUser.email] = authUser.user_metadata?.role || authUser.app_metadata?.role;
        }
        return acc;
      }, {} as Record<string, string>);

      // Combine profile data with auth metadata
      const usersWithProfiles: UserWithProfile[] = profiles.map((profile: any) => {
        const authMetadataRole = profile.email ? authUsersLookup[profile.email] : undefined;
        const syncStatus = authMetadataRole ? 
          (authMetadataRole === profile.role ? 'synced' : 'out_of_sync') : 
          'unknown';

        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email || `User ${profile.user_id}`,
          name: profile.name || profile.email?.split('@')[0] || 'Unknown User',
          role: profile.role,
          station: profile.station,
          employee_id: profile.employee_id,
          is_active: profile.is_active,
          authMetadataRole,
          syncStatus
        };
      });

      setUsers(usersWithProfiles);

    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Update user role in both database and Supabase auth metadata
   */
  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      setIsUpdating(prev => ({ ...prev, [userId]: true }));
      setError(null);

      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        throw new Error('User not found');
      }

      // Update database first
      const updateResponse = await supabaseAdapter.updateRecord(11725, userId, {
        role: newRole
      });

      if (updateResponse.error) {
        throw new Error(`Database update failed: ${updateResponse.error}`);
      }

      // Update Supabase auth metadata if user has email
      if (userToUpdate.email && userToUpdate.email.includes('@')) {
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const authUser = authUsers?.users?.find(u => u.email === userToUpdate.email);

          if (authUser) {
            const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
              authUser.id,
              { user_metadata: { role: newRole } }
            );

            if (authUpdateError) {
              console.warn('Auth metadata update failed:', authUpdateError);
              // Don't throw error, database update succeeded
            }
          } else {
            console.warn('Auth user not found for email:', userToUpdate.email);
          }
        } catch (authErr) {
          console.warn('Auth metadata update error:', authErr);
          // Continue, database update succeeded
        }
      }

      // Refresh users list
      await fetchUsers();

      // Refresh current user data if they updated their own role
      if (userToUpdate.user_id === currentUser?.ID) {
        await refreshUserData();
      }

      toast({
        title: "Role Updated",
        description: `${userToUpdate.name}'s role has been updated to ${newRole}`,
        variant: "default"
      });

    } catch (err) {
      console.error('Error updating user role:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  /**
   * Synchronize role between database and auth metadata
   */
  const synchronizeUserRole = async (userId: number) => {
    try {
      setIsUpdating(prev => ({ ...prev, [userId]: true }));
      
      const userToSync = users.find(u => u.id === userId);
      if (!userToSync) {
        throw new Error('User not found');
      }

      // Use the database role as the source of truth
      await updateUserRole(userId, userToSync.role);

    } catch (err) {
      console.error('Error synchronizing user role:', err);
      toast({
        title: "Sync Failed",
        description: err instanceof Error ? err.message : 'Failed to synchronize role',
        variant: "destructive"
      });
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge variant="default" className="text-green-600 bg-green-100">Synced</Badge>;
      case 'out_of_sync':
        return <Badge variant="destructive">Out of Sync</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = AVAILABLE_ROLES.find(r => r.value === role);
    return (
      <Badge variant={roleConfig?.color as any || 'secondary'}>
        {roleConfig?.label || role}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <CardTitle>Loading Users</CardTitle>
          </div>
          <CardDescription>Fetching user data and role information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Role Management</CardTitle>
          </div>
          <CardDescription>
            Manage user roles and permissions. Changes update both database and authentication metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by name, email, role, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={fetchUsers}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Sync Status</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {searchTerm ? 'No users match your search criteria' : 'No users found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.employee_id && (
                            <div className="text-xs text-muted-foreground">ID: {user.employee_id}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                        {user.authMetadataRole && user.authMetadataRole !== user.role && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Auth: {user.authMetadataRole}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getSyncStatusBadge(user.syncStatus)}
                      </TableCell>
                      <TableCell>{user.station || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                            disabled={isUpdating[user.id]}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {user.syncStatus === 'out_of_sync' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => synchronizeUserRole(user.id)}
                              disabled={isUpdating[user.id]}
                              className="flex items-center gap-1"
                            >
                              <Sync className="h-3 w-3" />
                              Sync
                            </Button>
                          )}

                          {isUpdating[user.id] && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Total Users: {users.length} | Filtered: {filteredUsers.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManager;