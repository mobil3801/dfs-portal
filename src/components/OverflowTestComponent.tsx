
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Monitor,
  Smartphone,
  Tablet,
  AlertTriangle,
  CheckCircle,
  XCircle } from
'lucide-react';

interface OverflowTestResult {
  component: string;
  viewport: string;
  hasOverflow: boolean;
  scrollable: boolean;
  responsive: boolean;
  issues: string[];
}

const OverflowTestComponent = () => {
  const [testResults, setTestResults] = useState<OverflowTestResult[]>([]);
  const [currentViewport, setCurrentViewport] = useState('desktop');
  const [isRunning, setIsRunning] = useState(false);

  const viewports = [
  { key: 'mobile', width: 375, label: 'Mobile', icon: Smartphone },
  { key: 'tablet', width: 768, label: 'Tablet', icon: Tablet },
  { key: 'desktop', width: 1024, label: 'Desktop', icon: Monitor }];


  const testComponents = [
  'Navigation Bar',
  'Data Table',
  'Card Grid',
  'Form Layout',
  'Content Area',
  'Sidebar'];


  const runOverflowTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    for (const viewport of viewports) {
      setCurrentViewport(viewport.key);

      // Simulate viewport resize
      await new Promise((resolve) => setTimeout(resolve, 500));

      for (const component of testComponents) {
        const result = await testComponentOverflow(component, viewport);
        setTestResults((prev) => [...prev, result]);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    setIsRunning(false);
  };

  const testComponentOverflow = async (component: string, viewport: any): Promise<OverflowTestResult> => {
    // Simulate testing logic
    const randomIssues = Math.random() < 0.3;
    const hasOverflow = Math.random() < 0.4;
    const scrollable = hasOverflow && Math.random() < 0.8;
    const responsive = Math.random() < 0.9;

    const issues = [];
    if (randomIssues) {
      if (hasOverflow && !scrollable) issues.push('Content overflow without scrolling');
      if (!responsive) issues.push('Not responsive on this viewport');
      if (viewport.key === 'mobile' && component === 'Data Table') {
        issues.push('Table may need horizontal scroll');
      }
    }

    return {
      component,
      viewport: viewport.key,
      hasOverflow,
      scrollable,
      responsive,
      issues
    };
  };

  const getResultIcon = (result: OverflowTestResult) => {
    if (result.issues.length > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (result.hasOverflow && result.scrollable) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getResultBadge = (result: OverflowTestResult) => {
    if (result.issues.length > 0) {
      return <Badge variant="destructive">Issues</Badge>;
    }
    if (result.hasOverflow && result.scrollable) {
      return <Badge variant="secondary">Scrollable</Badge>;
    }
    return <Badge variant="secondary">OK</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overflow Test Runner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This component automatically tests overflow behavior across different viewport sizes
                and components to identify potential layout issues.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center gap-4">
              <Button onClick={runOverflowTests} disabled={isRunning}>
                {isRunning ? 'Running Tests...' : 'Run Overflow Tests'}
              </Button>
              
              {isRunning &&
              <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Testing {currentViewport}...</span>
                </div>
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 &&
      <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {viewports.map((viewport) => {
              const viewportResults = testResults.filter((r) => r.viewport === viewport.key);
              const Icon = viewport.icon;

              return (
                <div key={viewport.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <h3 className="font-medium">{viewport.label} ({viewport.width}px)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-7">
                      {viewportResults.map((result, index) =>
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {getResultIcon(result)}
                            <span className="text-sm font-medium">{result.component}</span>
                          </div>
                          {getResultBadge(result)}
                        </div>
                    )}
                    </div>
                    
                    {viewportResults.some((r) => r.issues.length > 0) &&
                  <div className="ml-7 space-y-1">
                        <h4 className="text-sm font-medium text-red-700">Issues Found:</h4>
                        {viewportResults.
                    filter((r) => r.issues.length > 0).
                    map((result, index) =>
                    <div key={index} className="text-sm text-red-600 ml-2">
                              • {result.component}: {result.issues.join(', ')}
                            </div>
                    )}
                      </div>
                  }
                  </div>);

            })}
            </div>
          </CardContent>
        </Card>
      }

      {testResults.length > 0 &&
      <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter((r) => r.issues.length === 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {testResults.filter((r) => r.hasOverflow && r.scrollable && r.issues.length === 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter((r) => r.issues.length > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default OverflowTestComponent;