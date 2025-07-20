import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/use-admin-access';
import { AlertTriangle, CheckCircle, User, Shield, RefreshCw } from 'lucide-react';

const AdminAccessDebugger: React.FC = () => {
  const auth = useAuth();
  const adminAccess = useAdminAccess();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await auth.refreshUserData();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: boolean) => {
    return status ?
    <CheckCircle className="h-4 w-4 text-green-600" /> :
    <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Admin Access Debugger
        </h2>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm">

          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authentication Status */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center">
            <User className="h-4 w-4 mr-2" />
            Authentication Status
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Authenticated</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(auth.isAuthenticated)}
                <Badge variant={auth.isAuthenticated ? "default" : "destructive"}>
                  {auth.isAuthenticated ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Initialized</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(auth.isInitialized)}
                <Badge variant={auth.isInitialized ? "default" : "destructive"}>
                  {auth.isInitialized ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Loading</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(!auth.isLoading)}
                <Badge variant={auth.isLoading ? "destructive" : "default"}>
                  {auth.isLoading ? "Loading" : "Ready"}
                </Badge>
              </div>
            </div>

            {auth.authError &&
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Error:</strong> {auth.authError}
                </AlertDescription>
              </Alert>
            }
          </div>
        </div>

        {/* Access Permissions */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Access Permissions
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Admin Access</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(adminAccess.isAdmin)}
                <Badge variant={adminAccess.isAdmin ? "default" : "secondary"}>
                  {adminAccess.isAdmin ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Manager Access</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(adminAccess.isManager)}
                <Badge variant={adminAccess.isManager ? "default" : "secondary"}>
                  {adminAccess.isManager ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">General Access</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(adminAccess.hasAccess)}
                <Badge variant={adminAccess.hasAccess ? "default" : "destructive"}>
                  {adminAccess.hasAccess ? "Granted" : "Denied"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Current Role</span>
              <Badge variant="outline">
                {adminAccess.role}
              </Badge>
            </div>

            {adminAccess.station &&
            <div className="flex items-center justify-between">
                <span className="text-sm">Station</span>
                <Badge variant="outline">
                  {adminAccess.station}
                </Badge>
              </div>
            }
          </div>
        </div>
      </div>

      {/* User Details */}
      {auth.user &&
      <div className="mt-6 pt-6 border-t">
          <h3 className="font-medium mb-3">User Details</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Name:</strong> {auth.user.Name}
              </div>
              <div>
                <strong>Email:</strong> {auth.user.Email}
              </div>
              <div>
                <strong>User ID:</strong> {auth.user.ID}
              </div>
              <div>
                <strong>Created:</strong> {new Date(auth.user.CreateTime).toLocaleDateString()}
              </div>
              {auth.userProfile &&
            <>
                  <div>
                    <strong>Profile ID:</strong> {auth.userProfile.id}
                  </div>
                  <div>
                    <strong>Employee ID:</strong> {auth.userProfile.employee_id || 'Not set'}
                  </div>
                  <div>
                    <strong>Phone:</strong> {auth.userProfile.phone || 'Not set'}
                  </div>
                  <div>
                    <strong>Active:</strong> {auth.userProfile.is_active ? 'Yes' : 'No'}
                  </div>
                </>
            }
            </div>
          </div>
        </div>
      }

      {/* Debug Actions */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="font-medium mb-3">Debug Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => console.log('Auth Context:', auth)}
            variant="outline"
            size="sm">

            Log Auth Context
          </Button>
          <Button
            onClick={() => console.log('Admin Access:', adminAccess)}
            variant="outline"
            size="sm">

            Log Admin Access
          </Button>
          <Button
            onClick={() => console.log('User Profile:', auth.userProfile)}
            variant="outline"
            size="sm">

            Log User Profile
          </Button>
          {auth.authError &&
          <Button
            onClick={auth.clearError}
            variant="outline"
            size="sm">

              Clear Error
            </Button>
          }
        </div>
      </div>

      {/* Warning for Production */}
      <Alert className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> This debugger is for development and troubleshooting purposes. 
          Remove or hide this component in production environments.
        </AlertDescription>
      </Alert>
    </Card>);

};

export default AdminAccessDebugger;