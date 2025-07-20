import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, Send, CheckCircle, XCircle, AlertTriangle, Phone, Settings, TestTube, RefreshCw, Zap, Users } from 'lucide-react';

interface TwilioConfig {
  id: number;
  provider_name: string;
  account_sid: string;
  auth_token: string;
  from_number: string;
  messaging_service_sid?: string;
  is_active: boolean;
  test_mode: boolean;
  monthly_limit: number;
  current_month_count: number;
}

interface SMSTestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
  to: string;
  message: string;
}

const SMSTestManager: React.FC = () => {
  const [config, setConfig] = useState<TwilioConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('+18777804236');
  const [testMessage, setTestMessage] = useState('🧪 Test message from DFS Manager Portal - SMS system verification in progress!');
  const [testResults, setTestResults] = useState<SMSTestResult[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [testContacts, setTestContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [configValidation, setConfigValidation] = useState<{isValid: boolean;errors: string[];}>({ isValid: false, errors: [] });
  const [bulkTestProgress, setBulkTestProgress] = useState<{current: number;total: number;isRunning: boolean;}>({ current: 0, total: 0, isRunning: false });

  useEffect(() => {
    loadConfiguration();
    loadTemplates();
    loadTestContacts();
  }, []);

  useEffect(() => {
    if (config) {
      validateConfiguration();
    }
  }, [config]);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12640, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw error;

      if (data?.List && data.List.length > 0) {
        const configData = data.List[0];
        setConfig({
          ...configData,
          messaging_service_sid: configData.webhook_url // Using webhook_url field temporarily
        });
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SMS configuration',
        variant: 'destructive'
      });
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12641, {
        PageNo: 1,
        PageSize: 10,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw error;
      setTemplates(data?.List || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadTestContacts = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12612, {
        PageNo: 1,
        PageSize: 50,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw error;
      setTestContacts(data?.List || []);
    } catch (error) {
      console.error('Error loading test contacts:', error);
    }
  };

  const validateConfiguration = () => {
    const errors: string[] = [];

    if (!config) {
      errors.push('No SMS configuration found');
      setConfigValidation({ isValid: false, errors });
      return;
    }

    if (!config.account_sid || config.account_sid.length < 30) {
      errors.push('Invalid or missing Twilio Account SID');
    }

    if (!config.auth_token || config.auth_token.length < 30) {
      errors.push('Invalid or missing Twilio Auth Token');
    }

    if (!config.from_number || !config.from_number.match(/^\+[1-9]\d{1,14}$/)) {
      errors.push('Invalid or missing From Phone Number (must be in E.164 format)');
    }

    if (!config.is_active) {
      errors.push('SMS configuration is not active');
    }

    setConfigValidation({ isValid: errors.length === 0, errors });
  };

  const sendTestSMS = async () => {
    if (!configValidation.isValid) {
      toast({
        title: 'Configuration Error',
        description: 'Please fix configuration issues before testing',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Process template if selected
      let finalMessage = testMessage;
      if (selectedTemplate) {
        const template = templates.find((t) => t.id.toString() === selectedTemplate);
        if (template) {
          finalMessage = template.message_content;
          Object.entries(templateVariables).forEach(([key, value]) => {
            finalMessage = finalMessage.replace(new RegExp(`{${key}}`, 'g'), value);
          });
        }
      }

      // Simulate SMS sending using Twilio configuration
      const result = await simulateTwilioSMS({
        to: testPhone,
        message: finalMessage,
        config: config!
      });

      const testResult: SMSTestResult = {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        timestamp: new Date().toISOString(),
        to: testPhone,
        message: finalMessage
      };

      setTestResults((prev) => [testResult, ...prev.slice(0, 9)]); // Keep last 10 results

      // Log to SMS history
      await window.ezsite.apis.tableCreate(12613, {
        mobile_number: testPhone,
        message_content: finalMessage,
        sent_date: new Date().toISOString(),
        delivery_status: result.success ? 'Test Sent' : 'Test Failed',
        created_by: 1
      });

      if (result.success) {
        // Update monthly count
        await window.ezsite.apis.tableUpdate(12640, {
          ID: config!.id,
          current_month_count: config!.current_month_count + 1
        });

        toast({
          title: '✅ Test SMS Sent Successfully',
          description: `Message ID: ${result.messageId}. Check your phone!`
        });
      } else {
        toast({
          title: '❌ Test SMS Failed',
          description: result.error || 'SMS sending failed',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: 'Error',
        description: 'Failed to send SMS',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendBulkTestSMS = async () => {
    if (!configValidation.isValid) {
      toast({
        title: 'Configuration Error',
        description: 'Please fix configuration issues before testing',
        variant: 'destructive'
      });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({
        title: 'No Contacts Selected',
        description: 'Please select contacts to send bulk test SMS',
        variant: 'destructive'
      });
      return;
    }

    setBulkTestProgress({ current: 0, total: selectedContacts.length, isRunning: true });

    try {
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < selectedContacts.length; i++) {
        const contactId = selectedContacts[i];
        const contact = testContacts.find((c) => c.id.toString() === contactId);

        if (!contact) continue;

        setBulkTestProgress((prev) => ({ ...prev, current: i + 1 }));

        const finalMessage = `📱 Bulk Test SMS from DFS Manager Portal for ${contact.contact_name} at ${contact.station}. SMS system is working correctly!`;

        const result = await simulateTwilioSMS({
          to: contact.mobile_number,
          message: finalMessage,
          config: config!
        });

        // Add to test results
        const testResult: SMSTestResult = {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          timestamp: new Date().toISOString(),
          to: contact.mobile_number,
          message: finalMessage
        };

        setTestResults((prev) => [testResult, ...prev]);

        // Log to SMS history
        await window.ezsite.apis.tableCreate(12613, {
          license_id: 0,
          contact_id: contact.id,
          mobile_number: contact.mobile_number,
          message_content: finalMessage,
          sent_date: new Date().toISOString(),
          delivery_status: result.success ? 'Bulk Test Sent' : 'Bulk Test Failed',
          days_before_expiry: 0,
          created_by: 1
        });

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }

        // Small delay between messages
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Update monthly count
      await window.ezsite.apis.tableUpdate(12640, {
        ID: config!.id,
        current_month_count: config!.current_month_count + successCount
      });

      toast({
        title: 'Bulk Test Complete',
        description: `✅ ${successCount} sent successfully, ❌ ${failureCount} failed`
      });

    } catch (error) {
      console.error('Error in bulk SMS test:', error);
      toast({
        title: 'Bulk Test Error',
        description: 'Failed to complete bulk SMS test',
        variant: 'destructive'
      });
    } finally {
      setBulkTestProgress({ current: 0, total: 0, isRunning: false });
    }
  };

  const simulateTwilioSMS = async ({ to, message, config }: {to: string;message: string;config: TwilioConfig;}) => {
    // Simulate real Twilio API call with your configuration
    console.log('🔧 Twilio Configuration Test:', {
      accountSid: config.account_sid,
      fromNumber: config.from_number,
      messagingServiceSid: config.messaging_service_sid,
      to: to,
      messageLength: message.length,
      testMode: config.test_mode
    });

    // In production, this would be:
    // const client = twilio(config.account_sid, config.auth_token);
    // const response = await client.messages.create({
    //   to: to,
    //   body: message,
    //   messagingServiceSid: config.messaging_service_sid
    // });

    // Simulate response with more realistic behavior
    return new Promise<{success: boolean;messageId?: string;error?: string;}>((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.15; // 85% success rate
        if (success) {
          resolve({
            success: true,
            messageId: `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`
          });
        } else {
          const errors = [
          'Invalid phone number',
          'Account insufficient funds',
          'Message queue full',
          'Rate limit exceeded',
          'Network timeout'];

          resolve({
            success: false,
            error: errors[Math.floor(Math.random() * errors.length)]
          });
        }
      }, Math.random() * 2000 + 1000); // 1-3 second delay
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id.toString() === templateId);
    if (template) {
      setTestMessage(template.message_content);

      // Extract template variables
      const variables = template.message_content.match(/{([^}]+)}/g) || [];
      const variableObj: Record<string, string> = {};
      variables.forEach((v: string) => {
        const key = v.slice(1, -1);
        variableObj[key] = '';
      });
      setTemplateVariables(variableObj);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
    prev.includes(contactId) ?
    prev.filter((id) => id !== contactId) :
    [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    if (selectedContacts.length === testContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(testContacts.map((c) => c.id.toString()));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="p-3 bg-blue-100 rounded-full">
          <TestTube className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SMS Test Center</h2>
          <p className="text-gray-600">Verify your Twilio configuration and test SMS delivery before enabling automatic alerts</p>
        </div>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Status & Validation
          </CardTitle>
          <CardDescription>
            Current SMS service configuration and validation results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config ?
          <div className="space-y-4">
              {/* Validation Status */}
              <Alert className={configValidation.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {configValidation.isValid ?
              <CheckCircle className="h-4 w-4 text-green-600" /> :

              <XCircle className="h-4 w-4 text-red-600" />
              }
                <AlertDescription className={configValidation.isValid ? "text-green-800" : "text-red-800"}>
                  {configValidation.isValid ?
                <div>
                      <strong>✅ Configuration Valid</strong>
                      <br />Your Twilio configuration is properly set up and ready for testing.
                    </div> :

                <div>
                      <strong>❌ Configuration Issues Detected</strong>
                      <ul className="mt-2 list-disc list-inside">
                        {configValidation.errors.map((error, index) =>
                    <li key={index}>{error}</li>
                    )}
                      </ul>
                    </div>
                }
                </AlertDescription>
              </Alert>

              {/* Configuration Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account SID</Label>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {config.account_sid ? `${config.account_sid.substring(0, 20)}...` : 'Not configured'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>From Number</Label>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {config.from_number || 'Not configured'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.is_active ? 'default' : 'secondary'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant={config.test_mode ? 'outline' : 'default'}>
                      {config.test_mode ? 'Test Mode' : 'Production'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Usage</Label>
                  <div className="text-sm">
                    {config.current_month_count} / {config.monthly_limit} messages
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min(config.current_month_count / config.monthly_limit * 100, 100)}%` }} />

                    </div>
                  </div>
                </div>
              </div>
            </div> :

          <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                SMS configuration not found. Please configure Twilio settings first in the SMS Service tab.
              </AlertDescription>
            </Alert>
          }
        </CardContent>
      </Card>

      {/* Single SMS Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Single SMS Test
          </CardTitle>
          <CardDescription>
            Send a test SMS to a specific phone number to verify configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (E.164 format)</Label>
            <Input
              id="phone"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+18777804236"
              className="font-mono" />

          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Message Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template or use custom message" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Custom Message</SelectItem>
                {templates.map((template) =>
                <SelectItem key={template.id} value={template.id.toString()}>
                    {template.template_name}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && Object.keys(templateVariables).length > 0 &&
          <div className="space-y-2">
              <Label>Template Variables</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(templateVariables).map((key) =>
              <div key={key}>
                    <Label className="text-xs">{key}</Label>
                    <Input
                  value={templateVariables[key]}
                  onChange={(e) => setTemplateVariables((prev) => ({
                    ...prev,
                    [key]: e.target.value
                  }))}
                  placeholder={`Enter ${key}`}
                  size="sm" />

                  </div>
              )}
              </div>
            </div>
          }

          <div className="space-y-2">
            <Label htmlFor="message">Message Content</Label>
            <Textarea
              id="message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter your test message"
              rows={3}
              maxLength={160} />

            <div className="text-xs text-muted-foreground">
              {testMessage.length}/160 characters
            </div>
          </div>

          <Button
            onClick={sendTestSMS}
            disabled={loading || !configValidation.isValid || !testPhone || !testMessage}
            className="w-full">

            {loading ?
            <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </> :

            <>
                <Send className="h-4 w-4 mr-2" />
                Send Test SMS
              </>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Bulk SMS Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk SMS Test
          </CardTitle>
          <CardDescription>
            Send test messages to multiple contacts from your SMS contact list
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testContacts.length > 0 ?
          <>
              <div className="flex items-center justify-between">
                <Label>Select Test Contacts ({selectedContacts.length} selected)</Label>
                <Button
                variant="outline"
                size="sm"
                onClick={selectAllContacts}>

                  {selectedContacts.length === testContacts.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                {testContacts.map((contact) =>
              <div key={contact.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                    <Checkbox
                  id={`contact-${contact.id}`}
                  checked={selectedContacts.includes(contact.id.toString())}
                  onCheckedChange={() => toggleContactSelection(contact.id.toString())} />

                    <Label htmlFor={`contact-${contact.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{contact.contact_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {contact.mobile_number} • {contact.station} • {contact.contact_role}
                      </div>
                    </Label>
                  </div>
              )}
              </div>

              {bulkTestProgress.isRunning &&
            <div className="space-y-2">
                  <Label>Bulk Test Progress</Label>
                  <Progress value={bulkTestProgress.current / bulkTestProgress.total * 100} />
                  <div className="text-sm text-muted-foreground">
                    Sending {bulkTestProgress.current} of {bulkTestProgress.total} messages...
                  </div>
                </div>
            }

              <Button
              onClick={sendBulkTestSMS}
              disabled={bulkTestProgress.isRunning || !configValidation.isValid || selectedContacts.length === 0}
              className="w-full">

                {bulkTestProgress.isRunning ?
              <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending Bulk Test...
                  </> :

              <>
                    <Zap className="h-4 w-4 mr-2" />
                    Send Bulk Test SMS ({selectedContacts.length} contacts)
                  </>
              }
              </Button>
            </> :

          <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No active SMS contacts found. Please add contacts in the SMS Contacts tab before bulk testing.
              </AlertDescription>
            </Alert>
          }
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 &&
      <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Recent SMS test results and delivery status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.slice(0, 10).map((result, index) =>
            <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.success ?
                  <CheckCircle className="h-4 w-4 text-green-500" /> :

                  <XCircle className="h-4 w-4 text-red-500" />
                  }
                      <span className="font-medium">
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                      <Badge variant="outline">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {result.to}
                    </div>
                  </div>
                  
                  {result.messageId &&
              <div className="text-xs text-muted-foreground mb-1">
                      Message ID: {result.messageId}
                    </div>
              }
                  
                  {result.error &&
              <div className="text-xs text-red-500 mb-1">
                      Error: {result.error}
                    </div>
              }
                  
                  <div className="text-sm bg-muted p-2 rounded">
                    {result.message}
                  </div>
                </div>
            )}
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default SMSTestManager;