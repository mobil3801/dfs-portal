
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle,
  AlertTriangle,
  Info,
  Target,
  Eye,
  Settings } from
'lucide-react';

const OverflowTestGuide = () => {
  const testScenarios = [
  {
    title: "Mobile Portrait (375px)",
    description: "Test navigation collapse and content stacking",
    checks: [
    "Navigation items collapse into hamburger menu",
    "Tables scroll horizontally",
    "Cards stack vertically",
    "Forms maintain proper spacing"]

  },
  {
    title: "Tablet (768px)",
    description: "Test responsive breakpoints and layout changes",
    checks: [
    "Navigation shows partial items with overflow",
    "Tables show scroll indicators",
    "Cards show in 2-column grid",
    "Forms show in single column"]

  },
  {
    title: "Desktop (1024px+)",
    description: "Test full layout and overflow handling",
    checks: [
    "All navigation items visible or overflow handled",
    "Tables show all columns or scroll gracefully",
    "Cards show in multi-column grid",
    "Forms show in multi-column layout"]

  }];


  const commonIssues = [
  {
    issue: "Horizontal scrolling on body",
    cause: "Elements extending beyond viewport width",
    solution: "Use overflow-x-hidden on containers, ensure responsive design"
  },
  {
    issue: "Navigation items disappearing",
    cause: "No overflow handling for navigation",
    solution: "Implement overflow menu or horizontal scroll"
  },
  {
    issue: "Tables breaking layout",
    cause: "Wide tables without proper overflow handling",
    solution: "Use overflow-x-auto on table containers"
  },
  {
    issue: "Text not wrapping",
    cause: "Long text without proper word-break",
    solution: "Use word-wrap: break-word or truncate long text"
  }];


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overflow Testing Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This guide helps you systematically test overflow behavior across different screen sizes.
              Follow the test scenarios below to ensure your application handles overflow gracefully.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">How to Test</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">Visual Testing</span>
                </div>
                <ul className="text-sm space-y-1 ml-6">
                  <li>• Use browser dev tools to resize viewport</li>
                  <li>• Test on actual devices when possible</li>
                  <li>• Check for horizontal scrollbars</li>
                  <li>• Verify all content remains accessible</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Automated Testing</span>
                </div>
                <ul className="text-sm space-y-1 ml-6">
                  <li>• Use the viewport controls above</li>
                  <li>• Test with different content lengths</li>
                  <li>• Verify scroll behavior works correctly</li>
                  <li>• Check responsive breakpoints</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testScenarios.map((scenario, index) =>
            <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="h-4 w-4" />
                  <h4 className="font-medium">{scenario.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Checklist:</span>
                  {scenario.checks.map((check, checkIndex) =>
                <div key={checkIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {check}
                    </div>
                )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commonIssues.map((item, index) =>
            <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.issue}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Cause:</strong> {item.cause}
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      <strong>Solution:</strong> {item.solution}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSS Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Recommended CSS Classes</h4>
              <div className="space-y-2 text-sm">
                <div><code className="bg-gray-200 px-2 py-1 rounded">overflow-x-auto</code> - Horizontal scroll when needed</div>
                <div><code className="bg-gray-200 px-2 py-1 rounded">overflow-hidden</code> - Hide overflow completely</div>
                <div><code className="bg-gray-200 px-2 py-1 rounded">truncate</code> - Truncate text with ellipsis</div>
                <div><code className="bg-gray-200 px-2 py-1 rounded">break-words</code> - Allow word breaking</div>
                <div><code className="bg-gray-200 px-2 py-1 rounded">whitespace-nowrap</code> - Prevent text wrapping</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Container Guidelines</h4>
              <ul className="space-y-1 text-sm">
                <li>• Use max-width for content containers</li>
                <li>• Apply overflow handling to scrollable containers</li>
                <li>• Use responsive padding and margins</li>
                <li>• Consider min-width for important elements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default OverflowTestGuide;