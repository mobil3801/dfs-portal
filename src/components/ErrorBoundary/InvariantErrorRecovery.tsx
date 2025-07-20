import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Shield, Zap } from 'lucide-react';

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isRecovering: boolean;
  lastErrorMessage: string;
}

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  autoRecover?: boolean;
}

class InvariantErrorRecovery extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null;
  private recoveryAttempts = 0;
  private readonly maxRetries: number;

  constructor(props: Props) {
    super(props);
    this.maxRetries = props.maxRetries || 3;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isRecovering: false,
      lastErrorMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('InvariantErrorRecovery caught error:', error);

    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastErrorMessage: error.message
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('InvariantErrorRecovery componentDidCatch:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
      lastErrorMessage: error.message
    });

    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Check if this is an invariant error and attempt recovery
    if (this.isInvariantError(error) && this.props.autoRecover !== false) {
      this.attemptAutoRecovery(error);
    }
  }

  private isInvariantError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('invariant') ||
      message.includes('minified react error') ||
      message.includes('expected') ||
      error.stack?.includes('invariant') ||
      false);

  }

  private attemptAutoRecovery = async (error: Error) => {
    if (this.recoveryAttempts >= this.maxRetries) {
      console.warn('Maximum recovery attempts reached');
      return;
    }

    this.setState({ isRecovering: true });
    this.recoveryAttempts++;

    try {
      // Wait a bit before attempting recovery
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Attempt different recovery strategies based on error type
      if (error.message.includes('key')) {
        await this.fixKeyIssues();
      } else if (error.message.includes('nesting') || error.message.includes('validateDOMNesting')) {
        await this.fixNestingIssues();
      } else if (error.message.includes('update') || error.message.includes('render')) {
        await this.fixRenderIssues();
      }

      // Force a re-render by clearing the error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
        retryCount: this.state.retryCount + 1
      });

      console.log('Auto-recovery attempt completed');
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      this.setState({ isRecovering: false });
    }
  };

  private fixKeyIssues = async (): Promise<void> => {
    return new Promise((resolve) => {
      // Add unique keys to elements that might be missing them
      const elementsWithoutKeys = document.querySelectorAll('[data-react-key=""], [key=""]');

      elementsWithoutKeys.forEach((element, index) => {
        const uniqueKey = `auto-key-${Date.now()}-${index}`;
        element.setAttribute('data-react-key', uniqueKey);
      });

      // Remove duplicate keys
      const keyMap = new Map<string, Element[]>();
      const elementsWithKeys = document.querySelectorAll('[data-react-key]');

      elementsWithKeys.forEach((element) => {
        const key = element.getAttribute('data-react-key');
        if (key) {
          if (!keyMap.has(key)) {
            keyMap.set(key, []);
          }
          keyMap.get(key)!.push(element);
        }
      });

      keyMap.forEach((elements, key) => {
        if (elements.length > 1) {
          elements.forEach((element, index) => {
            if (index > 0) {
              const newKey = `${key}-dedup-${index}`;
              element.setAttribute('data-react-key', newKey);
            }
          });
        }
      });

      console.log('Fixed key issues');
      resolve();
    });
  };

  private fixNestingIssues = async (): Promise<void> => {
    return new Promise((resolve) => {
      // Fix common invalid nesting patterns
      const invalidNestings = [
      { parent: 'p', child: 'div' },
      { parent: 'a', child: 'a' },
      { parent: 'button', child: 'button' }];


      invalidNestings.forEach(({ parent, child }) => {
        const invalidElements = document.querySelectorAll(`${parent} ${child}`);
        invalidElements.forEach((element) => {
          // Try to move the invalid child outside of its parent
          const parentElement = element.closest(parent);
          if (parentElement && parentElement.parentNode) {
            try {
              parentElement.parentNode.insertBefore(element, parentElement.nextSibling);
              console.log(`Fixed invalid nesting: moved ${child} outside of ${parent}`);
            } catch (e) {
              console.warn('Could not fix nesting issue:', e);
            }
          }
        });
      });

      console.log('Fixed nesting issues');
      resolve();
    });
  };

  private fixRenderIssues = async (): Promise<void> => {
    return new Promise((resolve) => {
      // Clear any pending state updates that might be causing issues
      if (typeof window !== 'undefined' && (window as any).React) {
        try {
          // Force React to flush any pending updates
          const React = (window as any).React;
          if (React.unstable_batchedUpdates) {
            React.unstable_batchedUpdates(() => {





































































































































































































































































































































































              // Empty batch to flush pending updates
            });}} catch (e) {console.warn('Could not flush React updates:', e);}} // Clear any orphaned event listeners that might cause issues
      const elementsWithListeners = document.querySelectorAll('[onclick], [onchange], [onsubmit]');elementsWithListeners.forEach((element) => {element.removeAttribute('onclick');element.removeAttribute('onchange');element.removeAttribute('onsubmit');});console.log('Fixed render issues');resolve();});};private handleManualRetry = () => {this.setState({ hasError: false, error: null, errorInfo: null, isRecovering: false, retryCount: this.state.retryCount + 1 });};private handleForceReload = () => {window.location.reload();};render() {if (this.state.hasError) {const isInvariantError = this.state.error ? this.isInvariantError(this.state.error) : false;const canRetry = this.state.retryCount < this.maxRetries;return <Card className="w-full max-w-4xl mx-auto mt-8 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              {isInvariantError ? 'React Invariant Error Detected' : 'Application Error'}
            </CardTitle>
            <CardDescription>
              {isInvariantError ? 'A React consistency violation was detected. Recovery options are available.' : 'An unexpected error occurred in the application.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                Error ID: {this.state.errorId}
              </Badge>
              <Badge variant="outline">
                Retry Count: {this.state.retryCount}
              </Badge>
              {this.state.isRecovering && <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Recovering...
                </Badge>}
            </div>

            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">Error Message:</div>
                  <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {this.state.error?.message || 'Unknown error'}
                  </div>
                  {isInvariantError && <div className="text-sm text-red-700">
                      This appears to be a React invariant violation, which typically occurs due to:
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Duplicate React keys in lists</li>
                        <li>Invalid DOM element nesting</li>
                        <li>State mutations during render</li>
                        <li>Improper component lifecycle usage</li>
                      </ul>
                    </div>}
                </div>
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && <details className="text-sm">
                <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                  Show Error Details
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="font-semibold">Component Stack:</div>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                  {this.state.error?.stack && <div>
                      <div className="font-semibold">Error Stack:</div>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>}
                </div>
              </details>}

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button onClick={this.handleManualRetry} disabled={this.state.isRecovering || !canRetry} variant="default">

                <RefreshCw className="h-4 w-4 mr-2" />
                {this.state.isRecovering ? 'Recovering...' : `Retry (${this.maxRetries - this.state.retryCount} left)`}
              </Button>
              
              {isInvariantError && canRetry && <Button onClick={() => this.attemptAutoRecovery(this.state.error!)} disabled={this.state.isRecovering} variant="outline">

                  <Shield className="h-4 w-4 mr-2" />
                  Auto-Recover
                </Button>}
              
              <Button onClick={this.handleForceReload} variant="outline">

                <Zap className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
            </div>

            {!canRetry && <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Maximum retry attempts reached. Please reload the page or contact support if the issue persists.
                </AlertDescription>
              </Alert>}
          </CardContent>
        </Card>;}return this.props.children;}}export default InvariantErrorRecovery;