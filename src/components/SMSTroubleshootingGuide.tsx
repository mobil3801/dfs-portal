import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Phone,
  Shield,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  RefreshCw } from
'lucide-react';

interface TroubleshootingItem {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: 'config' | 'account' | 'delivery' | 'format';
  symptoms: string[];
  causes: string[];
  solutions: string[];
  preventive?: string[];
}

const SMSTroubleshootingGuide: React.FC = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const troubleshootingItems: TroubleshootingItem[] = [
  {
    id: 'sms-shows-sent-not-received',
    title: 'SMS shows "sent successfully" but recipient doesn\'t receive it',
    description: 'The most common issue where the system reports success but messages don\'t arrive',
    severity: 'high',
    category: 'delivery',
    symptoms: [
    'Application shows "SMS sent successfully"',
    'Recipient never receives the message',
    'No error messages in the application',
    'SMS history shows "Sent" status'],

    causes: [
    'Test mode is enabled and recipient number is not verified',
    'Invalid or incorrectly formatted phone number',
    'Insufficient account balance in Twilio',
    'Twilio number not properly configured',
    'Recipient\'s carrier blocking messages',
    'API credentials are incorrect but validation passed',
    'Network issues between your server and Twilio'],

    solutions: [
    'Verify test mode is disabled for production use',
    'Add recipient number to verified numbers if in test mode',
    'Check phone number format (must be E.164: +1234567890)',
    'Verify Twilio account balance is sufficient',
    'Confirm Twilio phone number is active and SMS-enabled',
    'Test with a different phone number/carrier',
    'Check Twilio delivery logs in their console',
    'Verify API credentials are correct and active'],

    preventive: [
    'Always test with your own phone number first',
    'Set up delivery status webhooks for real-time tracking',
    'Monitor account balance regularly',
    'Use phone number validation before sending']

  },
  {
    id: 'authentication-failed',
    title: 'Authentication failed or invalid credentials',
    description: 'Unable to connect to Twilio API due to credential issues',
    severity: 'high',
    category: 'config',
    symptoms: [
    'Error: "Authentication failed"',
    'HTTP 401 Unauthorized errors',
    'Cannot connect to Twilio API',
    'Configuration validation fails'],

    causes: [
    'Incorrect Account SID',
    'Incorrect Auth Token',
    'Credentials copied with extra spaces or characters',
    'Account SID doesn\'t match Auth Token',
    'Account suspended or deactivated'],

    solutions: [
    'Double-check Account SID starts with "AC"',
    'Verify Auth Token is exactly 32 characters',
    'Copy credentials directly from Twilio Console',
    'Ensure no extra spaces or newlines in credentials',
    'Generate new Auth Token if needed',
    'Check account status in Twilio Console'],

    preventive: [
    'Store credentials securely',
    'Regularly rotate Auth Tokens',
    'Use environment variables for credentials']

  },
  {
    id: 'invalid-phone-number',
    title: 'Invalid phone number format errors',
    description: 'Phone numbers not accepted by Twilio API',
    severity: 'medium',
    category: 'format',
    symptoms: [
    'Error: "Invalid phone number"',
    'Messages fail to send to specific numbers',
    'Phone number validation errors',
    'Some numbers work, others don\'t'],

    causes: [
    'Phone number not in E.164 format',
    'Missing country code',
    'Invalid characters in phone number',
    'Landline number used instead of mobile',
    'Number doesn\'t exist or is disconnected'],

    solutions: [
    'Format all numbers as +[country code][number]',
    'Remove spaces, dashes, and parentheses',
    'Add country code (+1 for US/Canada)',
    'Verify number is a mobile/cell phone',
    'Test with known working numbers',
    'Use phone number validation service'],

    preventive: [
    'Implement phone number validation on input',
    'Auto-format numbers to E.164',
    'Verify numbers are mobile before sending']

  },
  {
    id: 'test-mode-restrictions',
    title: 'Test mode preventing message delivery',
    description: 'Messages only work for verified numbers in test mode',
    severity: 'medium',
    category: 'config',
    symptoms: [
    'Some numbers receive messages, others don\'t',
    'Only your own number receives messages',
    'Error: "Test mode restrictions"',
    'Messages work in development but not production'],

    causes: [
    'Test mode is enabled in Twilio configuration',
    'Recipient numbers not added to verified list',
    'Forgot to disable test mode for production'],

    solutions: [
    'Disable test mode in SMS configuration',
    'Add recipient numbers to verified list',
    'Switch to production mode configuration',
    'Verify account upgrade if needed'],

    preventive: [
    'Clearly document test vs production settings',
    'Use environment-specific configurations',
    'Test with non-verified numbers before going live']

  },
  {
    id: 'insufficient-balance',
    title: 'Insufficient account balance',
    description: 'Twilio account doesn\'t have enough credit to send messages',
    severity: 'high',
    category: 'account',
    symptoms: [
    'Messages stop sending suddenly',
    'Error: "Insufficient funds"',
    'Some messages send, others fail',
    'Account balance warnings'],

    causes: [
    'Twilio account balance is too low',
    'Auto-recharge is disabled',
    'Payment method expired or failed',
    'Unexpected high usage'],

    solutions: [
    'Add funds to Twilio account',
    'Set up auto-recharge',
    'Update payment method',
    'Monitor usage patterns',
    'Set up balance alerts'],

    preventive: [
    'Enable auto-recharge with minimum balance',
    'Monitor monthly usage',
    'Set up low balance alerts',
    'Budget for expected SMS volume']

  },
  {
    id: 'carrier-blocking',
    title: 'Messages blocked by recipient carrier',
    description: 'Mobile carrier is filtering or blocking messages',
    severity: 'medium',
    category: 'delivery',
    symptoms: [
    'Messages don\'t arrive at specific carriers',
    'Inconsistent delivery across carriers',
    'Works for some numbers but not others',
    'Regional delivery issues'],

    causes: [
    'Carrier spam filtering',
    'Message content flagged',
    'High volume sending patterns',
    'Unregistered sender number',
    'Promotional content without opt-in'],

    solutions: [
    'Register sender number with carriers',
    'Modify message content to be less promotional',
    'Implement proper opt-in processes',
    'Use different sending patterns',
    'Contact carrier support',
    'Consider short code or toll-free number'],

    preventive: [
    'Follow carrier guidelines',
    'Implement double opt-in',
    'Monitor delivery rates by carrier',
    'Avoid spam trigger words']

  }];


  const toggleItem = (itemId: string) => {
    setOpenItems((prev) =>
    prev.includes(itemId) ?
    prev.filter((id) => id !== itemId) :
    [...prev, itemId]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':return 'text-red-600 border-red-200 bg-red-50';
      case 'medium':return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'low':return 'text-blue-600 border-blue-200 bg-blue-50';
      default:return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':return <AlertTriangle className="w-4 h-4" />;
      case 'medium':return <AlertTriangle className="w-4 h-4" />;
      case 'low':return <CheckCircle className="w-4 h-4" />;
      default:return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'config':return <Shield className="w-4 h-4" />;
      case 'account':return <DollarSign className="w-4 h-4" />;
      case 'delivery':return <MessageSquare className="w-4 h-4" />;
      case 'format':return <Phone className="w-4 h-4" />;
      default:return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredItems = selectedCategory === 'all' ?
  troubleshootingItems :
  troubleshootingItems.filter((item) => item.category === selectedCategory);

  const categoryStats = troubleshootingItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          SMS Troubleshooting Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="issues">Common Issues</TabsTrigger>
            <TabsTrigger value="checklist">Diagnostic Checklist</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}>

                All Issues ({troubleshootingItems.length})
              </Button>
              <Button
                variant={selectedCategory === 'config' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('config')}>

                <Shield className="w-3 h-3 mr-1" />
                Configuration ({categoryStats.config || 0})
              </Button>
              <Button
                variant={selectedCategory === 'delivery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('delivery')}>

                <MessageSquare className="w-3 h-3 mr-1" />
                Delivery ({categoryStats.delivery || 0})
              </Button>
              <Button
                variant={selectedCategory === 'account' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('account')}>

                <DollarSign className="w-3 h-3 mr-1" />
                Account ({categoryStats.account || 0})
              </Button>
              <Button
                variant={selectedCategory === 'format' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('format')}>

                <Phone className="w-3 h-3 mr-1" />
                Format ({categoryStats.format || 0})
              </Button>
            </div>

            <div className="space-y-3">
              {filteredItems.map((item) =>
              <Card key={item.id} className={`${getSeverityColor(item.severity)} border`}>
                  <Collapsible
                  open={openItems.includes(item.id)}
                  onOpenChange={() => toggleItem(item.id)}>

                    <CollapsibleTrigger asChild>
                      <CardContent className="pt-4 cursor-pointer hover:bg-opacity-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getSeverityIcon(item.severity)}
                            <div>
                              <div className="font-medium">{item.title}</div>
                              <div className="text-sm opacity-80">{item.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="capitalize">
                              {getCategoryIcon(item.category)}
                              <span className="ml-1">{item.category}</span>
                            </Badge>
                            <Badge variant={item.severity === 'high' ? 'destructive' : 'default'}>
                              {item.severity.toUpperCase()}
                            </Badge>
                            {openItems.includes(item.id) ?
                          <ChevronDown className="w-4 h-4" /> :
                          <ChevronRight className="w-4 h-4" />
                          }
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Symptoms
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {item.symptoms.map((symptom, index) =>
                            <li key={index}>{symptom}</li>
                            )}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Possible Causes
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {item.causes.map((cause, index) =>
                            <li key={index}>{cause}</li>
                            )}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Solutions
                          </h4>
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            {item.solutions.map((solution, index) =>
                          <li key={index}>{solution}</li>
                          )}
                          </ol>
                        </div>

                        {item.preventive &&
                      <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <Shield className="w-3 h-3 mr-1" />
                              Prevention Tips
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {item.preventive.map((tip, index) =>
                          <li key={index}>{tip}</li>
                          )}
                            </ul>
                          </div>
                      }
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Follow this checklist to systematically diagnose SMS delivery issues.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step 1: Configuration Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Verify Account SID starts with "AC" and is 34 characters</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Confirm Auth Token is exactly 32 characters</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Check from number is in E.164 format (+1234567890)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Verify from number is SMS-enabled in Twilio</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step 2: Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Check Twilio account balance is sufficient</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Verify account is not suspended</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Confirm payment method is valid</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Check monthly usage limits</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step 3: Test Mode Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Verify if test mode is enabled/disabled appropriately</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Check if recipient number is in verified list (test mode)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Test with your own verified number first</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step 4: Message Content & Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Validate recipient phone number format</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Check message content for spam triggers</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Verify message length is within limits</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Test with simple message content</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step 5: Delivery Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Check Twilio console for delivery logs</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Monitor delivery status updates</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Test with different carriers/numbers</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Check for carrier-specific issues</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Twilio Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="https://console.twilio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border rounded hover:bg-gray-50 transition-colors">

                    <div className="font-medium">Twilio Console</div>
                    <div className="text-sm text-muted-foreground">Access your account dashboard and logs</div>
                  </a>
                  
                  <a
                    href="https://www.twilio.com/docs/sms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border rounded hover:bg-gray-50 transition-colors">

                    <div className="font-medium">SMS Documentation</div>
                    <div className="text-sm text-muted-foreground">Complete SMS API documentation</div>
                  </a>

                  <a
                    href="https://support.twilio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border rounded hover:bg-gray-50 transition-colors">

                    <div className="font-medium">Twilio Support</div>
                    <div className="text-sm text-muted-foreground">Get help from Twilio support team</div>
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test SMS Configuration
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Validate Phone Numbers
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Check Delivery Status
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Check Account Balance
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">If SMS is completely broken:</div>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Check Twilio service status at status.twilio.com</li>
                      <li>Verify your account hasn't been suspended</li>
                      <li>Test with the simplest possible message to your own number</li>
                      <li>Check application logs for any error messages</li>
                      <li>Contact Twilio support if all else fails</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>);

};

export default SMSTroubleshootingGuide;