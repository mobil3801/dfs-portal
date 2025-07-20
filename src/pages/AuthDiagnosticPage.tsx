import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import ApiStatusChecker from '@/components/ApiStatusChecker';
import {
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Shield,
  User,
  Database,
  Settings,
  Zap } from
'lucide-react';

const AuthDiagnosticPage: React.FC = () => {
  const auth = useAuth();
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const runComprehensiveDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    setTestResults([]);

    const results = {
      timestamp: new Date().toISOString(),
      authContextStatus: {},
      apiAvailability: {},
      userDataIntegrity: {},
      permissionSystem: {},
      databaseConnectivity: {}
    };

    const addTestResult = (category: string, test: string, status: 'pass' | 'fail' | 'warning', message: string) => {
      setTestResults((prev) => [...prev, { category, test, status, message, timestamp: new Date() }]);
    };

    try {
      // Test 1: Auth Context Status
      addTestResult('Auth Context', 'Context Initialization', auth.isInitialized ? 'pass' : 'fail',
      `Auth context is ${auth.isInitialized ? 'initialized' : 'not initialized'}`);

      addTestResult('Auth Context', 'Loading State', !auth.isLoading ? 'pass' : 'warning',
      `Loading state: ${auth.isLoading ? 'active' : 'complete'}`);

      addTestResult('Auth Context', 'Authentication Status', auth.isAuthenticated ? 'pass' : 'warning',
      `User is ${auth.isAuthenticated ? 'authenticated' : 'not authenticated'}`);

      if (auth.authError) {
        addTestResult('Auth Context', 'Error State', 'fail', `Auth error: ${auth.authError}`);
      } else {
        addTestResult('Auth Context', 'Error State', 'pass', 'No authentication errors');
      }

      results.authContextStatus = {
        isInitialized: auth.isInitialized,
        isLoading: auth.isLoading,
        isAuthenticated: auth.isAuthenticated,
        hasError: !!auth.authError,
        errorMessage: auth.authError
      };

      // Test 2: API Availability
      if (window.ezsite?.apis) {
        addTestResult('API Availability', 'EZSite APIs', 'pass', 'EZSite APIs are available');

        const requiredMethods = ['getUserInfo', 'login', 'logout', 'register', 'tablePage'];
        const availableMethods = requiredMethods.filter((method) =>
        typeof window.ezsite?.apis?.[method] === 'function'
        );

        addTestResult('API Availability', 'Required Methods',
        availableMethods.length === requiredMethods.length ? 'pass' : 'fail',
        `${availableMethods.length}/${requiredMethods.length} required methods available`);

        results.apiAvailability = {
          ezsiteAvailable: true,
          requiredMethods: requiredMethods.length,
          availableMethods: availableMethods.length,
          methods: requiredMethods.map((method) => ({
            name: method,
            available: typeof window.ezsite?.apis?.[method] === 'function'
          }))
        };
      } else {
        addTestResult('API Availability', 'EZSite APIs', 'fail', 'EZSite APIs are not available');
        results.apiAvailability = { ezsiteAvailable: false };
      }

      // Test 3: User Data Integrity (if authenticated)
      if (auth.user) {
        addTestResult('User Data', 'User Object', 'pass', `User ID: ${auth.user.ID}, Email: ${auth.user.Email}`);

        const hasRequiredFields = auth.user.ID && auth.user.Email && auth.user.Name;
        addTestResult('User Data', 'Required Fields', hasRequiredFields ? 'pass' : 'fail',
        `Required user fields are ${hasRequiredFields ? 'present' : 'missing'}`);

        results.userDataIntegrity = {
          userExists: true,
          userID: auth.user.ID,
          email: auth.user.Email,
          name: auth.user.Name,
          hasRequiredFields
        };
      } else {
        addTestResult('User Data', 'User Object', 'warning', 'No user data (not authenticated)');
        results.userDataIntegrity = { userExists: false };
      }

      // Test 4: User Profile
      if (auth.userProfile) {
        addTestResult('User Profile', 'Profile Object', 'pass', `Role: ${auth.userProfile.role}, Station: ${auth.userProfile.station}`);

        results.userDataIntegrity.profile = {
          exists: true,
          role: auth.userProfile.role,
          station: auth.userProfile.station,
          isActive: auth.userProfile.is_active
        };
      } else {
        addTestResult('User Profile', 'Profile Object', 'warning', 'No user profile data');
        results.userDataIntegrity.profile = { exists: false };
      }

      // Test 5: Permission System
      if (auth.userProfile) {
        try {
          const isAdmin = auth.isAdmin();
          const isManager = auth.isManager();
          const canView = auth.hasPermission('view');

          addTestResult('Permissions', 'Role Detection', 'pass',
          `Admin: ${isAdmin}, Manager: ${isManager}, Can View: ${canView}`);

          results.permissionSystem = {
            roleDetectionWorking: true,
            isAdmin,
            isManager,
            canView,
            role: auth.userProfile.role
          };
        } catch (permissionError) {
          addTestResult('Permissions', 'Role Detection', 'fail',
          `Permission system error: ${permissionError instanceof Error ? permissionError.message : String(permissionError)}`);
          results.permissionSystem = {
            roleDetectionWorking: false,
            error: permissionError instanceof Error ? permissionError.message : String(permissionError)
          };
        }
      } else {
        addTestResult('Permissions', 'Role Detection', 'warning', 'Cannot test permissions without user profile');
        results.permissionSystem = { roleDetectionWorking: false };
      }

      // Test 6: Database Connectivity (if APIs available)
      if (window.ezsite?.apis?.tablePage) {
        try {
          const testResponse = await window.ezsite.apis.tablePage(11725, {
            PageNo: 1,
            PageSize: 1,
            Filters: []
          });

          if (testResponse.error) {
            addTestResult('Database', 'Table Access', 'warning', `Database query returned error: ${testResponse.error}`);
          } else {
            addTestResult('Database', 'Table Access', 'pass', 'Database connection and table access working');
          }

          results.databaseConnectivity = {
            connectionWorking: !testResponse.error,
            error: testResponse.error || null
          };
        } catch (error) {
          addTestResult('Database', 'Table Access', 'fail', `Database test failed: ${error instanceof Error ? error.message : String(error)}`);
          results.databaseConnectivity = {
            connectionWorking: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      } else {
        addTestResult('Database', 'Table Access', 'fail', 'Database APIs not available for testing');
        results.databaseConnectivity = { connectionWorking: false, error: 'APIs not available' };
      }

    } catch (error) {
      addTestResult('System', 'Diagnostic Run', 'fail', `Diagnostic failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    setDiagnosticResults(results);
    setIsRunningDiagnostic(false);
  };

  useEffect(() => {
    // Run initial diagnostic
    runComprehensiveDiagnostic();
  }, []);

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-600">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Warning</Badge>;
    }
  };

  const groupedResults = testResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, typeof testResults>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Authentication Diagnostic
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive authentication system analysis and troubleshooting
          </p>
        </div>
        <Button
          onClick={runComprehensiveDiagnostic}
          disabled={isRunningDiagnostic}
          className="flex items-center gap-2">

          {isRunningDiagnostic ?
          <Loader2 className="h-4 w-4 animate-spin" /> :

          <RefreshCw className="h-4 w-4" />
          }
          {isRunningDiagnostic ? 'Running...' : 'Run Diagnostic'}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="api">API Status</TabsTrigger>
          <TabsTrigger value="details">Raw Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Authentication Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    {getStatusBadge(auth.isAuthenticated ? 'pass' : 'warning')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Initialized</span>
                    {getStatusBadge(auth.isInitialized ? 'pass' : 'fail')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Loading</span>
                    {getStatusBadge(!auth.isLoading ? 'pass' : 'warning')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auth.user ?
                  <>
                      <div className="text-sm">
                        <strong>Name:</strong> {auth.user.Name}
                      </div>
                      <div className="text-sm">
                        <strong>Email:</strong> {auth.user.Email}
                      </div>
                      <div className="text-sm">
                        <strong>ID:</strong> {auth.user.ID}
                      </div>
                    </> :

                  <div className="text-sm text-gray-500">No user data available</div>
                  }
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">APIs</span>
                    {getStatusBadge(!!window.ezsite?.apis ? 'pass' : 'fail')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    {getStatusBadge(diagnosticResults?.databaseConnectivity?.connectionWorking ? 'pass' : 'fail')}
                  </div>
                  {auth.authError &&
                  <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {auth.authError}
                      </AlertDescription>
                    </Alert>
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          {Object.entries(groupedResults).map(([category, results]) =>
          <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((result, index) =>
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium text-sm">{result.test}</div>
                          <div className="text-xs text-gray-600">{result.message}</div>
                        </div>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="api">
          <ApiStatusChecker showFullDetails={true} />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {diagnosticResults &&
          <Card>
              <CardHeader>
                <CardTitle>Raw Diagnostic Data</CardTitle>
                <CardDescription>
                  Complete diagnostic results for technical analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(diagnosticResults, null, 2)}
                </pre>
              </CardContent>
            </Card>
          }
        </TabsContent>
      </Tabs>
    </div>);

};

export default AuthDiagnosticPage;