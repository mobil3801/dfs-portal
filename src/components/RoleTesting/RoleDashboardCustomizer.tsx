import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  User, Users, Settings, Shield, Eye, Edit, Plus, Trash2,
  Download, Upload, BarChart3, Monitor, AlertTriangle,
  CheckCircle, XCircle, Layout, FileText } from
'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedRoleAccess } from '@/hooks/use-enhanced-role-access';
import { toast } from '@/hooks/use-toast';

interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  category: 'summary' | 'reports' | 'management' | 'monitoring';
  requiredRole: 'Administrator' | 'Management' | 'Employee' | 'Any';
  requiredPermissions: string[];
  isEnabled: boolean;
  position: number;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
{
  id: 'sales-summary',
  name: 'Sales Summary',
  description: 'Daily sales overview and metrics',
  category: 'summary',
  requiredRole: 'Any',
  requiredPermissions: ['sales.canView'],
  isEnabled: true,
  position: 1
},
{
  id: 'station-status',
  name: 'Station Status',
  description: 'Real-time station operational status',
  category: 'summary',
  requiredRole: 'Any',
  requiredPermissions: ['dashboard.canView'],
  isEnabled: true,
  position: 2
},
{
  id: 'inventory-alerts',
  name: 'Inventory Alerts',
  description: 'Low stock and inventory warnings',
  category: 'summary',
  requiredRole: 'Management',
  requiredPermissions: ['inventory.canView'],
  isEnabled: true,
  position: 3
},
{
  id: 'employee-management',
  name: 'Employee Management',
  description: 'Quick access to employee operations',
  category: 'management',
  requiredRole: 'Management',
  requiredPermissions: ['employees.canView', 'employees.canEdit'],
  isEnabled: true,
  position: 4
},
{
  id: 'financial-reports',
  name: 'Financial Reports',
  description: 'Revenue and expense reporting',
  category: 'reports',
  requiredRole: 'Management',
  requiredPermissions: ['sales.canViewReports'],
  isEnabled: true,
  position: 5
},
{
  id: 'user-management',
  name: 'User Management',
  description: 'System user administration',
  category: 'management',
  requiredRole: 'Administrator',
  requiredPermissions: ['admin.canManageUsers'],
  isEnabled: true,
  position: 6
},
{
  id: 'system-monitoring',
  name: 'System Monitoring',
  description: 'Application health and performance',
  category: 'monitoring',
  requiredRole: 'Administrator',
  requiredPermissions: ['monitoring.canAccessMonitoring'],
  isEnabled: true,
  position: 7
},
{
  id: 'audit-logs',
  name: 'Audit Logs',
  description: 'Security and access logging',
  category: 'monitoring',
  requiredRole: 'Administrator',
  requiredPermissions: ['admin.canViewLogs'],
  isEnabled: true,
  position: 8
},
{
  id: 'license-tracking',
  name: 'License Tracking',
  description: 'License expiration and renewal alerts',
  category: 'summary',
  requiredRole: 'Management',
  requiredPermissions: ['licenses.canView'],
  isEnabled: true,
  position: 9
},
{
  id: 'task-management',
  name: 'Task Management',
  description: 'Daily tasks and shift assignments',
  category: 'summary',
  requiredRole: 'Employee',
  requiredPermissions: ['dashboard.canView'],
  isEnabled: true,
  position: 10
}];


const RoleDashboardCustomizer: React.FC = () => {
  const { userProfile } = useAuth();
  const roleAccess = useEnhancedRoleAccess();
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [previewRole, setPreviewRole] = useState<'Administrator' | 'Management' | 'Employee'>(
    roleAccess.userRole || 'Employee'
  );

  const canAccessWidget = (widget: DashboardWidget, forRole?: string): boolean => {
    const targetRole = forRole || roleAccess.userRole;

    // Check role requirement
    if (widget.requiredRole !== 'Any') {
      if (targetRole === 'Employee' && widget.requiredRole !== 'Employee') return false;
      if (targetRole === 'Management' && widget.requiredRole === 'Administrator') return false;
    }

    // Check permissions (simplified for preview)
    return true;
  };

  const getAvailableWidgetsForRole = (role: string) => {
    return widgets.filter((widget) => canAccessWidget(widget, role) && widget.isEnabled);
  };

  const toggleWidget = (widgetId: string) => {
    if (!roleAccess.canAccessAdminArea) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can customize dashboard layouts.',
        variant: 'destructive'
      });
      return;
    }

    setWidgets((prev) => prev.map((widget) =>
    widget.id === widgetId ?
    { ...widget, isEnabled: !widget.isEnabled } :
    widget
    ));

    toast({
      title: 'Widget Updated',
      description: 'Dashboard layout has been modified.'
    });
  };

  const updateWidgetPosition = (widgetId: string, newPosition: number) => {
    if (!roleAccess.canAccessAdminArea) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can reorder dashboard widgets.',
        variant: 'destructive'
      });
      return;
    }

    setWidgets((prev) => prev.map((widget) =>
    widget.id === widgetId ?
    { ...widget, position: newPosition } :
    widget
    ));
  };

  const resetToDefaults = () => {
    if (!roleAccess.canAccessAdminArea) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can reset dashboard layouts.',
        variant: 'destructive'
      });
      return;
    }

    setWidgets(DEFAULT_WIDGETS);
    toast({
      title: 'Reset Complete',
      description: 'Dashboard layout has been reset to defaults.'
    });
  };

  const exportConfiguration = () => {
    const config = {
      widgets: widgets,
      exportDate: new Date().toISOString(),
      exportedBy: userProfile?.employee_id || 'Unknown'
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-config.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Configuration Exported',
      description: 'Dashboard configuration has been downloaded.'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'summary':
        return <BarChart3 className="h-4 w-4" />;
      case 'reports':
        return <FileText className="h-4 w-4" />;
      case 'management':
        return <Users className="h-4 w-4" />;
      case 'monitoring':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Layout className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-red-500';
      case 'Management':
        return 'bg-blue-500';
      case 'Employee':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const categories = ['summary', 'reports', 'management', 'monitoring'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Customization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Label>Your Role:</Label>
              <Badge className={getRoleColor(roleAccess.userRole || 'Unknown')}>
                {roleAccess.userRole || 'No Role'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Label>Admin Access:</Label>
              <Badge variant={roleAccess.canAccessAdminArea ? 'default' : 'destructive'}>
                {roleAccess.canAccessAdminArea ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Label>Preview Role:</Label>
              <Select value={previewRole} onValueChange={(value: any) => setPreviewRole(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportConfiguration}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="widgets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="widgets">Widget Configuration</TabsTrigger>
          <TabsTrigger value="preview">Role Preview</TabsTrigger>
          <TabsTrigger value="analytics">Access Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="widgets" className="space-y-4">
          {categories.map((category) =>
          <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  {getCategoryIcon(category)}
                  {category} Widgets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {widgets.filter((w) => w.category === category).map((widget) =>
                <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{widget.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {widget.requiredRole}
                          </Badge>
                          {widget.isEnabled ?
                      <CheckCircle className="h-4 w-4 text-green-500" /> :

                      <XCircle className="h-4 w-4 text-red-500" />
                      }
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{widget.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Position:</Label>
                        <Select
                      value={widget.position.toString()}
                      onValueChange={(value) => updateWidgetPosition(widget.id, parseInt(value))}>

                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) =>
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                        )}
                          </SelectContent>
                        </Select>
                        <Switch
                      checked={widget.isEnabled}
                      onCheckedChange={() => toggleWidget(widget.id)}
                      disabled={!roleAccess.canAccessAdminArea} />

                      </div>
                    </div>
                )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Dashboard Preview for {previewRole}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAvailableWidgetsForRole(previewRole).
                sort((a, b) => a.position - b.position).
                map((widget) =>
                <div key={widget.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{widget.name}</span>
                      <Badge variant="outline" className="text-xs">
                        #{widget.position}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{widget.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {getCategoryIcon(widget.category)}
                      <span className="text-xs capitalize">{widget.category}</span>
                    </div>
                  </div>
                )}
              </div>
              {getAvailableWidgetsForRole(previewRole).length === 0 &&
              <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No widgets are available for the {previewRole} role with current configuration.
                  </AlertDescription>
                </Alert>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Widget Access Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Available Widgets</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Management</TableHead>
                    <TableHead>Monitoring</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['Administrator', 'Management', 'Employee'].map((role) => {
                    const availableWidgets = getAvailableWidgetsForRole(role);
                    const byCategory = categories.reduce((acc, cat) => {
                      acc[cat] = availableWidgets.filter((w) => w.category === cat).length;
                      return acc;
                    }, {} as Record<string, number>);

                    return (
                      <TableRow key={role}>
                        <TableCell>
                          <Badge className={getRoleColor(role)}>{role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{availableWidgets.length}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{byCategory.summary}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{byCategory.reports}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{byCategory.management}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{byCategory.monitoring}</Badge>
                        </TableCell>
                      </TableRow>);

                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Dashboard customization allows administrators to control which widgets are visible to different user roles. 
          Changes affect all users with the respective roles across all stations.
        </AlertDescription>
      </Alert>
    </div>);

};

export default RoleDashboardCustomizer;