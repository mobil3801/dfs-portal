import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Send,
  Zap } from
'lucide-react';
import ClickSendConfigManager from './ClickSendConfigManager';
import { clickSendSmsService } from '@/services/clickSendSmsService';
import { enhancedClickSendSmsService } from '@/services/enhancedClickSendSmsService';

interface ServiceStatus {
  available: boolean;
  message: string;
  providers?: Array<{name: string;available: boolean;}>;
  quota?: {quotaRemaining: number;};
}

interface UsageStats {
  used: number;
  limit: number;
  percentage: number;
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  balance: number;
}

const ClickSendServiceManager: React.FC = () => {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadServiceData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadServiceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadServiceData = async () => {
    try {
      setRefreshing(true);

      // Load SMS configuration first
      await clickSendSmsService.loadConfiguration();

      // Get service status
      const status = await clickSendSmsService.getServiceStatus();
      setServiceStatus(status);

      // Get usage statistics
      const usage = await clickSendSmsService.getDailyUsage();
      setUsageStats(usage);

      // Get service health
      const health = await enhancedClickSendSmsService.getServiceHealth();
      setServiceHealth(health);

    } catch (error) {
      console.error('Error loading service data:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS service data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    await loadServiceData();
    toast({
      title: "Refreshed",
      description: "SMS service data updated successfully"
    });
  };

  const getStatusBadge = (available: boolean) => {
    return available ?
    <Badge variant="secondary" className="text-green-700 bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Available
      </Badge> :

    <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Unavailable
      </Badge>;

  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="secondary" className="text-green-700 bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>);

      case 'degraded':
        return (
          <Badge variant="outline" className="text-yellow-700 bg-yellow-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Degraded
          </Badge>);

      case 'down':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Down
          </Badge>);

      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Checking...
          </Badge>);

    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading SMS service data...</p>
        </div>
      </div>);

  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SMS Service Manager</h2>
          <p className="text-muted-foreground">Monitor and manage your ClickSend SMS service</p>
        </div>
        <Button
          onClick={refreshData}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2">

          <BarChart3 className="h-4 w-4" />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Service Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Status</p>
                <div className="mt-2">
                  {serviceStatus ? getStatusBadge(serviceStatus.available) : getHealthBadge('unknown')}
                </div>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Health</p>
                <div className="mt-2">
                  {serviceHealth ? getHealthBadge(serviceHealth.status) : getHealthBadge('unknown')}
                </div>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Daily Usage</p>
                <p className="text-2xl font-bold">
                  {usageStats ? `${usageStats.used}/${usageStats.limit}` : '0/100'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Balance</p>
                <p className="text-2xl font-bold">
                  ${serviceHealth?.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Service Status Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {serviceStatus &&
              <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>{serviceStatus.message}</AlertDescription>
                </Alert>
              }

              {serviceStatus?.providers &&
              <div className="space-y-2">
                  <h4 className="font-medium">Providers</h4>
                  {serviceStatus.providers.map((provider, index) =>
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{provider.name}</span>
                      {getStatusBadge(provider.available)}
                    </div>
                )}
                </div>
              }

              {serviceHealth &&
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                    <p className="text-lg font-semibold">{serviceHealth.responseTime}ms</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                    <p className="text-lg font-semibold">{serviceHealth.errorRate.toFixed(1)}%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Last Check</p>
                    <p className="text-lg font-semibold">
                      {serviceHealth.lastCheck.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Usage Statistics
              </CardTitle>
              <CardDescription>
                Track your daily SMS usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageStats &&
              <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Messages sent today</span>
                      <span>{usageStats.used} / {usageStats.limit}</span>
                    </div>
                    <Progress value={usageStats.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {usageStats.percentage.toFixed(1)}% of daily limit used
                    </p>
                  </div>

                  {usageStats.percentage > 80 &&
                <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You've used {usageStats.percentage.toFixed(1)}% of your daily SMS limit. 
                        Consider increasing your limit or managing usage carefully.
                      </AlertDescription>
                    </Alert>
                }

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Remaining Today</p>
                      <p className="text-2xl font-bold text-green-600">
                        {usageStats.limit - usageStats.used}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Usage Rate</p>
                      <p className="text-2xl font-bold">
                        {usageStats.percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <ClickSendConfigManager />
        </TabsContent>
      </Tabs>
    </div>);

};

export default ClickSendServiceManager;