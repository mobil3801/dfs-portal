import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Zap,
  Eye } from
'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MemoryLeakMonitor } from '@/services/memoryLeakMonitor';
import useAdminAccess from '@/hooks/use-admin-access';

interface MemoryInfo {
  current: {usedJSHeapSize: number;jsHeapSizeLimit: number;} | null;
  pressure: number;
  componentsTracked: number;
  totalLeakReports: number;
  growth: number;
}

const MemoryMonitoringWidget: React.FC = () => {
  const { hasMonitoringAccess } = useAdminAccess();
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const navigate = useNavigate();

  // Return null if user doesn't have monitoring access
  if (!hasMonitoringAccess) {
    return null;
  }

  useEffect(() => {
    // Check if memory monitoring is available
    if (typeof window !== 'undefined' && window.performance?.memory) {
      setIsAvailable(true);

      // Get initial memory info
      const monitor = MemoryLeakMonitor.getInstance();
      const info = monitor.getCurrentMemoryInfo();
      setMemoryInfo(info);

      // Set up periodic updates
      const interval = setInterval(() => {
        const updatedInfo = monitor.getCurrentMemoryInfo();
        setMemoryInfo(updatedInfo);
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    } else {
      setIsAvailable(false);
    }
  }, []);

  const formatBytes = (bytes: number): string => {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const getMemoryStatus = () => {
    if (!memoryInfo || !memoryInfo.current) return { status: 'unknown', color: 'gray' };

    const pressure = memoryInfo.pressure;
    const hasLeaks = memoryInfo.totalLeakReports > 0;

    if (hasLeaks && pressure > 0.7) {
      return { status: 'critical', color: 'red', icon: AlertTriangle };
    } else if (hasLeaks || pressure > 0.7) {
      return { status: 'warning', color: 'orange', icon: AlertTriangle };
    } else if (pressure > 0.5) {
      return { status: 'moderate', color: 'yellow', icon: Activity };
    } else {
      return { status: 'good', color: 'green', icon: CheckCircle };
    }
  };

  const handleViewDetails = () => {
    navigate('/admin/memory-monitoring');
  };

  if (!isAvailable) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-600">
            <Activity className="h-5 w-5" />
            Memory Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-2">
              Memory monitoring not available in this environment
            </p>
            <Badge variant="secondary">Disabled</Badge>
          </div>
        </CardContent>
      </Card>);

  }

  if (!memoryInfo) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-spin" />
            Memory Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Loading memory data...</p>
          </div>
        </CardContent>
      </Card>);

  }

  const status = getMemoryStatus();
  const StatusIcon = status.icon;

  return (
    <Card className={`border-${status.color}-200 bg-${status.color}-50/30`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Memory Monitor
          </CardTitle>
          <Badge
            variant={status.color === 'green' ? 'default' : 'destructive'}
            className="capitalize">

            <StatusIcon className="h-3 w-3 mr-1" />
            {status.status}
          </Badge>
        </div>
        <CardDescription>
          Real-time memory usage and leak detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Memory Usage */}
        {memoryInfo.current &&
        <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Memory Usage</span>
              <span className="text-sm text-muted-foreground">
                {formatBytes(memoryInfo.current.usedJSHeapSize)}
              </span>
            </div>
            <Progress
            value={memoryInfo.pressure * 100}
            className={`h-2 ${
            memoryInfo.pressure > 0.8 ? 'text-red-600' :
            memoryInfo.pressure > 0.6 ? 'text-yellow-600' :
            'text-green-600'}`
            } />

            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0MB</span>
              <span>{formatBytes(memoryInfo.current.jsHeapSizeLimit)}</span>
            </div>
          </div>
        }

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Components</span>
            </div>
            <div className="text-lg font-bold">{memoryInfo.componentsTracked}</div>
            <div className="text-xs text-muted-foreground">Tracked</div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`h-4 w-4 ${
              memoryInfo.totalLeakReports > 0 ? 'text-red-600' : 'text-green-600'}`
              } />
              <span className="font-medium">Leaks</span>
            </div>
            <div className={`text-lg font-bold ${
            memoryInfo.totalLeakReports > 0 ? 'text-red-600' : 'text-green-600'}`
            }>
              {memoryInfo.totalLeakReports}
            </div>
            <div className="text-xs text-muted-foreground">Detected</div>
          </div>
        </div>

        {/* Memory Growth Alert */}
        {memoryInfo.growth > 50 * 1024 * 1024 && // 50MB threshold
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Memory Growth Alert</span>
            </div>
            <p className="text-xs text-orange-700">
              Memory usage has grown by {formatBytes(memoryInfo.growth)} since baseline
            </p>
          </div>
        }

        {/* Leak Reports Alert */}
        {memoryInfo.totalLeakReports > 0 &&
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Leak Detection</span>
            </div>
            <p className="text-xs text-red-700">
              {memoryInfo.totalLeakReports} potential memory leak(s) detected
            </p>
          </div>
        }

        {/* Success State */}
        {memoryInfo.totalLeakReports === 0 && memoryInfo.pressure < 0.5 &&
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">All Clear</span>
            </div>
            <p className="text-xs text-green-700">
              No memory leaks detected, low memory pressure
            </p>
          </div>
        }

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleViewDetails}
            size="sm"
            variant="outline"
            className="flex-1">

            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
          {memoryInfo.totalLeakReports > 0 &&
          <Button
            onClick={() => navigate('/admin/memory-monitoring?tab=guide')}
            size="sm"
            variant="destructive"
            className="flex-1">

              <Zap className="h-3 w-3 mr-1" />
              Fix Leaks
            </Button>
          }
        </div>
      </CardContent>
    </Card>);

};

export default MemoryMonitoringWidget;