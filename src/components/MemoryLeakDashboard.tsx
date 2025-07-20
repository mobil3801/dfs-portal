import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Trash2,
  Download,
  TrendingUp,
  Cpu,
  HardDrive,
  Zap } from
'lucide-react';
import { MemoryLeakMonitor } from '@/services/memoryLeakMonitor';
import { useToast } from '@/hooks/use-toast';
import { getMemoryUsage } from '../utils/memoryLeakIntegration';

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ComponentTracker {
  name: string;
  mountTime: number;
  unmountTime?: number;
  leakReports: any[];
  memoryUsageOnMount: MemoryStats | null;
  memoryUsageOnUnmount: MemoryStats | null;
}

const MemoryLeakDashboard: React.FC = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  const [components, setComponents] = useState<ComponentTracker[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<{timestamp: number;memory: MemoryStats;}[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const { toast } = useToast();

  const monitor = MemoryLeakMonitor.getInstance();

  const refreshData = () => {
    try {
      const info = monitor.getCurrentMemoryInfo();
      const componentStats = monitor.getComponentStats() as ComponentTracker[];
      const history = monitor.getMemoryHistory();

      setMemoryInfo(info);
      setComponents(Array.isArray(componentStats) ? componentStats : []);
      setMemoryHistory(history);
    } catch (error) {
      console.warn('Error refreshing memory data:', error);
      // Set safe fallback values
      setMemoryInfo({
        current: null,
        baseline: null,
        growth: 0,
        pressure: 0,
        componentsTracked: 0,
        totalLeakReports: 0,
        leakOccurrences: 0,
        isCriticalLeakDetected: false,
        nextAlertTime: 0
      });
      setComponents([]);
      setMemoryHistory([]);
    }
  };

  useEffect(() => {
    refreshData();

    const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getMemoryPressureColor = (pressure: number): string => {
    if (pressure < 0.5) return 'text-green-600';
    if (pressure < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryPressureLabel = (pressure: number): string => {
    if (pressure < 0.5) return 'Low';
    if (pressure < 0.7) return 'Medium';
    return 'High';
  };

  const handleForceGC = () => {
    const success = monitor.forceGarbageCollection();
    if (success) {
      toast({
        title: "Garbage Collection Triggered",
        description: "Manual garbage collection has been executed."
      });
      setTimeout(refreshData, 1000); // Refresh after GC
    } else {
      toast({
        title: "Garbage Collection Unavailable",
        description: "Enable garbage collection in Chrome DevTools with --js-flags=\"--expose-gc\"",
        variant: "destructive"
      });
    }
  };

  const handleResetBaseline = () => {
    monitor.resetBaseline();
    toast({
      title: "Baseline Reset",
      description: "Memory monitoring baseline has been reset."
    });
    refreshData();
  };

  const handleDownloadReport = () => {
    const report = monitor.generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-leak-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Memory leak report has been saved to your downloads."
    });
  };

  const suspiciousComponents = components.
  filter((comp) => comp.leakReports.length > 0).
  sort((a, b) => b.leakReports.length - a.leakReports.length);

  if (!memoryInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading memory data...
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Memory Leak Monitor</h1>
          <p className="text-muted-foreground">
            Real-time memory usage and leak detection dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleForceGC} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Force GC
          </Button>
          <Button onClick={handleResetBaseline} variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Reset Baseline
          </Button>
          <Button onClick={handleDownloadReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Memory Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memoryInfo.current ? formatBytes(memoryInfo.current.usedJSHeapSize) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              of {memoryInfo.current ? formatBytes(memoryInfo.current.jsHeapSizeLimit) : 'N/A'} limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(memoryInfo.growth)}
            </div>
            <p className="text-xs text-muted-foreground">
              since baseline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Pressure</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMemoryPressureColor(memoryInfo.pressure)}`}>
              {(memoryInfo.pressure * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {getMemoryPressureLabel(memoryInfo.pressure)} pressure
            </p>
            <Progress value={memoryInfo.pressure * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Components Tracked</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryInfo.componentsTracked}</div>
            <p className="text-xs text-muted-foreground">
              {memoryInfo.totalLeakReports} leak reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Memory Pressure Alert */}
      {memoryInfo.pressure > 0.7 &&
      <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High memory pressure detected ({(memoryInfo.pressure * 100).toFixed(1)}%). 
            Consider triggering garbage collection or investigating memory leaks.
          </AlertDescription>
        </Alert>
      }

      {/* Tabs for detailed views */}
      <Tabs defaultValue="components" className="space-y-4">
        <TabsList>
          <TabsTrigger value="components">Component Tracking</TabsTrigger>
          <TabsTrigger value="leaks">
            Leak Reports
            {suspiciousComponents.length > 0 &&
            <Badge variant="destructive" className="ml-2">
                {suspiciousComponents.length}
              </Badge>
            }
          </TabsTrigger>
          <TabsTrigger value="history">Memory History</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Tracking</CardTitle>
              <CardDescription>
                Real-time tracking of React components and their memory impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              {components.length === 0 ?
              <p className="text-center text-muted-foreground py-8">
                  No components are currently being tracked
                </p> :

              <div className="space-y-4">
                  {components.map((component, index) =>
                <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{component.name}</h3>
                        <div className="flex gap-2">
                          {component.leakReports.length > 0 &&
                      <Badge variant="destructive">
                              {component.leakReports.length} leaks
                            </Badge>
                      }
                          <Badge variant={component.unmountTime ? "secondary" : "default"}>
                            {component.unmountTime ? "Unmounted" : "Mounted"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Mount Time:</span>
                          <p>{new Date(component.mountTime).toLocaleTimeString()}</p>
                        </div>
                        {component.unmountTime &&
                    <div>
                            <span className="text-muted-foreground">Unmount Time:</span>
                            <p>{new Date(component.unmountTime).toLocaleTimeString()}</p>
                          </div>
                    }
                        {component.memoryUsageOnMount &&
                    <div>
                            <span className="text-muted-foreground">Memory on Mount:</span>
                            <p>{formatBytes(component.memoryUsageOnMount.usedJSHeapSize)}</p>
                          </div>
                    }
                        {component.memoryUsageOnUnmount &&
                    <div>
                            <span className="text-muted-foreground">Memory on Unmount:</span>
                            <p>{formatBytes(component.memoryUsageOnUnmount.usedJSHeapSize)}</p>
                          </div>
                    }
                      </div>
                    </div>
                )}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leak Reports</CardTitle>
              <CardDescription>
                Components with detected memory leak patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousComponents.length === 0 ?
              <div className="text-center py-8">
                  <div className="text-green-600 mb-2">✅ No memory leaks detected</div>
                  <p className="text-muted-foreground">All components are clean!</p>
                </div> :

              <div className="space-y-4">
                  {suspiciousComponents.map((component, index) =>
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-red-900">{component.name}</h3>
                        <Badge variant="destructive">
                          {component.leakReports.length} issues
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {component.leakReports.map((report, reportIndex) =>
                    <div key={reportIndex} className="text-sm bg-white rounded p-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{report.leakType}</span>
                              <span className="text-muted-foreground">
                                {new Date(report.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            {report.metadata &&
                      <pre className="mt-1 text-xs text-gray-600 bg-gray-100 p-1 rounded overflow-x-auto">
                                {JSON.stringify(report.metadata, null, 2)}
                              </pre>
                      }
                          </div>
                    )}
                      </div>
                    </div>
                )}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage History</CardTitle>
              <CardDescription>
                Historical memory usage data over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memoryHistory.length === 0 ?
              <p className="text-center text-muted-foreground py-8">
                  No memory history data available
                </p> :

              <div className="space-y-2 max-h-96 overflow-y-auto">
                  {memoryHistory.
                slice(-20) // Show last 20 entries
                .reverse().
                map((entry, index) =>
                <div key={index} className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatBytes(entry.memory.usedJSHeapSize)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(entry.memory.usedJSHeapSize / entry.memory.jsHeapSizeLimit * 100).toFixed(1)}% of limit
                          </div>
                        </div>
                      </div>
                )}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default MemoryLeakDashboard;