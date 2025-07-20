import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
  Server } from
'lucide-react';

interface ApiStatusCheckerProps {
  onApiReady?: () => void;
  showFullDetails?: boolean;
}

const ApiStatusChecker: React.FC<ApiStatusCheckerProps> = ({
  onApiReady,
  showFullDetails = false
}) => {
  const [status, setStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [checkCount, setCheckCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [details, setDetails] = useState<any>(null);
  const [isManualChecking, setIsManualChecking] = useState(false);

  const checkApiStatus = async (manual = false) => {
    if (manual) setIsManualChecking(true);
    setStatus('checking');
    setCheckCount((prev) => prev + 1);

    try {
      const checkDetails = {
        windowExists: typeof window !== 'undefined',
        ezsiteExists: !!window.ezsite,
        apisExists: !!window.ezsite?.apis,
        specificApis: {}
      };

      // Check for specific API methods
      if (window.ezsite?.apis) {
        const requiredMethods = [
        'getUserInfo',
        'login',
        'logout',
        'register',
        'sendResetPwdEmail',
        'resetPassword',
        'tablePage',
        'tableCreate',
        'tableUpdate',
        'tableDelete',
        'upload'];


        requiredMethods.forEach((method) => {
          checkDetails.specificApis[method] = typeof window.ezsite?.apis?.[method] === 'function';
        });
      }

      setDetails(checkDetails);

      // Test basic API functionality
      if (window.ezsite?.apis?.getUserInfo) {
        try {
          const testResponse = await window.ezsite.apis.getUserInfo();
          console.log('API test response:', testResponse);

          setStatus('available');
          setErrors([]);
          setLastCheck(new Date());

          if (onApiReady) {
            onApiReady();
          }

          return true;
        } catch (error) {
          console.error('API test failed:', error);
          setErrors([`API test failed: ${error instanceof Error ? error.message : String(error)}`]);
          setStatus('unavailable');
          return false;
        }
      } else {
        setErrors(['Required API methods not found']);
        setStatus('unavailable');
        return false;
      }
    } catch (error) {
      console.error('API status check failed:', error);
      setErrors([`Status check failed: ${error instanceof Error ? error.message : String(error)}`]);
      setStatus('unavailable');
      return false;
    } finally {
      if (manual) setIsManualChecking(false);
    }
  };

  const startPeriodicCheck = () => {
    const maxAttempts = 30;
    const interval = 1000;
    let attempts = 0;

    const intervalId = setInterval(async () => {
      attempts++;

      const isAvailable = await checkApiStatus();

      if (isAvailable || attempts >= maxAttempts) {
        clearInterval(intervalId);
        if (!isAvailable) {
          setStatus('unavailable');
          setErrors([`API failed to become available after ${maxAttempts} attempts`]);
        }
      }
    }, interval);

    return intervalId;
  };

  useEffect(() => {
    // Start checking immediately
    checkApiStatus();

    // If not available, start periodic checking
    if (status === 'unavailable' || status === 'checking') {
      const intervalId = startPeriodicCheck();
      return () => clearInterval(intervalId);
    }
  }, []);

  const handleManualRefresh = () => {
    checkApiStatus(true);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'unavailable':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      case 'available':
        return <Badge variant="default" className="bg-green-600">Available</Badge>;
      case 'unavailable':
        return <Badge variant="destructive">Unavailable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Checking API availability...';
      case 'available':
        return 'All APIs are functioning correctly';
      case 'unavailable':
        return 'APIs are currently unavailable';
      default:
        return 'API status unknown';
    }
  };

  if (!showFullDetails && status === 'available') {
    return null; // Don't show anything if APIs are working and we don't need full details
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          API Status Monitor
          {getStatusIcon()}
        </CardTitle>
        <CardDescription>
          EZSite Authentication & Database APIs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            {getStatusBadge()}
          </div>
          <Button
            onClick={handleManualRefresh}
            disabled={isManualChecking}
            size="sm"
            variant="outline">

            {isManualChecking ?
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> :

            <RefreshCw className="h-4 w-4 mr-2" />
            }
            Refresh
          </Button>
        </div>

        {/* Status Message */}
        <p className="text-sm text-gray-600">{getStatusMessage()}</p>

        {/* Check Details */}
        {lastCheck &&
        <p className="text-xs text-gray-500">
            Last checked: {lastCheck.toLocaleTimeString()} (Attempt #{checkCount})
          </p>
        }

        {/* Errors */}
        {errors.length > 0 &&
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) =>
              <li key={index} className="text-sm">{error}</li>
              )}
              </ul>
            </AlertDescription>
          </Alert>
        }

        {/* Detailed Information */}
        {showFullDetails && details &&
        <div className="space-y-3">
            <div className="border-t pt-3">
              <h4 className="font-medium mb-2">System Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {details.windowExists ?
                <Wifi className="h-4 w-4 text-green-600" /> :

                <WifiOff className="h-4 w-4 text-red-600" />
                }
                  <span>Window Object: {details.windowExists ? 'Available' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {details.ezsiteExists ?
                <Wifi className="h-4 w-4 text-green-600" /> :

                <WifiOff className="h-4 w-4 text-red-600" />
                }
                  <span>EZSite Object: {details.ezsiteExists ? 'Available' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {details.apisExists ?
                <Wifi className="h-4 w-4 text-green-600" /> :

                <WifiOff className="h-4 w-4 text-red-600" />
                }
                  <span>APIs Object: {details.apisExists ? 'Available' : 'Missing'}</span>
                </div>
              </div>
            </div>

            {/* API Methods */}
            {details.specificApis && Object.keys(details.specificApis).length > 0 &&
          <div className="border-t pt-3">
                <h4 className="font-medium mb-2">API Methods</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(details.specificApis).map(([method, available]) =>
              <div key={method} className="flex items-center gap-1">
                      {available ?
                <CheckCircle className="h-3 w-3 text-green-600" /> :

                <XCircle className="h-3 w-3 text-red-600" />
                }
                      <span>{method}</span>
                    </div>
              )}
                </div>
              </div>
          }
          </div>
        }

        {/* Action Buttons for Unavailable State */}
        {status === 'unavailable' &&
        <div className="border-t pt-3 space-y-2">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                If this issue persists, try refreshing the page or contact support.
              </AlertDescription>
            </Alert>
            <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full">

              Refresh Page
            </Button>
          </div>
        }
      </CardContent>
    </Card>);

};

export default ApiStatusChecker;