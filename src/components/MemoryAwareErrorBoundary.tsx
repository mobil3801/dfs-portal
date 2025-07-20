import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Trash2, Activity, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface MemoryAwareErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  memoryUsage: number;
  componentStack: string;
  retryCount: number;
  lastErrorTime: number;
  errorPattern: 'memory' | 'render' | 'network' | 'unknown';
  autoRecoveryAttempts: number;
}

interface MemoryAwareErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  autoRecovery?: boolean;
  memoryThreshold?: number;
  enableMemoryMonitoring?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolationLevel?: 'component' | 'page' | 'application';
}

class MemoryAwareErrorBoundary extends Component<
  MemoryAwareErrorBoundaryProps,
  MemoryAwareErrorBoundaryState>
{
  private memoryMonitorInterval: NodeJS.Timeout | null = null;
  private autoRecoveryTimeout: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private errorThrottleMap: Map<string, number> = new Map();

  constructor(props: MemoryAwareErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      memoryUsage: 0,
      componentStack: '',
      retryCount: 0,
      lastErrorTime: 0,
      errorPattern: 'unknown',
      autoRecoveryAttempts: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<MemoryAwareErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const memoryUsage = this.getMemoryUsage();
    const errorPattern = this.analyzeErrorPattern(error, errorInfo);

    this.setState({
      errorInfo,
      memoryUsage,
      componentStack: errorInfo.componentStack,
      errorPattern
    });

    // Log error with enhanced information
    this.logEnhancedError(error, errorInfo, errorPattern, memoryUsage);

    // Notify parent component
    this.props.onError?.(error, errorInfo);

    // Attempt automatic recovery for memory-related errors
    if (this.props.autoRecovery && errorPattern === 'memory') {
      this.attemptAutoRecovery();
    }
  }

  componentDidMount() {
    if (this.props.enableMemoryMonitoring) {
      this.startMemoryMonitoring();
    }
    this.setupPerformanceObserver();
  }

  componentWillUnmount() {
    this.cleanup();
  }

  componentDidUpdate(prevProps: MemoryAwareErrorBoundaryProps) {
    // Reset error boundary when resetKeys change
    if (this.props.resetOnPropsChange && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || [];
      const currentKeys = this.props.resetKeys;

      if (prevKeys.length !== currentKeys.length ||
      prevKeys.some((key, index) => key !== currentKeys[index])) {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: 0,
          autoRecoveryAttempts: 0
        });
      }
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;
    }
    return 0;
  }

  /**
   * Analyze error pattern to determine appropriate recovery strategy
   */
  private analyzeErrorPattern(error: Error, errorInfo: ErrorInfo): 'memory' | 'render' | 'network' | 'unknown' {
    const errorMessage = error.message.toLowerCase();
    const stackTrace = error.stack?.toLowerCase() || '';
    const componentStack = errorInfo.componentStack.toLowerCase();

    // Memory-related patterns
    if (errorMessage.includes('memory') ||
    errorMessage.includes('heap') ||
    stackTrace.includes('out of memory') ||
    this.state.memoryUsage > (this.props.memoryThreshold || 0.8)) {
      return 'memory';
    }

    // Render-related patterns
    if (errorMessage.includes('render') ||
    errorMessage.includes('hook') ||
    errorMessage.includes('state') ||
    componentStack.includes('render')) {
      return 'render';
    }

    // Network-related patterns
    if (errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection')) {
      return 'network';
    }

    return 'unknown';
  }

  /**
   * Enhanced error logging with memory context
   */
  private logEnhancedError(error: Error, errorInfo: ErrorInfo, pattern: string, memoryUsage: number) {
    const errorKey = `${error.name}-${error.message.substring(0, 50)}`;
    const now = Date.now();

    // Throttle similar errors
    const lastLogged = this.errorThrottleMap.get(errorKey) || 0;
    if (now - lastLogged < 5000) {// 5 second throttle
      return;
    }

    this.errorThrottleMap.set(errorKey, now);

    const enhancedErrorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      context: {
        memoryUsage: Math.round(memoryUsage * 100),
        pattern,
        retryCount: this.state.retryCount,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        isolationLevel: this.props.isolationLevel || 'component'
      },
      performance: this.getPerformanceMetrics()
    };

    console.error('[MemoryAwareErrorBoundary] Enhanced Error Report:', enhancedErrorData);

    // Send to error reporting service if available
    if (window.ezsite?.errorReporter) {
      window.ezsite.errorReporter.report(enhancedErrorData);
    }
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics() {
    return {
      navigation: performance.getEntriesByType('navigation')[0],
      memory: 'memory' in performance ? (performance as any).memory : null,
      timing: {
        loadTime: performance.now(),
        firstContentfulPaint: this.getFirstContentfulPaint(),
        largestContentfulPaint: this.getLargestContentfulPaint()
      }
    };
  }

  private getFirstContentfulPaint(): number | null {
    const entries = performance.getEntriesByName('first-contentful-paint');
    return entries.length > 0 ? entries[0].startTime : null;
  }

  private getLargestContentfulPaint(): number | null {
    const entries = performance.getEntriesByType('largest-contentful-paint');
    return entries.length > 0 ? entries[entries.length - 1].startTime : null;
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring() {
    this.memoryMonitorInterval = setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      const threshold = this.props.memoryThreshold || 0.8;

      if (memoryUsage > threshold) {
        console.warn(`[MemoryAwareErrorBoundary] High memory usage detected: ${Math.round(memoryUsage * 100)}%`);

        // Trigger proactive cleanup
        this.performMemoryCleanup();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Setup performance observer for monitoring
   */
  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.includes('react')) {
            if (entry.duration > 100) {
              console.warn(`[MemoryAwareErrorBoundary] Slow React operation detected: ${entry.name} (${entry.duration}ms)`);
            }
          }
        }
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('PerformanceObserver not fully supported');
      }
    }
  }

  /**
   * Perform memory cleanup
   */
  private performMemoryCleanup() {
    // Clear caches if available
    if (window.ezsite?.cache?.clear) {
      window.ezsite.cache.clear();
    }

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    console.log('[MemoryAwareErrorBoundary] Memory cleanup performed');
  }

  /**
   * Attempt automatic recovery
   */
  private attemptAutoRecovery() {
    const maxAttempts = 3;
    const { autoRecoveryAttempts } = this.state;

    if (autoRecoveryAttempts >= maxAttempts) {
      console.warn('[MemoryAwareErrorBoundary] Max auto-recovery attempts reached');
      return;
    }

    console.log(`[MemoryAwareErrorBoundary] Attempting auto-recovery (${autoRecoveryAttempts + 1}/${maxAttempts})`);

    // Perform cleanup before recovery
    this.performMemoryCleanup();

    // Set recovery timeout
    this.autoRecoveryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        autoRecoveryAttempts: autoRecoveryAttempts + 1
      });
    }, 2000 * (autoRecoveryAttempts + 1)); // Progressive delay
  }

  /**
   * Manual retry with cleanup
   */
  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn('[MemoryAwareErrorBoundary] Max retries reached');
      return;
    }

    // Perform cleanup before retry
    this.performMemoryCleanup();

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1
    });
  };

  /**
   * Force cleanup and reset
   */
  private handleForceCleanup = () => {
    this.performMemoryCleanup();

    // Clear all state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      autoRecoveryAttempts: 0
    });
  };

  /**
   * Cleanup resources
   */
  private cleanup() {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }

    if (this.autoRecoveryTimeout) {
      clearTimeout(this.autoRecoveryTimeout);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.errorThrottleMap.clear();
  }

  /**
   * Get severity level based on error pattern
   */
  private getSeverityLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const { errorPattern, memoryUsage, retryCount } = this.state;

    if (errorPattern === 'memory' || memoryUsage > 0.9 || retryCount > 2) {
      return 'critical';
    }

    if (errorPattern === 'render' || retryCount > 1) {
      return 'high';
    }

    if (errorPattern === 'network') {
      return 'medium';
    }

    return 'low';
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getSeverityLevel();
      const { error, errorInfo, memoryUsage, errorPattern, retryCount } = this.state;
      const { maxRetries = 3 } = this.props;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4">

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Component Error Detected
                <Badge variant={severity === 'critical' ? 'destructive' : 'secondary'}>
                  {severity.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {/* Error Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Error Pattern:</strong>
                  <Badge variant="outline" className="ml-2">
                    {errorPattern}
                  </Badge>
                </div>
                <div>
                  <strong>Memory Usage:</strong>
                  <Badge
                    variant={memoryUsage > 0.8 ? 'destructive' : 'outline'}
                    className="ml-2">

                    {Math.round(memoryUsage * 100)}%
                  </Badge>
                </div>
                <div>
                  <strong>Retry Count:</strong>
                  <Badge variant="outline" className="ml-2">
                    {retryCount}/{maxRetries}
                  </Badge>
                </div>
                <div>
                  <strong>Isolation Level:</strong>
                  <Badge variant="outline" className="ml-2">
                    {this.props.isolationLevel || 'component'}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {retryCount < maxRetries &&
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm">

                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry ({maxRetries - retryCount} left)
                  </Button>
                }
                
                <Button
                  onClick={this.handleForceCleanup}
                  variant="outline"
                  size="sm">

                  <Trash2 className="mr-2 h-4 w-4" />
                  Force Cleanup & Reset
                </Button>
                
                <Button
                  onClick={() => window.location.reload()}
                  variant="secondary"
                  size="sm">

                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              {/* Memory Warning */}
              {memoryUsage > 0.8 &&
              <Alert variant="destructive">
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    High memory usage detected. Consider closing unused tabs or restarting the application.
                  </AlertDescription>
                </Alert>
              }

              {/* Development Details */}
              {process.env.NODE_ENV === 'development' &&
              <details className="text-xs">
                  <summary className="cursor-pointer flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4" />
                    Development Details
                  </summary>
                  <div className="bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    <strong>Error Stack:</strong>
                    <pre>{error?.stack}</pre>
                    <strong>Component Stack:</strong>
                    <pre>{errorInfo?.componentStack}</pre>
                  </div>
                </details>
              }
            </CardContent>
          </Card>
        </motion.div>);

    }

    return this.props.children;
  }
}

export default MemoryAwareErrorBoundary;