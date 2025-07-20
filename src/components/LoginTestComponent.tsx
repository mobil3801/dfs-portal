import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const LoginTestComponent: React.FC = () => {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'failed';
    message: string;
    timestamp: string;
  }>>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const { login, logout, isAuthenticated, isLoading, authError, clearError } = useAuth();
  const { toast } = useToast();

  const addTestResult = (test: string, status: 'success' | 'failed', message: string) => {
    setTestResults((prev) => [...prev, {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runLoginTest = async () => {
    if (isRunningTest) return;

    setIsRunningTest(true);
    setTestResults([]);
    clearError();

    try {
      // Test 1: Clear any existing session
      addTestResult('Cleanup', 'pending', 'Clearing any existing session...');
      await logout();
      addTestResult('Cleanup', 'success', 'Session cleared successfully');

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test 2: First login attempt
      addTestResult('First Login Attempt', 'pending', 'Attempting first login...');
      console.log('🧪 Starting first login attempt...');

      const firstAttempt = await login(testEmail, testPassword);

      if (firstAttempt) {
        addTestResult('First Login Attempt', 'success', '✅ First login attempt succeeded!');
        toast({
          title: "Test Result",
          description: "First login attempt was successful!",
          variant: "default"
        });
      } else {
        addTestResult('First Login Attempt', 'failed', `❌ First login attempt failed: ${authError || 'Unknown error'}`);

        // Test 3: Second login attempt (to verify the bug)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        addTestResult('Second Login Attempt', 'pending', 'Attempting second login...');
        console.log('🧪 Starting second login attempt...');

        const secondAttempt = await login(testEmail, testPassword);

        if (secondAttempt) {
          addTestResult('Second Login Attempt', 'success', '⚠️ Second login attempt succeeded (indicates bug was present)');
          toast({
            title: "Test Result",
            description: "Bug detected: Second attempt succeeded where first failed",
            variant: "destructive"
          });
        } else {
          addTestResult('Second Login Attempt', 'failed', `❌ Second login attempt also failed: ${authError || 'Unknown error'}`);
        }
      }

      // Test 4: Verify authentication state
      if (isAuthenticated) {
        addTestResult('Authentication State', 'success', '✅ User is properly authenticated');
      } else {
        addTestResult('Authentication State', 'failed', '❌ User is not authenticated after login attempts');
      }

    } catch (error) {
      console.error('Test error:', error);
      addTestResult('Test Execution', 'failed', `Test failed with error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const runRapidLoginTest = async () => {
    if (isRunningTest) return;

    setIsRunningTest(true);
    setTestResults([]);
    clearError();

    try {
      // Test rapid successive login attempts
      addTestResult('Rapid Login Test', 'pending', 'Testing rapid successive login attempts...');

      await logout();
      await new Promise((resolve) => setTimeout(resolve, 200));

      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(login(testEmail, testPassword));
      }

      const results = await Promise.allSettled(promises);
      const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;

      if (successCount === 1) {
        addTestResult('Rapid Login Test', 'success', `✅ Only one login succeeded out of ${results.length} rapid attempts (correct behavior)`);
      } else {
        addTestResult('Rapid Login Test', 'failed', `❌ ${successCount} logins succeeded out of ${results.length} rapid attempts (should be 1)`);
      }

    } catch (error) {
      addTestResult('Rapid Login Test', 'failed', `Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const clearTests = () => {
    setTestResults([]);
    clearError();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Login Authentication Test Suite
          </CardTitle>
          <CardDescription>
            Test the login functionality to verify the double-attempt bug has been fixed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Auth Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            {isAuthenticated ?
            <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Authenticated
              </Badge> :

            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                Not Authenticated
              </Badge>
            }
            {isLoading &&
            <Badge variant="outline">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Loading
              </Badge>
            }
          </div>

          {authError &&
          <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {authError}
              </AlertDescription>
            </Alert>
          }

          {/* Test Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter test email" />

            </div>
            <div className="space-y-2">
              <Label htmlFor="testPassword">Test Password</Label>
              <div className="relative">
                <Input
                  id="testPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Enter test password"
                  className="pr-10" />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">

                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={runLoginTest}
              disabled={isRunningTest || isLoading}
              className="flex items-center gap-2">

              {isRunningTest ?
              <Loader2 className="h-4 w-4 animate-spin" /> :

              <LogIn className="h-4 w-4" />
              }
              Run Login Test
            </Button>
            
            <Button
              onClick={runRapidLoginTest}
              disabled={isRunningTest || isLoading}
              variant="outline"
              className="flex items-center gap-2">

              {isRunningTest ?
              <Loader2 className="h-4 w-4 animate-spin" /> :

              <AlertCircle className="h-4 w-4" />
              }
              Rapid Login Test
            </Button>

            <Button
              onClick={clearTests}
              disabled={isRunningTest}
              variant="ghost"
              size="sm">

              Clear Results
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 &&
          <div className="space-y-3">
              <h3 className="text-lg font-medium">Test Results</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result, index) =>
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                result.status === 'success' ?
                'bg-green-50 border-green-200' :
                result.status === 'failed' ?
                'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'}`
                }>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {result.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        {result.status === 'pending' && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
                        <span className="font-medium">{result.test}</span>
                      </div>
                      <span className="text-xs text-gray-500">{result.timestamp}</span>
                    </div>
                    <p className="text-sm mt-1 text-gray-700">{result.message}</p>
                  </div>
              )}
              </div>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

};

export default LoginTestComponent;