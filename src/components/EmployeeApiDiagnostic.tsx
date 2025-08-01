import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Database, Users, FileText, Clock, Shield } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'running';
  message: string;
  details?: any;
  timestamp: string;
}

const EmployeeApiDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: DiagnosticResult['status'], message: string, details?: any) => {
    const result: DiagnosticResult = {
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    setResults(prev => [...prev, result]);
    return result;
  };

  const runDiagnostics = async () => {
    setResults([]);
    setIsRunning(true);

    try {
      // Test 1: EZSite API Availability
      addResult('API Availability', 'running', 'Checking EZSite API system...');
      if (typeof window.ezsite === 'undefined' || typeof window.ezsite.apis === 'undefined') {
        addResult('API Availability', 'error', 'EZSite API system not available', {
          windowEzsite: typeof window.ezsite,
          apis: typeof window.ezsite?.apis
        });
        setIsRunning(false);
        return;
      }
      addResult('API Availability', 'success', 'EZSite API system is available');

      // Test 2: Employee Table Access (11727)
      addResult('Employee Table', 'running', 'Testing employee table access (ID: 11727)...');
      try {
        const { data: employeeData, error: employeeError } = await window.ezsite.apis.tablePage('11727', {
          PageNo: 1,
          PageSize: 1,
          OrderByField: 'ID',
          IsAsc: true,
          Filters: []
        });

        if (employeeError) {
          addResult('Employee Table', 'error', 'Employee table access failed', {
            tableId: '11727',
            error: employeeError
          });
        } else {
          addResult('Employee Table', 'success', `Employee table accessible. Found ${employeeData?.VirtualCount || 0} records`, {
            tableId: '11727',
            totalRecords: employeeData?.VirtualCount,
            sampleRecord: employeeData?.List?.[0] || null
          });
        }
      } catch (error) {
        addResult('Employee Table', 'error', 'Employee table connection failed', {
          tableId: '11727',
          error: error.toString()
        });
      }

      // Test 3: File Upload Table Access (26928)
      addResult('File Upload Table', 'running', 'Testing file upload table access (ID: 26928)...');
      try {
        const { data: fileData, error: fileError } = await window.ezsite.apis.tablePage('26928', {
          PageNo: 1,
          PageSize: 1,
          OrderByField: 'ID',
          IsAsc: true,
          Filters: []
        });

        if (fileError) {
          addResult('File Upload Table', 'error', 'File upload table access failed', {
            tableId: '26928',
            error: fileError
          });
        } else {
          addResult('File Upload Table', 'success', `File upload table accessible. Found ${fileData?.VirtualCount || 0} records`, {
            tableId: '26928',
            totalRecords: fileData?.VirtualCount,
            sampleRecord: fileData?.List?.[0] || null
          });
        }
      } catch (error) {
        addResult('File Upload Table', 'error', 'File upload table connection failed', {
          tableId: '26928',
          error: error.toString()
        });
      }

      // Test 4: Employee ID Generation Logic
      addResult('Employee ID Generation', 'running', 'Testing employee ID generation...');
      try {
        const { data: idData, error: idError } = await window.ezsite.apis.tablePage('11727', {
          PageNo: 1,
          PageSize: 10,
          OrderByField: 'employee_id',
          IsAsc: false,
          Filters: [{ name: 'employee_id', op: 'StringStartsWith', value: 'DFS' }]
        });

        if (idError) {
          addResult('Employee ID Generation', 'warning', 'Employee ID generation test failed', {
            error: idError
          });
        } else {
          const existingNumbers = (idData?.List || []).map((emp: any) => {
            const match = emp.employee_id?.match(/^DFS(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          }).filter((num: number) => num > 0);

          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1001;
          const nextId = `DFS${nextNumber}`;

          addResult('Employee ID Generation', 'success', `Employee ID generation working. Next ID: ${nextId}`, {
            existingDfsIds: existingNumbers.length,
            highestNumber: existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0,
            nextSuggestedId: nextId
          });
        }
      } catch (error) {
        addResult('Employee ID Generation', 'error', 'Employee ID generation logic failed', {
          error: error.toString()
        });
      }

      // Test 5: Employee Creation Capability
      addResult('Create Permission', 'running', 'Testing employee creation capability...');
      try {
        // Test with minimal data to see if creation would work
        const testEmployeeData = {
          employee_id: 'TEST_DIAGNOSTIC_001',
          first_name: 'Test',
          last_name: 'Diagnostic',
          email: 'test@diagnostic.com',
          phone: '1234567890',
          position: 'Test',
          station: 'Test Station',
          shift: 'Day',
          hire_date: new Date().toISOString(),
          salary: 0,
          is_active: true,
          employment_status: 'Ongoing',
          created_by: 1
        };

        // First check if test employee already exists
        const { data: existingTest } = await window.ezsite.apis.tablePage('11727', {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: 'employee_id', op: 'Equal', value: 'TEST_DIAGNOSTIC_001' }]
        });

        if (existingTest?.List?.length > 0) {
          addResult('Create Permission', 'warning', 'Test employee already exists (previous diagnostic run)', {
            testEmployeeId: 'TEST_DIAGNOSTIC_001',
            existingRecord: existingTest.List[0]
          });
        } else {
          // Attempt to create test employee (we'll delete it immediately)
          const { error: createError } = await window.ezsite.apis.tableCreate('11727', testEmployeeData);
          
          if (createError) {
            addResult('Create Permission', 'error', 'Employee creation failed', {
              error: createError,
              testData: testEmployeeData
            });
          } else {
            addResult('Create Permission', 'success', 'Employee creation capability confirmed', {
              testEmployeeCreated: true
            });

            // Clean up test employee
            const { data: createdEmployee } = await window.ezsite.apis.tablePage('11727', {
              PageNo: 1,
              PageSize: 1,
              Filters: [{ name: 'employee_id', op: 'Equal', value: 'TEST_DIAGNOSTIC_001' }]
            });

            if (createdEmployee?.List?.length > 0) {
              await window.ezsite.apis.tableDelete('11727', { ID: createdEmployee.List[0].ID });
              addResult('Create Permission', 'success', 'Test employee cleaned up successfully');
            }
          }
        }
      } catch (error) {
        addResult('Create Permission', 'error', 'Employee creation test failed', {
          error: error.toString()
        });
      }

      // Test 6: File Upload Capability
      addResult('File Upload', 'running', 'Testing file upload capability...');
      try {
        // Create a minimal test file
        const testFile = new Blob(['Test file content'], { type: 'text/plain' });
        const testFileWithName = new File([testFile], 'diagnostic-test.txt', { type: 'text/plain' });

        const { data: uploadResult, error: uploadError } = await window.ezsite.apis.upload({
          filename: 'diagnostic-test.txt',
          file: testFileWithName
        });

        if (uploadError) {
          addResult('File Upload', 'error', 'File upload failed', {
            error: uploadError
          });
        } else {
          addResult('File Upload', 'success', 'File upload capability confirmed', {
            uploadedFileId: uploadResult,
            testFileName: 'diagnostic-test.txt'
          });

          // Test file upload record creation
          const fileUploadData = {
            file_name: 'diagnostic-test.txt',
            file_size: testFileWithName.size,
            file_type: 'text/plain',
            store_file_id: uploadResult,
            uploaded_by: 1,
            upload_date: new Date().toISOString(),
            associated_table: 'diagnostic_test',
            associated_record_id: null,
            file_category: 'diagnostic',
            is_active: true,
            description: 'Diagnostic test file upload',
            file_url: ''
          };

          const { error: recordError } = await window.ezsite.apis.tableCreate('26928', fileUploadData);
          if (recordError) {
            addResult('File Upload', 'warning', 'File uploaded but record creation failed', {
              error: recordError,
              fileId: uploadResult
            });
          } else {
            addResult('File Upload', 'success', 'File upload record creation confirmed');
          }
        }
      } catch (error) {
        addResult('File Upload', 'error', 'File upload test failed', {
          error: error.toString()
        });
      }

    } catch (error) {
      addResult('Diagnostic Error', 'error', 'Diagnostic process failed', {
        error: error.toString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500 text-white">Pass</Badge>;
      case 'error':
        return <Badge className="bg-red-500 text-white">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-white">Warning</Badge>;
      case 'running':
        return <Badge className="bg-blue-500 text-white">Running</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-6 h-6" />
          <span>Employee API & Supabase Integration Diagnostic</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Comprehensive diagnostic to verify employee creation, file upload, and database integration
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>{isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}</span>
            </Button>
          </div>
          {results.length > 0 && (
            <div className="text-sm text-gray-600">
              {results.filter(r => r.status === 'success').length} passed, 
              {results.filter(r => r.status === 'error').length} failed, 
              {results.filter(r => r.status === 'warning').length} warnings
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Diagnostic Results</span>
            </h3>
            
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700">{result.message}</p>
                
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {!isRunning && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Click "Run Diagnostics" to test employee page Supabase integration</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeApiDiagnostic;