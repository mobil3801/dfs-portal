import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

const AdminUserSetup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@dfs-portal.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const { toast } = useToast();

  // Check if admin user already exists
  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    setCheckingAdmin(true);
    try {
      const profileResponse = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
        { name: 'role', op: 'Equal', value: 'Admin' }]

      });

      if (profileResponse.data?.List?.length > 0) {
        setHasAdmin(true);
        setMessage('Admin user already exists in the system');
        setMessageType('success');
      } else {
        // Also check for "Administrator" role
        const adminResponse = await window.ezsite.apis.tablePage(11725, {
          PageNo: 1,
          PageSize: 1,
          Filters: [
          { name: 'role', op: 'Equal', value: 'Administrator' }]

        });

        if (adminResponse.data?.List?.length > 0) {
          setHasAdmin(true);
          setMessage('Administrator user already exists in the system');
          setMessageType('success');
        } else {
          setMessage('No admin user found. Please create one to access admin features.');
          setMessageType('error');
        }
      }
    } catch (error) {
      console.error('Error checking admin user:', error);
      setMessage('Error checking admin user status');
      setMessageType('error');
    } finally {
      setCheckingAdmin(false);
    }
  };

  const createAdminUser = async () => {
    if (!adminPassword || adminPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // First register the user
      const registerResponse = await window.ezsite.apis.register({
        email: adminEmail,
        password: adminPassword
      });

      if (registerResponse.error) {
        throw new Error(registerResponse.error);
      }

      // Wait a moment for user to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get the user info to find the user ID
      const loginResponse = await window.ezsite.apis.login({
        email: adminEmail,
        password: adminPassword
      });

      if (loginResponse.error) {
        throw new Error('Failed to login after registration: ' + loginResponse.error);
      }

      // Get user info to get the ID
      const userInfoResponse = await window.ezsite.apis.getUserInfo();

      if (userInfoResponse.error || !userInfoResponse.data) {
        throw new Error('Failed to get user info after login');
      }

      const userId = userInfoResponse.data.ID;

      // Create admin profile
      const profileResponse = await window.ezsite.apis.tableCreate(11725, {
        user_id: userId,
        role: 'Admin',
        station: 'ALL',
        employee_id: 'ADMIN-001',
        phone: '',
        hire_date: new Date().toISOString(),
        is_active: true,
        detailed_permissions: JSON.stringify({
          users: { view: true, create: true, edit: true, delete: true },
          products: { view: true, create: true, edit: true, delete: true },
          sales: { view: true, create: true, edit: true, delete: true },
          employees: { view: true, create: true, edit: true, delete: true },
          vendors: { view: true, create: true, edit: true, delete: true },
          orders: { view: true, create: true, edit: true, delete: true },
          licenses: { view: true, create: true, edit: true, delete: true },
          salary: { view: true, create: true, edit: true, delete: true },
          inventory: { view: true, create: true, edit: true, delete: true },
          delivery: { view: true, create: true, edit: true, delete: true },
          settings: { view: true, create: true, edit: true, delete: true }
        })
      });

      if (profileResponse.error) {
        throw new Error('Failed to create admin profile: ' + profileResponse.error);
      }

      setMessage('Admin user created successfully! You can now login with admin privileges.');
      setMessageType('success');
      setHasAdmin(true);

      toast({
        title: 'Success',
        description: 'Admin user created successfully'
      });

      // Logout after creating admin to allow login with new credentials
      await window.ezsite.apis.logout();

    } catch (error) {
      console.error('Error creating admin user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create admin user';
      setMessage(errorMessage);
      setMessageType('error');

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 mx-auto text-blue-600 mb-2" />
          <CardTitle>Checking Admin Status</CardTitle>
          <CardDescription>Please wait while we check for admin users...</CardDescription>
        </CardHeader>
      </Card>);

  }

  if (hasAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-600 mb-2" />
          <CardTitle>Admin User Ready</CardTitle>
          <CardDescription>The admin user is set up and ready to use</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {message}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button
              onClick={checkAdminExists}
              variant="outline"
              className="mr-2">

              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <Shield className="w-12 h-12 mx-auto text-blue-600 mb-2" />
        <CardTitle>Create Admin User</CardTitle>
        <CardDescription>
          Set up the first admin user to access the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message &&
        <Alert className={`${messageType === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {messageType === 'success' ?
          <CheckCircle2 className="h-4 w-4 text-green-600" /> :

          <AlertCircle className="h-4 w-4 text-red-600" />
          }
            <AlertDescription className={messageType === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message}
            </AlertDescription>
          </Alert>
        }

        <div className="space-y-2">
          <Label htmlFor="adminEmail">Admin Email</Label>
          <Input
            id="adminEmail"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@dfs-portal.com"
            disabled={isLoading} />

        </div>

        <div className="space-y-2">
          <Label htmlFor="adminPassword">Admin Password</Label>
          <Input
            id="adminPassword"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Enter secure password"
            disabled={isLoading}
            minLength={6} />

          <p className="text-sm text-muted-foreground">
            Password must be at least 6 characters long
          </p>
        </div>

        <Button
          onClick={createAdminUser}
          disabled={isLoading || !adminEmail || !adminPassword}
          className="w-full">

          {isLoading ?
          <>
              <UserPlus className="mr-2 h-4 w-4 animate-spin" />
              Creating Admin User...
            </> :

          <>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Admin User
            </>
          }
        </Button>

        <div className="text-center">
          <Button
            onClick={checkAdminExists}
            variant="link"
            disabled={isLoading}
            className="text-sm">

            Check Again
          </Button>
        </div>
      </CardContent>
    </Card>);

};

export default AdminUserSetup;