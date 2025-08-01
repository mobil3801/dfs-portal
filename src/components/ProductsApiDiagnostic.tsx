import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'loading';
  message: string;
  details?: any;
}

const ProductsApiDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Check if window.ezsite exists
    addResult({
      test: 'EZSite Object Availability',
      status: typeof window !== 'undefined' && window.ezsite ? 'pass' : 'fail',
      message: typeof window !== 'undefined' && window.ezsite ? 'window.ezsite is available' : 'window.ezsite is not available',
      details: {
        windowExists: typeof window !== 'undefined',
        ezsiteExists: typeof window !== 'undefined' && !!window.ezsite
      }
    });

    // Test 2: Check if APIs object exists
    addResult({
      test: 'EZSite APIs Availability',
      status: typeof window !== 'undefined' && window.ezsite?.apis ? 'pass' : 'fail',
      message: typeof window !== 'undefined' && window.ezsite?.apis ? 'window.ezsite.apis is available' : 'window.ezsite.apis is not available',
      details: {
        apisExists: typeof window !== 'undefined' && !!window.ezsite?.apis,
        apiMethods: typeof window !== 'undefined' && window.ezsite?.apis ? Object.keys(window.ezsite.apis) : []
      }
    });

    // Test 3: Check specific API methods
    if (typeof window !== 'undefined' && window.ezsite?.apis) {
      const requiredMethods = ['tablePage', 'tableCreate', 'tableUpdate', 'tableDelete', 'getUserInfo'];
      const availableMethods = requiredMethods.filter(method => 
        typeof window.ezsite?.apis?.[method] === 'function'
      );

      addResult({
        test: 'Required API Methods',
        status: availableMethods.length === requiredMethods.length ? 'pass' : 'warning',
        message: `${availableMethods.length}/${requiredMethods.length} required methods available`,
        details: {
          required: requiredMethods,
          available: availableMethods,
          missing: requiredMethods.filter(method => !availableMethods.includes(method))
        }
      });

      // Test 4: Test getUserInfo (authentication check)
      try {
        addResult({
          test: 'Authentication Check',
          status: 'loading',
          message: 'Testing user authentication...'
        });

        const authResponse = await window.ezsite.apis.getUserInfo();
        
        setResults(prev => prev.map(result => 
          result.test === 'Authentication Check' ? {
            ...result,
            status: authResponse.error ? 'fail' : 'pass',
            message: authResponse.error ? `Authentication failed: ${authResponse.error}` : 'User is authenticated',
            details: authResponse
          } : result
        ));
      } catch (error) {
        setResults(prev => prev.map(result => 
          result.test === 'Authentication Check' ? {
            ...result,
            status: 'fail',
            message: `Authentication error: ${error}`,
            details: { error: String(error) }
          } : result
        ));
      }

      // Test 5: Test products table access (table 11726)
      try {
        addResult({
          test: 'Products Table Access',
          status: 'loading',
          message: 'Testing access to products table (11726)...'
        });

        const productsResponse = await window.ezsite.apis.tablePage('11726', {
          PageNo: 1,
          PageSize: 1,
          OrderByField: 'ID',
          IsAsc: false,
          Filters: []
        });

        setResults(prev => prev.map(result => 
          result.test === 'Products Table Access' ? {
            ...result,
            status: productsResponse.error ? 'fail' : 'pass',
            message: productsResponse.error ? 
              `Table access failed: ${productsResponse.error}` : 
              `Table accessible - ${productsResponse.data?.TotalCount || 0} total products`,
            details: {
              error: productsResponse.error,
              dataStructure: productsResponse.data ? {
                hasList: !!productsResponse.data.List,
                listLength: productsResponse.data.List?.length || 0,
                totalCount: productsResponse.data.TotalCount,
                firstProduct: productsResponse.data.List?.[0] ? Object.keys(productsResponse.data.List[0]) : []
              } : null
            }
          } : result
        ));
      } catch (error) {
        setResults(prev => prev.map(result => 
          result.test === 'Products Table Access' ? {
            ...result,
            status: 'fail',
            message: `Table access error: ${error}`,
            details: { error: String(error) }
          } : result
        ));
      }

      // Test 6: Test basic connectivity with a simple table
      try {
        addResult({
          test: 'Basic API Connectivity',
          status: 'loading',
          message: 'Testing basic API connectivity...'
        });

        const connectivityResponse = await window.ezsite.apis.tablePage('11725', {
          PageNo: 1,
          PageSize: 1,
          Filters: []
        });

        setResults(prev => prev.map(result => 
          result.test === 'Basic API Connectivity' ? {
            ...result,
            status: connectivityResponse.error ? 'fail' : 'pass',
            message: connectivityResponse.error ? 
              `Connectivity failed: ${connectivityResponse.error}` : 
              'API connectivity working',
            details: connectivityResponse
          } : result
        ));
      } catch (error) {
        setResults(prev => prev.map(result => 
          result.test === 'Basic API Connectivity' ? {
            ...result,
            status: 'fail',
            message: `Connectivity error: ${error}`,
            details: { error: String(error) }
          } : result
        ));
      }
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'loading': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pass: 'bg-green-100 text-green-800',
      fail: 'bg-red-100 text-red-800', 
      warning: 'bg-yellow-100 text-yellow-800',
      loading: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          <span>Products API Diagnostics</span>
        </CardTitle>
        <CardDescription>
          Diagnostic tool to identify the root cause of the "data format mismatch" error
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run Diagnostics'
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Diagnostic Results:</h3>
              {results.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{result.test}</h4>
                      <Badge className={getStatusBadge(result.status)}>
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">View Details</summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsApiDiagnostic;