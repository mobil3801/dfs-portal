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
  errorId: string | null;
  retryCount: number;
}

class EnhancedGlobalErrorBoundary extends Component<Props, State> {
  private errorLogger: ErrorLogger;
  private maxRetries = 3;
  private retryTimeouts: Set<NodeJS.Timeout> = new Set();

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
    this.errorLogger = ErrorLogger.getInstance();

    // Add global error handlers
    this.setupGlobalErrorHandlers();
  }

  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Handle global errors
    window.addEventListener('error', this.handleGlobalError);

    // Override console.error to catch React warnings
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');

      // Check for React invariant violations
      if (message.includes('Invariant') || message.includes('invariant')) {
        this.handleInvariantError(new Error(message), args);
      }

      originalConsoleError.apply(console, args);
    };
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);

    this.errorLogger.log(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      'high',
      'GlobalErrorBoundary',
      null,
      {
        type: 'promise_rejection',
        reason: event.reason,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    );
  };

  handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error:', event.error);

    this.errorLogger.log(
      event.error || new Error(event.message),
      'high',
      'GlobalErrorBoundary',
      null,
      {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    );
  };

  handleInvariantError = (error: Error, args: any[]) => {
    console.error('React Invariant Error detected:', error, args);

    this.errorLogger.log(
      error,
      'critical',
      'GlobalErrorBoundary',
      null,
      {
        type: 'react_invariant',
        args: args,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        stack: error.stack
      }
    );
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if this is a React invariant error
    const isInvariant = error.message?.includes('Invariant') ||
    error.message?.includes('invariant') ||
    error.stack?.includes('invariant');

    console.error('Error boundary caught error:', {
      message: error.message,
      stack: error.stack,
      isInvariant,
      errorId
    });

    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isInvariant = error.message?.includes('Invariant') ||
    error.message?.includes('invariant') ||
    error.stack?.includes('invariant');

    const severity = isInvariant ? 'critical' : 'high';

    // Enhanced error logging with more context
    this.errorLogger.log(
      error,
      severity,
      'EnhancedGlobalErrorBoundary',
      errorInfo,
      {
        errorId: this.state.errorId,
        isInvariant,
        retryCount: this.state.retryCount,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        componentStack: errorInfo.componentStack,
        reactVersion: React.version,
        memoryUsage: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      }
    );

    this.setState({
      error,
      errorInfo
    });

    // Enhanced console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Enhanced Global Error Boundary - Error Details');
      console.error('Error Type:', isInvariant ? 'React Invariant' : 'General Error');
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error ID:', this.state.errorId);
      console.error('Retry Count:', this.state.retryCount);

      // Memory information if available
      if ((performance as any).memory) {
        console.info('Memory Usage:', {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round((performance as any).memory.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576) + ' MB'
        });
      }

      console.groupEnd();
    }

    // Auto-retry for certain types of errors
    if (isInvariant && this.state.retryCount < this.maxRetries) {
      console.warn(`Attempting auto-retry ${this.state.retryCount + 1}/${this.maxRetries} for invariant error`);

      const timeout = setTimeout(() => {
        this.handleReset(true);
        this.retryTimeouts.delete(timeout);
      }, 1000 * (this.state.retryCount + 1)); // Exponential backoff

      this.retryTimeouts.add(timeout);
    }
  }

  componentWillUnmount() {
    // Clean up event listeners
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);

    // Clear any pending retry timeouts
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  handleReset = (isRetry = false) => {
    console.log(isRetry ? 'Auto-retrying after error' : 'Manual error reset');

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: isRetry ? prevState.retryCount + 1 : 0
    }));
  };

  handleForceReload = () => {
    console.log('Force reloading application');
    window.location.reload();
  };

  handleGoHome = () => {
    console.log('Navigating to home page');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const isInvariant = this.state.error.message?.includes('Invariant') ||
      this.state.error.message?.includes('invariant') ||
      this.state.error.stack?.includes('invariant');

      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.handleReset}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId}
            retryCount={this.state.retryCount}
            isInvariant={isInvariant} />);


      }

      // Enhanced fallback UI with more debugging info
      return (
        <div className="min-h-screen bg-gray-50">
          <ErrorFallback
            error={this.state.error}
            resetError={this.handleReset}
            severity="critical"
            component="Application"
            customMessage={
            isInvariant ?
            `A React rendering error occurred (Invariant violation). This typically happens when React encounters unexpected component behavior. Error ID: ${this.state.errorId}` :
            `A critical error occurred that prevented the application from loading properly. Error ID: ${this.state.errorId}`
            }
            showNavigation={false}
            customActions={
            <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                  <div className="text-sm text-yellow-800">
                    <p><strong>Error Type:</strong> {isInvariant ? 'React Invariant Violation' : 'Application Error'}</p>
                    <p><strong>Error ID:</strong> {this.state.errorId}</p>
                    <p><strong>Retry Count:</strong> {this.state.retryCount}/{this.maxRetries}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                  onClick={() => this.handleReset()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={this.state.retryCount >= this.maxRetries}>

                    Try Again
                  </button>
                  
                  <button
                  onClick={this.handleForceReload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">

                    Reload Application
                  </button>
                  
                  <button
                  onClick={this.handleGoHome}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">

                    Go to Home
                  </button>
                </div>
                
                {process.env.NODE_ENV === 'development' &&
              <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Show Error Details (Development)
                    </summary>
                    <div className="mt-2 p-4 bg-gray-100 rounded-md">
                      <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                      {this.state.errorInfo &&
                  <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Component Stack:</p>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-20">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                  }
                    </div>
                  </details>
              }
              </div>
            } />

        </div>);

    }

    return this.props.children;
  }
}

export default EnhancedGlobalErrorBoundary;