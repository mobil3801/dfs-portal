import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { TestTube, CheckCircle, AlertCircle, Send, Loader2 } from 'lucide-react';
import { smsService } from '@/services/smsService';

const SMSTestConnection: React.FC = () => {
  const [testNumber, setTestNumber] = useState('');
  const [testing, setTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const { toast } = useToast();

  const runConnectionTest = async () => {
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
      setLastTestResult(null);

      // Test SMS service connection
      const serviceStatus = await smsService.getServiceStatus();

      if (!serviceStatus.available) {
        throw new Error(serviceStatus.message);
      }

      // Send test SMS
      const result = await smsService.testSMS(testNumber);

      setLastTestResult({
        success: result.success,
        message: result.success ?
        `Test SMS sent successfully to ${testNumber}` :
        result.error,
        timestamp: new Date(),
        messageId: result.messageId,
        phoneNumber: testNumber
      });

      if (result.success) {
        toast({
          title: "✅ Test Successful",
          description: `Test SMS sent to ${testNumber}. Check your phone!`
        });
      } else {
        toast({
          title: "❌ Test Failed",
          description: result.error || "Failed to send test SMS",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('SMS test error:', error);
      setLastTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date(),
        phoneNumber: testNumber
      });

      toast({
        title: "❌ Connection Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TestTube className="w-5 h-5 mr-2" />
          SMS Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testNumber">Test Phone Number</Label>
          <Input
            id="testNumber"
            type="tel"
            placeholder="+1234567890"
            value={testNumber}
            onChange={(e) => setTestNumber(e.target.value)} />

          <p className="text-sm text-muted-foreground">
            Enter your phone number to receive a test SMS
          </p>
        </div>

        <Button
          onClick={runConnectionTest}
          disabled={testing || !testNumber.trim()}
          className="w-full">

          {testing ?
          <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing Connection...
            </> :

          <>
              <Send className="w-4 h-4 mr-2" />
              Send Test SMS
            </>
          }
        </Button>

        {lastTestResult &&
        <Alert className={lastTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {lastTestResult.success ?
          <CheckCircle className="h-4 w-4 text-green-600" /> :

          <AlertCircle className="h-4 w-4 text-red-600" />
          }
            <AlertDescription>
              <div className={lastTestResult.success ? "text-green-800" : "text-red-800"}>
                <div className="font-medium">
                  {lastTestResult.success ? "✅ Test Successful" : "❌ Test Failed"}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div><strong>Message:</strong> {lastTestResult.message}</div>
                  <div><strong>Phone:</strong> {lastTestResult.phoneNumber}</div>
                  <div><strong>Time:</strong> {lastTestResult.timestamp.toLocaleString()}</div>
                  {lastTestResult.messageId &&
                <div><strong>Message ID:</strong> {lastTestResult.messageId}</div>
                }
                </div>
              </div>
            </AlertDescription>
          </Alert>
        }

        <div className="border-t pt-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="font-medium">Test Information:</div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>This test sends a real SMS to verify your configuration</li>
              <li>Make sure to enter a phone number you have access to</li>
              <li>Test messages don't count toward license alerts</li>
              <li>Check your SMS provider balance if tests fail</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>);

};

export default SMSTestConnection;