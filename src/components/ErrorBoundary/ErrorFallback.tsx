import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  component?: string;
  showDetails?: boolean;
  showNavigation?: boolean;
  customMessage?: string;
  customActions?: React.ReactNode;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  severity = 'medium',
  component,
  showDetails = true,
  showNavigation = true,
  customMessage,
  customActions
}) => {
  const navigate = useNavigate();
  const [showDetailedError, setShowDetailedError] = React.useState(false);

  const getSeverityConfig = (severity: string) => {
    const configs = {
      low: {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200',
        badgeVariant: 'secondary' as const,
        icon: AlertTriangle,
        title: 'Minor Issue Detected'
      },
      medium: {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
        badgeVariant: 'destructive' as const,
        icon: AlertTriangle,
        title: 'Error Occurred'
      },
      high: {
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        badgeVariant: 'destructive' as const,
        icon: AlertTriangle,
        title: 'Serious Error'
      },
      critical: {
        color: 'text-red-700',
        bgColor: 'bg-red-100 border-red-300',
        badgeVariant: 'destructive' as const,
        icon: Bug,
        title: 'Critical System Error'
      }
    };
    return configs[severity] || configs.medium;
  };

  const config = getSeverityConfig(severity);
  const IconComponent = config.icon;

  const getErrorMessage = () => {
    if (customMessage) return customMessage;

    switch (severity) {
      case 'low':
        return 'A minor issue occurred, but you can continue using the application.';
      case 'medium':
        return 'An error occurred while processing your request. Please try again.';
      case 'high':
        return 'A serious error occurred. Some features may not work properly.';
      case 'critical':
        return 'A critical system error occurred. Please contact support if this continues.';
      default:
        return 'Something went wrong. Please try refreshing the page.';
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  const formatErrorForDisplay = (error: Error) => {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 10).join('\n') // Limit stack trace
    };
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className={`w-full max-w-2xl ${config.bgColor} border-2`}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full bg-white shadow-md ${config.color}`}>
              <IconComponent size={32} />
            </div>
          </div>
          <CardTitle className={`text-xl font-bold ${config.color}`}>
            {config.title}
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant={config.badgeVariant} className="text-sm">
              {severity.toUpperCase()}
            </Badge>
            {component &&
            <Badge variant="outline" className="text-sm">
                {component}
              </Badge>
            }
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-700 text-center leading-relaxed">
            {getErrorMessage()}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={resetError}
              variant="default"
              className="flex items-center gap-2">

              <RefreshCw size={16} />
              Try Again
            </Button>
            
            {showNavigation &&
            <>
                <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex items-center gap-2">

                  <Home size={16} />
                  Go to Dashboard
                </Button>
                
                <Button
                onClick={handleRefreshPage}
                variant="outline"
                className="flex items-center gap-2">

                  <RefreshCw size={16} />
                  Refresh Page
                </Button>
              </>
            }
          </div>

          {/* Custom Actions */}
          {customActions &&
          <div className="flex justify-center">
              {customActions}
            </div>
          }

          {/* Error Details */}
          {showDetails &&
          <Collapsible
            open={showDetailedError}
            onOpenChange={setShowDetailedError}
            className="mt-6">

              <CollapsibleTrigger asChild>
                <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800">

                  {showDetailedError ?
                <>
                      <ChevronUp size={16} />
                      Hide Technical Details
                    </> :

                <>
                      <ChevronDown size={16} />
                      Show Technical Details
                    </>
                }
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3">
                <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono">
                  <div className="mb-2">
                    <strong>Error Type:</strong> {formatErrorForDisplay(error).name}
                  </div>
                  <div className="mb-2">
                    <strong>Message:</strong> {formatErrorForDisplay(error).message}
                  </div>
                  {formatErrorForDisplay(error).stack &&
                <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                        {formatErrorForDisplay(error).stack}
                      </pre>
                    </div>
                }
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Timestamp:</strong> {new Date().toISOString()}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          }

          {/* Support Information */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
            <p>
              If this error persists, please contact support with the error details above.
            </p>
            <p className="mt-1">
              <strong>Error ID:</strong> {Date.now().toString(36)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default ErrorFallback;