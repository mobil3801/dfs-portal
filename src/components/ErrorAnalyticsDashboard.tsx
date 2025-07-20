import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Clock,
  Activity,
  Shield,
  FileText,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle } from
'lucide-react';
import { EnhancedErrorLogger, ErrorPattern, formatErrorPattern, getSeverityColor } from '@/services/enhancedErrorLogger';
import { useToast } from '@/hooks/use-toast';

const ErrorAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState(null);
  const [patterns, setPatterns] = useState<ErrorPattern[]>([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const errorLogger = EnhancedErrorLogger.getInstance();

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const analyticsData = errorLogger.getAnalytics();
      const patternsData = errorLogger.getPatterns();
      const recommendationsData = errorLogger.getRecommendations();

      setAnalytics(analyticsData);
      setPatterns(patternsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      toast({
        title: "Error Loading Analytics",
        description: "Failed to refresh analytics data.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportReport = () => {
    try {
      const report = errorLogger.exportComprehensiveReport();
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `error-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      toast({
        title: "Report Exported",
        description: "Comprehensive error analytics report has been downloaded."
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analytics report.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    refreshData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>);

  }

  const criticalPatterns = patterns.filter((p) => p.severity === 'critical' || p.trend === 'increasing');
  const healthScore = Math.max(0, 100 - analytics.trends.hourly * 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Error Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and analysis of application errors
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            size="sm">

            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthScore.toFixed(0)}%</div>
            <Progress value={healthScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Based on recent error trends
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              Across all components and time periods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patterns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{patterns.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalPatterns.length} critical patterns detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.recoveryRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              System stability and error recovery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalPatterns.length > 0 &&
      <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-red-800">Critical Issues Detected:</strong> 
                <span className="ml-2 text-red-700">
                  {criticalPatterns.length} pattern(s) require immediate attention
                </span>
              </div>
              <Badge variant="destructive">{criticalPatterns.length}</Badge>
            </div>
          </AlertDescription>
        </Alert>
      }

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Error Patterns</TabsTrigger>
          <TabsTrigger value="trends">Trends & Metrics</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Error Distribution by Severity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Error Distribution by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.errorsBySeverity).map(([severity, count]) =>
                  <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getSeverityColor(severity)}>
                          {severity}
                        </Badge>
                        <span className="text-sm">{count} errors</span>
                      </div>
                      <div className="flex-1 mx-4">
                        <Progress
                        value={count / analytics.totalErrors * 100}
                        className="h-2" />

                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(count / analytics.totalErrors * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Error Components */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Components with Most Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.errorsByComponent).
                  sort(([, a], [, b]) => b - a).
                  slice(0, 5).
                  map(([component, count]) =>
                  <div key={component} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{component}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{count} errors</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Error Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Error Trends</CardTitle>
              <CardDescription>
                Error frequency over different time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{analytics.trends.hourly}</div>
                  <div className="text-sm text-muted-foreground">Last Hour</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{analytics.trends.daily}</div>
                  <div className="text-sm text-muted-foreground">Last 24 Hours</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{analytics.trends.weekly}</div>
                  <div className="text-sm text-muted-foreground">Last 7 Days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detected Error Patterns</CardTitle>
              <CardDescription>
                Automatically identified patterns in error occurrences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patterns.length === 0 ?
                <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p className="text-muted-foreground">No error patterns detected</p>
                  </div> :

                patterns.map((pattern) =>
                <Card key={pattern.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{pattern.name}</h4>
                              <Badge variant="outline" className={getSeverityColor(pattern.severity)}>
                                {pattern.severity}
                              </Badge>
                              <Badge variant={pattern.trend === 'increasing' ? 'destructive' : 'secondary'}>
                                {pattern.trend === 'increasing' && <TrendingUp className="w-3 h-3 mr-1" />}
                                {pattern.trend === 'decreasing' && <TrendingDown className="w-3 h-3 mr-1" />}
                                {pattern.trend}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {pattern.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Frequency: {pattern.frequency}</span>
                              <span>Last: {pattern.lastOccurrence.toLocaleString()}</span>
                              <span>Components: {pattern.components.join(', ')}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-600">{pattern.frequency}</div>
                            <div className="text-xs text-muted-foreground">occurrences</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                )
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hourly Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Errors by Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.errorsByHour).
                  sort(([a], [b]) => parseInt(a) - parseInt(b)).
                  map(([hour, count]) =>
                  <div key={hour} className="flex items-center gap-3">
                      <span className="text-sm font-mono w-8">{hour}:00</span>
                      <div className="flex-1">
                        <Progress value={count / Math.max(...Object.values(analytics.errorsByHour)) * 100} />
                      </div>
                      <span className="text-sm w-8 text-right">{count}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Error Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Common Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topErrorMessages.slice(0, 5).map((error, index) =>
                  <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="secondary">{error.count}x</Badge>
                        <span className="text-xs text-muted-foreground">
                          {(error.count / analytics.totalErrors * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {error.message.length > 80 ?
                      `${error.message.substring(0, 80)}...` :
                      error.message
                      }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Improvement Recommendations</CardTitle>
              <CardDescription>
                AI-generated suggestions based on error pattern analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.length === 0 ?
                <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p className="text-muted-foreground">No specific recommendations at this time</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      System appears to be running smoothly
                    </p>
                  </div> :

                recommendations.map((rec, index) =>
                <Card key={index} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-orange-100">
                            {rec.priority === 'high' ?
                        <AlertCircle className="h-4 w-4 text-orange-600" /> :
                        rec.priority === 'medium' ?
                        <AlertTriangle className="h-4 w-4 text-yellow-600" /> :

                        <Target className="h-4 w-4 text-blue-600" />
                        }
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{rec.action}</h4>
                              <Badge
                            variant={rec.priority === 'high' ? 'destructive' :
                            rec.priority === 'medium' ? 'default' : 'secondary'}>

                                {rec.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                )
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default ErrorAnalyticsDashboard;