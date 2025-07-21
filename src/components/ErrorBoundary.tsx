import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useErrorNotification } from '@/contexts/ErrorNotificationContext';
import { getErrorMessage } from '@/utils/errorMessageTranslations';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
  showErrorNotification?: (message: string, title?: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  componentName?: string;
}

/**
 * ErrorBoundary component that catches JavaScript errors in its child component tree
 * and displays a fallback UI instead of crashing the entire application.
 * 
 * This is especially useful for handling errors related to undefined values
 * being passed to methods like `.toLowerCase()`.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Static method to update state when an error occurs
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  /**
   * Lifecycle method called when an error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack trace:', errorInfo.componentStack);

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Show user-friendly notification if notification function is available
    if (this.props.showErrorNotification) {
      const userFriendlyMessage = getErrorMessage(error, `displaying ${this.props.componentName || 'component'}`);
      const title = `${this.props.componentName || 'Component'} Error`;
      this.props.showErrorNotification(userFriendlyMessage, title);
    }

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset the error state to allow re-rendering the component
   */
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallbackComponent: FallbackComponent, componentName } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetErrorBoundary}
            componentName={componentName}
          />
        );
      }

      // Default fallback UI
      return <DefaultErrorFallback 
        error={error} 
        errorInfo={errorInfo} 
        resetError={this.resetErrorBoundary} 
        componentName={componentName}
      />;
    }

    // When there's no error, render children normally
    return children;
  }
}

/**
 * Default fallback UI component that displays when an error occurs
 */
const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  componentName
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <Card className="w-full max-w-2xl mx-auto my-4 border-2 border-red-200 bg-red-50">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="p-3 rounded-full bg-white shadow-md text-red-600">
            <AlertTriangle size={28} />
          </div>
        </div>
        <CardTitle className="text-xl font-bold text-red-600">
          Component Error
        </CardTitle>
        {componentName && (
          <Badge variant="outline" className="mt-2">
            {componentName}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-700 text-center">
          Something went wrong while rendering this component. This has been logged for investigation.
        </p>
        
        <p className="text-sm text-gray-600 text-center">
          Error: {error.message}
        </p>
        
        {/* Reset Button */}
        <div className="flex justify-center">
          <Button
            onClick={resetError}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
        
        {/* Error Details (Collapsible) */}
        <Collapsible
          open={showDetails}
          onOpenChange={setShowDetails}
          className="mt-4"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-center text-gray-600"
            >
              {showDetails ? "Hide Details" : "Show Technical Details"}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-2">
            <div className="bg-gray-100 rounded-lg p-3 text-sm font-mono">
              <div className="mb-2">
                <strong>Error Type:</strong> {error.name}
              </div>
              <div className="mb-2">
                <strong>Message:</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo && errorInfo.componentStack && (
                <div className="mt-2">
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Support Information */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
          <p>
            If this error persists, please contact support with the error details above.
          </p>
          <p className="mt-1">
            <strong>Error ID:</strong> {Date.now().toString(36)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Wrapper component that provides error notification functionality to ErrorBoundary
 */
const ErrorBoundaryWithNotifications: React.FC<Omit<ErrorBoundaryProps, 'showErrorNotification'>> = (props) => {
  const { showError } = useErrorNotification();
  
  return (
    <ErrorBoundary
      {...props}
      showErrorNotification={showError}
    />
  );
};

export default ErrorBoundaryWithNotifications;
export { ErrorBoundary };