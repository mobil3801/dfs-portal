import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, ArrowLeft, AlertTriangle, User, RefreshCw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AccessDeniedProps {
  feature?: string;
  requiredRole?: string;
  showBackButton?: boolean;
  className?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  feature = 'this feature',
  requiredRole = 'Administrator',
  showBackButton = true,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();

  const handleRefresh = () => {
    window.location.reload();
  };

  // Debug information for troubleshooting
  const debugInfo = {
    hasUser: !!user,
    userEmail: user?.Email || 'Not logged in',
    hasProfile: !!userProfile,
    currentRole: userProfile?.role || 'No role',
    profileId: userProfile?.ID || 'No ID',
    isLoading: loading
  };

  return (
    <div className={`flex items-center justify-center min-h-64 ${className}`}>
      <Card className="max-w-lg w-full border-2 border-red-200 bg-red-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-100 rounded-full">
              <Shield className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-red-800 flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            Access Denied
          </CardTitle>
          <CardDescription className="text-red-700">
            You don't have permission to access {feature}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-red-100 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">Administrator Access Required</span>
            </div>
            <p className="text-sm text-red-700">
              This feature requires {requiredRole} privileges for security and compliance reasons.
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="destructive" className="w-full py-2">
              Current Role: {userProfile?.role || 'No Role'}
            </Badge>
            <Badge variant="outline" className="w-full py-2 border-red-300 text-red-700">
              Required Role: {requiredRole}
            </Badge>
          </div>

          {/* Debug Information */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-3 w-3" />
              <span className="font-medium">Debug Information:</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-left">
              <span>User:</span>
              <span className={debugInfo.hasUser ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.hasUser ? '✓ Logged in' : '✗ Not logged in'}
              </span>
              <span>Email:</span>
              <span className="truncate">{debugInfo.userEmail}</span>
              <span>Profile:</span>
              <span className={debugInfo.hasProfile ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.hasProfile ? '✓ Found' : '✗ Missing'}
              </span>
              <span>Role:</span>
              <span className={debugInfo.currentRole !== 'No role' ? 'text-blue-600' : 'text-red-600'}>
                {debugInfo.currentRole}
              </span>
              <span>Loading:</span>
              <span className={debugInfo.isLoading ? 'text-yellow-600' : 'text-green-600'}>
                {debugInfo.isLoading ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
            <p className="font-medium mb-1">Need access?</p>
            <p>Contact your system administrator to request {requiredRole} privileges.</p>
            {!userProfile &&
            <p className="mt-2 text-xs">
                Note: Your user profile may not be set up correctly. Try refreshing the page.
              </p>
            }
          </div>

          <div className="flex gap-2 pt-4">
            {showBackButton &&
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1 border-red-300 text-red-700 hover:bg-red-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            }
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Login suggestion if not logged in */}
          {!user &&
          <div className="pt-2">
              <Button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <User className="h-4 w-4 mr-2" />
                Go to Login
              </Button>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

};

export default AccessDenied;