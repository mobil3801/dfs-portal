import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Gauge,
  Monitor,
  RefreshCw,
  TrendingUp,
  Zap } from
'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  timing: {
    renderTime: number;
    apiResponseTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
  };
  network: {
    activeConnections: number;
    requestsPerMinute: number;
    errorRate: number;
    avgLatency: number;
  };
  resources: {
    cacheHitRate: number;
    backgroundTasks: number;
    eventListeners: number;
    domNodes: number;
  };
  vitals: {
    cls: number; // Cumulative Layout Shift
    fid: number; // First Input Delay
    lcp: number; // Largest Contentful Paint
    ttfb: number; // Time to First Byte
  };
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolve?: boolean;
}

interface OptimizationSuggestion {
  category: 'memory' | 'network' | 'rendering' | 'caching';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  action?: () => void;
}

const PerformanceMonitoringSystem: React.FC = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(false);

  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const lastMetrics = useRef<PerformanceMetrics | null>(null);
  const alertHistory = useRef<Alert[]>([]);

  /**
   * Collect comprehensive performance metrics
   */
  const collectMetrics = useCallback((): PerformanceMetrics => {
    // Memory metrics
    const memoryInfo = 'memory' in performance ? (performance as any).memory : null;
    const memoryUsed = memoryInfo?.usedJSHeapSize || 0;
    const memoryTotal = memoryInfo?.totalJSHeapSize || 1;
    const memoryPercentage = memoryUsed / memoryTotal * 100;

    // Calculate memory trend
    let memoryTrend: 'up' | 'down' | 'stable' = 'stable';
    if (lastMetrics.current) {
      const lastPercentage = lastMetrics.current.memory.percentage;
      if (memoryPercentage > lastPercentage + 5) memoryTrend = 'up';else
      if (memoryPercentage < lastPercentage - 5) memoryTrend = 'down';
    }

    // Timing metrics
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const navigationEntry = navigationEntries[0];

    // Network metrics (estimated)
    const networkEntries = performance.getEntriesByType('resource');
    const recentRequests = networkEntries.filter((entry) =>
    Date.now() - entry.startTime < 60000 // Last minute
    );

    const avgLatency = recentRequests.length > 0 ?
    recentRequests.reduce((sum, entry) => sum + entry.duration, 0) / recentRequests.length :
    0;

    // Resource metrics
    const domNodes = document.querySelectorAll('*').length;
    const eventListeners = getEventListenerCount();

    // Web Vitals (simplified)
    const vitals = getWebVitals();

    return {
      memory: {
        used: memoryUsed,
        total: memoryTotal,
        percentage: memoryPercentage,
        trend: memoryTrend
      },
      timing: {
        renderTime: performance.now(),
        apiResponseTime: avgLatency,
        domContentLoaded: navigationEntry?.domContentLoadedEventEnd - navigationEntry?.domContentLoadedEventStart || 0,
        firstContentfulPaint: getFirstContentfulPaint() || 0
      },
      network: {
        activeConnections: estimateActiveConnections(),
        requestsPerMinute: recentRequests.length,
        errorRate: calculateErrorRate(recentRequests),
        avgLatency
      },
      resources: {
        cacheHitRate: calculateCacheHitRate(),
        backgroundTasks: getBackgroundTaskCount(),
        eventListeners,
        domNodes
      },
      vitals
    };
  }, []);

  /**
   * Get Web Vitals metrics
   */
  const getWebVitals = (): PerformanceMetrics['vitals'] => {
    const cls = getCLS();
    const fid = getFID();
    const lcp = getLCP();
    const ttfb = getTTFB();

    return { cls, fid, lcp, ttfb };
  };

  /**
   * Get Cumulative Layout Shift
   */
  const getCLS = (): number => {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });

    try {
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
































































































































































































































































































































































      // Layout shift not supported
    }return clsValue;}; /**
  * Get First Input Delay
  */const getFID = (): number => {let fidValue = 0;const observer = new PerformanceObserver((list) => {for (const entry of list.getEntries()) {fidValue = (entry as any).processingStart - entry.startTime;}});try {observer.observe({ type: 'first-input', buffered: true });} catch (e) {
















      // First input not supported
    }return fidValue;}; /**
  * Get Largest Contentful Paint
  */const getLCP = (): number => {const entries = performance.getEntriesByType('largest-contentful-paint');return entries.length > 0 ? entries[entries.length - 1].startTime : 0;}; /**
  * Get Time to First Byte
  */const getTTFB = (): number => {const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];const navigationEntry = navigationEntries[0];return navigationEntry ? navigationEntry.responseStart - navigationEntry.requestStart : 0;}; /**
  * Get First Contentful Paint
  */const getFirstContentfulPaint = (): number | null => {const entries = performance.getEntriesByName('first-contentful-paint');return entries.length > 0 ? entries[0].startTime : null;}; /**
  * Estimate event listener count
  */const getEventListenerCount = (): number => {// This is an approximation since there's no direct API
    const elements = document.querySelectorAll('*');let count = 0;elements.forEach((element) => {const events = ['click', 'scroll', 'mouseover', 'keydown', 'resize'];events.forEach((eventType) => {if ((element as any)[`on${eventType}`]) count++;});});return count;}; /**
  * Estimate active connections
  */const estimateActiveConnections = (): number => {// Estimate based on recent network activity
    const recentEntries = performance.getEntriesByType('resource').filter((entry) => Date.now() - entry.startTime < 10000 // Last 10 seconds
    );return recentEntries.length;}; /**
  * Calculate error rate from performance entries
  */const calculateErrorRate = (entries: PerformanceEntry[]): number => {if (entries.length === 0) return 0;const errorEntries = entries.filter((entry) => {// This is a simplified check - in reality you'd need more sophisticated error detection
        return entry.duration === 0 || entry.name.includes('error');});return errorEntries.length / entries.length * 100;}; /**
  * Calculate cache hit rate
  */const calculateCacheHitRate = (): number => {// This would integrate with your actual cache implementation
    // For now, return a mock value
    return Math.random() * 100;}; /**
  * Get background task count
  */const getBackgroundTaskCount = (): number => {// Count various background activities
    const intervals = (window as any).__intervals__ || [];const timeouts = (window as any).__timeouts__ || [];const observers = (window as any).__observers__ || [];return intervals.length + timeouts.length + observers.length;}; /**
  * Analyze metrics and generate alerts
  */const analyzeMetrics = useCallback((currentMetrics: PerformanceMetrics) => {const newAlerts: Alert[] = []; // Memory alerts
      if (currentMetrics.memory.percentage > 80) {newAlerts.push({ id: `memory-high-${Date.now()}`, type: 'warning', title: 'High Memory Usage', message: `Memory usage is at ${currentMetrics.memory.percentage.toFixed(1)}%`, timestamp: Date.now(), severity: currentMetrics.memory.percentage > 90 ? 'critical' : 'high', autoResolve: true });} // Performance alerts
      if (currentMetrics.timing.apiResponseTime > 2000) {newAlerts.push({ id: `api-slow-${Date.now()}`, type: 'warning', title: 'Slow API Response', message: `Average API response time is ${currentMetrics.timing.apiResponseTime.toFixed(0)}ms`, timestamp: Date.now(), severity: 'medium' });} // Network alerts
      if (currentMetrics.network.errorRate > 10) {newAlerts.push({ id: `network-errors-${Date.now()}`, type: 'error', title: 'High Network Error Rate', message: `Network error rate is ${currentMetrics.network.errorRate.toFixed(1)}%`, timestamp: Date.now(), severity: 'high' });} // Web Vitals alerts
      if (currentMetrics.vitals.cls > 0.1) {newAlerts.push({ id: `cls-poor-${Date.now()}`, type: 'warning', title: 'Poor Layout Stability', message: `Cumulative Layout Shift is ${currentMetrics.vitals.cls.toFixed(3)}`, timestamp: Date.now(), severity: 'medium' });}if (currentMetrics.vitals.lcp > 2500) {newAlerts.push({ id: `lcp-slow-${Date.now()}`, type: 'warning', title: 'Slow Loading Performance', message: `Largest Contentful Paint is ${currentMetrics.vitals.lcp.toFixed(0)}ms`, timestamp: Date.now(), severity: 'medium' });} // Add new alerts
      if (newAlerts.length > 0) {setAlerts((prev) => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
        alertHistory.current = [...newAlerts, ...alertHistory.current]; // Show toast for critical alerts
        newAlerts.forEach((alert) => {if (alert.severity === 'critical') {toast({ title: alert.title, description: alert.message, variant: 'destructive' });}});}}, [toast]); /**
  * Generate optimization suggestions
  */const generateSuggestions = useCallback((currentMetrics: PerformanceMetrics) => {const newSuggestions: OptimizationSuggestion[] = [];if (currentMetrics.memory.percentage > 70) {newSuggestions.push({ category: 'memory', title: 'Optimize Memory Usage', description: 'Consider implementing virtual scrolling for large lists and clearing unused data.', impact: 'high', effort: 'medium', action: () => {// Trigger memory cleanup
              if ('gc' in window) {(window as any).gc();}toast({ title: 'Memory cleanup attempted', description: 'Forced garbage collection.' });} });}if (currentMetrics.network.avgLatency > 1000) {newSuggestions.push({ category: 'network', title: 'Optimize Network Requests', description: 'Implement request batching and connection pooling to reduce latency.', impact: 'high', effort: 'medium' });}if (currentMetrics.resources.domNodes > 3000) {newSuggestions.push({ category: 'rendering', title: 'Reduce DOM Complexity', description: 'Consider using virtual scrolling or pagination to reduce DOM node count.', impact: 'medium', effort: 'high' });}if (currentMetrics.resources.cacheHitRate < 60) {newSuggestions.push({ category: 'caching', title: 'Improve Cache Strategy', description: 'Implement better caching strategies to improve cache hit rate.', impact: 'medium', effort: 'low' });}setSuggestions(newSuggestions);}, [toast]); /**
  * Start monitoring
  */const startMonitoring = useCallback(() => {if (monitoringInterval.current) return;setIsMonitoring(true); // Collect initial metrics
      const initialMetrics = collectMetrics();setMetrics(initialMetrics);lastMetrics.current = initialMetrics; // Set up periodic collection
      monitoringInterval.current = setInterval(() => {const currentMetrics = collectMetrics();setMetrics(currentMetrics);analyzeMetrics(currentMetrics);generateSuggestions(currentMetrics);lastMetrics.current = currentMetrics;}, 5000); // Every 5 seconds
      toast({ title: 'Performance Monitoring Started', description: 'Real-time performance monitoring is now active.' });}, [collectMetrics, analyzeMetrics, generateSuggestions, toast]); /**
  * Stop monitoring
  */const stopMonitoring = useCallback(() => {if (monitoringInterval.current) {clearInterval(monitoringInterval.current);monitoringInterval.current = null;}if (performanceObserver.current) {performanceObserver.current.disconnect();}setIsMonitoring(false);toast({ title: 'Performance Monitoring Stopped', description: 'Real-time performance monitoring has been paused.' });}, [toast]); /**
  * Auto-dismiss alerts
  */useEffect(() => {const dismissTimeout = setTimeout(() => {setAlerts((prev) => prev.filter((alert) => !alert.autoResolve || Date.now() - alert.timestamp < 30000));}, 30000);return () => clearTimeout(dismissTimeout);}, [alerts]); /**
  * Initialize monitoring on mount
  */useEffect(() => {startMonitoring();return () => {stopMonitoring();};}, [startMonitoring, stopMonitoring]); /**
  * Get status color based on metric value
  */const getStatusColor = (value: number, thresholds: {good: number;warning: number;}) => {if (value <= thresholds.good) return 'text-green-600';if (value <= thresholds.warning) return 'text-yellow-600';return 'text-red-600';}; /**
  * Format metric values
  */const formatBytes = (bytes: number) => {if (bytes === 0) return '0 B';const k = 1024;const sizes = ['B', 'KB', 'MB', 'GB'];const i = Math.floor(Math.log(bytes) / Math.log(k));return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];};const formatTime = (ms: number) => {if (ms < 1000) return `${ms.toFixed(0)}ms`;return `${(ms / 1000).toFixed(2)}s`;};if (!metrics) {return <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
            <p>Collecting performance metrics...</p>
          </div>
        </CardContent>
      </Card>;}return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Monitor className="h-6 w-6" />
          Performance Monitoring
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Active' : 'Paused'}
          </Badge>
          <Button onClick={isMonitoring ? stopMonitoring : startMonitoring} variant="outline" size="sm">

            {isMonitoring ? 'Pause' : 'Start'} Monitoring
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">

          {alerts.slice(0, 3).map((alert) => <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'} className="animate-pulse">

              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{alert.title}</strong>: {alert.message}
                  </div>
                  <Badge variant="outline">
                    {alert.severity}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>)}
        </motion.div>}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Memory Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={getStatusColor(metrics.memory.percentage, { good: 50, warning: 80 })}>
                      {metrics.memory.percentage.toFixed(1)}%
                    </span>
                    <Badge variant="outline">
                      {metrics.memory.trend === 'up' ? '↗' : metrics.memory.trend === 'down' ? '↘' : '→'}
                    </Badge>
                  </div>
                  <Progress value={metrics.memory.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* API Response Time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  API Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <span className={getStatusColor(metrics.timing.apiResponseTime, { good: 500, warning: 1000 })}>
                    {formatTime(metrics.timing.apiResponseTime)}
                  </span>
                  <Progress value={Math.min(metrics.timing.apiResponseTime / 3000 * 100, 100)} className="h-2" />

                  <p className="text-xs text-muted-foreground">
                    Avg response time
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Network Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>{metrics.network.activeConnections}</span>
                    <Badge variant={metrics.network.errorRate > 5 ? 'destructive' : 'default'}>
                      {metrics.network.errorRate.toFixed(1)}% errors
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active connections
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {calculateOverallScore(metrics)}
                    </span>
                    <Badge variant={calculateOverallScore(metrics) > 80 ? 'default' : 'secondary'}>
                      {calculateOverallScore(metrics) > 80 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overall score
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Heap Memory</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span>{formatBytes(metrics.memory.used)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{formatBytes(metrics.memory.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usage:</span>
                      <span className={getStatusColor(metrics.memory.percentage, { good: 50, warning: 80 })}>
                        {metrics.memory.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Resources</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>DOM Nodes:</span>
                      <span>{metrics.resources.domNodes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Event Listeners:</span>
                      <span>{metrics.resources.eventListeners}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Background Tasks:</span>
                      <span>{metrics.resources.backgroundTasks}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active Connections:</span>
                    <span>{metrics.network.activeConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requests/min:</span>
                    <span>{metrics.network.requestsPerMinute}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate:</span>
                    <span className={getStatusColor(metrics.network.errorRate, { good: 2, warning: 5 })}>
                      {metrics.network.errorRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Latency:</span>
                    <span className={getStatusColor(metrics.network.avgLatency, { good: 200, warning: 500 })}>
                      {formatTime(metrics.network.avgLatency)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cache Hit Rate:</span>
                    <span className={getStatusColor(100 - metrics.resources.cacheHitRate, { good: 20, warning: 50 })}>
                      {metrics.resources.cacheHitRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>LCP (Largest Contentful Paint):</span>
                    <span className={getStatusColor(metrics.vitals.lcp, { good: 2500, warning: 4000 })}>
                      {formatTime(metrics.vitals.lcp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>FID (First Input Delay):</span>
                    <span className={getStatusColor(metrics.vitals.fid, { good: 100, warning: 300 })}>
                      {formatTime(metrics.vitals.fid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLS (Cumulative Layout Shift):</span>
                    <span className={getStatusColor(metrics.vitals.cls * 1000, { good: 100, warning: 250 })}>
                      {metrics.vitals.cls.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>TTFB (Time to First Byte):</span>
                    <span className={getStatusColor(metrics.vitals.ttfb, { good: 600, warning: 1200 })}>
                      {formatTime(metrics.vitals.ttfb)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{suggestion.category}</Badge>
                        <Badge variant={suggestion.impact === 'high' ? 'default' : 'secondary'}>
                          {suggestion.impact} impact
                        </Badge>
                        <Badge variant={suggestion.effort === 'low' ? 'default' : 'secondary'}>
                          {suggestion.effort} effort
                        </Badge>
                      </div>
                      <h4 className="font-semibold">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>
                    {suggestion.action && <Button onClick={suggestion.action} size="sm">
                        <Zap className="mr-2 h-4 w-4" />
                        Apply Fix
                      </Button>}
                  </div>
                </CardContent>
              </Card>)}
            
            {suggestions.length === 0 && <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-muted-foreground">No optimization suggestions at this time.</p>
                    <p className="text-sm text-muted-foreground">Your application is performing well!</p>
                  </div>
                </CardContent>
              </Card>}
          </div>
        </TabsContent>
      </Tabs>
    </div>;}; /**
* Calculate overall performance score
*/const calculateOverallScore = (metrics: PerformanceMetrics): number => {let score = 100; // Memory penalty
  if (metrics.memory.percentage > 80) score -= 20;else if (metrics.memory.percentage > 60) score -= 10; // Timing penalty
  if (metrics.timing.apiResponseTime > 2000) score -= 15;else if (metrics.timing.apiResponseTime > 1000) score -= 8; // Network penalty
  if (metrics.network.errorRate > 5) score -= 15;else if (metrics.network.errorRate > 2) score -= 8; // Web Vitals penalty
  if (metrics.vitals.lcp > 4000) score -= 10;else if (metrics.vitals.lcp > 2500) score -= 5;if (metrics.vitals.cls > 0.25) score -= 10;else if (metrics.vitals.cls > 0.1) score -= 5;return Math.max(0, Math.round(score));};export default PerformanceMonitoringSystem;