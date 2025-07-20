import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, Bug } from 'lucide-react';
import { sanitizeUserInput } from '@/utils/sanitizeHelper';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
}

class InvalidCharacterErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is an InvalidCharacterError
    if (error.name === 'InvalidCharacterError' ||
    error.message.includes('invalid characters') ||
    error.message.includes('InvalidCharacterError')) {
      return {
        hasError: true,
        error,
        errorId: `invalid-char-${Date.now()}`
      };
    }

    // Let other error boundaries handle non-InvalidCharacterError
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('InvalidCharacterError caught:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log detailed error information
    const errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Detailed InvalidCharacterError info:', errorDetails);

    // Attempt to sanitize localStorage data if it might be the cause
    this.sanitizeStorageData();
  }

  private sanitizeStorageData = () => {
    try {
      // Sanitize localStorage data that might contain invalid characters
      const keysToCheck = ['formData', 'userData', 'cachedData', 'preferences'];

      keysToCheck.forEach((key) => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const sanitized = sanitizeUserInput(parsed);
            localStorage.setItem(key, JSON.stringify(sanitized));
          } catch (e) {
            // If parsing fails, remove the potentially corrupted data
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Error sanitizing storage data:', error);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorId: '',
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Force a page reload if we've exceeded retry attempts
      window.location.reload();
    }
  };

  private handleReset = () => {
    // Clear potentially problematic data
    this.sanitizeStorageData();

    // Clear form data that might contain invalid characters
    const forms = document.querySelectorAll('form');
    forms.forEach((form) => {
      try {
        form.reset();
      } catch (e) {
        console.error('Error resetting form:', e);
      }
    });

    this.setState({
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Show custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Bug className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-800">Character Encoding Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The application encountered invalid characters that prevent proper display. 
                  This can happen with special characters in form inputs or data.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Error Details:</h4>
                <p className="text-xs text-gray-600 break-words">
                  {this.state.error.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Error ID: {this.state.errorId}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Suggested Solutions:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Clear form data and try again</li>
                  <li>• Remove special characters from inputs</li>
                  <li>• Refresh the page to reset the application</li>
                  <li>• Check for copy-pasted text with hidden characters</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {this.state.retryCount < this.maxRetries ?
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="outline">

                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.state.retryCount} left)
                  </Button> :
                null}
                
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="outline">

                  Clear Data & Reset
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  className="flex-1">

                  Reload Page
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                If the problem persists, please contact support with Error ID: {this.state.errorId}
              </div>
            </CardContent>
          </Card>
        </div>);

    }

    return this.props.children;
  }
}

export default InvalidCharacterErrorBoundary;