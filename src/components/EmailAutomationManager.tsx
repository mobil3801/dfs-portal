import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Send,
  Settings,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  BarChart3,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Eye } from
'lucide-react';

interface EmailAutomationConfig {
  id?: number;
  automation_name: string;
  email_type: string;
  is_active: boolean;
  from_email: string;
  from_name: string;
  trigger_condition: string;
  trigger_value: number;
  frequency_hours: number;
  template_id?: number;
  recipient_groups: string;
  last_run?: string;
  next_run?: string;
  total_sent: number;
  success_rate: number;
  created_by?: number;
}

interface EmailTemplate {
  id?: number;
  template_name: string;
  template_type: string;
  subject: string;
  html_content: string;
  text_content: string;
  is_active: boolean;
  variables: string;
  created_by?: number;
}

interface EmailStats {
  totalSent: number;
  successRate: number;
  deliveryRate: number;
  openRate: number;
  lastSent: string;
  queuedEmails: number;
}

const EmailAutomationManager: React.FC = () => {
  const [automations, setAutomations] = useState<EmailAutomationConfig[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    successRate: 0,
    deliveryRate: 0,
    openRate: 0,
    lastSent: '',
    queuedEmails: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingAutomation, setEditingAutomation] = useState<EmailAutomationConfig | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [testEmailSending, setTestEmailSending] = useState<number | null>(null);
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadAutomations();
    loadTemplates();
    loadStats();
  }, []);

  const loadAutomations = async () => {
    try {
      // Since email automation tables don't exist yet, we'll create them first
      console.log('Loading email automations...');
      // For now, use mock data until tables are created
      setAutomations([
      {
        id: 1,
        automation_name: 'License Expiry Alerts',
        email_type: 'License Alert',
        is_active: true,
        from_email: 'alerts@dfsmanager.com',
        from_name: 'DFS Manager Alerts',
        trigger_condition: 'days_before_expiry',
        trigger_value: 30,
        frequency_hours: 24,
        recipient_groups: 'station_managers,admin',
        total_sent: 45,
        success_rate: 98.5,
        last_run: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        next_run: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        automation_name: 'Daily Sales Reports',
        email_type: 'Sales Report',
        is_active: true,
        from_email: 'reports@dfsmanager.com',
        from_name: 'DFS Manager Reports',
        trigger_condition: 'daily_schedule',
        trigger_value: 8,
        frequency_hours: 24,
        recipient_groups: 'management',
        total_sent: 120,
        success_rate: 99.2,
        last_run: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        next_run: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString()
      }]
      );
    } catch (error) {
      console.error('Error loading automations:', error);
      toast({
        title: "Error",
        description: "Failed to load email automations",
        variant: "destructive"
      });
    }
  };

  const loadTemplates = async () => {
    try {
      console.log('Loading email templates...');
      // Mock template data
      setTemplates([
      {
        id: 1,
        template_name: 'License Expiry Alert',
        template_type: 'License Alert',
        subject: 'License Expiring Soon - {license_name}',
        html_content: `
            <h2>License Expiry Alert</h2>
            <p>Dear {recipient_name},</p>
            <p>This is a reminder that the license <strong>{license_name}</strong> for station <strong>{station_name}</strong> will expire on <strong>{expiry_date}</strong>.</p>
            <p>Please take immediate action to renew this license to avoid any business disruption.</p>
            <p>Days remaining: <strong>{days_remaining}</strong></p>
            <hr>
            <p>DFS Manager System</p>
          `,
        text_content: 'License {license_name} for {station_name} expires on {expiry_date}. Days remaining: {days_remaining}',
        is_active: true,
        variables: 'license_name,station_name,expiry_date,days_remaining,recipient_name'
      },
      {
        id: 2,
        template_name: 'Daily Sales Summary',
        template_type: 'Sales Report',
        subject: 'Daily Sales Report - {report_date}',
        html_content: `
            <h2>Daily Sales Report</h2>
            <p>Sales summary for {report_date}</p>
            <table border="1" style="border-collapse: collapse; width: 100%;">
              <tr><th>Station</th><th>Total Sales</th><th>Fuel Sales</th><th>Store Sales</th></tr>
              <tr><td>{station_name}</td><td>${total_sales}</td><td>${fuel_sales}</td><td>${store_sales}</td></tr>
            </table>
            <p>Generated automatically by DFS Manager</p>
          `,
        text_content: 'Daily sales for {report_date}: Total: ${total_sales}, Fuel: ${fuel_sales}, Store: ${store_sales}',
        is_active: true,
        variables: 'report_date,station_name,total_sales,fuel_sales,store_sales'
      }]
      );
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from automations
      const totalSent = automations.reduce((sum, auto) => sum + auto.total_sent, 0);
      const avgSuccessRate = automations.length > 0 ?
      automations.reduce((sum, auto) => sum + auto.success_rate, 0) / automations.length :
      0;

      setStats({
        totalSent,
        successRate: avgSuccessRate,
        deliveryRate: 96.8,
        openRate: 78.3,
        lastSent: automations.length > 0 ? automations[0].last_run || '' : '',
        queuedEmails: 12
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async (automationId: number) => {
    setTestEmailSending(automationId);
    try {
      const automation = automations.find((a) => a.id === automationId);
      if (!automation) return;

      const { error } = await window.ezsite.apis.sendEmail({
        from: `${automation.from_name} <${automation.from_email}>`,
        to: [automation.from_email], // Send to self for testing
        subject: `TEST: ${automation.automation_name} - ${new Date().toLocaleString()}`,
        html: `
          <h2>Email Automation Test</h2>
          <p>This is a test email for the automation: <strong>${automation.automation_name}</strong></p>
          <p><strong>Type:</strong> ${automation.email_type}</p>
          <p><strong>Trigger:</strong> ${automation.trigger_condition} = ${automation.trigger_value}</p>
          <p><strong>Frequency:</strong> Every ${automation.frequency_hours} hours</p>
          <p><strong>Recipients:</strong> ${automation.recipient_groups}</p>
          <hr>
          <p>Test sent at: ${new Date().toLocaleString()}</p>
          <p>DFS Manager Email Automation System</p>
        `
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Test email sent successfully for ${automation.automation_name}`
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setTestEmailSending(null);
    }
  };

  const toggleAutomation = async (id: number, active: boolean) => {
    try {
      setAutomations((prev) => prev.map((auto) =>
      auto.id === id ? { ...auto, is_active: active } : auto
      ));

      toast({
        title: active ? "Automation Enabled" : "Automation Disabled",
        description: `Email automation has been ${active ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({
        title: "Error",
        description: "Failed to update automation status",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  const formatTimeUntil = (dateString: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));

    if (diff < 0) return 'Overdue';
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading email automation...</span>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Send className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Sent</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalSent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Open Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.openRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Queued</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.queuedEmails}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Automations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Active Automations</span>
                <Badge variant="secondary">{automations.filter((a) => a.is_active).length} Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automations.filter((a) => a.is_active).map((automation) =>
                <div key={automation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{automation.automation_name}</p>
                        <p className="text-sm text-gray-600">
                          Last run: {formatTimeAgo(automation.last_run || '')} • 
                          Next: {formatTimeUntil(automation.next_run || '')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800">
                        {automation.success_rate}% success
                      </Badge>
                      <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestEmail(automation.id!)}
                      disabled={testEmailSending === automation.id}>

                        {testEmailSending === automation.id ?
                      <RefreshCw className="w-4 h-4 animate-spin" /> :

                      <Send className="w-4 h-4" />
                      }
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Email Automations</span>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Automation
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automations.map((automation) =>
                <Card key={automation.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <Switch
                            checked={automation.is_active}
                            onCheckedChange={(checked) => toggleAutomation(automation.id!, checked)} />

                            <div>
                              <h3 className="font-semibold">{automation.automation_name}</h3>
                              <p className="text-sm text-gray-600">{automation.email_type}</p>
                            </div>
                          </div>
                          <div className="hidden md:block">
                            <p className="text-sm text-gray-600">
                              Trigger: {automation.trigger_condition} = {automation.trigger_value}
                            </p>
                            <p className="text-sm text-gray-600">
                              Frequency: Every {automation.frequency_hours} hours
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={automation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {automation.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total Sent</p>
                            <p className="font-medium">{automation.total_sent}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Success Rate</p>
                            <p className="font-medium">{automation.success_rate}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Last Run</p>
                            <p className="font-medium">{formatTimeAgo(automation.last_run || '')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Next Run</p>
                            <p className="font-medium">{formatTimeUntil(automation.next_run || '')}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Email Templates</span>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) =>
                <Card key={template.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                        <Badge className={template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-medium">{template.template_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Subject</p>
                          <p className="font-medium text-sm">{template.subject}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Variables</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.variables.split(',').map((variable, index) =>
                          <Badge key={index} variant="outline" className="text-xs">
                                {variable.trim()}
                              </Badge>
                          )}
                          </div>
                        </div>
                        <div className="flex space-x-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Delivery Rate</span>
                      <span>{stats.deliveryRate}%</span>
                    </div>
                    <Progress value={stats.deliveryRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Open Rate</span>
                      <span>{stats.openRate}%</span>
                    </div>
                    <Progress value={stats.openRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Success Rate</span>
                      <span>{stats.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.successRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {automations.slice(0, 5).map((automation) =>
                  <div key={automation.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{automation.automation_name}</p>
                        <p className="text-xs text-gray-600">
                          {formatTimeAgo(automation.last_run || '')}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Sent
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>);

};

export default EmailAutomationManager;