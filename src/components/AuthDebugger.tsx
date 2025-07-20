import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/use-admin-access';
import { AlertTriangle, CheckCircle, User, Shield, Settings } from 'lucide-react';

const AuthDebugger: React.FC = () => {
  const auth = useAuth();
  const adminAccess = useAdminAccess();
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Only render for authenticated admin users
  if (!auth.isAuthenticated || !auth.user || !adminAccess.isAdmin) {
    return null;
  }

  const runAuthTest = async () => {
    try {
      setTestResult('Testing authentication...');

      // Test getUserInfo API
      const userInfoResponse = await window.ezsite.apis.getUserInfo();
      console.log('Auth Test - getUserInfo:', userInfoResponse);

      if (userInfoResponse.error) {
        setTestResult(`❌ Auth Test Failed: ${userInfoResponse.error}`);
        return;
      }

      if (!userInfoResponse.data) {
        setTestResult('⚠️ Auth Test: No user data (not authenticated)');
        return;
      }

      // Test profile fetch
      const profileResponse = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "user_id", op: "Equal", value: userInfoResponse.data.ID }]
      });

      console.log('Auth Test - Profile:', profileResponse);

      setTestResult('✅ Auth Test: All systems functional');
    } catch (error) {
      console.error('Auth test error:', error);
      setTestResult(`❌ Auth Test Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getStatusIcon = (status: boolean | undefined) => {
    return status ?
    <CheckCircle className="h-4 w-4 text-green-600" /> :
    <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (status: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="ml-2">
        {status ? trueText : falseText}
      </Badge>);
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg">
          <Settings className="h-4 w-4 mr-2" />
          Auth Debug
        </Button>
      </div>);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="p-4 shadow-lg bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Auth Debugger
          </h3>
          <Button
            onClick={() => setIsExpanded(false)}
            variant="ghost"
            size="sm">
            ×
          </Button>
        </div>

        <div className="space-y-3">
          {/* Authentication Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Authenticated</span>
            <div className="flex items-center">
              {getStatusIcon(auth.isAuthenticated)}
              {getStatusBadge(auth.isAuthenticated, "Yes", "No")}
            </div>
          </div>

          {/* Loading Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Loading</span>
            <div className="flex items-center">
              {getStatusIcon(!auth.isLoading)}
              {getStatusBadge(!auth.isLoading, "Ready", "Loading")}
            </div>
          </div>

          {/* Initialization Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Initialized</span>
            <div className="flex items-center">
              {getStatusIcon(auth.isInitialized)}
              {getStatusBadge(auth.isInitialized, "Yes", "No")}
            </div>
          </div>

          {/* User Info */}
          {auth.user &&
          <div className="border-t pt-3">
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">User Details</span>
              </div>
              <div className="text-xs space-y-1">
                <div><strong>Name:</strong> {auth.user.Name}</div>
                <div><strong>Email:</strong> {auth.user.Email}</div>
                <div><strong>ID:</strong> {auth.user.ID}</div>
              </div>
            </div>
          }

          {/* Role Info */}
          {auth.userProfile &&
          <div className="border-t pt-3">
              <div className="text-xs space-y-1">
                <div><strong>Role:</strong> {auth.userProfile.role}</div>
                <div><strong>Station:</strong> {auth.userProfile.station || 'Not assigned'}</div>
                <div className="flex items-center">
                  <strong>Admin Access:</strong>
                  {getStatusBadge(adminAccess.isAdmin, "Yes", "No")}
                </div>
                <div className="flex items-center">
                  <strong>Manager Access:</strong>
                  {getStatusBadge(adminAccess.isManager, "Yes", "No")}
                </div>
              </div>
            </div>
          }

          {/* Error Display */}
          {auth.authError &&
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {auth.authError}
              </AlertDescription>
            </Alert>
          }

          {/* Test Results */}
          {testResult &&
          <Alert>
              <AlertDescription className="text-xs">
                {testResult}
              </AlertDescription>
            </Alert>
          }

          {/* Action Buttons */}
          <div className="border-t pt-3 space-y-2">
            <Button
              onClick={runAuthTest}
              variant="outline"
              size="sm"
              className="w-full text-xs">
              Run Auth Test
            </Button>
            <Button
              onClick={auth.refreshUserData}
              variant="outline"
              size="sm"
              className="w-full text-xs">
              Refresh User Data
            </Button>
            {auth.authError &&
            <Button
              onClick={auth.clearError}
              variant="outline"
              size="sm"
              className="w-full text-xs">
                Clear Error
              </Button>
            }
          </div>
        </div>
      </Card>
    </div>);
};

export default AuthDebugger;