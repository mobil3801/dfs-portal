import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, AlertTriangle, TrendingUp, Settings, Shield } from 'lucide-react';
import DatabaseConnectionMonitor from '@/components/DatabaseConnectionMonitor';
import AccessDenied from '@/components/AccessDenied';
import useAdminAccess from '@/hooks/use-admin-access';

const DatabaseMonitoringPage = () => {
  const { hasMonitoringAccess } = useAdminAccess();

  // Check admin access first
  if (!hasMonitoringAccess) {
    return (
      <AccessDenied
        feature="Database Monitoring System"
        requiredRole="Administrator" />);


  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor and manage database performance and connections
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Database className="h-4 w-4 mr-2" />
          Live Monitoring
        </Badge>
      </div>

      {/* Critical Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>High Database Connection Count Detected</AlertTitle>
        <AlertDescription>
          Current connections: 85/100 (85% capacity). Monitor closely and take action to prevent service disruption.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Connection Monitor</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="alerts">Alert Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <DatabaseConnectionMonitor />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Query Performance</span>
                </CardTitle>
                <CardDescription>
                  Monitor slow queries and database performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Query Time</span>
                    <Badge variant="secondary">145ms</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Slow Queries (&gt;1s)</span>
                    <Badge variant="destructive">12</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Transactions</span>
                    <Badge variant="default">8</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  View Detailed Performance Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Pool Status</CardTitle>
                <CardDescription>
                  Current status of database connection pools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Connections</span>
                    <Badge variant="destructive">85</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Idle Connections</span>
                    <Badge variant="secondary">3</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Waiting for Connection</span>
                    <Badge variant="outline">0</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Manage Connection Pool
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Connection Spikes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Connection Activity</CardTitle>
              <CardDescription>
                Identify patterns and potential connection leaks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">High connection usage detected</div>
                    <div className="text-sm text-muted-foreground">2 minutes ago - 85/100 connections</div>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Connection spike in sales reports</div>
                    <div className="text-sm text-muted-foreground">15 minutes ago - 78/100 connections</div>
                  </div>
                  <Badge variant="secondary">Warning</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Normal connection usage</div>
                    <div className="text-sm text-muted-foreground">1 hour ago - 45/100 connections</div>
                  </div>
                  <Badge variant="default">Normal</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Connection Management</CardTitle>
                <CardDescription>
                  Optimize database connection usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Close Idle Connections
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Kill Long-Running Queries
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Adjust Pool Size
                  </Button>
                  <Button variant="destructive" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency Connection Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Immediate actions to reduce connection usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-red-500 bg-red-50 dark:bg-red-950">
                    <div className="font-medium text-red-800 dark:text-red-200">
                      Critical: Review connection leaks
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-300">
                      Check for unclosed connections in sales report generation
                    </div>
                  </div>
                  <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      Implement connection pooling
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-300">
                      Configure maximum pool size and connection timeout
                    </div>
                  </div>
                  <div className="p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
                    <div className="font-medium text-blue-800 dark:text-blue-200">
                      Optimize query performance
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-300">
                      Review slow queries that may be holding connections
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Alert Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure alerts for database connection monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Warning Threshold</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="flex-1 px-3 py-2 border rounded-md"
                      defaultValue="70" />

                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Critical Threshold</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="flex-1 px-3 py-2 border rounded-md"
                      defaultValue="85" />

                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Alert Methods</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Browser notifications</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Email alerts</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">SMS alerts</span>
                  </label>
                </div>
              </div>
              
              <Button className="w-full">Save Alert Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default DatabaseMonitoringPage;