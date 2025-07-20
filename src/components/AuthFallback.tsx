import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import ApiStatusChecker from '@/components/ApiStatusChecker';
import {
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  Loader2,
  CheckCircle,
  XCircle } from
'lucide-react';

interface AuthFallbackProps {
  error?: string;
  onRetry?: () => void;
  showDiagnostic?: boolean;
}

const AuthFallback: React.FC<AuthFallbackProps> = ({
  error,
  onRetry,
  showDiagnostic = true
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRetryEnabled, setAutoRetryEnabled] = useState(true);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (autoRetryEnabled && retryCount < 3) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleRetry();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [autoRetryEnabled, retryCount]);

  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    try {
      if (onRetry) {
        await onRetry();
      } else {
        // Default retry behavior
        window.location.reload();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
      setCountdown(10);
    }
  };

  const handleManualRefresh = () => {
    window.location.reload();
  };

  const handleGoToLogin = () => {
    window.location.href = '/login';
  };

  const handleGoToDiagnostic = () => {
    window.location.href = '/admin/auth-diagnostic';
  };

  const getErrorType = (errorMessage?: string) => {
    if (!errorMessage) return 'unknown';

    if (errorMessage.includes('not available') || errorMessage.includes('failed to load')) {
      return 'api_unavailable';
    }
    if (errorMessage.includes('not authenticated')) {
      return 'not_authenticated';
    }
    if (errorMessage.includes('failed to initialize')) {
      return 'initialization_failed';
    }
    return 'unknown';
  };

  const errorType = getErrorType(error);

  const getErrorIcon = () => {
    switch (errorType) {
      case 'api_unavailable':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'not_authenticated':
        return <Shield className="h-12 w-12 text-yellow-500" />;
      case 'initialization_failed':
        return <AlertTriangle className="h-12 w-12 text-orange-500" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'api_unavailable':
        return 'Authentication Service Unavailable';
      case 'not_authenticated':
        return 'Authentication Required';
      case 'initialization_failed':
        return 'System Initialization Failed';
      default:
        return 'Authentication Error';
    }
  };

  const getErrorDescription = () => {
    switch (errorType) {
      case 'api_unavailable':
        return 'The authentication service is currently unavailable. This might be a temporary issue.';
      case 'not_authenticated':
        return 'You need to be authenticated to access this system.';
      case 'initialization_failed':
        return 'The system failed to initialize properly. This might indicate a configuration issue.';
      default:
        return 'An unexpected authentication error occurred.';
    }
  };

  const getSuggestedActions = () => {
    switch (errorType) {
      case 'api_unavailable':
        return [
        { label: 'Wait for Auto-Retry', action: () => {}, disabled: true },
        { label: 'Manual Retry', action: handleRetry },
        { label: 'Refresh Page', action: handleManualRefresh },
        { label: 'View Diagnostic', action: handleGoToDiagnostic }];

      case 'not_authenticated':
        return [
        { label: 'Go to Login', action: handleGoToLogin },
        { label: 'Refresh Page', action: handleManualRefresh }];

      case 'initialization_failed':
        return [
        { label: 'Retry Initialization', action: handleRetry },
        { label: 'Refresh Page', action: handleManualRefresh },
        { label: 'View Diagnostic', action: handleGoToDiagnostic }];

      default:
        return [
        { label: 'Retry', action: handleRetry },
        { label: 'Refresh Page', action: handleManualRefresh },
        { label: 'Go to Login', action: handleGoToLogin }];

    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Main Error Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {getErrorIcon()}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {getErrorTitle()}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {getErrorDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Details */}
            {error &&
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Technical Details:</strong> {error}
                </AlertDescription>
              </Alert>
            }

            {/* Retry Status */}
            {autoRetryEnabled && retryCount < 3 && errorType === 'api_unavailable' &&
            <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Auto-retry in {countdown} seconds (Attempt {retryCount + 1}/3)</span>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoRetryEnabled(false)}>

                      Cancel Auto-Retry
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            }

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getSuggestedActions().map((action, index) =>
              <Button
                key={index}
                onClick={action.action}
                disabled={action.disabled || isRetrying}
                variant={index === 0 ? "default" : "outline"}
                className="flex items-center gap-2">

                  {isRetrying && action.label.includes('Retry') ?
                <Loader2 className="h-4 w-4 animate-spin" /> :
                action.label.includes('Diagnostic') ?
                <ExternalLink className="h-4 w-4" /> :

                <RefreshCw className="h-4 w-4" />
                }
                  {action.label}
                </Button>
              )}
            </div>

            {/* Retry Statistics */}
            {retryCount > 0 &&
            <div className="text-center text-sm text-gray-500 border-t pt-4">
                <p>Retry attempts: {retryCount}/3</p>
                {retryCount >= 3 &&
              <p className="text-red-600 font-medium">
                    Maximum retry attempts reached. Please try refreshing the page or contact support.
                  </p>
              }
              </div>
            }
          </CardContent>
        </Card>

        {/* API Status Checker */}
        {showDiagnostic && errorType === 'api_unavailable' &&
        <ApiStatusChecker
          onApiReady={() => {
            if (onRetry) {
              onRetry();
            } else {
              window.location.reload();
            }
          }}
          showFullDetails={true} />

        }

        {/* Help Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-blue-900">Need Help?</h3>
              <p className="text-sm text-blue-700">
                If this problem persists, please contact your system administrator or try accessing the system from a different browser.
              </p>
              <div className="flex justify-center gap-2 text-xs text-blue-600">
                <Badge variant="outline">Error Code: AUTH_{errorType.toUpperCase()}</Badge>
                <Badge variant="outline">Timestamp: {new Date().toLocaleTimeString()}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

};

export default AuthFallback;