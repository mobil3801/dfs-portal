import React, { Component, ReactNode } from 'react';
import { ErrorLogger } from '@/services/errorLogger';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<any>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  private errorLogger: ErrorLogger;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
    this.errorLogger = ErrorLogger.getInstance();
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error with high severity since it's at the global level
    this.errorLogger.log(
      error,
      'critical',
      'GlobalErrorBoundary',
      errorInfo,
      {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    );

    this.setState({
      error,
      errorInfo
    });

    // In development, also log to console for easier debugging
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Global Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.handleReset}
            errorInfo={this.state.errorInfo} />);


      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50">
          <ErrorFallback
            error={this.state.error}
            resetError={this.handleReset}
            severity="critical"
            component="Application"
            customMessage="A critical error occurred that prevented the application from loading properly. This has been automatically reported to our team."
            showNavigation={false}
            customActions={
            <div className="space-y-2">
                <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">

                  Reload Application
                </button>
                <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors ml-2">

                  Go to Home
                </button>
              </div>
            } />

        </div>);

    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;