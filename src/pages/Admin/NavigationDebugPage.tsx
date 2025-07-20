import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/use-admin-access';
import EnhancedNavigationDebugger from '@/components/EnhancedNavigationDebugger';
import AccessDenied from '@/components/AccessDenied';

const NavigationDebugPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { hasAdminAccess } = useAdminAccess();

  // Check admin access
  if (!hasAdminAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Navigation Debug Center</h1>
          <p className="text-gray-600 mt-2">
            Diagnose and troubleshoot navigation menu visibility issues
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Admin Tool
        </Badge>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This tool helps diagnose navigation menu issues. Use the tabs below to analyze authentication status, 
          access control, and menu item visibility. If users report missing navigation items, this tool will 
          help identify the root cause.
        </AlertDescription>
      </Alert>

      <EnhancedNavigationDebugger />

      <Card>
        <CardHeader>
          <CardTitle>Quick Fixes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded">
              <h4 className="font-medium text-blue-900">Navigation Not Showing</h4>
              <p className="text-blue-800">
                Check if user is authenticated and has proper role assignments. 
                Verify authentication state in the Status tab.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <h4 className="font-medium text-green-900">Missing Admin Items</h4>
              <p className="text-green-800">
                Ensure user profile has 'Administrator' or 'Admin' role in the database.
                Check user information in the Status tab.
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <h4 className="font-medium text-yellow-900">Loading Issues</h4>
              <p className="text-yellow-800">
                If navigation is stuck loading, check browser console for errors.
                Try refreshing user data using the Refresh button.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default NavigationDebugPage;