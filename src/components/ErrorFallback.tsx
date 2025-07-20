import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  componentName?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  componentName = 'Component'
}) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-red-800">
            {componentName} Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              {error?.message || `An error occurred while loading the ${componentName} component.`}
            </AlertDescription>
          </Alert>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>What you can do:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Try refreshing the page</li>
              <li>Clear your browser cache</li>
              <li>Check your internet connection</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="w-full">

              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          {error &&
          <details className="text-xs text-gray-500 mt-4">
              <summary className="cursor-pointer hover:text-gray-700">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {error.stack || error.message}
              </pre>
            </details>
          }
        </CardContent>
      </Card>
    </div>);

};

export default ErrorFallback;