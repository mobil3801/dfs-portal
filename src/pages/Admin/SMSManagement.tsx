import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Phone,
  Settings,
  Send,
  History,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TestTube,
  DollarSign,
  Globe } from
'lucide-react';
import SMSDiagnosticTool from '@/components/SMSDiagnosticTool';

interface SMSConfig {
  id?: number;
  service_name: string;
  username: string;
  api_key: string;
  from_number: string;
  test_mode: boolean;
  is_enabled: boolean;
  daily_limit: number;
  webhook_url: string;
}

interface SMSLog {
  id: number;
  recipient_phone: string;
  message_content: string;
  sender_name: string;
  status: string;
  sent_at: string;
  message_id: string;
  clicksend_message_id: string;
  cost: number;
  error_message: string;
  message_type: string;
  sent_by_user_id: number;
}

// Country codes and validation
const SUPPORTED_COUNTRIES = [
{ code: '+1', name: 'United States/Canada', enabled: true },
{ code: '+44', name: 'United Kingdom', enabled: true },
{ code: '+61', name: 'Australia', enabled: true },
{ code: '+64', name: 'New Zealand', enabled: true },
{ code: '+33', name: 'France', enabled: true },
{ code: '+49', name: 'Germany', enabled: true },
{ code: '+81', name: 'Japan', enabled: true },
{ code: '+86', name: 'China', enabled: false },
{ code: '+91', name: 'India', enabled: true },
{ code: '+55', name: 'Brazil', enabled: true }];


const SMSManagement: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<SMSConfig>({
    service_name: 'ClickSend',
    username: 'mobil3801beach@gmail.com',
    api_key: '54DC23E4-34D7-C6B1-0601-112E36A46B49',
    from_number: 'DFS',
    test_mode: false,
    is_enabled: true,
    daily_limit: 100,
    webhook_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test message from DFS Manager SMS system.');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [dailyUsage, setDailyUsage] = useState({ used: 0, limit: 100, percentage: 0 });
  const [accountBalance, setAccountBalance] = useState<number | null>(null);

  useEffect(() => {
    loadConfiguration();
    loadSMSLogs();
    loadDailyUsage();
  }, []);

  // Helper function to safely convert balance to number
  const safeNumberConversion = (value: any): number => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return !isNaN(parsed) ? parsed : 0;
    }
    return 0;
  };

  // Country validation function
  const validateCountryCode = (phoneNumber: string): {valid: boolean;country?: string;enabled?: boolean;} => {
    for (const country of SUPPORTED_COUNTRIES) {
      if (phoneNumber.startsWith(country.code)) {
        return {
          valid: true,
          country: country.name,
          enabled: country.enabled
        };
      }
    }
    return { valid: false };
  };

  const loadConfiguration = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(24201, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: []
      });

      if (error) throw new Error(error);

      if (data?.List && data.List.length > 0) {
        const loadedConfig = data.List[0];
        setConfig({
          id: loadedConfig.id,
          service_name: loadedConfig.service_name || 'ClickSend',
          username: loadedConfig.username || 'mobil3801beach@gmail.com',
          api_key: loadedConfig.api_key || '54DC23E4-34D7-C6B1-0601-112E36A46B49',
          from_number: loadedConfig.from_number || 'DFS',
          test_mode: loadedConfig.test_mode || false,
          is_enabled: loadedConfig.is_enabled !== false,
          daily_limit: loadedConfig.daily_limit || 100,
          webhook_url: loadedConfig.webhook_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading SMS configuration:', error);
      toast({
        title: "Configuration Load Warning",
        description: "Using default ClickSend configuration. Save to persist settings.",
        variant: "default"
      });
    }
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      const configData = {
        ...config,
        updated_at: new Date().toISOString()
      };

      if (config.id) {
        const { error } = await window.ezsite.apis.tableUpdate(24201, {
          ID: config.id,
          ...configData
        });
        if (error) throw new Error(error);
      } else {
        const { error } = await window.ezsite.apis.tableCreate(24201, {
          ...configData,
          created_at: new Date().toISOString()
        });
        if (error) throw new Error(error);
      }

      toast({
        title: "Configuration Saved",
        description: "ClickSend SMS configuration has been saved successfully."
      });

      await loadConfiguration();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save configuration: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      if (!config.username || !config.api_key) {
        throw new Error('Username and API key are required');
      }

      const credentials = btoa(`${config.username}:${config.api_key}`);
      const response = await fetch('https://rest.clicksend.com/v3/account', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        if (result.data) {
          setConnectionStatus('connected');
          // Safely convert balance to number
          const balance = safeNumberConversion(result.data.balance);
          setAccountBalance(balance);
          toast({
            title: "Connection Successful",
            description: `ClickSend API connection is working correctly. Balance: $${balance.toFixed(4)}`
          });
        } else {
          throw new Error('Invalid response from ClickSend API');
        }
      } else {
        throw new Error(result.response_msg || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ClickSend API: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestSMS = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and message.",
        variant: "destructive"
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(testPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please use E.164 format (+1234567890)",
        variant: "destructive"
      });
      return;
    }

    // Validate country support
    const countryValidation = validateCountryCode(testPhone);
    if (!countryValidation.valid) {
      toast({
        title: "Unsupported Country",
        description: "The phone number's country code is not recognized. Please use a supported country code.",
        variant: "destructive"
      });
      return;
    }

    if (!countryValidation.enabled) {
      toast({
        title: "Country Not Enabled",
        description: `SMS sending to ${countryValidation.country} is not enabled in your ClickSend account. Please enable this country in your ClickSend dashboard or contact support.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (!config.username || !config.api_key) {
        throw new Error('SMS service not configured. Please configure credentials first.');
      }

      const credentials = btoa(`${config.username}:${config.api_key}`);

      const smsData = {
        messages: [{
          source: config.from_number,
          to: testPhone,
          body: testMessage
        }]
      };

      console.log('Sending SMS with data:', smsData);

      const response = await fetch('https://rest.clicksend.com/v3/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(smsData)
      });

      const result = await response.json();
      console.log('ClickSend API Response:', result);

      if (response.ok && result.data?.messages?.[0]) {
        const messageResult = result.data.messages[0];

        // Log the test SMS
        try {
          await window.ezsite.apis.tableCreate(24202, {
            recipient_phone: testPhone,
            message_content: testMessage,
            sender_name: config.from_number,
            status: messageResult.status === 'SUCCESS' ? 'Sent' : 'Failed',
            sent_at: new Date().toISOString(),
            message_id: messageResult.message_id || '',
            clicksend_message_id: messageResult.message_id || '',
            cost: safeNumberConversion(messageResult.message_price),
            error_message: messageResult.status !== 'SUCCESS' ? messageResult.custom_string || 'Unknown error' : '',
            message_type: 'test',
            sent_by_user_id: 1
          });
        } catch (logError) {
          console.error('Failed to log SMS:', logError);
        }

        if (messageResult.status === 'SUCCESS') {
          const cost = safeNumberConversion(messageResult.message_price);
          toast({
            title: "Test SMS Sent Successfully",
            description: `Message sent to ${testPhone}. Message ID: ${messageResult.message_id}. Cost: $${cost.toFixed(4)}`
          });
        } else {
          // Handle specific error messages
          let errorMessage = messageResult.custom_string || messageResult.status || 'Failed to send SMS';

          // Check for country-specific errors
          if (errorMessage.toLowerCase().includes('country not enable') ||
          errorMessage.toLowerCase().includes('country is not enabled')) {
            const countryInfo = validateCountryCode(testPhone);
            errorMessage = `SMS sending to ${countryInfo.country || 'this country'} is not enabled in your ClickSend account. Please enable this destination country in your ClickSend dashboard.`;
          }

          throw new Error(errorMessage);
        }
      } else {
        // Handle API errors
        let errorMessage = result.response_msg ||
        result.error_message || (
        result.data && typeof result.data === 'string' ? result.data : '') ||
        `HTTP ${response.status}: ${response.statusText}`;

        // Check for country-specific errors in the main response
        if (errorMessage.toLowerCase().includes('country not enable') ||
        errorMessage.toLowerCase().includes('country is not enabled')) {
          const countryInfo = validateCountryCode(testPhone);
          errorMessage = `SMS sending to ${countryInfo.country || 'this country'} is not enabled in your ClickSend account. Please enable this destination country in your ClickSend dashboard or contact ClickSend support.`;
        }

        throw new Error(errorMessage);
      }

      await loadSMSLogs();
      await loadDailyUsage();
    } catch (error) {
      console.error('SMS sending error:', error);

      // Log failed attempt
      try {
        await window.ezsite.apis.tableCreate(24202, {
          recipient_phone: testPhone,
          message_content: testMessage,
          sender_name: config.from_number,
          status: 'Failed',
          sent_at: new Date().toISOString(),
          message_id: '',
          clicksend_message_id: '',
          cost: 0,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          message_type: 'test',
          sent_by_user_id: 1
        });
      } catch (logError) {
        console.error('Failed to log SMS error:', logError);
      }

      toast({
        title: "Test SMS Failed",
        description: `Failed to send test SMS: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSMSLogs = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(24202, {
        PageNo: 1,
        PageSize: 50,
        OrderByField: 'sent_at',
        IsAsc: false,
        Filters: []
      });

      if (error) throw new Error(error);
      setSmsLogs(data?.List || []);
    } catch (error) {
      console.error('Error loading SMS logs:', error);
    }
  };

  const loadDailyUsage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await window.ezsite.apis.tablePage(24202, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
        { name: 'sent_at', op: 'StringStartsWith', value: today },
        { name: 'status', op: 'Equal', value: 'Sent' }]

      });

      if (error) throw new Error(error);

      const used = data?.VirtualCount || 0;
      const limit = config.daily_limit;
      const percentage = limit > 0 ? used / limit * 100 : 0;

      setDailyUsage({ used, limit, percentage });
    } catch (error) {
      console.error('Error loading daily usage:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'failed':
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = safeNumberConversion(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(safeAmount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMS Management</h1>
          <p className="text-muted-foreground">
            Manage ClickSend SMS service configuration and monitor message activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {connectionStatus === 'connected' &&
          <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />Connected
            </Badge>
          }
          {connectionStatus === 'error' &&
          <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />Disconnected
            </Badge>
          }
          {accountBalance !== null &&
          <Badge variant="outline">
              <DollarSign className="w-3 h-3 mr-1" />
              Balance: {formatCurrency(accountBalance)}
            </Badge>
          }
        </div>
      </div>

      {/* Daily Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Usage</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyUsage.used}/{dailyUsage.limit}</div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(dailyUsage.percentage, 100)}%` }} />

            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dailyUsage.percentage.toFixed(1)}% of daily limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{config.is_enabled ? 'Active' : 'Disabled'}</div>
            <p className="text-xs text-muted-foreground">
              ClickSend SMS {config.test_mode ? '(Test Mode)' : '(Production)'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{smsLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Total messages logged
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="test">Send Test SMS</TabsTrigger>
          <TabsTrigger value="logs">Message Logs</TabsTrigger>
          <TabsTrigger value="countries">Supported Countries</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ClickSend Configuration</CardTitle>
              <CardDescription>
                Configure your ClickSend SMS service credentials and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">ClickSend Username/Email</Label>
                  <Input
                    id="username"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    placeholder="your-email@example.com" />

                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={config.api_key}
                    onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                    placeholder="Your ClickSend API Key" />

                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_number">Default Sender Name</Label>
                  <Input
                    id="from_number"
                    value={config.from_number}
                    onChange={(e) => setConfig({ ...config, from_number: e.target.value })}
                    placeholder="DFS" />

                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily_limit">Daily SMS Limit</Label>
                  <Input
                    id="daily_limit"
                    type="number"
                    value={config.daily_limit}
                    onChange={(e) => setConfig({ ...config, daily_limit: parseInt(e.target.value) || 100 })}
                    placeholder="100" />

                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
                <Input
                  id="webhook_url"
                  value={config.webhook_url}
                  onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                  placeholder="https://your-domain.com/sms-webhook" />

              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_enabled"
                    checked={config.is_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, is_enabled: checked })} />

                  <Label htmlFor="is_enabled">Enable SMS Service</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="test_mode"
                    checked={config.test_mode}
                    onCheckedChange={(checked) => setConfig({ ...config, test_mode: checked })} />

                  <Label htmlFor="test_mode">Test Mode</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={saveConfiguration} disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                  Save Configuration
                </Button>
                <Button variant="outline" onClick={testConnection} disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Test SMS</CardTitle>
              <CardDescription>
                Send a test SMS message to verify your ClickSend configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!config.is_enabled &&
              <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    SMS service is currently disabled. Enable it in the Configuration tab to send messages.
                  </AlertDescription>
                </Alert>
              }

              <div className="space-y-2">
                <Label htmlFor="test_phone">Phone Number</Label>
                <Input
                  id="test_phone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+1234567890"
                  disabled={!config.is_enabled} />

                <p className="text-sm text-muted-foreground">
                  Use E.164 format (e.g., +1234567890). Check Supported Countries tab for available destinations.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_message">Message</Label>
                <Textarea
                  id="test_message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter your test message here..."
                  rows={3}
                  disabled={!config.is_enabled} />

                <p className="text-sm text-muted-foreground">
                  {testMessage.length}/160 characters
                </p>
              </div>

              <Button
                onClick={sendTestSMS}
                disabled={loading || !config.is_enabled || !testPhone || !testMessage}
                className="w-full">

                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Test SMS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>SMS Message Logs</CardTitle>
                <CardDescription>
                  View and monitor all SMS messages sent through the system
                </CardDescription>
              </div>
              <Button variant="outline" onClick={loadSMSLogs}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {smsLogs.length === 0 ?
                <div className="text-center py-8">
                    <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No SMS messages found</p>
                  </div> :
                <div className="space-y-2">
                    {smsLogs.map((log) =>
                  <div key={log.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{log.recipient_phone}</span>
                            {getStatusBadge(log.status)}
                            <Badge variant="outline">{log.message_type}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(log.sent_at).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm">{log.message_content}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>From: {log.sender_name}</span>
                          <span>Cost: {formatCurrency(log.cost)}</span>
                          {log.message_id && <span>ID: {log.message_id}</span>}
                        </div>
                        {log.error_message &&
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                            Error: {log.error_message}
                          </div>
                    }
                      </div>
                  )}
                  </div>
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supported Countries</CardTitle>
              <CardDescription>
                Countries and regions where SMS sending is supported by ClickSend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SUPPORTED_COUNTRIES.map((country) =>
                <div key={country.code} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{country.name}</p>
                        <p className="text-sm text-muted-foreground">{country.code}</p>
                      </div>
                    </div>
                    <Badge variant={country.enabled ? "default" : "secondary"}>
                      {country.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                )}
              </div>
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  If a country shows as "Disabled" or you receive a "country not enabled" error, 
                  you need to enable SMS sending for that country in your ClickSend dashboard. 
                  Contact ClickSend support if you need assistance enabling additional countries.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default SMSManagement;