// Error logging service for the DFS Manager Portal
// Compatible with React Error Boundaries and async error handling
export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  error: Error;
  errorInfo?: React.ErrorInfo;
  component?: string;
  userId?: string;
  userAgent: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100; // Keep last 100 error logs

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(
  error: Error,
  severity: ErrorLogEntry['severity'] = 'medium',
  component?: string,
  errorInfo?: React.ErrorInfo,
  context?: Record<string, any>)
  : void {
    const logEntry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      error,
      errorInfo,
      component,
      userId: this.getCurrentUserId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity,
      context
    };

    // Add to local logs
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Console logging for development
    this.logToConsole(logEntry);

    // Store in localStorage for persistence
    this.persistLogs();

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(logEntry);
    }
  }

  private logToConsole(entry: ErrorLogEntry): void {
    const style = this.getConsoleStyle(entry.severity);
    console.group(`%c🚨 Error Boundary Caught Error - ${entry.severity.toUpperCase()}`, style);
    console.error('Error:', entry.error);
    console.log('Component:', entry.component || 'Unknown');
    console.log('Timestamp:', entry.timestamp.toISOString());
    console.log('URL:', entry.url);
    if (entry.errorInfo) {
      console.log('Component Stack:', entry.errorInfo.componentStack);
    }
    if (entry.context) {
      console.log('Context:', entry.context);
    }
    console.groupEnd();
  }

  private getConsoleStyle(severity: ErrorLogEntry['severity']): string {
    const styles = {
      low: 'color: #856404; background: #fff3cd; padding: 2px 4px; border-radius: 3px;',
      medium: 'color: #721c24; background: #f8d7da; padding: 2px 4px; border-radius: 3px;',
      high: 'color: #721c24; background: #f5c6cb; padding: 2px 4px; border-radius: 3px; font-weight: bold;',
      critical: 'color: white; background: #dc3545; padding: 2px 4px; border-radius: 3px; font-weight: bold;'
    };
    return styles[severity];
  }

  private persistLogs(): void {
    try {
      const serializedLogs = this.logs.map((log) => ({
        ...log,
        error: {
          name: log.error.name,
          message: log.error.message,
          stack: log.error.stack
        }
      }));
      localStorage.setItem('dfs_error_logs', JSON.stringify(serializedLogs));
    } catch (e) {
      console.warn('Failed to persist error logs:', e);
    }
  }

  private sendToErrorService(entry: ErrorLogEntry): void {
    // In a real application, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    try {
      // Example API call (not implemented in this demo)
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (e) {
      console.warn('Failed to send error to reporting service:', e);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from authentication context
    try {
      return localStorage.getItem('user_id') || undefined;
    } catch {
      return undefined;
    }
  }

  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('dfs_error_logs');
  }

  getLogsSummary(): {
    total: number;
    bySeverity: Record<string, number>;
  } {
    const bySeverity = this.logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total: this.logs.length, bySeverity };
  }
}
