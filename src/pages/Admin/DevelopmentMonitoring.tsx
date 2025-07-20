import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AccessDenied from '@/components/AccessDenied';
import { useAdminAccess } from '@/hooks/use-admin-access';
import DevelopmentMonitor from '@/components/DevelopmentMonitor';
import {
  Code2,
  FileText,
  GitBranch,
  Monitor,
  Settings,
  Terminal,
  Wrench } from
'lucide-react';

const DevelopmentMonitoringPage: React.FC = () => {
  const { hasAdminAccess } = useAdminAccess();

  if (!hasAdminAccess) {
    return <AccessDenied />;
  }

  const quickActions = [
  {
    title: 'Run Lint Check',
    description: 'Check code for linting issues',
    command: 'npm run lint:check',
    icon: <Code2 className="h-4 w-4" />,
    color: 'blue'
  },
  {
    title: 'Fix Lint Issues',
    description: 'Auto-fix linting problems',
    command: 'npm run lint:fix',
    icon: <Wrench className="h-4 w-4" />,
    color: 'green'
  },
  {
    title: 'Check Imports',
    description: 'Analyze import statements',
    command: 'npm run check-imports',
    icon: <GitBranch className="h-4 w-4" />,
    color: 'purple'
  },
  {
    title: 'Type Check',
    description: 'Run TypeScript validation',
    command: 'npm run type-check',
    icon: <FileText className="h-4 w-4" />,
    color: 'orange'
  },
  {
    title: 'Quality Check',
    description: 'Complete quality analysis',
    command: 'npm run quality-check',
    icon: <Monitor className="h-4 w-4" />,
    color: 'red'
  },
  {
    title: 'Setup Git Hooks',
    description: 'Install development hooks',
    command: 'npm run setup-hooks',
    icon: <Settings className="h-4 w-4" />,
    color: 'gray'
  }];


  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'green':return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'purple':return 'border-purple-200 bg-purple-50 hover:bg-purple-100';
      case 'orange':return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
      case 'red':return 'border-red-200 bg-red-50 hover:bg-red-100';
      default:return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Development Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor code quality, imports, and development workflow
          </p>
        </div>
        <Badge variant="outline" className="text-green-600">
          Development Environment
        </Badge>
      </div>

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor">
          <DevelopmentMonitor />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Development Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action, index) =>
                <Card
                  key={index}
                  className={`cursor-pointer transition-colors ${getColorClasses(action.color)}`}
                  onClick={() => {
                    navigator.clipboard.writeText(action.command);
                    // You could add a toast notification here
                  }}>

                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1">
                            {action.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">
                            {action.description}
                          </p>
                          <code className="text-xs bg-white/50 px-2 py-1 rounded border">
                            {action.command}
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Click on any command card to copy the command to your clipboard. 
                  Then paste it in your terminal to run the check.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Initial Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">1. Install Git Hooks</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically run checks before commits
                    </p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      npm run setup-hooks
                    </code>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold">2. VS Code Setup</h4>
                    <p className="text-sm text-muted-foreground">
                      Install recommended extensions for better development experience
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold">3. Run Initial Check</h4>
                    <p className="text-sm text-muted-foreground">
                      Verify everything is working correctly
                    </p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      npm run quality-check
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Development Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold">Daily Development</h4>
                    <p className="text-sm text-muted-foreground">
                      Start development with safety checks
                    </p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      npm run dev:safe
                    </code>
                  </div>
                  
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold">Before Deployment</h4>
                    <p className="text-sm text-muted-foreground">
                      Ensure production readiness
                    </p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      npm run build:safe
                    </code>
                  </div>
                  
                  <div className="border-l-4 border-gray-500 pl-4">
                    <h4 className="font-semibold">Weekly Maintenance</h4>
                    <p className="text-sm text-muted-foreground">
                      Regular code health checks
                    </p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      npm run check-imports
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monitoring Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Automated Checks</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Import statement validation</li>
                      <li>• Missing dependency detection</li>
                      <li>• Unused import identification</li>
                      <li>• Circular dependency warnings</li>
                      <li>• TypeScript compilation errors</li>
                      <li>• ESLint rule violations</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Git Integration</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Pre-commit quality checks</li>
                      <li>• Pre-push build verification</li>
                      <li>• Automatic issue prevention</li>
                      <li>• Development workflow enforcement</li>
                      <li>• Code quality maintenance</li>
                      <li>• Import issue detection</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>);

};

export { DevelopmentMonitoringPage };
export default DevelopmentMonitoringPage;