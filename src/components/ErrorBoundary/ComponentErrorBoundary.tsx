import React, { Component, ReactNode } from 'react';
import { ErrorLogger } from '@/services/errorLogger';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: React.ComponentType<any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  showErrorDetails?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  minHeight?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ComponentErrorBoundary extends Component<Props, State> {
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
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const severity = this.props.severity || 'medium';
    const componentName = this.props.componentName || 'Unknown Component';

    this.errorLogger.log(
      error,
      severity,
      `ComponentErrorBoundary - ${componentName}`,
      errorInfo,
      {
        component: componentName,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    );

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Component Error Boundary - ${componentName}`);
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
            errorInfo={this.state.errorInfo}
            componentName={this.props.componentName} />);


      }

      // Default compact fallback UI for components
      return (
        <Card
          className="bg-red-50 border-red-200 border-2"
          style={{ minHeight: this.props.minHeight || 'auto' }}>

          <CardContent className="p-4">
            <div className="flex items-center justify-center text-center">
              <div className="space-y-3">
                <div className="flex items-center justify-center text-red-600">
                  <AlertTriangle size={24} />
                </div>
                
                <div>
                  <h3 className="font-semibold text-red-800 text-sm">
                    Component Error
                  </h3>
                  <p className="text-red-600 text-xs mt-1">
                    {this.props.componentName || 'This component'} encountered an error
                  </p>
                </div>

                <Button
                  onClick={this.handleReset}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100">

                  <RefreshCw size={14} className="mr-1" />
                  Retry
                </Button>

                {this.props.showErrorDetails &&
                <details className="mt-2 text-xs text-red-600">
                    <summary className="cursor-pointer hover:text-red-800">
                      Error Details
                    </summary>
                    <div className="mt-1 text-left bg-red-100 p-2 rounded font-mono text-xs">
                      <div><strong>Error:</strong> {this.state.error.message}</div>
                      {this.state.error.stack &&
                    <div className="mt-1">
                          <strong>Stack:</strong>
                          <pre className="whitespace-pre-wrap text-xs">
                            {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                          </pre>
                        </div>
                    }
                    </div>
                  </details>
                }
              </div>
            </div>
          </CardContent>
        </Card>);

    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;