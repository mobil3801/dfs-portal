import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  Settings,
  Send,
  TestTube,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Phone,
  Key,
  User,
  Shield } from
'lucide-react';

interface ClickSendConfig {
  id?: number;
  service_provider: string;
  api_key: string;
  username: string;
  from_number: string;
  is_enabled: boolean;
  daily_limit: number;
  emergency_contacts: string;
  alert_types: string;
}

const ClickSendConfigManager: React.FC = () => {
  const [config, setConfig] = useState<ClickSendConfig>({
    service_provider: 'ClickSend',
    api_key: '54DC23E4-34D7-C6B1-0601-112E36A46B49', // Pre-filled with provided API key
    username: 'mobil3801beach@gmail.com', // Pre-filled with provided username
    from_number: 'DFS', // Pre-filled with provided source
    is_enabled: true, // Auto-enable since credentials are provided
    daily_limit: 100,
    emergency_contacts: '[]',
    alert_types: '{}'
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [accountBalance, setAccountBalance] = useState<number | null>(null);

  useEffect(() => {
    loadConfiguration();
    // Auto-test connection with provided credentials
    checkConnection();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage(24060, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: []
      });

      if (error) throw new Error(error);

      if (data?.List && data.List.length > 0) {
        const configData = data.List[0];
        setConfig({
          id: configData.id,
          service_provider: 'ClickSend', // Always ClickSend
          api_key: '54DC23E4-34D7-C6B1-0601-112E36A46B49', // Keep provided API key
          username: 'mobil3801beach@gmail.com', // Keep provided username
          from_number: configData.from_number || 'DFS',
          is_enabled: configData.is_enabled !== false, // Default to true
          daily_limit: configData.daily_limit || 100,
          emergency_contacts: configData.emergency_contacts || '[]',
          alert_types: configData.alert_types || '{}'
        });
      } else {
        // Auto-save the provided credentials on first load
        await saveConfiguration();
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setLoading(true);

      const configData = {
        ...config,
        service_provider: 'ClickSend',
        last_updated: new Date().toISOString(),
        created_by: 1
      };

      if (config.id) {
        const { error } = await window.ezsite.apis.tableUpdate(24060, {
          ID: config.id,
          ...configData
        });
        if (error) throw new Error(error);
      } else {
        const { error } = await window.ezsite.apis.tableCreate(24060, configData);
        if (error) throw new Error(error);
      }

      toast({
        title: "Success",
        description: "ClickSend configuration saved successfully"
      });

      await loadConfiguration();

      if (config.is_enabled && config.api_key && config.username) {
        await checkConnection();
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      setLoading(true);

      // Use provided credentials for connection test
      const username = '54DC23E4-34D7-C6B1-0601-112E36A46B49';
      const apiKey = 'mobil3801beach@gmail.com';

      // Test ClickSend API connection
      const credentials = btoa(`${username}:${apiKey}`);
      const response = await fetch('https://rest.clicksend.com/v3/account', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setConnectionStatus('connected');
        setAccountBalance(result.data?.balance || 0);
        toast({
          title: "Connection Successful",
          description: "Successfully connected to ClickSend with your provided credentials"
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Connection Failed",
          description: "Failed to connect to ClickSend. Please check your credentials.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('error');
      toast({
        title: "Connection Error",
        description: "Network error while testing connection",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestSMS = async () => {
    if (!testPhone) {
      toast({
        title: "Error",
        description: "Please enter a phone number for testing",
        variant: "destructive"
      });
      return;
    }

    if (!testPhone.match(/^\+[1-9]\d{1,14}$/)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number in E.164 format (+1234567890)",
        variant: "destructive"
      });
      return;
    }

    try {
      setTesting(true);

      // Use provided credentials for test SMS
      const credentials = btoa(`mobil3801beach@gmail.com:54DC23E4-34D7-C6B1-0601-112E36A46B49`);
      const smsData = {
        messages: [{
          source: "DFS", // Using provided source
          to: testPhone,
          body: `DFS Manager Test SMS - ${new Date().toLocaleString()}. ClickSend is working correctly with your provided credentials!`
        }]
      };

      const response = await fetch('https://rest.clicksend.com/v3/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(smsData)
      });

      const result = await response.json();

      if (response.ok && result.data?.messages?.[0]?.status === 'SUCCESS') {
        toast({
          title: "Test SMS Sent",
          description: `Test message sent successfully to ${testPhone}`
        });

        // Log to SMS history
        await window.ezsite.apis.tableCreate(24062, {
          recipient_phone: testPhone,
          message_content: smsData.messages[0].body,
          message_type: 'test',
          status: 'Sent',
          sent_at: new Date().toISOString(),
          sms_provider_id: result.data.messages[0].message_id,
          cost: result.data.messages[0].message_price || 0,
          sent_by: 1
        });
      } else {
        throw new Error(result.data?.messages?.[0]?.custom_string || 'Failed to send test SMS');
      }
    } catch (error) {
      console.error('Test SMS error:', error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test SMS",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="secondary" className="text-green-700 bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>);

      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Connection Failed
          </Badge>);

      default:
        return (
          <Badge variant="outline">
            <Settings className="h-3 w-3 mr-1" />
            Testing...
          </Badge>);

    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ClickSend Configuration
            <Badge className="ml-auto bg-blue-100 text-blue-800">
              <Shield className="h-3 w-3 mr-1" />
              Pre-Configured
            </Badge>
          </CardTitle>
          <CardDescription>
            Your ClickSend SMS service is pre-configured with your provided credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Service Status</p>
                        <p className="text-sm text-muted-foreground">ClickSend Active</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Account</p>
                        <p className="text-sm text-muted-foreground">mobil3801beach@gmail.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {accountBalance !== null &&
                <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Balance</p>
                          <p className="text-sm text-muted-foreground">${accountBalance.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                }
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your ClickSend SMS service is pre-configured and ready to use. All SMS functionality will use your provided credentials automatically.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">API Credentials</h3>
                {renderConnectionStatus()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={config.username}
                    disabled
                    className="bg-gray-50" />

                  <p className="text-xs text-muted-foreground">Pre-configured</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_key" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={config.api_key}
                    disabled
                    className="bg-gray-50" />

                  <p className="text-xs text-muted-foreground">Pre-configured</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from_number" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    From Number/Source
                  </Label>
                  <Input
                    id="from_number"
                    type="text"
                    placeholder="DFS"
                    value={config.from_number}
                    onChange={(e) => setConfig({ ...config, from_number: e.target.value })} />

                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveConfiguration}
                  disabled={loading}
                  className="flex items-center gap-2">

                  <Settings className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button
                  variant="outline"
                  onClick={checkConnection}
                  disabled={loading}
                  className="flex items-center gap-2">

                  <CheckCircle className="h-4 w-4" />
                  Test Connection
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable SMS Service</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable SMS notifications
                    </p>
                  </div>
                  <Switch
                    checked={config.is_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, is_enabled: checked })} />

                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily_limit">Daily SMS Limit</Label>
                  <Input
                    id="daily_limit"
                    type="number"
                    min="1"
                    max="1000"
                    value={config.daily_limit}
                    onChange={(e) => setConfig({ ...config, daily_limit: parseInt(e.target.value) || 100 })} />

                  <p className="text-sm text-muted-foreground">
                    Maximum number of SMS messages that can be sent per day
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test_phone">Test Phone Number</Label>
                  <Input
                    id="test_phone"
                    type="text"
                    placeholder="+1234567890"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)} />

                  <p className="text-sm text-muted-foreground">
                    Enter a phone number in E.164 format to send a test message
                  </p>
                </div>

                <Button
                  onClick={sendTestSMS}
                  disabled={testing || !config.is_enabled || !testPhone}
                  className="flex items-center gap-2">

                  <Send className="h-4 w-4" />
                  {testing ? 'Sending...' : 'Send Test SMS'}
                </Button>

                {connectionStatus === 'connected' &&
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ClickSend is configured and ready to send SMS messages with your provided credentials.
                    </AlertDescription>
                  </Alert>
                }

                {connectionStatus === 'error' &&
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connection to ClickSend failed. Please check your network connection.
                    </AlertDescription>
                  </Alert>
                }
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>);

};

export default ClickSendConfigManager;