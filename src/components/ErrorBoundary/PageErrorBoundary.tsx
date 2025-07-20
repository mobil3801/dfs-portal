import React, { Component, ReactNode } from 'react';
import { ErrorLogger } from '@/services/errorLogger';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
  pageName?: string;
  fallback?: React.ComponentType<any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class PageErrorBoundary extends Component<Props, State> {
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
    const severity = this.props.severity || 'high';
    const pageName = this.props.pageName || 'Unknown Page';

    this.errorLogger.log(
      error,
      severity,
      `PageErrorBoundary - ${pageName}`,
      errorInfo,
      {
        page: pageName,
        url: window.location.href,
        pathname: window.location.pathname,
        timestamp: new Date().toISOString()
      }
    );

    this.setState({
      error,
      errorInfo
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Page Error Boundary Caught Error - ${pageName}`);
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
            pageName={this.props.pageName} />);


      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
          severity={this.props.severity || 'high'}
          component={this.props.pageName}
          customMessage={
          this.props.pageName ?
          `An error occurred while loading the ${this.props.pageName} page. You can try refreshing or navigate to another page.` :
          undefined
          } />);


    }

    return this.props.children;
  }
}

export default PageErrorBoundary;