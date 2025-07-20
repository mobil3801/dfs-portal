
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOverflowDetection } from '@/hooks/use-overflow-detection';
import { runAutomatedOverflowTests } from '@/utils/overflowDetection';
import {
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Monitor,
  Smartphone,
  Tablet,
  Bug,
  Download,
  RefreshCw } from
'lucide-react';

const OverflowTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [selectedTest, setSelectedTest] = useState<any>(null);

  const {
    startMonitoring,
    stopMonitoring,
    getReport,
    refreshIssues,
    issues,
    isMonitoring
  } = useOverflowDetection({
    checkInterval: 2000,
    enableLogging: true,
    enableReporting: true
  });

  const standardViewports = [
  { width: 375, height: 667, name: 'iPhone SE' },
  { width: 414, height: 896, name: 'iPhone 11' },
  { width: 768, height: 1024, name: 'iPad' },
  { width: 1024, height: 768, name: 'iPad Landscape' },
  { width: 1280, height: 720, name: 'Laptop' },
  { width: 1920, height: 1080, name: 'Desktop' }];


  const runComprehensiveTests = async () => {
    setIsRunningTests(true);
    setTestProgress(0);
    setTestResults([]);

    try {
      const results = await runAutomatedOverflowTests(standardViewports);
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunningTests(false);
      setTestProgress(100);
    }
  };

  const downloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      testResults,
      currentIssues: issues,
      liveReport: getReport()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overflow-test-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (issueCount: number) => {
    if (issueCount === 0) return 'text-green-600';
    if (issueCount < 3) return 'text-yellow-600';
    if (issueCount < 5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (issueCount: number) => {
    if (issueCount === 0) return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
    if (issueCount < 3) return <Badge className="bg-yellow-100 text-yellow-800">Minor</Badge>;
    if (issueCount < 5) return <Badge className="bg-orange-100 text-orange-800">Moderate</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
  };

  useEffect(() => {
    // Start monitoring when component mounts
    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Overflow Test Suite</h2>
          <p className="text-muted-foreground">Comprehensive overflow behavior testing and monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={refreshIssues}
            variant="outline"
            size="sm"
            disabled={isRunningTests}>

            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={downloadReport}
            variant="outline"
            size="sm"
            disabled={isRunningTests}>

            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Live Monitoring Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bug className="h-5 w-5" />
            <span>Live Monitoring</span>
            {isMonitoring && <Badge className="bg-green-100 text-green-800">Active</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getSeverityColor(issues.length)}`}>
                {issues.length}
              </div>
              <div className="text-sm text-muted-foreground">Current Issues</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {issues.filter((i) => i.type === 'horizontal').length}
              </div>
              <div className="text-sm text-muted-foreground">Horizontal</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {issues.filter((i) => i.type === 'vertical').length}
              </div>
              <div className="text-sm text-muted-foreground">Vertical</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center space-x-2">
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              size="sm">

              {isMonitoring ?
              <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Monitoring
                </> :

              <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Monitoring
                </>
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Suite */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Test Controls */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Run comprehensive overflow tests across multiple viewports
                </p>
              </div>
              <Button
                onClick={runComprehensiveTests}
                disabled={isRunningTests}
                className="min-w-[120px]">

                {isRunningTests ?
                <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </> :

                <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Tests
                  </>
                }
              </Button>
            </div>

            {/* Test Progress */}
            {isRunningTests &&
            <div className="space-y-2">
                <Progress value={testProgress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  Running tests... {testProgress}%
                </p>
              </div>
            }

            {/* Test Results */}
            {testResults.length > 0 &&
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testResults.map((result, index) => {
                  const Icon = result.viewport.width <= 480 ? Smartphone :
                  result.viewport.width <= 768 ? Tablet : Monitor;

                  return (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTest === result ? 'ring-2 ring-blue-500' : ''}`
                      }
                      onClick={() => setSelectedTest(result)}>

                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <span className="font-medium text-sm">
                                {result.viewport.width} × {result.viewport.height}
                              </span>
                            </div>
                            {getSeverityBadge(result.totalIssues)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${getSeverityColor(result.totalIssues)}`}>
                              {result.totalIssues}
                            </div>
                            <div className="text-sm text-muted-foreground">Issues Found</div>
                          </div>
                        </CardContent>
                      </Card>);

                })}
                </div>
              </div>
            }
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Issues</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Overflow Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {issues.length === 0 ?
              <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No overflow issues detected</p>
                </div> :

              <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {issues.map((issue, index) =>
                  <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="font-medium">{issue.selector}</span>
                              <Badge variant="outline">{issue.type}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Scroll Size:</span>
                                <br />
                                {issue.scrollWidth} × {issue.scrollHeight}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Client Size:</span>
                                <br />
                                {issue.clientWidth} × {issue.clientHeight}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  )}
                  </div>
                </ScrollArea>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTest ?
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {selectedTest.viewport.width} × {selectedTest.viewport.height}
                    </h3>
                    {getSeverityBadge(selectedTest.totalIssues)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedTest.issuesByType.horizontal}
                      </div>
                      <div className="text-sm text-muted-foreground">Horizontal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedTest.issuesByType.vertical}
                      </div>
                      <div className="text-sm text-muted-foreground">Vertical</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedTest.issuesByType.both}
                      </div>
                      <div className="text-sm text-muted-foreground">Both</div>
                    </div>
                  </div>

                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {selectedTest.issues.map((issue: any, index: number) =>
                    <div key={index} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{issue.selector}</span>
                            <Badge variant="outline">{issue.type}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {issue.scrollWidth} × {issue.scrollHeight} → {issue.clientWidth} × {issue.clientHeight}
                          </div>
                        </div>
                    )}
                    </div>
                  </ScrollArea>
                </div> :

              <div className="text-center py-8">
                  <p className="text-muted-foreground">Select a test result to view details</p>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Common Overflow Issues:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• Long text content without proper word wrapping</li>
                      <li>• Fixed-width elements that don't scale with viewport</li>
                      <li>• Navigation items that don't adapt to smaller screens</li>
                      <li>• Tables with too many columns for mobile devices</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Best Practices:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• Use responsive design patterns (flexbox, grid)</li>
                      <li>• Implement proper text truncation with ellipsis</li>
                      <li>• Add horizontal scrolling for wide content</li>
                      <li>• Use overflow-aware navigation components</li>
                      <li>• Test across multiple viewport sizes</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default OverflowTestSuite;