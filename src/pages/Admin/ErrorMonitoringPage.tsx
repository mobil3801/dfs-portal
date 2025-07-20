import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Bug,
  Key,
  Shield,
  Activity,
  RefreshCw,
  Info,
  CheckCircle,
  XCircle } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAccess } from '@/hooks/use-admin-access';
import AccessDenied from '@/components/AccessDenied';
import InvariantErrorDetector from '@/components/ErrorBoundary/InvariantErrorDetector';
import EnhancedInvariantDetector from '@/components/ErrorBoundary/EnhancedInvariantDetector';
import ReactKeyValidator from '@/components/ErrorBoundary/ReactKeyValidator';
import InvariantQuickFix from '@/components/ErrorBoundary/InvariantQuickFix';
import ErrorAnalyticsDashboard from '@/components/ErrorAnalyticsDashboard';
import ErrorMonitoringWidget from '@/components/ErrorMonitoringWidget';

const ErrorMonitoringPage: React.FC = () => {
  const { hasAdminAccess } = useAdminAccess();
  const { toast } = useToast();

  if (!hasAdminAccess) {
    return <AccessDenied />;
  }

  const runDiagnostics = () => {
    console.log('Running comprehensive error diagnostics...');

    // Check for common issues
    const diagnostics = {
      reactVersion: React.version,
      memoryUsage: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)
      } : null,
      errors: {
        consoleErrors: 0,
        unhandledRejections: 0,
        invariantViolations: 0
      },
      timestamp: new Date().toISOString()
    };

    console.log('System Diagnostics:', diagnostics);

    toast({
      title: "Diagnostics Complete",
      description: "System diagnostics have been logged to the console."
    });
  };

  const clearConsole = () => {
    console.clear();
    toast({
      title: "Console Cleared",
      description: "Browser console has been cleared."
    });
  };

  const forceGarbageCollection = () => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      toast({
        title: "Garbage Collection Triggered",
        description: "Manual garbage collection has been triggered."
      });
    } else {
      toast({
        title: "Garbage Collection Unavailable",
        description: "Manual garbage collection is not available in this environment.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Error Monitoring & Debugging</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive error detection, monitoring, and debugging tools for React invariant violations.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Run Diagnostics
          </Button>
          
          <Button onClick={clearConsole} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Console
          </Button>
          
          <Button onClick={forceGarbageCollection} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Force GC
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Error Boundaries</p>
              <p className="text-xs text-gray-500">Active &amp; Monitoring</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">React Version</p>
              <p className="text-xs text-gray-500">v{React.version}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Memory Usage</p>
              <p className="text-xs text-gray-500">
                {(performance as any).memory ?
                `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)} MB` :
                'Unavailable'
                }
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">Debug Mode</p>
              <p className="text-xs text-gray-500">
                {process.env.NODE_ENV === 'development' ? 'Enabled' : 'Production'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Debugging Tools */}
      <Tabs defaultValue="quickfix" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="quickfix" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Quick Fix
          </TabsTrigger>
          <TabsTrigger value="invariant" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Detector
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Keys
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Help
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quickfix" className="space-y-4">
          <InvariantQuickFix />
        </TabsContent>

        <TabsContent value="invariant" className="space-y-4">
          <div className="space-y-4">
            <EnhancedInvariantDetector />
            <InvariantErrorDetector />
          </div>
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <ReactKeyValidator />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ErrorAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <ErrorMonitoringWidget />
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Common Invariant Causes
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-red-600">Missing or Invalid Keys</p>
                  <p className="text-gray-600">React elements in lists need unique, stable keys.</p>
                </div>
                
                <div>
                  <p className="font-medium text-red-600">Component Nesting Issues</p>
                  <p className="text-gray-600">Invalid DOM nesting can cause rendering errors.</p>
                </div>
                
                <div>
                  <p className="font-medium text-red-600">State Updates During Render</p>
                  <p className="text-gray-600">Modifying state during component render phase.</p>
                </div>
                
                <div>
                  <p className="font-medium text-red-600">Ref Handling Issues</p>
                  <p className="text-gray-600">Improper ref usage or cleanup.</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Prevention Best Practices
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-green-600">Use Stable Keys</p>
                  <p className="text-gray-600">Use unique IDs, not array indices for dynamic lists.</p>
                </div>
                
                <div>
                  <p className="font-medium text-green-600">Validate Props</p>
                  <p className="text-gray-600">Use TypeScript and PropTypes for type safety.</p>
                </div>
                
                <div>
                  <p className="font-medium text-green-600">Error Boundaries</p>
                  <p className="text-gray-600">Implement error boundaries to catch rendering errors.</p>
                </div>
                
                <div>
                  <p className="font-medium text-green-600">Testing</p>
                  <p className="text-gray-600">Use React Testing Library to catch rendering issues.</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                Debugging Commands
              </h3>
              
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm space-y-2">
                <p className="text-gray-700"># Check React DevTools</p>
                <p className="text-blue-600">__REACT_DEVTOOLS_GLOBAL_HOOK__</p>
                
                <p className="text-gray-700 mt-3"># Memory usage (Chrome DevTools)</p>
                <p className="text-blue-600">performance.memory</p>
                
                <p className="text-gray-700 mt-3"># Force garbage collection (if available)</p>
                <p className="text-blue-600">window.gc &amp;&amp; window.gc()</p>
                
                <p className="text-gray-700 mt-3"># React Fiber debugging</p>
                <p className="text-blue-600">React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Development Only Features */}
      {process.env.NODE_ENV === 'development' &&
      <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> Enhanced debugging features are active. 
            Additional console logging and error details are available.
          </AlertDescription>
        </Alert>
      }
    </div>);

};

export default ErrorMonitoringPage;