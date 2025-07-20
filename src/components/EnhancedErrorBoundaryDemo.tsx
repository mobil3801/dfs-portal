import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  Bug,
  Zap,
  Timer,
  Database,
  Network,
  FileX,
  Shield,
  BarChart3,
  RefreshCcw,
  Download,
  Trash2 } from
'lucide-react';
import { ComponentErrorBoundary, FormErrorBoundary } from './ErrorBoundary';
import { ErrorLogger } from '@/services/errorLogger';
import { useToast } from '@/hooks/use-toast';

// Error simulation components
const AsyncErrorComponent: React.FC<{shouldError: boolean;errorType: string;}> = ({ shouldError, errorType }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (shouldError) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        if (errorType === 'network') {
          throw new Error('Network request failed: Connection timeout');
        } else if (errorType === 'parsing') {
          throw new Error('JSON parsing error: Unexpected token');
        } else if (errorType === 'permission') {
          throw new Error('Permission denied: Insufficient privileges');
        }
      }, 1000);
    }
  }, [shouldError, errorType]);

  if (isLoading) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
          <span className="text-sm text-yellow-800">Processing request...</span>
        </div>
      </div>);

  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-800">Async operation completed successfully</span>
      </div>
    </div>);

};

const MemoryLeakComponent: React.FC<{shouldError: boolean;}> = ({ shouldError }) => {
  const [intervalIds, setIntervalIds] = useState<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (shouldError) {
      // Simulate memory leak by creating multiple intervals
      const ids: NodeJS.Timeout[] = [];
      for (let i = 0; i < 100; i++) {
        const id = setInterval(() => {
          console.log(`Memory leak interval ${i}`);
        }, 100);
        ids.push(id);
      }
      setIntervalIds(ids);

      // Throw error after creating memory leak
      setTimeout(() => {
        throw new Error('Memory leak detected: Too many active intervals');
      }, 500);
    }

    return () => {
      intervalIds.forEach((id) => clearInterval(id));
    };
  }, [shouldError, intervalIds]);

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span className="text-sm text-blue-800">Memory management component active</span>
      </div>
    </div>);

};

const DatabaseErrorComponent: React.FC<{shouldError: boolean;}> = ({ shouldError }) => {
  useEffect(() => {
    if (shouldError) {
      setTimeout(() => {
        throw new Error('Database connection failed: Unable to establish connection to primary database');
      }, 800);
    }
  }, [shouldError]);

  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-purple-800">Database connection established</span>
      </div>
    </div>);

};

const EnhancedErrorBoundaryDemo: React.FC = () => {
  const [activeErrors, setActiveErrors] = useState<Record<string, boolean>>({});
  const [errorType, setErrorType] = useState('network');
  const [testingInProgress, setTestingInProgress] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const { toast } = useToast();

  const errorLogger = ErrorLogger.getInstance();

  const errorScenarios = [
  {
    id: 'component',
    name: 'Component Render Error',
    description: 'Simulates a component that throws during rendering',
    icon: Bug,
    severity: 'medium' as const,
    component: (shouldError: boolean) =>
    <ComponentErrorBoundary componentName="Demo Component" severity="medium">
          <div className={shouldError ? 'throw-error' : 'working'}>
            {shouldError && (() => {throw new Error('Component render error for demo');})()}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Component rendering normally</span>
              </div>
            </div>
          </div>
        </ComponentErrorBoundary>

  },
  {
    id: 'async',
    name: 'Async Operation Error',
    description: 'Simulates errors in asynchronous operations',
    icon: Timer,
    severity: 'high' as const,
    component: (shouldError: boolean) =>
    <ComponentErrorBoundary componentName="Async Component" severity="high">
          <AsyncErrorComponent shouldError={shouldError} errorType={errorType} />
        </ComponentErrorBoundary>

  },
  {
    id: 'database',
    name: 'Database Error',
    description: 'Simulates database connection or query errors',
    icon: Database,
    severity: 'critical' as const,
    component: (shouldError: boolean) =>
    <ComponentErrorBoundary componentName="Database Component" severity="critical">
          <DatabaseErrorComponent shouldError={shouldError} />
        </ComponentErrorBoundary>

  },
  {
    id: 'memory',
    name: 'Memory Leak Error',
    description: 'Simulates memory management issues',
    icon: Zap,
    severity: 'high' as const,
    component: (shouldError: boolean) =>
    <ComponentErrorBoundary componentName="Memory Component" severity="high">
          <MemoryLeakComponent shouldError={shouldError} />
        </ComponentErrorBoundary>

  }];


  const toggleError = (scenarioId: string) => {
    setActiveErrors((prev) => ({
      ...prev,
      [scenarioId]: !prev[scenarioId]
    }));
  };

  const runAutomatedTest = async () => {
    setTestingInProgress(true);
    setTestProgress(0);

    for (let i = 0; i < errorScenarios.length; i++) {
      const scenario = errorScenarios[i];

      // Trigger error
      setActiveErrors((prev) => ({ ...prev, [scenario.id]: true }));
      setTestProgress((i + 0.5) / errorScenarios.length * 100);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear error
      setActiveErrors((prev) => ({ ...prev, [scenario.id]: false }));
      setTestProgress((i + 1) / errorScenarios.length * 100);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setTestingInProgress(false);
    toast({
      title: "Automated Test Complete",
      description: "All error scenarios have been tested successfully."
    });
  };

  const clearAllErrors = () => {
    setActiveErrors({});
    toast({
      title: "Errors Cleared",
      description: "All active error states have been reset."
    });
  };

  const exportErrorLogs = () => {
    const logs = errorLogger.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    toast({
      title: "Error Logs Exported",
      description: "Error logs have been downloaded as JSON file."
    });
  };

  const clearErrorLogs = () => {
    errorLogger.clearLogs();
    toast({
      title: "Error Logs Cleared",
      description: "All stored error logs have been cleared."
    });
  };

  const errorSummary = errorLogger.getLogsSummary();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Enhanced Error Boundary Demo
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive error testing and monitoring system
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={runAutomatedTest}
                disabled={testingInProgress}
                variant="outline"
                size="sm">

                <BarChart3 className="w-4 h-4 mr-2" />
                Run All Tests
              </Button>
              <Button
                onClick={clearAllErrors}
                variant="outline"
                size="sm">

                <RefreshCcw className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scenarios" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scenarios">Error Scenarios</TabsTrigger>
              <TabsTrigger value="monitoring">Error Monitoring</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scenarios" className="space-y-6">
              {testingInProgress &&
              <Alert>
                  <Timer className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>Automated testing in progress...</div>
                      <Progress value={testProgress} className="w-full" />
                    </div>
                  </AlertDescription>
                </Alert>
              }

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {errorScenarios.map((scenario) => {
                  const IconComponent = scenario.icon;
                  const isActive = activeErrors[scenario.id];

                  return (
                    <div key={scenario.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                          <div>
                            <h3 className="font-semibold">{scenario.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {scenario.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isActive ? 'destructive' : 'secondary'}>
                            {isActive ? 'Error Active' : 'Normal'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {scenario.severity}
                          </Badge>
                        </div>
                      </div>
                      
                      {scenario.component(isActive)}
                      
                      <Button
                        onClick={() => toggleError(scenario.id)}
                        variant={isActive ? 'default' : 'destructive'}
                        size="sm"
                        disabled={testingInProgress}>

                        <Zap className="w-4 h-4 mr-2" />
                        {isActive ? 'Fix Error' : 'Trigger Error'}
                      </Button>
                    </div>);

                })}
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800">Advanced Configuration</h4>
                      <div className="mt-2 space-y-3">
                        <div>
                          <label className="text-sm font-medium text-blue-700">
                            Async Error Type:
                          </label>
                          <Select value={errorType} onValueChange={setErrorType}>
                            <SelectTrigger className="w-full mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="network">Network Error</SelectItem>
                              <SelectItem value="parsing">Parsing Error</SelectItem>
                              <SelectItem value="permission">Permission Error</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-sm text-blue-600">
                          Configure the type of async error to simulate for testing different error handling scenarios.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="monitoring" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                    <Bug className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {errorSummary.total}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Errors logged in current session
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {errorSummary.bySeverity.critical || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      High priority errors requiring attention
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.values(activeErrors).filter(Boolean).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Currently running error scenarios
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Error Log Management</CardTitle>
                    <div className="flex gap-2">
                      <Button onClick={exportErrorLogs} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export Logs
                      </Button>
                      <Button onClick={clearErrorLogs} variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Logs
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(errorSummary.bySeverity).map(([severity, count]) =>
                      <div key={severity} className="text-center">
                          <div className="text-lg font-semibold">{count}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {severity}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Error Pattern Analysis</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Analyze error patterns over time to identify system issues
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Alert>
                      <BarChart3 className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Pattern Detection:</strong> The system monitors error frequency, 
                        severity distribution, and component failure rates to help identify 
                        potential system issues before they become critical.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Common Error Patterns:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Repeated component failures indicate code issues</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>Network errors suggest connectivity problems</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>Memory errors indicate resource management issues</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Database errors suggest backend problems</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Monitoring Benefits:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Early detection of system degradation</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Improved user experience through better error handling</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Data-driven decisions for system improvements</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Reduced downtime through proactive monitoring</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>);

};

export default EnhancedErrorBoundaryDemo;