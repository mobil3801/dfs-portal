import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Shield, TrendingUp, AlertTriangle, Play } from 'lucide-react';
import MemoryLeakDashboard from '@/components/MemoryLeakDashboard';
import MemoryLeakPreventionGuide from '@/components/MemoryLeakPreventionGuide';
import MemoryLeakDemo from '@/components/MemoryLeakDemo';
import AccessDenied from '@/components/AccessDenied';
import useAdminAccess from '@/hooks/use-admin-access';

const MemoryMonitoring: React.FC = () => {
  const { hasMonitoringAccess } = useAdminAccess();

  // Check admin access first
  if (!hasMonitoringAccess) {
    return (
      <AccessDenied
        feature="Memory Leak Monitoring System"
        requiredRole="Administrator" />);


  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Memory Leak Monitoring System
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Comprehensive memory leak detection, prevention, and monitoring for React applications. 
          Keep your DFS Manager Portal running smoothly with real-time memory analysis.
        </p>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8 text-blue-600" />
              <Badge variant="secondary">Real-time</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-blue-900">Live Monitoring</h3>
            <p className="text-sm text-blue-700">
              Track memory usage and component lifecycle in real-time
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Shield className="h-8 w-8 text-green-600" />
              <Badge variant="secondary">Prevention</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-green-900">Leak Prevention</h3>
            <p className="text-sm text-green-700">
              Automatic cleanup and safe resource management
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <Badge variant="secondary">Analytics</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-purple-900">Memory Analytics</h3>
            <p className="text-sm text-purple-700">
              Detailed reports and memory usage patterns
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <Badge variant="secondary">Detection</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-orange-900">Leak Detection</h3>
            <p className="text-sm text-orange-700">
              Automatic detection of common memory leak patterns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Dashboard
          </TabsTrigger>
          <TabsTrigger value="demo" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Interactive Demo
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Prevention Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Memory Leak Dashboard
              </CardTitle>
              <CardDescription>
                Real-time monitoring of memory usage, component tracking, and leak detection for your DFS Manager Portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemoryLeakDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Interactive Memory Leak Demo
              </CardTitle>
              <CardDescription>
                Experience the difference between memory-safe and leak-prone components in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemoryLeakDemo />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Memory Leak Prevention Guide
              </CardTitle>
              <CardDescription>
                Learn best practices, common patterns, and how to use our monitoring tools to prevent memory leaks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemoryLeakPreventionGuide />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-blue-900">Memory Monitoring Status</h3>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Monitoring Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Leak Detection Enabled</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Memory monitoring is automatically enabled for all components using our detection hooks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default MemoryMonitoring;