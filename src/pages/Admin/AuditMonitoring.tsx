import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AccessDenied from '@/components/AccessDenied';
import useAdminAccess from '@/hooks/use-admin-access';
import AuditLogDashboard from '@/components/AuditLogDashboard';
import AuditLogViewer from '@/components/AuditLogViewer';
import { Shield, Eye, BarChart3, Download, AlertTriangle, Settings } from 'lucide-react';

const AuditMonitoringPage: React.FC = () => {
  const { isAdmin } = useAdminAccess();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check admin access first
  if (!isAdmin) {
    return (
      <AccessDenied
        feature="Audit Monitoring System"
        requiredRole="Administrator" />);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Audit & Security Monitoring</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            Active Monitoring
          </Badge>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Monitoring Status</p>
                <p className="text-2xl font-bold text-blue-800">Active</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              All access attempts are being logged
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Security Level</p>
                <p className="text-2xl font-bold text-orange-800">High</p>
              </div>
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-orange-600 mt-2">
              Enhanced monitoring enabled
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Compliance</p>
                <p className="text-2xl font-bold text-green-800">100%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              Meeting security standards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Audit Logs</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Security Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AuditLogDashboard />
        </TabsContent>

        <TabsContent value="logs">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>Security Alerts Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Failed Login Threshold</h4>
                        <Badge className="bg-yellow-500 text-white">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Alert when more than 5 failed login attempts occur within 15 minutes
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Suspicious Activity Detection</h4>
                        <Badge className="bg-red-500 text-white">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Monitor for unusual access patterns and data modification attempts
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Data Access Monitoring</h4>
                        <Badge className="bg-blue-500 text-white">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Track all sensitive data access and modifications
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Permission Changes</h4>
                        <Badge className="bg-purple-500 text-white">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Monitor all user permission and role modifications
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Audit Logging Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Logging Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Log Retention Period</label>
                      <div className="p-3 border rounded-md bg-gray-50">
                        <span className="text-sm">90 days (recommended)</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Log Level</label>
                      <div className="p-3 border rounded-md bg-gray-50">
                        <span className="text-sm">Detailed (All Events)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Monitored Events</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                    'Login Attempts',
                    'Logout Events',
                    'Registration',
                    'Password Resets',
                    'Data Access',
                    'Data Modifications',
                    'Permission Changes',
                    'Admin Actions',
                    'File Uploads',
                    'Report Generation',
                    'System Errors',
                    'Suspicious Activity'].
                    map((event) =>
                    <div key={event} className="flex items-center space-x-2 p-2 border rounded-md">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs">{event}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Export & Compliance</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Weekly Report
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Monthly Report
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Compliance Report
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Audit Logging Status</h4>
                      <p className="text-sm text-muted-foreground">
                        All security events are being monitored and logged
                      </p>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      <Shield className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default AuditMonitoringPage;