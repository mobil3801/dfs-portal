import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Eye, TrendingUp, RefreshCw, Clock, User, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuditLogEntry {
  id: number;
  event_type: string;
  username: string;
  ip_address: string;
  event_timestamp: string;
  event_status: string;
  resource_accessed: string;
  action_performed: string;
  failure_reason: string;
  risk_level: string;
  station: string;
}

interface AuditStats {
  totalEvents: number;
  failedAttempts: number;
  suspiciousActivity: number;
  securityScore: number;
}

const AuditLogDashboard: React.FC = () => {
  const [auditStats, setAuditStats] = useState<AuditStats>({
    totalEvents: 0,
    failedAttempts: 0,
    suspiciousActivity: 0,
    securityScore: 100
  });
  const [recentEvents, setRecentEvents] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      console.log('Fetching real-time audit log data...');

      // Fetch recent audit logs (table ID: 12706)
      const { data: auditData, error: auditError } = await window.ezsite.apis.tablePage(12706, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "event_timestamp",
        IsAsc: false,
        Filters: []
      });

      if (auditError) {
        console.error('Error fetching audit logs:', auditError);
        throw new Error(auditError);
      }

      const logs = auditData?.List || [];
      console.log('Audit logs loaded:', logs.length, 'entries');

      // Calculate statistics from real data
      const totalEvents = logs.length;
      const failedAttempts = logs.filter((log: AuditLogEntry) =>
      log.event_status === 'Failed' || log.event_status === 'Blocked'
      ).length;
      const suspiciousActivity = logs.filter((log: AuditLogEntry) =>
      log.risk_level === 'High' || log.risk_level === 'Critical'
      ).length;

      // Calculate security score based on success rate
      const successfulEvents = logs.filter((log: AuditLogEntry) => log.event_status === 'Success').length;
      const securityScore = totalEvents > 0 ? Math.round(successfulEvents / totalEvents * 100) : 100;

      setAuditStats({
        totalEvents,
        failedAttempts,
        suspiciousActivity,
        securityScore
      });

      // Set recent events (last 10)
      setRecentEvents(logs.slice(0, 10));

    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast({
        title: "Error Loading Audit Data",
        description: "Failed to fetch audit log information. Please try again.",
        variant: "destructive"
      });

      // Set default values if fetch fails
      setAuditStats({
        totalEvents: 0,
        failedAttempts: 0,
        suspiciousActivity: 0,
        securityScore: 100
      });
      setRecentEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAuditData();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Audit log data has been updated with latest information."
    });
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const formatTimeAgo = (timestamp: string): string => {
    if (!timestamp) return 'unknown time';
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getEventStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'failed':
      case 'blocked':
        return 'bg-red-500 text-white';
      case 'suspicious':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />;
      case 'data access':
      case 'data modification':
        return <Eye className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading real-time audit data...</p>
        </div>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Log Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time security monitoring and audit trail analysis
          </p>
        </div>
        <Button
          onClick={refreshData}
          disabled={refreshing}
          variant="outline"
          size="sm">

          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold">{auditStats.totalEvents.toLocaleString()}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All recorded events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Attempts</p>
                <p className="text-3xl font-bold text-red-600">{auditStats.failedAttempts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {auditStats.totalEvents > 0 ?
              `${(auditStats.failedAttempts / auditStats.totalEvents * 100).toFixed(1)}% of total events` :
              'No events recorded'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspicious Activity</p>
                <p className="text-3xl font-bold text-orange-600">{auditStats.suspiciousActivity}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {auditStats.suspiciousActivity > 0 ? 'Requires attention' : 'All clear'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className={`text-3xl font-bold ${
                auditStats.securityScore >= 95 ? 'text-green-600' :
                auditStats.securityScore >= 80 ? 'text-yellow-600' : 'text-red-600'}`
                }>{auditStats.securityScore}%</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${
              auditStats.securityScore >= 95 ? 'text-green-600' :
              auditStats.securityScore >= 80 ? 'text-yellow-600' : 'text-red-600'}`
              } />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on security events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {auditStats.suspiciousActivity > 0 &&
      <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong>Security Alert:</strong> {auditStats.suspiciousActivity} suspicious activities detected. 
            Review the recent events below for more details.
          </AlertDescription>
        </Alert>
      }

      {auditStats.securityScore < 80 &&
      <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong>Low Security Score:</strong> Your system security score is {auditStats.securityScore}%. 
            This indicates a high number of failed or blocked events that require investigation.
          </AlertDescription>
        </Alert>
      }

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ?
          <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No audit events recorded yet.</p>
              <p className="text-sm mt-1">Security events will appear here as they occur.</p>
            </div> :

          <div className="space-y-3">
              {recentEvents.map((event) =>
            <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getEventStatusColor(event.event_status)}>
                      {getEventIcon(event.event_type)}
                      <span className="ml-1">{event.event_status}</span>
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {event.event_type}: {event.action_performed || event.resource_accessed || 'System action'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.username || 'Unknown user'} from {event.ip_address || 'unknown IP'}
                        {event.station && ` • Station: ${event.station}`}
                        {event.failure_reason && ` • Reason: ${event.failure_reason}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeAgo(event.event_timestamp)}
                    </span>
                    {event.risk_level && event.risk_level !== 'Low' &&
                <Badge
                  variant={event.risk_level === 'Critical' ? 'destructive' : 'secondary'}
                  className="mt-1 text-xs">

                        {event.risk_level} Risk
                      </Badge>
                }
                  </div>
                </div>
            )}
            </div>
          }
        </CardContent>
      </Card>
    </div>);

};

export default AuditLogDashboard;