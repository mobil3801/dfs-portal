import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Bell,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Save,
  TestTube,
  Mail,
  MessageSquare,
  Clock } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notification_methods: ('email' | 'sms' | 'in_app')[];
  cooldown_minutes: number;
  description: string;
  created_at: string;
  last_triggered?: string;
}

interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'webhook';
  name: string;
  configuration: Record<string, any>;
  enabled: boolean;
}

const AlertThresholdManager = () => {
  const { toast } = useToast();
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
  {
    id: '1',
    name: 'High Connection Time',
    metric: 'connection_time',
    operator: 'greater_than',
    threshold: 2000,
    severity: 'high',
    enabled: true,
    notification_methods: ['email', 'in_app'],
    cooldown_minutes: 15,
    description: 'Alert when database connection time exceeds 2 seconds',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Critical Error Rate',
    metric: 'error_rate',
    operator: 'greater_than',
    threshold: 5,
    severity: 'critical',
    enabled: true,
    notification_methods: ['email', 'sms', 'in_app'],
    cooldown_minutes: 5,
    description: 'Alert when error rate exceeds 5%',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Memory Usage Warning',
    metric: 'memory_usage',
    operator: 'greater_than',
    threshold: 80,
    severity: 'medium',
    enabled: true,
    notification_methods: ['in_app'],
    cooldown_minutes: 30,
    description: 'Alert when memory usage exceeds 80%',
    created_at: new Date().toISOString()
  }]
  );

  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([
  {
    id: '1',
    type: 'email',
    name: 'Admin Email',
    configuration: { recipients: ['admin@dfsmanager.com'] },
    enabled: true
  },
  {
    id: '2',
    type: 'sms',
    name: 'Emergency SMS',
    configuration: { phone_numbers: ['+1234567890'] },
    enabled: true
  }]
  );

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<AlertRule>>({
    name: '',
    metric: 'connection_time',
    operator: 'greater_than',
    threshold: 1000,
    severity: 'medium',
    enabled: true,
    notification_methods: ['in_app'],
    cooldown_minutes: 15,
    description: ''
  });

  const availableMetrics = [
  { value: 'connection_time', label: 'Connection Time (ms)', unit: 'ms' },
  { value: 'query_response_time', label: 'Query Response Time (ms)', unit: 'ms' },
  { value: 'error_rate', label: 'Error Rate (%)', unit: '%' },
  { value: 'memory_usage', label: 'Memory Usage (%)', unit: '%' },
  { value: 'cpu_usage', label: 'CPU Usage (%)', unit: '%' },
  { value: 'active_connections', label: 'Active Connections', unit: 'count' }];


  const handleCreateRule = () => {
    if (!newRule.name || !newRule.description) {
      toast({
        title: "Validation Error",
        description: "Please provide name and description for the alert rule",
        variant: "destructive"
      });
      return;
    }

    const rule: AlertRule = {
      ...(newRule as AlertRule),
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };

    setAlertRules((prev) => [...prev, rule]);
    setNewRule({
      name: '',
      metric: 'connection_time',
      operator: 'greater_than',
      threshold: 1000,
      severity: 'medium',
      enabled: true,
      notification_methods: ['in_app'],
      cooldown_minutes: 15,
      description: ''
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Alert Rule Created",
      description: `Successfully created alert rule: ${rule.name}`
    });
  };

  const handleUpdateRule = (updatedRule: AlertRule) => {
    setAlertRules((prev) =>
    prev.map((rule) => rule.id === updatedRule.id ? updatedRule : rule)
    );
    setEditingRule(null);

    toast({
      title: "Alert Rule Updated",
      description: `Successfully updated alert rule: ${updatedRule.name}`
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    const rule = alertRules.find((r) => r.id === ruleId);
    setAlertRules((prev) => prev.filter((rule) => rule.id !== ruleId));

    toast({
      title: "Alert Rule Deleted",
      description: `Successfully deleted alert rule: ${rule?.name}`
    });
  };

  const handleToggleRule = (ruleId: string) => {
    setAlertRules((prev) =>
    prev.map((rule) =>
    rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    )
    );
  };

  const testAlertRule = async (rule: AlertRule) => {
    toast({
      title: "Testing Alert Rule",
      description: `Sending test notification for: ${rule.name}`
    });

    // Simulate test notification
    setTimeout(() => {
      toast({
        title: "Test Notification Sent",
        description: `Test alert sent successfully via ${rule.notification_methods.join(', ')}`,
        variant: "default"
      });
    }, 1000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':return 'destructive';
      case 'high':return 'secondary';
      case 'medium':return 'outline';
      default:return 'default';
    }
  };

  const getMetricUnit = (metric: string) => {
    const metricConfig = availableMetrics.find((m) => m.value === metric);
    return metricConfig?.unit || '';
  };

  const formatLastTriggered = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Threshold Manager
          </CardTitle>
          <CardDescription>
            Configure automated monitoring alerts and notification thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {alertRules.filter((r) => r.enabled).length} Active Rules
              </Badge>
              <Badge variant="secondary">
                {notificationChannels.filter((c) => c.enabled).length} Notification Channels
              </Badge>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Alert Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Alert Rule</DialogTitle>
                  <DialogDescription>
                    Set up automated monitoring alerts with custom thresholds
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Rule Name</Label>
                      <Input
                        id="name"
                        value={newRule.name || ''}
                        onChange={(e) => setNewRule((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter rule name" />

                    </div>
                    <div>
                      <Label htmlFor="metric">Metric</Label>
                      <Select
                        value={newRule.metric}
                        onValueChange={(value) => setNewRule((prev) => ({ ...prev, metric: value }))}>

                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMetrics.map((metric) =>
                          <SelectItem key={metric.value} value={metric.value}>
                              {metric.label}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="operator">Operator</Label>
                      <Select
                        value={newRule.operator}
                        onValueChange={(value: any) => setNewRule((prev) => ({ ...prev, operator: value }))}>

                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                          <SelectItem value="equals">Equals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="threshold">Threshold</Label>
                      <Input
                        id="threshold"
                        type="number"
                        value={newRule.threshold || 0}
                        onChange={(e) => setNewRule((prev) => ({ ...prev, threshold: Number(e.target.value) }))}
                        placeholder="Enter threshold value" />

                    </div>
                    <div>
                      <Label htmlFor="severity">Severity</Label>
                      <Select
                        value={newRule.severity}
                        onValueChange={(value: any) => setNewRule((prev) => ({ ...prev, severity: value }))}>

                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newRule.description || ''}
                      onChange={(e) => setNewRule((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this alert monitors" />

                  </div>

                  <div>
                    <Label htmlFor="cooldown">Cooldown Period (minutes)</Label>
                    <Input
                      id="cooldown"
                      type="number"
                      value={newRule.cooldown_minutes || 15}
                      onChange={(e) => setNewRule((prev) => ({ ...prev, cooldown_minutes: Number(e.target.value) }))}
                      placeholder="Minimum time between alerts" />

                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRule} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {alertRules.length === 0 ?
          <Card>
              <CardContent className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Alert Rules Configured</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first alert rule to start monitoring system performance
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Create Alert Rule
                </Button>
              </CardContent>
            </Card> :

          <div className="space-y-4">
              {alertRules.map((rule) =>
            <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <Badge variant={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testAlertRule(rule)}
                      className="flex items-center gap-1">

                          <TestTube className="h-3 w-3" />
                          Test
                        </Button>
                        <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
                      className="flex items-center gap-1">

                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700">

                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                        <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)} />

                      </div>
                    </div>
                    <CardDescription>{rule.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Metric</Label>
                        <div className="font-medium">
                          {availableMetrics.find((m) => m.value === rule.metric)?.label || rule.metric}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Condition</Label>
                        <div className="font-medium">
                          {rule.operator.replace('_', ' ')} {rule.threshold}{getMetricUnit(rule.metric)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Cooldown</Label>
                        <div className="font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rule.cooldown_minutes} min
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Last Triggered</Label>
                        <div className="font-medium text-sm">
                          {formatLastTriggered(rule.last_triggered)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label className="text-sm text-muted-foreground">Notification Methods</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {rule.notification_methods.map((method) =>
                    <Badge key={method} variant="outline" className="flex items-center gap-1">
                            {method === 'email' && <Mail className="h-3 w-3" />}
                            {method === 'sms' && <MessageSquare className="h-3 w-3" />}
                            {method === 'in_app' && <Bell className="h-3 w-3" />}
                            {method.replace('_', ' ')}
                          </Badge>
                    )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
            )}
            </div>
          }
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Configure how alerts are delivered to administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationChannels.map((channel) =>
              <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {channel.type === 'email' && <Mail className="h-5 w-5 text-blue-500" />}
                    {channel.type === 'sms' && <MessageSquare className="h-5 w-5 text-green-500" />}
                    <div>
                      <div className="font-medium">{channel.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {channel.type} notifications
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={channel.enabled ? 'default' : 'secondary'}>
                      {channel.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Global Alert Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide alert behavior and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Global settings affect all alert rules and notification channels.
                  Changes take effect immediately for all monitoring activities.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Alert System</Label>
                    <p className="text-sm text-muted-foreground">
                      Master switch for all alert functionality
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Quiet Hours</Label>
                    <p className="text-sm text-muted-foreground">
                      Suppress non-critical alerts during specified hours
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Alert Escalation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically escalate unacknowledged critical alerts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Alert History Retention</Label>
                    <p className="text-sm text-muted-foreground">
                      Keep alert history for specified number of days
                    </p>
                  </div>
                  <Input
                    type="number"
                    defaultValue={30}
                    className="w-20"
                    min={1}
                    max={365} />

                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Global Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default AlertThresholdManager;