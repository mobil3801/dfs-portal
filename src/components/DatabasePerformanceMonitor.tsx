import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Database,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  Settings,
  Bell } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RealtimeAlertNotifications from '@/components/RealtimeAlertNotifications';

interface PerformanceMetrics {
  connectionTime: number;
  queryResponseTime: number;
  activeConnections: number;
  totalQueries: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  lastUpdated: string;
}

interface AlertThreshold {
  metric: string;
  threshold: number;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const DatabasePerformanceMonitor = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    connectionTime: 0,
    queryResponseTime: 0,
    activeConnections: 0,
    totalQueries: 0,
    errorRate: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    lastUpdated: new Date().toISOString()
  });

  const [alertThresholds, setAlertThresholds] = useState<AlertThreshold[]>([
  { metric: 'connectionTime', threshold: 2000, enabled: true, severity: 'high' },
  { metric: 'queryResponseTime', threshold: 1000, enabled: true, severity: 'medium' },
  { metric: 'errorRate', threshold: 5, enabled: true, severity: 'critical' },
  { metric: 'memoryUsage', threshold: 80, enabled: true, severity: 'high' },
  { metric: 'cpuUsage', threshold: 90, enabled: true, severity: 'critical' }]
  );

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<Array<{id: string;message: string;severity: string;timestamp: string;}>>([]);
  const [historicalData, setHistoricalData] = useState<PerformanceMetrics[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isMonitoring) {
      interval = setInterval(async () => {
        await collectMetrics();
      }, 5000); // Collect metrics every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  const collectMetrics = async () => {
    try {
      const startTime = Date.now();

      // Simulate database performance check
      const connectionTest = await testDatabaseConnection();
      const connectionTime = Date.now() - startTime;

      // Simulate query performance test
      const queryStartTime = Date.now();
      await testQueryPerformance();
      const queryResponseTime = Date.now() - queryStartTime;

      // Generate realistic performance metrics
      const newMetrics: PerformanceMetrics = {
        connectionTime,
        queryResponseTime,
        activeConnections: Math.floor(Math.random() * 20) + 5,
        totalQueries: metrics.totalQueries + Math.floor(Math.random() * 10) + 1,
        errorRate: Math.random() * 3, // 0-3% error rate
        memoryUsage: Math.random() * 30 + 50, // 50-80% memory usage
        cpuUsage: Math.random() * 40 + 30, // 30-70% CPU usage
        lastUpdated: new Date().toISOString()
      };

      setMetrics(newMetrics);

      // Add to historical data (keep last 50 readings)
      setHistoricalData((prev) => {
        const updated = [...prev, newMetrics];
        return updated.slice(-50);
      });

      // Check for threshold violations
      checkAlertThresholds(newMetrics);

    } catch (error) {
      console.error('Error collecting metrics:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to collect performance metrics",
        variant: "destructive"
      });
    }
  };

  const testDatabaseConnection = async () => {
    // Simulate connection test with error handling
    return new Promise((resolve, reject) => {
      try {
        setTimeout(() => resolve(true), Math.random() * 500 + 100);
      } catch (error) {
        console.warn('Database connection test error:', error);
        reject(error);
      }
    });
  };

  const testQueryPerformance = async () => {
    // Simulate query performance test
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), Math.random() * 300 + 50);
    });
  };

  const checkAlertThresholds = (currentMetrics: PerformanceMetrics) => {
    alertThresholds.forEach((threshold) => {
      if (!threshold.enabled) return;

      const metricValue = currentMetrics[threshold.metric as keyof PerformanceMetrics] as number;
      const isViolation = metricValue > threshold.threshold;

      if (isViolation) {
        const alertId = `${threshold.metric}_${Date.now()}`;
        const newAlert = {
          id: alertId,
          message: `${threshold.metric} exceeded threshold: ${metricValue.toFixed(2)} > ${threshold.threshold}`,
          severity: threshold.severity,
          timestamp: new Date().toISOString()
        };

        setAlerts((prev) => [newAlert, ...prev.slice(0, 19)]); // Keep last 20 alerts

        toast({
          title: `${threshold.severity.toUpperCase()} Alert`,
          description: newAlert.message,
          variant: threshold.severity === 'critical' ? 'destructive' : 'default'
        });
      }
    });
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      toast({
        title: "Monitoring Started",
        description: "Real-time database performance monitoring is now active"
      });
    } else {
      toast({
        title: "Monitoring Stopped",
        description: "Database performance monitoring has been paused"
      });
    }
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value > threshold * 0.9) return 'destructive';
    if (value > threshold * 0.7) return 'secondary';
    return 'default';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':return 'destructive';
      case 'high':return 'secondary';
      case 'medium':return 'outline';
      default:return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Performance Monitor
          </CardTitle>
          <CardDescription>
            Real-time monitoring of database connection and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
                className="flex items-center gap-2">

                {isMonitoring ? <XCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </Button>
              <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                {isMonitoring ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Last Updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Thresholds</TabsTrigger>
          <TabsTrigger value="history">Historical Data</TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Live Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Connection Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connection Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.connectionTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  Database connection latency
                </p>
                <Progress
                  value={metrics.connectionTime / 3000 * 100}
                  className="mt-2" />

              </CardContent>
            </Card>

            {/* Query Response Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Query Response</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.queryResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  Average query execution time
                </p>
                <Progress
                  value={metrics.queryResponseTime / 2000 * 100}
                  className="mt-2" />

              </CardContent>
            </Card>

            {/* Active Connections */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeConnections}</div>
                <p className="text-xs text-muted-foreground">
                  Current database connections
                </p>
                <Progress
                  value={metrics.activeConnections / 25 * 100}
                  className="mt-2" />

              </CardContent>
            </Card>

            {/* Error Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.errorRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  Database operation failures
                </p>
                <Progress
                  value={metrics.errorRate / 10 * 100}
                  className="mt-2" />

              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Database memory utilization
                </p>
                <Progress
                  value={metrics.memoryUsage}
                  className="mt-2" />

              </CardContent>
            </Card>

            {/* CPU Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cpuUsage.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Database CPU utilization
                </p>
                <Progress
                  value={metrics.cpuUsage}
                  className="mt-2" />

              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alert Thresholds Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Alert Thresholds
                </CardTitle>
                <CardDescription>
                  Configure monitoring thresholds and alert severity levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {alertThresholds.map((threshold, index) =>
                <div key={threshold.metric} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{threshold.metric.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="text-sm text-muted-foreground">
                        Threshold: {threshold.threshold}
                        {threshold.metric.includes('Time') ? 'ms' : threshold.metric.includes('Rate') || threshold.metric.includes('Usage') ? '%' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(threshold.severity)}>
                        {threshold.severity}
                      </Badge>
                      <Badge variant={threshold.enabled ? 'default' : 'secondary'}>
                        {threshold.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>
                  Latest threshold violations and system alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ?
                <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    No alerts detected
                  </div> :

                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {alerts.map((alert) =>
                  <Alert key={alert.id}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <span>{alert.message}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                  )}
                  </div>
                }
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Historical Performance Data
              </CardTitle>
              <CardDescription>
                Performance trends over the last {historicalData.length} monitoring cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historicalData.length === 0 ?
              <div className="text-center py-8 text-muted-foreground">
                  Start monitoring to collect historical performance data
                </div> :

              <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Data points collected: {historicalData.length}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Average Response Time</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {(historicalData.reduce((sum, data) => sum + data.queryResponseTime, 0) / historicalData.length).toFixed(0)}ms
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Average Error Rate</h4>
                      <div className="text-2xl font-bold text-red-600">
                        {(historicalData.reduce((sum, data) => sum + data.errorRate, 0) / historicalData.length).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <RealtimeAlertNotifications />
        </TabsContent>
      </Tabs>
    </div>);

};

export default DatabasePerformanceMonitor;