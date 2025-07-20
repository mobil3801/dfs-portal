// Analytics performance monitoring utilities

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: any;
}

interface LoadTimeMetric {
  operation: string;
  loadTime: number;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

interface PerformanceStats {
  averageLoadTime: number;
  minLoadTime: number;
  maxLoadTime: number;
  totalOperations: number;
  successRate: number;
  errorCount: number;
  memoryUsage?: number;
}

interface PerformanceAlert {
  type: 'slow_load' | 'memory_high' | 'error_rate_high' | 'cache_miss_high';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric[]>();
  private loadTimes: LoadTimeMetric[] = [];
  private readonly maxHistorySize = 1000;
  private readonly performanceThresholds = {
    slowLoadTime: 3000, // 3 seconds
    highMemoryUsage: 100 * 1024 * 1024, // 100MB
    highErrorRate: 0.1, // 10%
    highCacheMissRate: 0.5 // 50%
  };

  private monitorName: string;
  private startTime: number;
  private alerts: PerformanceAlert[] = [];

  constructor(name: string) {
    this.monitorName = name;
    this.startTime = performance.now();

    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }

  // Record load time for operations
  recordLoadTime(loadTime: number, operation = 'default', success = true, errorMessage?: string): void {
    const metric: LoadTimeMetric = {
      operation,
      loadTime,
      timestamp: new Date(),
      success,
      errorMessage
    };

    this.loadTimes.push(metric);

    // Trim history if too large
    if (this.loadTimes.length > this.maxHistorySize) {
      this.loadTimes = this.loadTimes.slice(-this.maxHistorySize);
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(metric);

    // Log slow operations
    if (loadTime > this.performanceThresholds.slowLoadTime) {
      console.warn(`Slow operation detected: ${operation} took ${loadTime}ms`);
    }
  }

  // Record custom metric
  recordMetric(name: string, value: number, metadata?: any): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      metadata
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Trim history
    if (metricHistory.length > this.maxHistorySize) {
      this.metrics.set(name, metricHistory.slice(-this.maxHistorySize));
    }
  }

  // Get performance statistics
  getMetrics(): PerformanceStats {
    const recentLoadTimes = this.loadTimes.slice(-100); // Last 100 operations

    if (recentLoadTimes.length === 0) {
      return {
        averageLoadTime: 0,
        minLoadTime: 0,
        maxLoadTime: 0,
        totalOperations: 0,
        successRate: 0,
        errorCount: 0
      };
    }

    const loadTimes = recentLoadTimes.map((m) => m.loadTime);
    const successfulOps = recentLoadTimes.filter((m) => m.success).length;

    return {
      averageLoadTime: loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length,
      minLoadTime: Math.min(...loadTimes),
      maxLoadTime: Math.max(...loadTimes),
      totalOperations: recentLoadTimes.length,
      successRate: successfulOps / recentLoadTimes.length,
      errorCount: recentLoadTimes.length - successfulOps,
      memoryUsage: this.getMemoryUsage()
    };
  }

  // Get memory usage
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  // Get performance history
  getLoadTimeHistory(operation?: string): LoadTimeMetric[] {
    if (operation) {
      return this.loadTimes.filter((m) => m.operation === operation);
    }
    return [...this.loadTimes];
  }

  // Get custom metric history
  getCustomMetricHistory(metricName: string): PerformanceMetric[] {
    return this.metrics.get(metricName) || [];
  }

  // Get performance alerts
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  // Clear alerts
  clearAlerts(): void {
    this.alerts = [];
  }

  // Check for performance alerts
  private checkPerformanceAlerts(metric: LoadTimeMetric): void {
    // Check slow load time
    if (metric.loadTime > this.performanceThresholds.slowLoadTime) {
      this.addAlert({
        type: 'slow_load',
        message: `Slow operation: ${metric.operation} took ${metric.loadTime}ms`,
        value: metric.loadTime,
        threshold: this.performanceThresholds.slowLoadTime,
        timestamp: new Date()
      });
    }

    // Check error rate
    const recentOps = this.loadTimes.slice(-20); // Last 20 operations
    if (recentOps.length >= 10) {
      const errorRate = recentOps.filter((op) => !op.success).length / recentOps.length;
      if (errorRate > this.performanceThresholds.highErrorRate) {
        this.addAlert({
          type: 'error_rate_high',
          message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
          value: errorRate,
          threshold: this.performanceThresholds.highErrorRate,
          timestamp: new Date()
        });
      }
    }

    // Check memory usage
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > this.performanceThresholds.highMemoryUsage) {
      this.addAlert({
        type: 'memory_high',
        message: `High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        value: memoryUsage,
        threshold: this.performanceThresholds.highMemoryUsage,
        timestamp: new Date()
      });
    }
  }

  // Add performance alert
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Keep only recent alerts (last 50)
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // Log critical alerts
    if (alert.type === 'memory_high' || alert.type === 'error_rate_high') {
      console.warn(`Performance Alert: ${alert.message}`);
    }
  }

  // Start periodic monitoring
  private startPeriodicMonitoring(): void {
    // Monitor every 30 seconds
    setInterval(() => {
      this.recordMetric('memory_usage', this.getMemoryUsage());
      this.recordMetric('uptime', performance.now() - this.startTime);

      // Calculate cache hit rate if available
      const cacheStats = this.getCacheStats();
      if (cacheStats) {
        this.recordMetric('cache_hit_rate', cacheStats.hitRate);
        this.recordMetric('cache_size', cacheStats.size);
      }
    }, 30000);
  }

  // Get cache statistics (would integrate with analytics cache)
  private getCacheStats(): {hitRate: number;size: number;} | null {
    try {
      // This would integrate with the analytics cache
      // For now, return simulated data
      return {
        hitRate: Math.random() * 0.4 + 0.6, // 60-100% hit rate
        size: Math.floor(Math.random() * 50) + 10 // 10-60 entries
      };
    } catch {
      return null;
    }
  }

  // Generate performance report
  generateReport(): any {
    const stats = this.getMetrics();
    const recentAlerts = this.alerts.slice(-10);

    return {
      monitorName: this.monitorName,
      generatedAt: new Date().toISOString(),
      stats,
      alerts: recentAlerts,
      recommendations: this.generateRecommendations(stats),
      uptime: performance.now() - this.startTime,
      healthScore: this.calculateHealthScore(stats)
    };
  }

  // Generate performance recommendations
  private generateRecommendations(stats: PerformanceStats): string[] {
    const recommendations: string[] = [];

    if (stats.averageLoadTime > 2000) {
      recommendations.push('Consider enabling caching to improve load times');
    }

    if (stats.successRate < 0.95) {
      recommendations.push('High error rate detected - review error handling and data validation');
    }

    if (stats.memoryUsage && stats.memoryUsage > 50 * 1024 * 1024) {
      recommendations.push('High memory usage - consider optimizing data structures and garbage collection');
    }

    if (stats.maxLoadTime > 5000) {
      recommendations.push('Some operations are very slow - consider database query optimization');
    }

    return recommendations;
  }

  // Calculate health score (0-100)
  private calculateHealthScore(stats: PerformanceStats): number {
    let score = 100;

    // Deduct points for slow performance
    if (stats.averageLoadTime > 1000) {
      score -= Math.min(30, (stats.averageLoadTime - 1000) / 100);
    }

    // Deduct points for errors
    if (stats.successRate < 1) {
      score -= (1 - stats.successRate) * 50;
    }

    // Deduct points for high memory usage
    if (stats.memoryUsage && stats.memoryUsage > 50 * 1024 * 1024) {
      score -= Math.min(20, (stats.memoryUsage - 50 * 1024 * 1024) / (1024 * 1024));
    }

    return Math.max(0, Math.min(100, score));
  }

  // Export performance data
  exportData(): any {
    return {
      monitorName: this.monitorName,
      loadTimes: this.loadTimes,
      customMetrics: Array.from(this.metrics.entries()),
      alerts: this.alerts,
      stats: this.getMetrics(),
      exportedAt: new Date().toISOString()
    };
  }

  // Clear all performance data
  clear(): void {
    this.loadTimes = [];
    this.metrics.clear();
    this.alerts = [];
  }

  // Measure function execution time
  async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    let success = true;
    let error: Error | undefined;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err : new Error('Unknown error');
      throw err;
    } finally {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      this.recordLoadTime(loadTime, operation, success, error?.message);
    }
  }

  // Measure synchronous function execution time
  measure<T>(operation: string, fn: () => T): T {
    const startTime = performance.now();
    let success = true;
    let error: Error | undefined;

    try {
      const result = fn();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err : new Error('Unknown error');
      throw err;
    } finally {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      this.recordLoadTime(loadTime, operation, success, error?.message);
    }
  }
}

class AnalyticsPerformance {
  private monitors = new Map<string, PerformanceMonitor>();

  // Create or get performance monitor
  createMonitor(name: string): PerformanceMonitor {
    if (!this.monitors.has(name)) {
      this.monitors.set(name, new PerformanceMonitor(name));
    }
    return this.monitors.get(name)!;
  }

  // Get existing monitor
  getMonitor(name: string): PerformanceMonitor | null {
    return this.monitors.get(name) || null;
  }

  // Get all monitors
  getAllMonitors(): Map<string, PerformanceMonitor> {
    return new Map(this.monitors);
  }

  // Remove monitor
  removeMonitor(name: string): boolean {
    return this.monitors.delete(name);
  }

  // Generate comprehensive report
  generateGlobalReport(): any {
    const reports = Array.from(this.monitors.values()).map((monitor) => monitor.generateReport());

    return {
      generatedAt: new Date().toISOString(),
      totalMonitors: this.monitors.size,
      monitors: reports,
      globalHealthScore: this.calculateGlobalHealthScore(reports),
      summary: this.generateGlobalSummary(reports)
    };
  }

  // Calculate global health score
  private calculateGlobalHealthScore(reports: any[]): number {
    if (reports.length === 0) return 100;

    const totalScore = reports.reduce((sum, report) => sum + report.healthScore, 0);
    return totalScore / reports.length;
  }

  // Generate global summary
  private generateGlobalSummary(reports: any[]): any {
    const totalOperations = reports.reduce((sum, report) => sum + report.stats.totalOperations, 0);
    const totalErrors = reports.reduce((sum, report) => sum + report.stats.errorCount, 0);
    const avgLoadTime = reports.reduce((sum, report) => sum + report.stats.averageLoadTime, 0) / reports.length;

    return {
      totalOperations,
      totalErrors,
      globalErrorRate: totalOperations > 0 ? totalErrors / totalOperations : 0,
      averageLoadTime: avgLoadTime || 0,
      activeMonitors: reports.length,
      totalAlerts: reports.reduce((sum, report) => sum + report.alerts.length, 0)
    };
  }

  // Clear all monitors
  clearAll(): void {
    this.monitors.forEach((monitor) => monitor.clear());
  }

  // Export all performance data
  exportAllData(): any {
    const data: any = {};

    this.monitors.forEach((monitor, name) => {
      data[name] = monitor.exportData();
    });

    return {
      exportedAt: new Date().toISOString(),
      monitors: data,
      globalReport: this.generateGlobalReport()
    };
  }
}

export const analyticsPerformance = new AnalyticsPerformance();
export default analyticsPerformance;