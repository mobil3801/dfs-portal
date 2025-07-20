import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  TestTube,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
  Phone,
  Settings,
  Bug,
  Clock,
  RefreshCw,
  AlertTriangle,
  Info } from
'lucide-react';
import { enhancedSmsService } from '@/services/enhancedSmsService';

interface TestResult {
  success: boolean;
  message: string;
  timestamp: Date;
  phoneNumber: string;
  messageId?: string;
  errorCode?: string;
  details?: any;
  deliveryStatus?: any;
}

const EnhancedSMSTestManager: React.FC = () => {
  const [testNumber, setTestNumber] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [deliveryTracking, setDeliveryTracking] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadServiceStatus();
  }, []);

  const loadServiceStatus = async () => {
    try {
      setConfigLoading(true);
      await enhancedSmsService.loadConfiguration();
      const status = await enhancedSmsService.getServiceStatus();
      setServiceStatus(status);
    } catch (error) {
      console.error('Error loading service status:', error);
      setServiceStatus({
        available: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const runBasicTest = async () => {
    if (!testNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to test",
        variant: "destructive"
      });
      return;
    }

    try {
      setTesting(true);

      const result = await enhancedSmsService.testSMS(testNumber);

      const testResult: TestResult = {
        success: result.success,
        message: result.success ?
        `Test SMS sent successfully to ${testNumber}` :
        result.error || 'Unknown error',
        timestamp: new Date(),
        phoneNumber: testNumber,
        messageId: result.messageId,
        errorCode: result.errorCode,
        details: result
      };

      setTestResults((prev) => [testResult, ...prev]);

      // Track delivery status if message was sent
      if (result.success && result.messageId) {
        trackDeliveryStatus(result.messageId, testNumber);
      }

      if (result.success) {
        toast({
          title: "✅ Test SMS Sent",
          description: `Test message sent to ${testNumber}. Check your phone!`
        });
      } else {
        toast({
          title: "❌ Test Failed",
          description: result.error || 'Failed to send test SMS',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('SMS test error:', error);
      const testResult: TestResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date(),
        phoneNumber: testNumber
      };
      setTestResults((prev) => [testResult, ...prev]);

      toast({
        title: "❌ Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const runAdvancedTest = async () => {
    if (!testNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to test",
        variant: "destructive"
      });
      return;
    }

    try {
      setTesting(true);

      const testData = await enhancedSmsService.testSMSWithDetails(testNumber);

      const testResult: TestResult = {
        success: testData.response.success,
        message: testData.response.success ?
        `Advanced test completed for ${testNumber}` :
        testData.response.error || 'Unknown error',
        timestamp: new Date(),
        phoneNumber: testNumber,
        messageId: testData.response.messageId,
        errorCode: testData.response.errorCode,
        details: testData,
        deliveryStatus: testData.deliveryStatus
      };

      setTestResults((prev) => [testResult, ...prev]);

      if (testData.response.success) {
        toast({
          title: "✅ Advanced Test Completed",
          description: `Comprehensive test completed for ${testNumber}`
        });
      } else {
        toast({
          title: "❌ Advanced Test Failed",
          description: testData.response.error || 'Failed to complete advanced test',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Advanced SMS test error:', error);
      toast({
        title: "❌ Advanced Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const sendCustomMessage = async () => {
    if (!testNumber.trim() || !customMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and message",
        variant: "destructive"
      });
      return;
    }

    try {
      setTesting(true);

      const result = await enhancedSmsService.sendSMS({
        to: testNumber,
        message: customMessage,
        type: 'custom'
      });

      const testResult: TestResult = {
        success: result.success,
        message: result.success ?
        `Custom message sent to ${testNumber}` :
        result.error || 'Unknown error',
        timestamp: new Date(),
        phoneNumber: testNumber,
        messageId: result.messageId,
        errorCode: result.errorCode,
        details: result
      };

      setTestResults((prev) => [testResult, ...prev]);

      if (result.success) {
        toast({
          title: "✅ Custom Message Sent",
          description: `Message sent to ${testNumber}`
        });
        setCustomMessage(''); // Clear after successful send
      } else {
        toast({
          title: "❌ Send Failed",
          description: result.error || 'Failed to send message',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Custom SMS error:', error);
      toast({
        title: "❌ Send Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const trackDeliveryStatus = async (messageId: string, phoneNumber: string) => {
    try {
      // Initial status
      setDeliveryTracking((prev) => ({
        ...prev,
        [messageId]: { status: 'checking', phoneNumber }
      }));

      // Check status after a delay
      setTimeout(async () => {
        try {
          const status = await enhancedSmsService.getDeliveryStatus(messageId);
          setDeliveryTracking((prev) => ({
            ...prev,
            [messageId]: { ...status, phoneNumber }
          }));
        } catch (error) {
          console.error('Error tracking delivery:', error);
          setDeliveryTracking((prev) => ({
            ...prev,
            [messageId]: {
              status: 'error',
              phoneNumber,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }));
        }
      }, 10000); // Check after 10 seconds
    } catch (error) {
      console.error('Error setting up delivery tracking:', error);
    }
  };

  const addToTestNumbers = async () => {
    if (!testNumber.trim()) return;

    try {
      await enhancedSmsService.addTestNumber(testNumber);
      toast({
        title: "✅ Test Number Added",
        description: `${testNumber} added to verified test numbers`
      });
      await loadServiceStatus(); // Refresh status
    } catch (error) {
      toast({
        title: "❌ Failed to Add",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':return 'text-green-600';
      case 'sent':case 'queued':return 'text-blue-600';
      case 'failed':case 'undelivered':return 'text-red-600';
      default:return 'text-yellow-600';
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ?
    <CheckCircle className="h-4 w-4 text-green-600" /> :
    <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <TestTube className="w-5 h-5 mr-2" />
            Enhanced SMS Testing & Debugging
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadServiceStatus}
            disabled={configLoading}>

            {configLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="testing" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="testing" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testNumber">Phone Number</Label>
              <Input
                id="testNumber"
                type="tel"
                placeholder="+1234567890"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)} />

              <p className="text-sm text-muted-foreground">
                Enter phone number in E.164 format (+1234567890)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={runBasicTest}
                disabled={testing || !testNumber.trim()}
                className="w-full">

                {testing ?
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </> :
                <>
                    <Send className="w-4 h-4 mr-2" />
                    Basic Test
                  </>
                }
              </Button>

              <Button
                onClick={runAdvancedTest}
                disabled={testing || !testNumber.trim()}
                variant="outline"
                className="w-full">

                {testing ?
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </> :
                <>
                    <Bug className="w-4 h-4 mr-2" />
                    Advanced Test
                  </>
                }
              </Button>
            </div>

            {serviceStatus?.testMode &&
            <Button
              onClick={addToTestNumbers}
              disabled={!testNumber.trim()}
              variant="outline"
              size="sm"
              className="w-full">

                <Phone className="w-4 h-4 mr-2" />
                Add to Verified Test Numbers
              </Button>
            }

            <div className="border-t pt-4 space-y-2">
              <Label htmlFor="customMessage">Custom Message (Optional)</Label>
              <Textarea
                id="customMessage"
                placeholder="Enter custom message to test..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3} />

              
              <Button
                onClick={sendCustomMessage}
                disabled={testing || !testNumber.trim() || !customMessage.trim()}
                variant="secondary"
                className="w-full">

                {testing ?
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </> :
                <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Custom Message
                  </>
                }
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            {configLoading ?
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading service status...
              </div> :
            serviceStatus ?
            <div className="space-y-4">
                <Alert className={serviceStatus.available ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {serviceStatus.available ?
                <CheckCircle className="h-4 w-4 text-green-600" /> :
                <AlertCircle className="h-4 w-4 text-red-600" />
                }
                  <AlertDescription>
                    <div className={serviceStatus.available ? "text-green-800" : "text-red-800"}>
                      <div className="font-medium">
                        {serviceStatus.available ? "✅ SMS Service Active" : "❌ SMS Service Inactive"}
                      </div>
                      <div className="mt-1">{serviceStatus.message}</div>
                    </div>
                  </AlertDescription>
                </Alert>

                {serviceStatus.configuration &&
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Configuration</div>
                          <div className="space-y-1 text-sm">
                            <div>From Number: {serviceStatus.configuration.fromNumber}</div>
                            <div>
                              Test Mode: 
                              <Badge variant={serviceStatus.configuration.testMode ? "secondary" : "default"} className="ml-1">
                                {serviceStatus.configuration.testMode ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            {serviceStatus.configuration.testNumbers?.length > 0 &&
                        <div>
                                Test Numbers: {serviceStatus.configuration.testNumbers.length}
                              </div>
                        }
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {serviceStatus.quota &&
                <Card>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Account Status</div>
                            <div className="space-y-1 text-sm">
                              <div>Balance: {serviceStatus.quota.quotaRemaining}</div>
                              <div>Provider: Twilio</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                }
                  </div>
              }

                {serviceStatus.testMode &&
              <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Test Mode is Enabled</div>
                      <div className="mt-1">
                        Only verified phone numbers can receive SMS messages. 
                        Add your phone number to the verified list using the "Add to Verified Test Numbers" button.
                      </div>
                    </AlertDescription>
                  </Alert>
              }
              </div> :

            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Unable to load service status. Please check your configuration.
                </AlertDescription>
              </Alert>
            }
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Test Results</h3>
              <Badge variant="outline">{testResults.length} tests</Badge>
            </div>

            {testResults.length === 0 ?
            <div className="text-center py-8 text-muted-foreground">
                No test results yet. Run a test to see results here.
              </div> :

            <div className="space-y-3">
                {testResults.map((result, index) =>
              <Card key={index} className={result.success ? "border-green-200" : "border-red-200"}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.success)}
                          <div>
                            <div className="font-medium">{result.phoneNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {result.timestamp.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? "Success" : "Failed"}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="text-sm">{result.message}</div>
                        
                        {result.messageId &&
                    <div className="text-xs text-muted-foreground">
                            Message ID: {result.messageId}
                          </div>
                    }

                        {result.errorCode &&
                    <Badge variant="destructive" className="text-xs">
                            Error: {result.errorCode}
                          </Badge>
                    }

                        {result.details &&
                    <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                    }
                      </div>
                    </CardContent>
                  </Card>
              )}
              </div>
            }
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Delivery Tracking</h3>
              <Badge variant="outline">{Object.keys(deliveryTracking).length} messages</Badge>
            </div>

            {Object.keys(deliveryTracking).length === 0 ?
            <div className="text-center py-8 text-muted-foreground">
                No delivery tracking data. Send a test message to see tracking information.
              </div> :

            <div className="space-y-3">
                {Object.entries(deliveryTracking).map(([messageId, tracking]) =>
              <Card key={messageId}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{tracking.phoneNumber}</div>
                          <Badge className={getStatusColor(tracking.status)}>
                            {tracking.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Message ID: {messageId}
                        </div>

                        {tracking.deliveredAt &&
                    <div className="text-sm">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Delivered: {new Date(tracking.deliveredAt).toLocaleString()}
                          </div>
                    }

                        {tracking.errorMessage &&
                    <Alert variant="destructive" className="mt-2">
                            <AlertDescription className="text-sm">
                              {tracking.errorMessage}
                            </AlertDescription>
                          </Alert>
                    }

                        {tracking.status === 'checking' &&
                    <div className="flex items-center space-x-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              Checking delivery status...
                            </span>
                          </div>
                    }
                      </div>
                    </CardContent>
                  </Card>
              )}
              </div>
            }
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>);

};

export default EnhancedSMSTestManager;