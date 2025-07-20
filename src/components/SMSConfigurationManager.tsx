import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Shield,
  Globe,
  Phone,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key,
  Zap } from
'lucide-react';
import { enhancedSmsService } from '@/services/enhancedSmsService';

interface SMSConfig {
  id: number;
  provider_name: string;
  account_sid: string;
  auth_token: string;
  from_number: string;
  is_active: boolean;
  test_mode: boolean;
  monthly_limit: number;
  current_month_count: number;
  webhook_url: string;
  created_by: number;
}

const SMSConfigurationManager: React.FC = () => {
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean;message: string;} | null>(null);
  const [showTokens, setShowTokens] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [serviceHealth, setServiceHealth] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    provider_name: 'Twilio',
    account_sid: '',
    auth_token: '',
    from_number: '',
    is_active: true,
    test_mode: false,
    monthly_limit: 1000,
    webhook_url: ''
  });

  useEffect(() => {
    loadConfiguration();
    checkServiceHealth();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage('12640', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: []
      });

      if (error) throw error;

      if (data?.List && data.List.length > 0) {
        const configData = data.List[0];
        setConfig(configData);
        setFormData({
          provider_name: configData.provider_name || 'Twilio',
          account_sid: configData.account_sid || '',
          auth_token: configData.auth_token || '',
          from_number: configData.from_number || '',
          is_active: configData.is_active ?? true,
          test_mode: configData.test_mode ?? false,
          monthly_limit: configData.monthly_limit || 1000,
          webhook_url: configData.webhook_url || ''
        });
      } else {
        // Load from environment variables if no DB config
        setFormData({
          ...formData,
          account_sid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
          auth_token: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
          from_number: import.meta.env.VITE_TWILIO_PHONE_NUMBER || '',
          test_mode: import.meta.env.VITE_SMS_TEST_MODE === 'true',
          webhook_url: import.meta.env.VITE_SMS_WEBHOOK_URL || ''
        });
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

  const checkServiceHealth = async () => {
    try {
      const health = await enhancedSmsService.getServiceHealth();
      setServiceHealth(health);
    } catch (error) {
      console.error('Error checking service health:', error);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);

      if (config) {
        // Update existing configuration
        const { error } = await window.ezsite.apis.tableUpdate('12640', {
          ID: config.id,
          ...formData,
          current_month_count: config.current_month_count // Preserve current count
        });
        if (error) throw error;
      } else {
        // Create new configuration
        const { error } = await window.ezsite.apis.tableCreate('12640', {
          ...formData,
          current_month_count: 0,
          created_by: 1 // This should be the current user ID
        });
        if (error) throw error;
      }

      toast({
        title: "✅ Configuration Saved",
        description: "SMS configuration has been saved successfully."
      });

      await loadConfiguration();
      await checkServiceHealth();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save SMS configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testConfiguration = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      if (!testPhoneNumber) {
        throw new Error('Please enter a phone number for testing');
      }

      // Initialize service with current configuration
      await enhancedSmsService.initialize();

      const result = await enhancedSmsService.sendProductionSMS({
        to: testPhoneNumber,
        content: `DFS Manager SMS Test - ${new Date().toLocaleString()}. Configuration is working correctly!`,
        priority: 'low'
      });

      setTestResult({
        success: result.success,
        message: result.success ? 'Test SMS sent successfully!' : result.error || 'Test failed'
      });

      if (result.success) {
        toast({
          title: "✅ Test Successful",
          description: "Test SMS sent successfully!"
        });
      } else {
        toast({
          title: "❌ Test Failed",
          description: result.error || 'Test failed',
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test failed';
      setTestResult({
        success: false,
        message: errorMessage
      });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const resetMonthlyCount = async () => {
    if (!config) return;

    try {
      const { error } = await window.ezsite.apis.tableUpdate('12640', {
        ID: config.id,
        current_month_count: 0
      });

      if (error) throw error;

      toast({
        title: "Count Reset",
        description: "Monthly SMS count has been reset to 0."
      });

      await loadConfiguration();
    } catch (error) {
      console.error('Error resetting monthly count:', error);
      toast({
        title: "Error",
        description: "Failed to reset monthly count",
        variant: "destructive"
      });
    }
  };

  const getHealthStatusBadge = () => {
    if (!serviceHealth) return <Badge variant="secondary">Unknown</Badge>;

    switch (serviceHealth.status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-100 text-red-800">Down</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getHealthIcon = () => {
    if (!serviceHealth) return <AlertTriangle className="w-5 h-5 text-gray-500" />;

    switch (serviceHealth.status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            SMS Configuration
          </h2>
          <p className="text-gray-600">Configure Twilio SMS service settings for automated alerts</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {getHealthIcon()}
          {getHealthStatusBadge()}
        </div>
      </div>

      {/* Service Health Alert */}
      {serviceHealth && serviceHealth.status !== 'healthy' &&
      <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Service Health Warning:</strong> {serviceHealth.details?.message || 'SMS service is not operating normally'}
          </AlertDescription>
        </Alert>
      }

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Twilio Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ?
          <div className="text-center py-8">
              <p className="text-gray-600">Loading configuration...</p>
            </div> :

          <>
              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                  id="provider"
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  disabled />

                </div>
                
                <div>
                  <Label htmlFor="from-number">From Phone Number</Label>
                  <Input
                  id="from-number"
                  value={formData.from_number}
                  onChange={(e) => setFormData({ ...formData, from_number: e.target.value })}
                  placeholder="+1234567890" />

                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    API Credentials
                  </h3>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTokens(!showTokens)}>

                    {showTokens ? 'Hide' : 'Show'} Tokens
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="account-sid">Account SID</Label>
                    <Input
                    id="account-sid"
                    type={showTokens ? 'text' : 'password'}
                    value={formData.account_sid}
                    onChange={(e) => setFormData({ ...formData, account_sid: e.target.value })}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />

                  </div>
                  
                  <div>
                    <Label htmlFor="auth-token">Auth Token</Label>
                    <Input
                    id="auth-token"
                    type={showTokens ? 'text' : 'password'}
                    value={formData.auth_token}
                    onChange={(e) => setFormData({ ...formData, auth_token: e.target.value })}
                    placeholder="Your Twilio Auth Token" />

                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Advanced Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="monthly-limit">Monthly SMS Limit</Label>
                    <Input
                    id="monthly-limit"
                    type="number"
                    value={formData.monthly_limit}
                    onChange={(e) => setFormData({ ...formData, monthly_limit: parseInt(e.target.value) || 1000 })} />

                  </div>
                  
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                    <Input
                    id="webhook-url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    placeholder="https://your-domain.com/webhooks/sms" />

                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />

                    <Label htmlFor="active">Service Active</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                    id="test-mode"
                    checked={formData.test_mode}
                    onCheckedChange={(checked) => setFormData({ ...formData, test_mode: checked })} />

                    <Label htmlFor="test-mode">Test Mode</Label>
                  </div>
                </div>
              </div>

              {/* Current Usage */}
              {config &&
            <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Current Usage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{config.current_month_count}</div>
                      <p className="text-sm text-blue-600">Messages Sent This Month</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{config.monthly_limit - config.current_month_count}</div>
                      <p className="text-sm text-green-600">Messages Remaining</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">
                        {Math.round(config.current_month_count / config.monthly_limit * 100)}%
                      </div>
                      <p className="text-sm text-purple-600">Usage Percentage</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={resetMonthlyCount}>
                      Reset Monthly Count
                    </Button>
                  </div>
                </div>
            }

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                onClick={saveConfiguration}
                disabled={saving || !formData.account_sid || !formData.auth_token || !formData.from_number}
                className="bg-blue-600 hover:bg-blue-700">

                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </>
          }
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="w-5 h-5 mr-2" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-phone">Test Phone Number</Label>
            <Input
              id="test-phone"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              placeholder="+1234567890" />

            <p className="text-sm text-gray-500 mt-1">
              Enter a phone number to send a test SMS (use E.164 format: +1234567890)
            </p>
          </div>
          
          <Button
            onClick={testConfiguration}
            disabled={testing || !testPhoneNumber || !formData.account_sid || !formData.auth_token}
            variant="outline">

            <Zap className="w-4 h-4 mr-2" />
            {testing ? 'Sending Test...' : 'Send Test SMS'}
          </Button>
          
          {testResult &&
          <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {testResult.success ?
            <CheckCircle className="h-4 w-4 text-green-600" /> :

            <XCircle className="h-4 w-4 text-red-600" />
            }
              <AlertDescription className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          }
        </CardContent>
      </Card>
    </div>);

};

export default SMSConfigurationManager;