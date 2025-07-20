import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Settings,
  Eye,
  EyeOff } from
'lucide-react';

interface NavigationHealthCheckProps {
  showDebugInfo?: boolean;
}

const NavigationHealthCheck: React.FC<NavigationHealthCheckProps> = ({
  showDebugInfo = false
}) => {
  const {
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    userProfile,
    isAdmin,
    isManager,
    authError
  } = useAuth();
  const location = useLocation();
  const [showDetails, setShowDetails] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [issues, setIssues] = useState<string[]>([]);

  // Check navigation health
  useEffect(() => {
    const checkHealth = () => {
      const detectedIssues: string[] = [];
      let status: 'healthy' | 'warning' | 'error' = 'healthy';

      // Check authentication issues
      if (!isInitialized) {
        detectedIssues.push('Authentication system not initialized');
        status = 'error';
      } else if (isLoading) {
        detectedIssues.push('Still loading authentication data');
        status = 'warning';
      } else if (!isAuthenticated) {
        detectedIssues.push('User not authenticated');
        status = 'error';
      } else if (!user) {
        detectedIssues.push('User data not loaded');
        status = 'error';
      } else if (!userProfile) {
        detectedIssues.push('User profile not loaded');
        status = 'warning';
      }

      // Check for auth errors
      if (authError) {
        detectedIssues.push(`Authentication error: ${authError}`);
        status = 'error';
      }

      // Check API availability
      if (typeof window !== 'undefined' && !window.ezsite?.apis) {
        detectedIssues.push('EZSite APIs not available');
        status = 'error';
      }

      setIssues(detectedIssues);
      setHealthStatus(status);
    };

    checkHealth();
  }, [isInitialized, isLoading, isAuthenticated, user, userProfile, authError]);

  const getStatusIcon = () => {
    switch (healthStatus) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'Navigation System Healthy';
      case 'warning':
        return 'Navigation System Warning';
      case 'error':
        return 'Navigation System Error';
      default:
        return 'Navigation System Unknown';
    }
  };

  // Don't show if not in debug mode and system is healthy
  if (!showDebugInfo && healthStatus === 'healthy') {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Status Alert */}
      {healthStatus !== 'healthy' &&
      <Alert variant={healthStatus === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Navigation issues detected. {issues.length} issue{issues.length !== 1 ? 's' : ''} found.
              </span>
              <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}>

                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? 'Hide' : 'Details'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      }

      {/* Debug Info Card */}
      {showDebugInfo &&
      <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {getStatusIcon()}
              <span className={getStatusColor()}>{getStatusText()}</span>
              <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}>

                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          {showDetails &&
        <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant={healthStatus === 'healthy' ? 'default' : 'destructive'} className="ml-2">
                      {healthStatus}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Page:</span>
                    <span className="ml-2 text-gray-600">{location.pathname}</span>
                  </div>
                  <div>
                    <span className="font-medium">User:</span>
                    <span className="ml-2 text-gray-600">{user?.Name || 'None'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Role:</span>
                    <Badge variant="outline" className="ml-2">
                      {isAdmin() ? 'Admin' : isManager() ? 'Manager' : 'Employee'}
                    </Badge>
                  </div>
                </div>

                {issues.length > 0 &&
            <div>
                    <h4 className="font-medium text-sm mb-2">Issues Found:</h4>
                    <ul className="text-sm space-y-1">
                      {issues.map((issue, index) =>
                <li key={index} className="flex items-start gap-2">
                          <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-red-600">{issue}</span>
                        </li>
                )}
                    </ul>
                  </div>
            }

                <div className="flex gap-2 pt-2">
                  <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}>

                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                  {isAdmin() &&
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/admin/navigation-debug', '_blank')}>

                      <Settings className="h-4 w-4 mr-2" />
                      Debug Tools
                    </Button>
              }
                </div>
              </div>
            </CardContent>
        }
        </Card>
      }
    </div>);

};

export default NavigationHealthCheck;