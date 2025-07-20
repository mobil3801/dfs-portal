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

const SMSConfigurationValidator: React.FC = () => {
  const [config, setConfig] = useState({
    accountSid: '',
    authToken: '',
    fromNumber: '',
    testMode: true,
    webhookUrl: ''
  });

  const [validation, setValidation] = useState<ConfigValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [existingConfig, setExistingConfig] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingConfiguration();
  }, []);

  const loadExistingConfiguration = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12640, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw new Error(error);

      if (data?.List && data.List.length > 0) {
        const existing = data.List[0];
        setExistingConfig(existing);
        setConfig({
          accountSid: existing.account_sid || '',
          authToken: existing.auth_token || '',
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

      // Validate Account SID
      if (!config.accountSid) {
        issues.push({
          field: 'accountSid',
          valid: false,
          message: 'Account SID is required',
          suggestion: 'Get your Account SID from Twilio Console > Account Settings'
        });
      } else if (!config.accountSid.startsWith('AC')) {
        issues.push({
          field: 'accountSid',
          valid: false,
          message: 'Account SID should start with "AC"',
          suggestion: 'Verify you copied the correct Account SID from Twilio Console'
        });
      } else if (config.accountSid.length !== 34) {
        issues.push({
          field: 'accountSid',
          valid: false,
          message: 'Account SID should be 34 characters long',
          suggestion: 'Double-check the Account SID from Twilio Console'
        });
      } else {
        issues.push({
          field: 'accountSid',
          valid: true,
          message: 'Account SID format is valid'
        });
        score += 20;
      }

      // Validate Auth Token
      if (!config.authToken) {
        issues.push({
          field: 'authToken',
          valid: false,
          message: 'Auth Token is required',
          suggestion: 'Get your Auth Token from Twilio Console > Account Settings'
        });
      } else if (config.authToken.length !== 32) {
        issues.push({
          field: 'authToken',
          valid: false,
          message: 'Auth Token should be 32 characters long',
          suggestion: 'Verify you copied the complete Auth Token from Twilio Console'
        });
      } else {
        issues.push({
          field: 'authToken',
          valid: true,
          message: 'Auth Token format is valid'
        });
        score += 20;
      }

      // Validate From Number
      if (!config.fromNumber) {
        issues.push({
          field: 'fromNumber',
          valid: false,
          message: 'From number is required',
          suggestion: 'Get a phone number from Twilio Console > Phone Numbers'
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
        score += 20;
      }

      // Test API Connection
      if (config.accountSid && config.authToken) {
        try {
          const testResult = await testTwilioConnection();
          if (testResult.success) {
            issues.push({
              field: 'connection',
              valid: true,
              message: 'Successfully connected to Twilio API'
            });
            score += 30;
          } else {
            issues.push({
              field: 'connection',
              valid: false,
              message: testResult.error || 'Failed to connect to Twilio API',
              suggestion: 'Verify your Account SID and Auth Token are correct'
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
            suggestion: 'Use HTTPS for security and Twilio compatibility'
          });
        } else {
          issues.push({
            field: 'webhookUrl',
            valid: true,
            message: 'Webhook URL format is valid'
          });
          score += 10;
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
        overall: score >= 70,
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

  const testTwilioConnection = async (): Promise<{success: boolean;error?: string;}> => {
    try {
      // Test with a simple API call to get account info
      const baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}.json`;

      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${config.accountSid}:${config.authToken}`)
        }
      });

      if (response.ok) {
        const data = await response.json();
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
        provider_name: 'Twilio',
        account_sid: config.accountSid,
        auth_token: config.authToken,
        from_number: config.fromNumber,
        is_active: true,
        test_mode: config.testMode,
        webhook_url: config.webhookUrl || '',
        monthly_limit: 1000,
        current_month_count: 0,
        created_by: 1 // Should be current user ID
      };

      if (existingConfig?.ID) {
        // Update existing configuration
        await window.ezsite.apis.tableUpdate(12640, {
          ID: existingConfig.ID,
          ...configData
        });
      } else {
        // Create new configuration
        await window.ezsite.apis.tableCreate(12640, configData);
      }

      toast({
        title: "✅ Configuration Saved",
        description: "SMS provider configuration has been saved successfully"
      });

      // Reload configuration
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
          SMS Configuration Validator
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
                <Label htmlFor="accountSid">
                  <Key className="w-4 h-4 inline mr-1" />
                  Account SID
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="accountSid"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.accountSid}
                    onChange={(e) => setConfig((prev) => ({ ...prev, accountSid: e.target.value }))} />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(config.accountSid)}
                    disabled={!config.accountSid}>

                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="authToken">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Auth Token
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="authToken"
                    type={showAuthToken ? "text" : "password"}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.authToken}
                    onChange={(e) => setConfig((prev) => ({ ...prev, authToken: e.target.value }))} />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAuthToken(!showAuthToken)}>

                    {showAuthToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                      "Your SMS configuration is valid and ready to use." :
                      "Please fix the issues below before proceeding."
                      }
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
                Click "Validate Configuration" to check your SMS settings.
              </div>
            }
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Getting Twilio Credentials</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Sign up for a Twilio account at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">twilio.com <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                    <li>Go to the Twilio Console Dashboard</li>
                    <li>Find your Account SID and Auth Token in the "Account Info" section</li>
                    <li>Purchase a phone number from Phone Numbers → Manage → Buy a number</li>
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
                      <div>Check that Account SID starts with "AC" and Auth Token is 32 characters</div>
                    </div>
                    <div>
                      <div className="font-medium text-red-600">❌ "Invalid from number"</div>
                      <div>Ensure the from number is purchased in your Twilio account and in E.164 format</div>
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
                    <li>Monitor your monthly SMS usage and limits</li>
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

export default SMSConfigurationValidator;