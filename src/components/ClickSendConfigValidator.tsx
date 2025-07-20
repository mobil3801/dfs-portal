import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Key,
  Phone,
  Shield,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Eye,
  EyeOff } from
'lucide-react';

interface ValidationResult {
  field: string;
  valid: boolean;
  message: string;
  suggestion?: string;
}

interface ConfigValidation {
  overall: boolean;
  score: number;
  issues: ValidationResult[];
  recommendations: string[];
}

const ClickSendConfigValidator: React.FC = () => {
  const [config, setConfig] = useState({
    username: '',
    apiKey: '',
    fromNumber: '',
    testMode: true,
    webhookUrl: ''
  });

  const [validation, setValidation] = useState<ConfigValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [existingConfig, setExistingConfig] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingConfiguration();
  }, []);

  const loadExistingConfiguration = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(24060, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'is_enabled', op: 'Equal', value: true }]
      });

      if (error) throw new Error(error);

      if (data?.List && data.List.length > 0) {
        const existing = data.List[0];
        setExistingConfig(existing);
        setConfig({
          username: existing.username || '',
          apiKey: existing.api_key || '',
          fromNumber: existing.from_number || '',
          testMode: existing.test_mode ?? true,
          webhookUrl: existing.webhook_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const validateConfiguration = async () => {
    setValidating(true);

    try {
      const issues: ValidationResult[] = [];
      let score = 0;
      const recommendations: string[] = [];

      // Validate Username
      if (!config.username) {
        issues.push({
          field: 'username',
          valid: false,
          message: 'Username is required',
          suggestion: 'Get your username from ClickSend Console > Account Settings'
        });
      } else if (config.username.length < 3) {
        issues.push({
          field: 'username',
          valid: false,
          message: 'Username should be at least 3 characters long',
          suggestion: 'Verify you copied the correct username from ClickSend Console'
        });
      } else {
        issues.push({
          field: 'username',
          valid: true,
          message: 'Username format is valid'
        });
        score += 25;
      }

      // Validate API Key
      if (!config.apiKey) {
        issues.push({
          field: 'apiKey',
          valid: false,
          message: 'API Key is required',
          suggestion: 'Get your API Key from ClickSend Console > API Credentials'
        });
      } else if (config.apiKey.length < 10) {
        issues.push({
          field: 'apiKey',
          valid: false,
          message: 'API Key appears to be too short',
          suggestion: 'Verify you copied the complete API Key from ClickSend Console'
        });
      } else {
        issues.push({
          field: 'apiKey',
          valid: true,
          message: 'API Key format is valid'
        });
        score += 25;
      }

      // Validate From Number
      if (!config.fromNumber) {
        issues.push({
          field: 'fromNumber',
          valid: false,
          message: 'From number is required',
          suggestion: 'Get a phone number from ClickSend Console > Phone Numbers'
        });
      } else if (!config.fromNumber.startsWith('+')) {
        issues.push({
          field: 'fromNumber',
          valid: false,
          message: 'From number should be in E.164 format (+1234567890)',
          suggestion: 'Add country code prefix (e.g., +1 for US numbers)'
        });
      } else {
        issues.push({
          field: 'fromNumber',
          valid: true,
          message: 'From number format is valid'
        });
        score += 25;
      }

      // Test API Connection
      if (config.username && config.apiKey) {
        try {
          const testResult = await testClickSendConnection();
          if (testResult.success) {
            issues.push({
              field: 'connection',
              valid: true,
              message: 'Successfully connected to ClickSend API'
            });
            score += 25;
          } else {
            issues.push({
              field: 'connection',
              valid: false,
              message: testResult.error || 'Failed to connect to ClickSend API',
              suggestion: 'Verify your username and API key are correct'
            });
          }
        } catch (error) {
          issues.push({
            field: 'connection',
            valid: false,
            message: 'Error testing connection: ' + (error instanceof Error ? error.message : 'Unknown error'),
            suggestion: 'Check your internet connection and credentials'
          });
        }
      }

      // Webhook URL validation (optional)
      if (config.webhookUrl) {
        if (!config.webhookUrl.startsWith('https://')) {
          issues.push({
            field: 'webhookUrl',
            valid: false,
            message: 'Webhook URL should use HTTPS',
            suggestion: 'Use HTTPS for security and ClickSend compatibility'
          });
        } else {
          issues.push({
            field: 'webhookUrl',
            valid: true,
            message: 'Webhook URL format is valid'
          });
        }
      }

      // Generate recommendations
      if (config.testMode) {
        recommendations.push('Test mode is enabled - only verified numbers can receive SMS');
      } else {
        recommendations.push('Production mode is enabled - all valid numbers can receive SMS');
      }

      if (!config.webhookUrl) {
        recommendations.push('Consider adding a webhook URL for delivery status updates');
      }

      if (score < 60) {
        recommendations.push('Fix critical configuration issues before going live');
      } else if (score < 80) {
        recommendations.push('Configuration is mostly correct, but some improvements are recommended');
      }

      setValidation({
        overall: score >= 75,
        score,
        issues,
        recommendations
      });

    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate configuration",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  const testClickSendConnection = async (): Promise<{success: boolean;error?: string;}> => {
    try {
      const credentials = btoa(`${config.username}:${config.apiKey}`);

      const response = await fetch('https://rest.clicksend.com/v3/account', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  };

  const saveConfiguration = async () => {
    if (!validation || !validation.overall) {
      toast({
        title: "Configuration Invalid",
        description: "Please fix validation issues before saving",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const configData = {
        service_provider: 'ClickSend',
        username: config.username,
        api_key: config.apiKey,
        from_number: config.fromNumber,
        is_enabled: true,
        test_mode: config.testMode,
        webhook_url: config.webhookUrl || '',
        daily_limit: 1000,
        created_by: 1
      };

      if (existingConfig?.id) {
        await window.ezsite.apis.tableUpdate(24060, {
          ID: existingConfig.id,
          ...configData
        });
      } else {
        await window.ezsite.apis.tableCreate(24060, configData);
      }

      toast({
        title: "✅ Configuration Saved",
        description: "ClickSend SMS configuration has been saved successfully"
      });

      await loadExistingConfiguration();

    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "❌ Save Failed",
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard"
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          ClickSend Configuration Validator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  <Key className="w-4 h-4 inline mr-1" />
                  Username
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="username"
                    placeholder="Your ClickSend username"
                    value={config.username}
                    onChange={(e) => setConfig((prev) => ({ ...prev, username: e.target.value }))} />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(config.username)}
                    disabled={!config.username}>

                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  <Shield className="w-4 h-4 inline mr-1" />
                  API Key
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Your ClickSend API key"
                    value={config.apiKey}
                    onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))} />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}>

                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromNumber">
                  <Phone className="w-4 h-4 inline mr-1" />
                  From Number
                </Label>
                <Input
                  id="fromNumber"
                  placeholder="+1234567890"
                  value={config.fromNumber}
                  onChange={(e) => setConfig((prev) => ({ ...prev, fromNumber: e.target.value }))} />

              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-app.com/webhooks/sms"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))} />

              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={config.testMode}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, testMode: checked }))} />

              <Label>Test Mode (Only verified numbers can receive SMS)</Label>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={validateConfiguration}
                disabled={validating}
                className="flex-1">

                {validating ?
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </> :

                <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Validate Configuration
                  </>
                }
              </Button>

              <Button
                onClick={saveConfiguration}
                disabled={saving || !validation?.overall}
                variant="default">

                {saving ?
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </> :

                "Save Configuration"
                }
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            {validation ?
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Validation Results</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getScoreVariant(validation.score)} className={getScoreColor(validation.score)}>
                      Score: {validation.score}/100
                    </Badge>
                    <Progress value={validation.score} className="w-32" />
                  </div>
                </div>

                <Alert className={validation.overall ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {validation.overall ?
                <CheckCircle className="h-4 w-4 text-green-600" /> :

                <AlertCircle className="h-4 w-4 text-red-600" />
                }
                  <AlertDescription>
                    <div className={validation.overall ? "text-green-800" : "text-red-800"}>
                      <div className="font-medium">
                        {validation.overall ? "✅ Configuration Valid" : "❌ Configuration Issues Found"}
                      </div>
                      <div className="mt-1">
                        {validation.overall ?
                      "Your ClickSend configuration is valid and ready to use." :
                      "Please fix the issues below before proceeding."}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h4 className="font-medium">Validation Details</h4>
                  {validation.issues.map((issue, index) =>
                <Card key={index} className={issue.valid ? "border-green-200" : "border-red-200"}>
                      <CardContent className="pt-4">
                        <div className="flex items-start space-x-2">
                          {issue.valid ?
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> :

                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      }
                          <div className="flex-1">
                            <div className="font-medium capitalize">{issue.field}</div>
                            <div className={`text-sm ${issue.valid ? 'text-green-800' : 'text-red-800'}`}>
                              {issue.message}
                            </div>
                            {issue.suggestion &&
                        <div className="text-sm text-muted-foreground mt-1">
                                💡 {issue.suggestion}
                              </div>
                        }
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                )}
                </div>

                {validation.recommendations.length > 0 &&
              <div className="space-y-2">
                    <h4 className="font-medium">Recommendations</h4>
                    <ul className="space-y-1">
                      {validation.recommendations.map((rec, index) =>
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="mr-2">•</span>
                          {rec}
                        </li>
                  )}
                    </ul>
                  </div>
              }
              </div> :

            <div className="text-center py-8 text-muted-foreground">
                Click "Validate Configuration" to check your ClickSend settings.
              </div>
            }
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Getting ClickSend Credentials</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Sign up for a ClickSend account at <a href="https://www.clicksend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">clicksend.com <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                    <li>Go to the ClickSend Dashboard</li>
                    <li>Navigate to Developers → API Credentials</li>
                    <li>Copy your Username and API Key</li>
                    <li>Purchase a phone number from Numbers → Buy Numbers</li>
                    <li>Copy the phone number in E.164 format (+1234567890)</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Common Issues & Solutions</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-medium text-red-600">❌ "Authentication failed"</div>
                      <div>Check that username and API key are correctly copied from ClickSend Console</div>
                    </div>
                    <div>
                      <div className="font-medium text-red-600">❌ "Invalid from number"</div>
                      <div>Ensure the from number is purchased in your ClickSend account and in E.164 format</div>
                    </div>
                    <div>
                      <div className="font-medium text-red-600">❌ "Test mode restrictions"</div>
                      <div>In test mode, only verified phone numbers can receive SMS. Add numbers to verified list.</div>
                    </div>
                    <div>
                      <div className="font-medium text-yellow-600">⚠️ "Message sent but not received"</div>
                      <div>Check delivery status, verify phone number format, and ensure sufficient account balance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Best Practices</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Keep test mode enabled during development</li>
                    <li>Set up webhooks for delivery status tracking</li>
                    <li>Monitor your daily SMS usage and limits</li>
                    <li>Use E.164 format for all phone numbers (+country code + number)</li>
                    <li>Test with your own phone number before going live</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>);

};

export default ClickSendConfigValidator;