import { ErrorLogger, ErrorLogEntry } from './errorLogger';

// Enhanced error patterns and analytics
export interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  lastOccurrence: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trend: 'increasing' | 'stable' | 'decreasing';
  components: string[];
  suggestedActions: string[];
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByHour: Record<string, number>;
  errorsByComponent: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  topErrorMessages: Array<{message: string;count: number;}>;
  recoveryRate: number;
  patterns: ErrorPattern[];
  trends: {
    hourly: number;
    daily: number;
    weekly: number;
  };
}

export class EnhancedErrorLogger extends ErrorLogger {
  private static enhancedInstance: EnhancedErrorLogger;
  private patterns: Map<string, ErrorPattern> = new Map();
  private analytics: ErrorAnalytics | null = null;

  private constructor() {
    super();
    this.initializePatterns();
  }

  static getInstance(): EnhancedErrorLogger {
    if (!EnhancedErrorLogger.enhancedInstance) {
      EnhancedErrorLogger.enhancedInstance = new EnhancedErrorLogger();
    }
    return EnhancedErrorLogger.enhancedInstance;
  }

  private initializePatterns(): void {
    // Define common error patterns
    const commonPatterns: Omit<ErrorPattern, 'frequency' | 'lastOccurrence' | 'trend'>[] = [
    {
      id: 'network_timeout',
      name: 'Network Timeout Pattern',
      description: 'Repeated network timeouts indicating connectivity issues',
      severity: 'high',
      components: ['api', 'network', 'fetch'],
      suggestedActions: [
      'Check network connectivity',
      'Implement retry logic',
      'Review API endpoint health',
      'Consider connection pooling']

    },
    {
      id: 'memory_leak',
      name: 'Memory Leak Pattern',
      description: 'Components consuming excessive memory over time',
      severity: 'critical',
      components: ['memory', 'component', 'useEffect'],
      suggestedActions: [
      'Review component cleanup',
      'Check for event listener cleanup',
      'Audit interval and timeout usage',
      'Implement memory monitoring']

    },
    {
      id: 'render_errors',
      name: 'Render Error Pattern',
      description: 'Frequent component rendering failures',
      severity: 'medium',
      components: ['render', 'component', 'state'],
      suggestedActions: [
      'Review component state management',
      'Add prop validation',
      'Implement error boundaries',
      'Check for null/undefined values']

    },
    {
      id: 'async_race',
      name: 'Async Race Condition Pattern',
      description: 'Race conditions in asynchronous operations',
      severity: 'high',
      components: ['async', 'promise', 'api'],
      suggestedActions: [
      'Implement proper loading states',
      'Use AbortController for cancellation',
      'Review async/await usage',
      'Add request deduplication']

    },
    {
      id: 'form_validation',
      name: 'Form Validation Pattern',
      description: 'Repeated form validation and submission errors',
      severity: 'medium',
      components: ['form', 'validation', 'input'],
      suggestedActions: [
      'Enhance client-side validation',
      'Improve error messaging',
      'Add real-time validation',
      'Review form state management']

    }];


    commonPatterns.forEach((pattern) => {
      this.patterns.set(pattern.id, {
        ...pattern,
        frequency: 0,
        lastOccurrence: new Date(),
        trend: 'stable'
      });
    });
  }

  // Override the log method to include pattern detection
  log(
  error: Error,
  severity: ErrorLogEntry['severity'] = 'medium',
  component?: string,
  errorInfo?: React.ErrorInfo,
  context?: Record<string, any>)
  : void {
    // Call parent log method
    super.log(error, severity, component, errorInfo, context);

    // Analyze for patterns
    this.analyzeForPatterns(error, component, severity);

    // Update analytics
    this.updateAnalytics();
  }

  private analyzeForPatterns(error: Error, component?: string, severity?: string): void {
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    const currentTime = new Date();

    // Check each pattern for matches
    this.patterns.forEach((pattern, patternId) => {
      let isMatch = false;

      // Check if error matches pattern criteria
      if (patternId === 'network_timeout' && (
      errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('connection'))) {
        isMatch = true;
      } else if (patternId === 'memory_leak' && (
      errorMessage.includes('memory') || errorMessage.includes('leak') || errorMessage.includes('interval'))) {
        isMatch = true;
      } else if (patternId === 'render_errors' && (
      errorMessage.includes('render') || errorMessage.includes('component') || errorStack.includes('render'))) {
        isMatch = true;
      } else if (patternId === 'async_race' && (
      errorMessage.includes('async') || errorMessage.includes('promise') || errorMessage.includes('race'))) {
        isMatch = true;
      } else if (patternId === 'form_validation' && (
      errorMessage.includes('validation') || errorMessage.includes('form') || component?.includes('form'))) {
        isMatch = true;
      }

      if (isMatch) {
        const updatedPattern = {
          ...pattern,
          frequency: pattern.frequency + 1,
          lastOccurrence: currentTime,
          trend: this.calculateTrend(pattern.frequency, currentTime, pattern.lastOccurrence)
        };

        // Add component to pattern if not already included
        if (component && !updatedPattern.components.includes(component)) {
          updatedPattern.components.push(component);
        }

        this.patterns.set(patternId, updatedPattern);
      }
    });
  }

  private calculateTrend(currentFreq: number, currentTime: Date, lastTime: Date): 'increasing' | 'stable' | 'decreasing' {
    const timeDiff = currentTime.getTime() - lastTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // If errors are happening more than once per hour, it's increasing
    if (hoursDiff < 1 && currentFreq > 1) {
      return 'increasing';
    }
    // If errors happen less than once per day, it's stable
    if (hoursDiff > 24) {
      return 'stable';
    }
    // Otherwise, it's decreasing
    return 'decreasing';
  }

  private updateAnalytics(): void {
    const logs = this.getLogs();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Error counts by time period
    const errorsLastHour = logs.filter((log) => log.timestamp > oneHourAgo).length;
    const errorsLastDay = logs.filter((log) => log.timestamp > oneDayAgo).length;
    const errorsLastWeek = logs.filter((log) => log.timestamp > oneWeekAgo).length;

    // Error distribution by hour
    const errorsByHour: Record<string, number> = {};
    logs.forEach((log) => {
      const hour = log.timestamp.getHours().toString().padStart(2, '0');
      errorsByHour[hour] = (errorsByHour[hour] || 0) + 1;
    });

    // Error distribution by component
    const errorsByComponent: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.component) {
        errorsByComponent[log.component] = (errorsByComponent[log.component] || 0) + 1;
      }
    });

    // Error distribution by severity
    const errorsBySeverity: Record<string, number> = {};
    logs.forEach((log) => {
      errorsBySeverity[log.severity] = (errorsBySeverity[log.severity] || 0) + 1;
    });

    // Top error messages
    const errorMessageCounts: Record<string, number> = {};
    logs.forEach((log) => {
      const message = log.error.message;
      errorMessageCounts[message] = (errorMessageCounts[message] || 0) + 1;
    });

    const topErrorMessages = Object.entries(errorMessageCounts).
    sort(([, a], [, b]) => b - a).
    slice(0, 10).
    map(([message, count]) => ({ message, count }));

    // Calculate recovery rate (simplified - based on error resolution)
    const recoveryRate = logs.length > 0 ? Math.max(0, 100 - errorsLastHour / logs.length * 100) : 100;

    this.analytics = {
      totalErrors: logs.length,
      errorsByHour,
      errorsByComponent,
      errorsBySeverity,
      topErrorMessages,
      recoveryRate,
      patterns: Array.from(this.patterns.values()),
      trends: {
        hourly: errorsLastHour,
        daily: errorsLastDay,
        weekly: errorsLastWeek
      }
    };
  }

  getAnalytics(): ErrorAnalytics | null {
    if (!this.analytics) {
      this.updateAnalytics();
    }
    return this.analytics;
  }

  getPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values()).sort((a, b) => b.frequency - a.frequency);
  }

  getCriticalPatterns(): ErrorPattern[] {
    return this.getPatterns().filter((pattern) =>
    pattern.severity === 'critical' ||
    pattern.severity === 'high' && pattern.trend === 'increasing'
    );
  }

  getRecommendations(): Array<{priority: 'high' | 'medium' | 'low';action: string;reason: string;}> {
    const recommendations: Array<{priority: 'high' | 'medium' | 'low';action: string;reason: string;}> = [];
    const analytics = this.getAnalytics();

    if (!analytics) return recommendations;

    // High priority recommendations
    if (analytics.trends.hourly > 5) {
      recommendations.push({
        priority: 'high',
        action: 'Investigate recent code changes causing error spike',
        reason: `${analytics.trends.hourly} errors in the last hour indicates a critical issue`
      });
    }

    // Pattern-based recommendations
    this.getCriticalPatterns().forEach((pattern) => {
      pattern.suggestedActions.forEach((action) => {
        recommendations.push({
          priority: pattern.severity === 'critical' ? 'high' : 'medium',
          action,
          reason: `Addressing ${pattern.name} (${pattern.frequency} occurrences)`
        });
      });
    });

    // Component-based recommendations
    const topErrorComponent = Object.entries(analytics.errorsByComponent).
    sort(([, a], [, b]) => b - a)[0];

    if (topErrorComponent && topErrorComponent[1] > 3) {
      recommendations.push({
        priority: 'medium',
        action: `Review and refactor ${topErrorComponent[0]} component`,
        reason: `Component has ${topErrorComponent[1]} recorded errors`
      });
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  // Export comprehensive error report
  exportComprehensiveReport(): any {
    const analytics = this.getAnalytics();
    const patterns = this.getPatterns();
    const recommendations = this.getRecommendations();
    const logs = this.getLogs();

    return {
      generatedAt: new Date().toISOString(),
      summary: analytics,
      patterns,
      recommendations,
      detailedLogs: logs.slice(0, 50), // Last 50 errors
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Helper function to format error patterns for display
export const formatErrorPattern = (pattern: ErrorPattern): string => {
  const trendIcon = pattern.trend === 'increasing' ? '📈' :
  pattern.trend === 'decreasing' ? '📉' : '➡️';

  return `${trendIcon} ${pattern.name} (${pattern.frequency}x) - ${pattern.description}`;
};

// Helper function to get severity color
export const getSeverityColor = (severity: string): string => {
  const colors = {
    low: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    medium: 'text-orange-600 bg-orange-50 border-orange-200',
    high: 'text-red-600 bg-red-50 border-red-200',
    critical: 'text-red-800 bg-red-100 border-red-300'
  };
  return colors[severity as keyof typeof colors] || colors.medium;
};