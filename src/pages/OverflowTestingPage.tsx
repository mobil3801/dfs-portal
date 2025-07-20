
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import OverflowTestSuite from '@/components/OverflowTestSuite';
import ResponsiveNavigationTester from '@/components/ResponsiveNavigationTester';
import {
  TestTube,
  Monitor,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink } from
'lucide-react';

const OverflowTestingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Overflow Testing Suite</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive testing tools for responsive design and overflow behavior
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <TestTube className="h-3 w-3 mr-1" />
              Testing Tools
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Monitor className="h-3 w-3 mr-1" />
              Live Monitoring
            </Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <TestTube className="h-5 w-5 text-blue-600" />
                <span>Automated Testing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Run comprehensive overflow tests across multiple viewport sizes and detect issues automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Navigation className="h-5 w-5 text-green-600" />
                <span>Navigation Testing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Test navigation components with different viewport sizes and item counts to ensure proper overflow handling.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-purple-600" />
                <span>Live Monitoring</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Real-time overflow detection that monitors your application and reports issues as they occur.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Guide */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Quick Start:</strong> Use the tabs below to access different testing tools. 
            Start with the Navigation Tester to see how your navigation behaves across different screen sizes, 
            then use the Overflow Test Suite for comprehensive monitoring.
          </AlertDescription>
        </Alert>

        {/* Main Testing Interface */}
        <Tabs defaultValue="navigation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="navigation" className="flex items-center space-x-2">
              <Navigation className="h-4 w-4" />
              <span>Navigation Testing</span>
            </TabsTrigger>
            <TabsTrigger value="overflow" className="flex items-center space-x-2">
              <TestTube className="h-4 w-4" />
              <span>Overflow Detection</span>
            </TabsTrigger>
            <TabsTrigger value="ci" className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span>CI/CD Integration</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="navigation" className="space-y-6">
            <ResponsiveNavigationTester />
          </TabsContent>

          <TabsContent value="overflow" className="space-y-6">
            <OverflowTestSuite />
          </TabsContent>

          <TabsContent value="ci" className="space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>CI/CD Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Automated overflow detection can be integrated into your CI/CD pipeline to catch issues before deployment.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Setup Instructions</h3>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">1. Install Testing Script</h4>
                        <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                          chmod +x scripts/setup-overflow-testing.sh<br />
                          ./scripts/setup-overflow-testing.sh
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">2. Run Tests Locally</h4>
                        <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                          npm start  # Start development server<br />
                          npm run test:overflow:dev  # Run overflow tests
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">3. View Reports</h4>
                        <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                          open overflow-test-reports/overflow-report.html
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">4. GitHub Actions Integration</h4>
                        <p className="text-sm text-muted-foreground">
                          The setup script automatically creates a GitHub Actions workflow that runs overflow tests on:
                        </p>
                        <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                          <li>• Push to main/develop branches</li>
                          <li>• Pull requests</li>
                          <li>• Manual workflow dispatch</li>
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">Benefits</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li>• Catch issues before deployment</li>
                          <li>• Automated testing across viewports</li>
                          <li>• Visual reports with screenshots</li>
                          <li>• Integration with PR reviews</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Features</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Multiple viewport testing</li>
                          <li>• Screenshot capture</li>
                          <li>• JSON and HTML reports</li>
                          <li>• Pre-commit hooks</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Viewport Sizes</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                        { name: 'iPhone SE', size: '375×667' },
                        { name: 'iPhone 11', size: '414×896' },
                        { name: 'iPad', size: '768×1024' },
                        { name: 'iPad Landscape', size: '1024×768' },
                        { name: 'Laptop', size: '1280×720' },
                        { name: 'Desktop', size: '1920×1080' }].
                        map((viewport) =>
                        <div key={viewport.name} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="font-medium">{viewport.name}</div>
                            <div className="text-muted-foreground">{viewport.size}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Test Routes</h4>
                      <div className="flex flex-wrap gap-2">
                        {['/', '/dashboard', '/products', '/orders', '/customers', '/settings'].map((route) =>
                        <Badge key={route} variant="outline">{route}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Report Outputs</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>JSON Report:</strong> Machine-readable test results</li>
                        <li>• <strong>HTML Report:</strong> Human-readable visual report</li>
                        <li>• <strong>Screenshots:</strong> Visual evidence of overflow issues</li>
                        <li>• <strong>CI Artifacts:</strong> Downloadable reports from CI runs</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Overflow testing helps ensure your application provides a consistent user experience across all devices and screen sizes.
          </p>
        </div>
      </div>
    </div>);

};

export default OverflowTestingPage;