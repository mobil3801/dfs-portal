import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Shield,
  Activity,
  TrendingUp,
  Bell,
  CheckCircle,
  XCircle,
  Clock } from
'lucide-react';
import { EnhancedErrorLogger } from '@/services/enhancedErrorLogger';
import { useToast } from '@/hooks/use-toast';
import useAdminAccess from '@/hooks/use-admin-access';

interface ErrorAlert {
  id: string;
  type: 'spike' | 'pattern' | 'critical' | 'recovery';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
}

const ErrorMonitoringWidget: React.FC = () => {
  const { hasMonitoringAccess } = useAdminAccess();
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [activeAlerts, setActiveAlerts] = useState<ErrorAlert[]>([]);
  const [errorTrend, setErrorTrend] = useState<'increasing' | 'stable' | 'decreasing'>('stable');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { toast } = useToast();

  const errorLogger = EnhancedErrorLogger.getInstance();

  // Return null if user doesn't have monitoring access
  if (!hasMonitoringAccess) {
    return null;
  }

  const checkSystemHealth = () => {
    const analytics = errorLogger.getAnalytics();
    if (!analytics) return;

    const newAlerts: ErrorAlert[] = [];
    let newStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check for error spikes
    if (analytics.trends.hourly > 5) {
      newStatus = 'critical';
      newAlerts.push({
        id: `spike-${Date.now()}`,
        type: 'spike',
        message: `High error rate detected: ${analytics.trends.hourly} errors in the last hour`,
        timestamp: new Date(),
        severity: 'critical',
        acknowledged: false
      });
    } else if (analytics.trends.hourly > 2) {
      newStatus = 'warning';
      newAlerts.push({
        id: `spike-${Date.now()}`,
        type: 'spike',
        message: `Elevated error rate: ${analytics.trends.hourly} errors in the last hour`,
        timestamp: new Date(),
        severity: 'medium',
        acknowledged: false
      });
    }

    // Check for critical patterns
    const criticalPatterns = errorLogger.getCriticalPatterns();
    if (criticalPatterns.length > 0) {
      newStatus = Math.max(newStatus === 'critical' ? 2 : newStatus === 'warning' ? 1 : 0, 1) === 2 ? 'critical' : 'warning';
      criticalPatterns.forEach((pattern) => {
        newAlerts.push({
          id: `pattern-${pattern.id}-${Date.now()}`,
          type: 'pattern',
          message: `Critical pattern detected: ${pattern.name} (${pattern.frequency} occurrences)`,
          timestamp: new Date(),
          severity: pattern.severity,
          acknowledged: false
        });
      });
    }

    // Determine trend
    const recentErrors = analytics.trends.hourly;
    const olderErrors = analytics.trends.daily - analytics.trends.hourly;
    const avgOlderRate = olderErrors / 23; // Average per hour for the other 23 hours

    if (recentErrors > avgOlderRate * 1.5) {
      setErrorTrend('increasing');
    } else if (recentErrors < avgOlderRate * 0.5) {
      setErrorTrend('decreasing');
    } else {
      setErrorTrend('stable');
    }

    // Update state
    setSystemStatus(newStatus);
    setActiveAlerts((prev) => {
      const existingIds = prev.map((alert) => alert.id);
      const uniqueNewAlerts = newAlerts.filter((alert) => !existingIds.includes(alert.id));
      return [...prev, ...uniqueNewAlerts].slice(-10); // Keep last 10 alerts
    });
    setLastUpdate(new Date());

    // Show toast for critical alerts
    newAlerts.forEach((alert) => {
      if (alert.severity === 'critical') {
        toast({
          title: "Critical Error Alert",
          description: alert.message,
          variant: "destructive"
        });
      }
    });
  };

  const acknowledgeAlert = (alertId: string) => {
    setActiveAlerts((prev) =>
    prev.map((alert) =>
    alert.id === alertId ? { ...alert, acknowledged: true } : alert
    )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':return 'text-red-600 bg-red-50 border-red-200';
      default:return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing':return <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />;
      default:return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  useEffect(() => {
    // Initial check
    checkSystemHealth();

    // Set up periodic monitoring
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const unacknowledgedAlerts = activeAlerts.filter((alert) => !alert.acknowledged);

  return (
    <div className="space-y-4">
      {/* System Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Health Monitor
            </div>
            <Badge className={getStatusColor(systemStatus)}>
              {systemStatus.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                {systemStatus === 'healthy' ?
                <CheckCircle className="h-6 w-6 text-green-500" /> :
                systemStatus === 'warning' ?
                <AlertTriangle className="h-6 w-6 text-yellow-500" /> :

                <XCircle className="h-6 w-6 text-red-500" />
                }
              </div>
              <div className="text-sm font-medium">Status</div>
              <div className="text-xs text-muted-foreground">{systemStatus}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                {getTrendIcon(errorTrend)}
              </div>
              <div className="text-sm font-medium">Trend</div>
              <div className="text-xs text-muted-foreground">{errorTrend}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Bell className={`h-6 w-6 ${unacknowledgedAlerts.length > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
              </div>
              <div className="text-sm font-medium">Alerts</div>
              <div className="text-xs text-muted-foreground">{unacknowledgedAlerts.length} new</div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Auto-refresh: 30s</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {activeAlerts.length > 0 &&
      <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Alerts
              {unacknowledgedAlerts.length > 0 &&
            <Badge variant="destructive" className="ml-2">
                  {unacknowledgedAlerts.length} new
                </Badge>
            }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.slice(-5).reverse().map((alert) =>
            <Alert
              key={alert.id}
              className={`${alert.acknowledged ? 'opacity-60' : ''} ${
              alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
              alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
              alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
              'border-blue-200 bg-blue-50'}`
              }>

                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                        variant="outline"
                        className={`text-xs ${
                        alert.severity === 'critical' ? 'border-red-300 text-red-700' :
                        alert.severity === 'high' ? 'border-orange-300 text-orange-700' :
                        alert.severity === 'medium' ? 'border-yellow-300 text-yellow-700' :
                        'border-blue-300 text-blue-700'}`
                        }>

                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.type}
                          </Badge>
                          {alert.acknowledged &&
                      <Badge variant="secondary" className="text-xs">
                              acknowledged
                            </Badge>
                      }
                        </div>
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                      {!alert.acknowledged &&
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="ml-2">

                          Acknowledge
                        </Button>
                  }
                    </div>
                  </AlertDescription>
                </Alert>
            )}
            </div>
          </CardContent>
        </Card>
      }

      {/* No Alerts State */}
      {activeAlerts.length === 0 &&
      <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">
                No active alerts. System is operating normally.
              </p>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default ErrorMonitoringWidget;