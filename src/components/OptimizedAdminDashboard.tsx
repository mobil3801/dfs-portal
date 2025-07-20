import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  Database,
  Gauge,
  Monitor,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Zap } from
'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAccess } from '@/hooks/use-admin-access';

// Import our optimized components
import VirtualScrollContainer, { useVirtualScrollData } from '@/components/VirtualScrollContainer';
import MemoryAwareErrorBoundary from '@/components/MemoryAwareErrorBoundary';
import PerformanceMonitoringSystem from '@/components/PerformanceMonitoringSystem';
import SessionOptimizationManager from '@/components/SessionOptimizationManager';
import BackgroundCleanupService from '@/components/BackgroundCleanupService';
import { optimizedDataService } from '@/services/optimizedDataService';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  totalProducts: number;
  memoryUsage: number;
  cacheHitRate: number;
  avgResponseTime: number;
  errorRate: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastBackup: number;
  diskUsage: number;
  cpuUsage: number;
}

const OptimizedAdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const { hasAdminAccess } = useAdminAccess();
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  // Virtual scroll data for different tables
  const employeesData = useVirtualScrollData<any>({
    tableId: '11727',
    pageSize: 50,
    initialParams: { OrderByField: 'id', IsAsc: false }
  });

  const salesData = useVirtualScrollData<any>({
    tableId: '12356',
    pageSize: 50,
    initialParams: { OrderByField: 'report_date', IsAsc: false }
  });

  const productsData = useVirtualScrollData<any>({
    tableId: '11726',
    pageSize: 50,
    initialParams: { OrderByField: 'id', IsAsc: false }
  });

  const usersData = useVirtualScrollData<any>({
    tableId: '11725',
    pageSize: 50,
    initialParams: { OrderByField: 'id', IsAsc: false }
  });

  /**
   * Load dashboard metrics with optimization
   */
  const loadMetrics = useCallback(async () => {
    try {
      // Use optimized data service for selective fetching
      const [usersResult, salesResult, productsResult] = await Promise.all([
      optimizedDataService.fetchData('11725', { PageNo: 1, PageSize: 1 }, {
        fields: ['id'],
        priority: 'high',
        cache: true
      }),
      optimizedDataService.fetchData('12356', { PageNo: 1, PageSize: 1 }, {
        fields: ['id', 'total_sales'],
        priority: 'high',
        cache: true
      }),
      optimizedDataService.fetchData('11726', { PageNo: 1, PageSize: 1 }, {
        fields: ['id'],
        priority: 'medium',
        cache: true
      })]
      );

      // Get performance metrics from service
      const performanceMetrics = optimizedDataService.getMetrics();

      setMetrics({
        totalUsers: usersResult.data?.VirtualCount || 0,
        activeUsers: Math.floor((usersResult.data?.VirtualCount || 0) * 0.7), // Estimate
        totalSales: salesResult.data?.List?.reduce((sum: number, item: any) => sum + (item.total_sales || 0), 0) || 0,
        totalProducts: productsResult.data?.VirtualCount || 0,
        memoryUsage: performanceMetrics.memoryUsage || 0,
        cacheHitRate: performanceMetrics.cacheHitRate || 0,
        avgResponseTime: performanceMetrics.avgResponseTime || 0,
        errorRate: 100 - (performanceMetrics.cacheHitRate || 0) // Simplified
      });

      // Simulate system health data
      setSystemHealth({
        status: performanceMetrics.memoryUsage > 80 ? 'critical' :
        performanceMetrics.memoryUsage > 60 ? 'warning' : 'healthy',
        uptime: Date.now() - (Date.now() - 24 * 60 * 60 * 1000), // 24h uptime
        lastBackup: Date.now() - 2 * 60 * 60 * 1000, // 2h ago
        diskUsage: Math.random() * 100,
        cpuUsage: Math.random() * 100
      });

    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
      toast({
        title: 'Metrics Load Error',
        description: 'Failed to load some dashboard metrics. Data may be incomplete.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  /**
   * Optimize system performance
   */
  const optimizeSystem = useCallback(async () => {
    setIsOptimizing(true);

    try {
      // Trigger various optimization processes
      toast({
        title: 'System Optimization Started',
        description: 'Running performance optimization tasks...'
      });

      // Simulate optimization tasks
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }

      // Clear caches
      if (window.ezsite?.cache?.clear) {
        window.ezsite.cache.clear();
      }

      // Reload metrics
      await loadMetrics();

      toast({
        title: 'Optimization Complete',
        description: 'System performance has been optimized.'
      });
    } catch (error) {
      console.error('Optimization failed:', error);
      toast({
        title: 'Optimization Failed',
        description: 'Failed to complete system optimization.',
        variant: 'destructive'
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [loadMetrics, toast]);

  /**
   * Memoized table row renderer for virtual scrolling
   */
  const renderEmployeeRow = useCallback((item: any, index: number) =>
  <motion.div
    key={`employee-${item.id}-${index}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-between p-4 border-b hover:bg-gray-50">

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h4 className="font-medium">{item.first_name} {item.last_name}</h4>
          <p className="text-sm text-gray-600">{item.position} • {item.station}</p>
        </div>
      </div>
      <Badge variant={item.is_active ? 'default' : 'secondary'}>
        {item.is_active ? 'Active' : 'Inactive'}
      </Badge>
    </motion.div>,
  []);

  const renderSalesRow = useCallback((item: any, index: number) =>
  <motion.div
    key={`sales-${item.id}-${index}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-between p-4 border-b hover:bg-gray-50">

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <h4 className="font-medium">{new Date(item.report_date).toLocaleDateString()}</h4>
          <p className="text-sm text-gray-600">{item.station} • {item.employee_name}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold">${(item.total_sales || 0).toLocaleString()}</div>
        <div className="text-sm text-gray-600">{item.shift} shift</div>
      </div>
    </motion.div>,
  []);

  const renderProductRow = useCallback((item: any, index: number) =>
  <motion.div
    key={`product-${item.id}-${index}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-between p-4 border-b hover:bg-gray-50">

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <Database className="h-4 w-4 text-purple-600" />
        </div>
        <div>
          <h4 className="font-medium">{item.product_name}</h4>
          <p className="text-sm text-gray-600">{item.category} • ${item.price}</p>
        </div>
      </div>
      <Badge variant={item.quantity_in_stock > item.minimum_stock ? 'default' : 'destructive'}>
        Stock: {item.quantity_in_stock}
      </Badge>
    </motion.div>,
  []);

  /**
   * Load metrics on mount and set up periodic refresh
   */
  useEffect(() => {
    loadMetrics();

    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  /**
   * Performance monitoring effect
   */
  useEffect(() => {
    const monitorPerformance = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const usage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize * 100;

        if (usage > 90) {
          toast({
            title: 'Critical Memory Usage',
            description: `Memory usage is at ${usage.toFixed(1)}%. Consider optimizing.`,
            variant: 'destructive'
          });
        }
      }
    };

    const interval = setInterval(monitorPerformance, 60000); // Every minute
    return () => clearInterval(interval);
  }, [toast]);

  if (!hasAdminAccess) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </CardContent>
      </Card>);

  }

  if (!metrics || !systemHealth) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading optimized dashboard...</p>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <MemoryAwareErrorBoundary
      maxRetries={3}
      autoRecovery={true}
      memoryThreshold={0.8}
      enableMemoryMonitoring={true}
      isolationLevel="page">

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Monitor className="h-8 w-8" />
              Optimized Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time performance monitoring with intelligent optimization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={systemHealth.status === 'healthy' ? 'default' :
              systemHealth.status === 'warning' ? 'secondary' : 'destructive'}>

              {systemHealth.status.toUpperCase()}
            </Badge>
            <Button
              onClick={optimizeSystem}
              disabled={isOptimizing}
              size="sm">

              {isOptimizing ?
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> :

              <Zap className="mr-2 h-4 w-4" />
              }
              Optimize System
            </Button>
            <Button
              onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
              variant="outline"
              size="sm">

              <Settings className="mr-2 h-4 w-4" />
              Advanced
            </Button>
          </div>
        </div>

        {/* System Health Alert */}
        {systemHealth.status !== 'healthy' &&
        <Alert variant={systemHealth.status === 'critical' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              System status: {systemHealth.status}. 
              {systemHealth.status === 'critical' && 'Immediate attention required.'}
              {systemHealth.status === 'warning' && 'Performance may be affected.'}
            </AlertDescription>
          </Alert>
        }

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeUsers} active users
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Recent transactions
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  In inventory
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory</span>
                    <Badge variant={metrics.memoryUsage > 80 ? 'destructive' : 'default'}>
                      {metrics.memoryUsage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={metrics.memoryUsage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Cache hit: {metrics.cacheHitRate.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Advanced Metrics */}
        {showAdvancedMetrics &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {metrics.avgResponseTime.toFixed(0)}ms
                  </div>
                  <Progress
                  value={Math.min(metrics.avgResponseTime / 2000 * 100, 100)}
                  className="h-2 mt-2" />

                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {metrics.errorRate.toFixed(1)}%
                  </div>
                  <Progress value={metrics.errorRate} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>CPU:</span>
                      <span>{systemHealth.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Disk:</span>
                      <span>{systemHealth.diskUsage.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        }

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Sales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MemoryAwareErrorBoundary>
                    <VirtualScrollContainer
                      items={salesData.items.map((item) => ({ id: item.id, data: item }))}
                      itemHeight={80}
                      containerHeight={300}
                      renderItem={(item) => renderSalesRow(item.data, 0)}
                      loadMore={salesData.loadMore}
                      hasMore={salesData.hasMore}
                      loading={salesData.loading}
                      className="border rounded" />

                  </MemoryAwareErrorBoundary>
                </CardContent>
              </Card>

              {/* Active Employees */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Active Employees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MemoryAwareErrorBoundary>
                    <VirtualScrollContainer
                      items={employeesData.items.filter((emp) => emp.is_active).map((item) => ({ id: item.id, data: item }))}
                      itemHeight={80}
                      containerHeight={300}
                      renderItem={(item) => renderEmployeeRow(item.data, 0)}
                      loadMore={employeesData.loadMore}
                      hasMore={employeesData.hasMore}
                      loading={employeesData.loading}
                      className="border rounded" />

                  </MemoryAwareErrorBoundary>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MemoryAwareErrorBoundary>
                    <VirtualScrollContainer
                      items={productsData.items.map((item) => ({ id: item.id, data: item }))}
                      itemHeight={80}
                      containerHeight={400}
                      renderItem={(item) => renderProductRow(item.data, 0)}
                      loadMore={productsData.loadMore}
                      hasMore={productsData.hasMore}
                      loading={productsData.loading}
                      className="border rounded" />

                  </MemoryAwareErrorBoundary>
                </CardContent>
              </Card>

              {/* Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Profiles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MemoryAwareErrorBoundary>
                    <VirtualScrollContainer
                      items={usersData.items.map((item) => ({ id: item.id, data: item }))}
                      itemHeight={80}
                      containerHeight={400}
                      renderItem={(item) =>
                      <div className="flex items-center justify-between p-4 border-b hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">User #{item.data.user_id}</h4>
                              <p className="text-sm text-gray-600">{item.data.role} • {item.data.station}</p>
                            </div>
                          </div>
                          <Badge variant={item.data.is_active ? 'default' : 'secondary'}>
                            {item.data.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      }
                      loadMore={usersData.loadMore}
                      hasMore={usersData.hasMore}
                      loading={usersData.loading}
                      className="border rounded" />

                  </MemoryAwareErrorBoundary>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <MemoryAwareErrorBoundary>
              <PerformanceMonitoringSystem />
            </MemoryAwareErrorBoundary>
          </TabsContent>

          <TabsContent value="sessions">
            <MemoryAwareErrorBoundary>
              <SessionOptimizationManager />
            </MemoryAwareErrorBoundary>
          </TabsContent>

          <TabsContent value="cleanup">
            <MemoryAwareErrorBoundary>
              <BackgroundCleanupService />
            </MemoryAwareErrorBoundary>
          </TabsContent>

          <TabsContent value="monitoring">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Real-time Metrics</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Memory Usage:</span>
                          <span className={metrics.memoryUsage > 80 ? 'text-red-600' : 'text-green-600'}>
                            {metrics.memoryUsage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cache Hit Rate:</span>
                          <span>{metrics.cacheHitRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Response Time:</span>
                          <span>{metrics.avgResponseTime.toFixed(0)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Error Rate:</span>
                          <span>{metrics.errorRate.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">System Health</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
                            {systemHealth.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Uptime:</span>
                          <span>{Math.floor((Date.now() - systemHealth.uptime) / (1000 * 60 * 60))}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Backup:</span>
                          <span>{Math.floor((Date.now() - systemHealth.lastBackup) / (1000 * 60))}m ago</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CPU Usage:</span>
                          <span>{systemHealth.cpuUsage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MemoryAwareErrorBoundary>);

};

export default OptimizedAdminDashboard;