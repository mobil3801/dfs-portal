import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TestTube,
  MessageSquare,
  DollarSign,
  Activity } from
'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const SMSDiagnosticTool: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: DiagnosticResult[] = [];

    try {
      // Test 1: Check if tables exist and are accessible
      results.push(await testDatabaseTables());

      // Test 2: Validate ClickSend credentials
      results.push(await testClickSendCredentials());

      // Test 3: Check account balance
      results.push(await testAccountBalance());

      // Test 4: Validate phone number format (if provided)
      if (testPhone) {
        results.push(testPhoneNumberFormat(testPhone));
      }

      // Test 5: Check daily limits
      results.push(await testDailyLimits());

    } catch (error) {
      results.push({
        test: 'Overall Diagnostic',
        status: 'error',
        message: `Diagnostic failed: ${error}`
      });
    }

    setDiagnosticResults(results);
    setLoading(false);
  };

  const testDatabaseTables = async (): Promise<DiagnosticResult> => {
    try {
      // Test SMS config table (24201)
      const configResponse = await window.ezsite.apis.tablePage(24201, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: []
      });

      // Test SMS logs table (24202)
      const logsResponse = await window.ezsite.apis.tablePage(24202, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: []
      });

      if (configResponse.error) {
        return {
          test: 'Database Tables',
          status: 'error',
          message: `SMS config table error: ${configResponse.error}`
        };
      }

      if (logsResponse.error) {
        return {
          test: 'Database Tables',
          status: 'error',
          message: `SMS logs table error: ${logsResponse.error}`
        };
      }

      return {
        test: 'Database Tables',
        status: 'success',
        message: 'All SMS database tables are accessible',
        details: {
          configRecords: configResponse.data?.VirtualCount || 0,
          logRecords: logsResponse.data?.VirtualCount || 0
        }
      };
    } catch (error) {
      return {
        test: 'Database Tables',
        status: 'error',
        message: `Database access failed: ${error}`
      };
    }
  };

  const testClickSendCredentials = async (): Promise<DiagnosticResult> => {
    try {
      const credentials = btoa('mobil3801beach@gmail.com:54DC23E4-34D7-C6B1-0601-112E36A46B49');

      const response = await fetch('https://rest.clicksend.com/v3/account', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.data) {
        return {
          test: 'ClickSend Credentials',
          status: 'success',
          message: 'ClickSend API credentials are valid',
          details: {
            accountId: result.data.user_id,
            country: result.data.country,
            balance: result.data.balance
          }
        };
      } else {
        return {
          test: 'ClickSend Credentials',
          status: 'error',
          message: result.response_msg || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        test: 'ClickSend Credentials',
        status: 'error',
        message: `Credential validation failed: ${error}`
      };
    }
  };

  const testAccountBalance = async (): Promise<DiagnosticResult> => {
    try {
      const credentials = btoa('mobil3801beach@gmail.com:54DC23E4-34D7-C6B1-0601-112E36A46B49');

      const response = await fetch('https://rest.clicksend.com/v3/account', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const balance = result.data.balance || 0;

        if (balance <= 0) {
          return {
            test: 'Account Balance',
            status: 'error',
            message: 'Account balance is insufficient for sending SMS',
            details: { balance }
          };
        } else if (balance < 5) {
          return {
            test: 'Account Balance',
            status: 'warning',
            message: 'Account balance is low',
            details: { balance }
          };
        } else {
          return {
            test: 'Account Balance',
            status: 'success',
            message: `Account balance is sufficient: $${balance.toFixed(4)}`,
            details: { balance }
          };
        }
      } else {
        return {
          test: 'Account Balance',
          status: 'error',
          message: 'Failed to retrieve account balance'
        };
      }
    } catch (error) {
      return {
        test: 'Account Balance',
        status: 'error',
        message: `Balance check failed: ${error}`
      };
    }
  };

  const testPhoneNumberFormat = (phoneNumber: string): DiagnosticResult => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    if (e164Regex.test(phoneNumber)) {
      return {
        test: 'Phone Number Format',
        status: 'success',
        message: 'Phone number format is valid (E.164)',
        details: { phoneNumber }
      };
    } else {
      return {
        test: 'Phone Number Format',
        status: 'error',
        message: 'Phone number must be in E.164 format (+1234567890)',
        details: { phoneNumber }
      };
    }
  };

  const testDailyLimits = async (): Promise<DiagnosticResult> => {
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

      const todayCount = data?.VirtualCount || 0;
      const dailyLimit = 100; // Default limit

      if (todayCount >= dailyLimit) {
        return {
          test: 'Daily Limits',
          status: 'error',
          message: `Daily SMS limit reached (${todayCount}/${dailyLimit})`,
          details: { todayCount, dailyLimit }
        };
      } else if (todayCount > dailyLimit * 0.8) {
        return {
          test: 'Daily Limits',
          status: 'warning',
          message: `Daily SMS usage is high (${todayCount}/${dailyLimit})`,
          details: { todayCount, dailyLimit }
        };
      } else {
        return {
          test: 'Daily Limits',
          status: 'success',
          message: `Daily SMS usage is within limits (${todayCount}/${dailyLimit})`,
          details: { todayCount, dailyLimit }
        };
      }
    } catch (error) {
      return {
        test: 'Daily Limits',
        status: 'error',
        message: `Daily limit check failed: ${error}`
      };
    }
  };

  const sendActualTestSMS = async () => {
    if (!testPhone) {
      toast({
        title: "Missing Phone Number",
        description: "Please enter a phone number to test SMS sending.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const credentials = btoa('mobil3801beach@gmail.com:54DC23E4-34D7-C6B1-0601-112E36A46B49');

      const smsData = {
        messages: [{
          source: 'DFS',
          to: testPhone,
          body: `DFS Manager SMS Test - ${new Date().toLocaleString()}. This is a test message to verify SMS functionality.`
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

      if (response.ok && result.data?.messages?.[0]) {
        const messageResult = result.data.messages[0];

        // Log the test SMS
        await window.ezsite.apis.tableCreate(24202, {
          recipient_phone: testPhone,
          message_content: smsData.messages[0].body,
          sender_name: 'DFS',
          status: messageResult.status === 'SUCCESS' ? 'Sent' : 'Failed',
          sent_at: new Date().toISOString(),
          message_id: messageResult.message_id || '',
          clicksend_message_id: messageResult.message_id || '',
          cost: parseFloat(messageResult.message_price) || 0,
          error_message: messageResult.status !== 'SUCCESS' ? messageResult.custom_string || 'Unknown error' : '',
          message_type: 'diagnostic_test',
          sent_by_user_id: 1
        });

        if (messageResult.status === 'SUCCESS') {
          toast({
            title: "Test SMS Sent Successfully",
            description: `Test SMS sent to ${testPhone}. Message ID: ${messageResult.message_id}. Cost: $${(parseFloat(messageResult.message_price) || 0).toFixed(4)}`
          });
        } else {
          throw new Error(messageResult.custom_string || messageResult.status || 'Failed to send SMS');
        }
      } else {
        const errorMessage = result.response_msg ||
        result.error_message ||
        `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Test SMS Failed",
        description: `Failed to send test SMS: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Warning</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          SMS Diagnostic Tool
        </CardTitle>
        <CardDescription>
          Comprehensive testing and diagnostics for ClickSend SMS integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runDiagnostics}
            disabled={loading}
            className="flex-1">

            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
            Run Full Diagnostics
          </Button>
        </div>

        {diagnosticResults.length > 0 &&
        <div className="space-y-3">
            <h4 className="font-medium">Diagnostic Results:</h4>
            {diagnosticResults.map((result, index) =>
          <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-sm text-muted-foreground">{result.message}</p>
                {result.details &&
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
            }
              </div>
          )}
          </div>
        }

        <div className="border-t pt-4 space-y-4">
          <h4 className="font-medium">Live SMS Test</h4>
          <div className="space-y-2">
            <Label htmlFor="test_phone">Test Phone Number</Label>
            <Input
              id="test_phone"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+1234567890" />

            <p className="text-sm text-muted-foreground">
              Use E.164 format. This will send an actual SMS message.
            </p>
          </div>
          <Button
            onClick={sendActualTestSMS}
            disabled={loading || !testPhone}
            className="w-full">

            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
            Send Live Test SMS
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This tool uses your actual ClickSend account and will consume SMS credits for live tests.
            Make sure you have sufficient balance before testing.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>);

};

export default SMSDiagnosticTool;