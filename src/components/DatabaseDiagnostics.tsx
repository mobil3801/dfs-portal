import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  Table,
  Columns,
  RefreshCw,
  Play,
  Clock,
  AlertTriangle,
  FileText,
  Settings,
  Eye,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  duration?: number;
  details?: string;
  recommendations?: string[];
  icon: React.ReactNode;
  errorCode?: string;
}

interface SchemaInfo {
  schemaName: string;
  tableCount: number;
  accessible: boolean;
  error?: string;
}

interface TableInfo {
  tableName: string;
  exists: boolean;
  schema?: string;
  columns?: string[];
  error?: string;
  recommendations?: string[];
}

interface ColumnInfo {
  tableName: string;
  columnName: string;
  exists: boolean;
  dataType?: string;
  isNullable?: boolean;
  error?: string;
  recommendations?: string[];
}

const DatabaseDiagnostics: React.FC = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo[]>([]);
  const [tableInfo, setTableInfo] = useState<TableInfo[]>([]);
  const [columnInfo, setColumnInfo] = useState<ColumnInfo[]>([]);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  // Define the specific tables and columns we need to check based on the error context
  const criticalTables = ['module_access', 'products', 'sales_reports', 'deliveries'];
  const criticalColumns = [
    { table: 'licenses', column: 'expiry_date' },
    { table: 'audit_logs', column: 'event_timestamp' }
  ];

  const [tests, setTests] = useState<DiagnosticTest[]>([
    {
      id: 'connection',
      name: 'Database Connection',
      description: 'Test Supabase PostgreSQL connection',
      status: 'pending',
      icon: <Database className="w-4 h-4" />
    },
    {
      id: 'schema_detection',
      name: 'Schema Detection',
      description: 'Detect available database schemas and access permissions',
      status: 'pending',
      icon: <Shield className="w-4 h-4" />
    },
    {
      id: 'table_existence',
      name: 'Critical Tables Check',
      description: 'Verify existence of critical tables (module_access, products, sales_reports, deliveries)',
      status: 'pending',
      icon: <Table className="w-4 h-4" />
    },
    {
      id: 'column_existence',
      name: 'Critical Columns Check',
      description: 'Verify existence of critical columns (licenses.expiry_date, audit_logs.event_timestamp)',
      status: 'pending',
      icon: <Columns className="w-4 h-4" />
    },
    {
      id: 'permissions_check',
      name: 'Database Permissions',
      description: 'Check read/write permissions on critical tables',
      status: 'pending',
      icon: <Eye className="w-4 h-4" />
    }
  ]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    setSchemaInfo([]);
    setTableInfo([]);
    setColumnInfo([]);

    toast({
      title: "Database Diagnostics Started",
      description: "Running comprehensive database schema validation..."
    });

    const totalTests = tests.length;
    
    for (let i = 0; i < totalTests; i++) {
      const test = tests[i];

      // Update test status to running
      setTests(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'running' as const } : t
      ));

      // Run specific test
      const result = await runSpecificTest(test.id);

      setTests(prev => prev.map(t =>
        t.id === test.id ? {
          ...t,
          status: result.passed ? 'passed' as const : 'failed' as const,
          duration: result.duration,
          details: result.details,
          recommendations: result.recommendations,
          errorCode: result.errorCode
        } : t
      ));

      setProgress((i + 1) / totalTests * 100);
    }

    setIsRunning(false);
    setLastRefresh(new Date().toLocaleTimeString());

    const passedCount = tests.filter(t => t.status === 'passed').length;
    const failedCount = tests.filter(t => t.status === 'failed').length;

    toast({
      title: "Database Diagnostics Complete",
      description: `${passedCount}/${totalTests} tests passed. Check results for schema issues.`,
      variant: failedCount > 0 ? "destructive" : "default"
    });
  };

  const runSpecificTest = async (testId: string): Promise<{
    passed: boolean;
    duration: number;
    details: string;
    recommendations?: string[];
    errorCode?: string;
  }> => {
    const startTime = Date.now();

    try {
      switch (testId) {
        case 'connection':
          return await testDatabaseConnection();
        case 'schema_detection':
          return await testSchemaDetection();
        case 'table_existence':
          return await testTableExistence();
        case 'column_existence':
          return await testColumnExistence();
        case 'permissions_check':
          return await testDatabasePermissions();
        default:
          return {
            passed: false,
            duration: Date.now() - startTime,
            details: 'Unknown test type',
            recommendations: ['Contact system administrator']
          };
      }
    } catch (error) {
      return {
        passed: false,
        duration: Date.now() - startTime,
        details: `Test failed with error: ${error}`,
        recommendations: ['Check database connection', 'Verify Supabase configuration']
      };
    }
  };

  const testDatabaseConnection = async () => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (error) {
        return {
          passed: false,
          duration: Date.now() - startTime,
          details: `Connection failed: ${error.message}`,
          recommendations: [
            'Check Supabase configuration in .env files',
            'Verify database URL and API key',
            'Ensure network connectivity to Supabase'
          ],
          errorCode: error.code
        };
      }

      return {
        passed: true,
        duration: Date.now() - startTime,
        details: `Database connection successful (${Date.now() - startTime}ms)`,
        recommendations: ['Connection is healthy']
      };
    } catch (error: any) {
      return {
        passed: false,
        duration: Date.now() - startTime,
        details: `Connection test failed: ${error.message}`,
        recommendations: [
          'Verify Supabase project is running',
          'Check environment variables',
          'Test network connectivity'
        ]
      };
    }
  };

  const testSchemaDetection = async () => {
    const startTime = Date.now();
    const schemas: SchemaInfo[] = [];

    try {
      // Test common PostgreSQL schemas
      const schemaNames = ['public', 'auth', 'storage', 'realtime', 'information_schema'];
      
      for (const schemaName of schemaNames) {
        try {
          const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', schemaName);

          if (error) {
            schemas.push({
              schemaName,
              tableCount: 0,
              accessible: false,
              error: error.message
            });
          } else {
            schemas.push({
              schemaName,
              tableCount: data?.length || 0,
              accessible: true
            });
          }
        } catch (err: any) {
          schemas.push({
            schemaName,
            tableCount: 0,
            accessible: false,
            error: err.message
          });
        }
      }

      setSchemaInfo(schemas);

      const accessibleSchemas = schemas.filter(s => s.accessible);
      const publicSchema = schemas.find(s => s.schemaName === 'public');

      return {
        passed: publicSchema?.accessible ?? false,
        duration: Date.now() - startTime,
        details: `Found ${accessibleSchemas.length} accessible schemas. Public schema ${publicSchema?.accessible ? 'accessible' : 'not accessible'}`,
        recommendations: publicSchema?.accessible ? 
          ['Schema detection successful'] : 
          ['Check database schema permissions', 'Verify RLS policies', 'Ensure proper database setup']
      };
    } catch (error: any) {
      return {
        passed: false,
        duration: Date.now() - startTime,
        details: `Schema detection failed: ${error.message}`,
        recommendations: [
          'Check database permissions',
          'Verify Supabase RLS settings',
          'Ensure user has schema access rights'
        ]
      };
    }
  };

  const testTableExistence = async () => {
    const startTime = Date.now();
    const tableResults: TableInfo[] = [];

    try {
      for (const tableName of criticalTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (error) {
            const recommendations = [];
            if (error.code === '42P01') {
              recommendations.push(`Create table '${tableName}' in public schema`);
              recommendations.push('Run database migration scripts');
              recommendations.push('Check if table exists in different schema');
            }
            if (error.code === 'PGRST116') {
              recommendations.push(`Table '${tableName}' exists but no RLS policy allows access`);
              recommendations.push('Create appropriate RLS policies');
              recommendations.push('Check user permissions');
            }

            tableResults.push({
              tableName,
              exists: false,
              error: error.message,
              recommendations
            });
          } else {
            // Try to get column information
            const { data: columnData } = await supabase
              .from('information_schema.columns')
              .select('column_name')
              .eq('table_name', tableName)
              .eq('table_schema', 'public');

            tableResults.push({
              tableName,
              exists: true,
              schema: 'public',
              columns: columnData?.map(col => col.column_name) || []
            });
          }
        } catch (err: any) {
          tableResults.push({
            tableName,
            exists: false,
            error: err.message,
            recommendations: ['Check database connection', 'Verify table name spelling']
          });
        }
      }

      setTableInfo(tableResults);

      const existingTables = tableResults.filter(t => t.exists);
      const missingTables = tableResults.filter(t => !t.exists);

      return {
        passed: missingTables.length === 0,
        duration: Date.now() - startTime,
        details: `${existingTables.length}/${criticalTables.length} critical tables found. Missing: ${missingTables.map(t => t.tableName).join(', ')}`,
        recommendations: missingTables.length === 0 ? 
          ['All critical tables exist'] :
          [
            'Create missing tables using migration scripts',
            'Check database schema setup',
            'Verify table creation permissions'
          ]
      };
    } catch (error: any) {
      return {
        passed: false,
        duration: Date.now() - startTime,
        details: `Table existence check failed: ${error.message}`,
        recommendations: [
          'Check database connection',
          'Verify schema permissions',
          'Run database setup scripts'
        ]
      };
    }
  };

  const testColumnExistence = async () => {
    const startTime = Date.now();
    const columnResults: ColumnInfo[] = [];

    try {
      for (const { table, column } of criticalColumns) {
        try {
          const { data, error } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', table)
            .eq('column_name', column)
            .eq('table_schema', 'public')
            .single();

          if (error || !data) {
            const recommendations = [];
            if (error?.code === '42P01') {
              recommendations.push(`Table '${table}' does not exist`);
              recommendations.push('Create the table first');
            } else {
              recommendations.push(`Add column '${column}' to table '${table}'`);
              recommendations.push('Run ALTER TABLE command or migration script');
              recommendations.push('Check column name spelling');
            }

            columnResults.push({
              tableName: table,
              columnName: column,
              exists: false,
              error: error?.message || 'Column not found',
              recommendations
            });
          } else {
            columnResults.push({
              tableName: table,
              columnName: column,
              exists: true,
              dataType: data.data_type,
              isNullable: data.is_nullable === 'YES'
            });
          }
        } catch (err: any) {
          columnResults.push({
            tableName: table,
            columnName: column,
            exists: false,
            error: err.message,
            recommendations: ['Check database connection', 'Verify table and column names']
          });
        }
      }

      setColumnInfo(columnResults);

      const existingColumns = columnResults.filter(c => c.exists);
      const missingColumns = columnResults.filter(c => !c.exists);

      return {
        passed: missingColumns.length === 0,
        duration: Date.now() - startTime,
        details: `${existingColumns.length}/${criticalColumns.length} critical columns found. Missing: ${missingColumns.map(c => `${c.tableName}.${c.columnName}`).join(', ')}`,
        recommendations: missingColumns.length === 0 ? 
          ['All critical columns exist'] :
          [
            'Add missing columns using ALTER TABLE statements',
            'Run database migration scripts',
            'Check column definitions in schema'
          ]
      };
    } catch (error: any) {
      return {
        passed: false,
        duration: Date.now() - startTime,
        details: `Column existence check failed: ${error.message}`,
        recommendations: [
          'Check database connection',
          'Verify schema permissions',
          'Ensure information_schema access'
        ]
      };
    }
  };

  const testDatabasePermissions = async () => {
    const startTime = Date.now();
    const permissions = {
      canRead: false,
      canWrite: false,
      canCreate: false,
      errors: [] as string[]
    };

    try {
      // Test read permissions on existing table
      const { error: readError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (!readError) {
        permissions.canRead = true;
      } else {
        permissions.errors.push(`Read permission error: ${readError.message}`);
      }

      // Test write permissions (try to insert, update, and delete in a test table)
      try {
        // Insert test
        const insertResponse = await supabase
          .from('products') // Assuming this table exists
          .insert([{ name: 'test_permission_check', description: 'test' }])
          .select();

        if (insertResponse.error) {
          permissions.errors.push(`Insert permission error: ${insertResponse.error.message}`);
        } else {
          permissions.canWrite = true;

          // Update test
          const insertedId = insertResponse.data?.[0]?.id;
          if (insertedId) {
            const updateResponse = await supabase
              .from('products')
              .update({ description: 'updated_test' })
              .eq('id', insertedId);

            if (updateResponse.error) {
              permissions.errors.push(`Update permission error: ${updateResponse.error.message}`);
            }

            // Delete test
            const deleteResponse = await supabase
              .from('products')
              .delete()
              .eq('id', insertedId);

            if (deleteResponse.error) {
              permissions.errors.push(`Delete permission error: ${deleteResponse.error.message}`);
            }
          } else {
            permissions.errors.push('Could not retrieve inserted record ID for update/delete tests');
          }
        }
      } catch (writeError) {
        permissions.errors.push(`Write permission check failed: ${writeError.message}`);
      }

      return {
        passed: permissions.canRead && permissions.canWrite,
        duration: Date.now() - startTime,
        details: `Read: ${permissions.canRead ? 'Yes' : 'No'}, Write: ${permissions.canWrite ? 'Yes' : 'No'}. Errors: ${permissions.errors.length}`,
        recommendations: permissions.canRead && permissions.canWrite ? 
          ['Database permissions are functional'] :
          [
            'Check RLS policies on tables',
            'Verify user authentication',
            'Ensure proper service role configuration',
            'Review Supabase project permissions'
          ]
      };
    } catch (error: any) {
      return {
        passed: false,
        duration: Date.now() - startTime,
        details: `Permission check failed: ${error.message}`,
        recommendations: [
          'Check database authentication',
          'Verify Supabase service role',
          'Review RLS policies',
          'Check connection configuration'
        ]
      };
    }
  };

  const resetDiagnostics = () => {
    setTests(prev => prev.map(test => ({
      ...test,
      status: 'pending' as const,
      duration: undefined,
      details: undefined,
      recommendations: undefined,
      errorCode: undefined
    })));
    setProgress(0);
    setSchemaInfo([]);
    setTableInfo([]);
    setColumnInfo([]);
    setLastRefresh('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Schema Diagnostics</h2>
          <p className="text-gray-600">
            Diagnose PostgreSQL schema issues including missing tables, columns, and permission errors
          </p>
          {lastRefresh && (
            <p className="text-sm text-gray-500 mt-1">Last updated: {lastRefresh}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={resetDiagnostics}
            variant="outline"
            disabled={isRunning}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests">Diagnostic Tests</TabsTrigger>
          <TabsTrigger value="schema">Schema Info</TabsTrigger>
          <TabsTrigger value="tables">Table Status</TabsTrigger>
          <TabsTrigger value="columns">Column Status</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          {isRunning && (
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </Card>
          )}

          <div className="grid gap-4">
            {tests.map((test) => (
              <Card key={test.id} className={`p-4 border-2 ${getStatusColor(test.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {test.icon}
                    <div>
                      <h3 className="font-semibold">{test.name}</h3>
                      <p className="text-sm text-gray-600">{test.description}</p>
                      {test.details && (
                        <p className="text-xs text-gray-500 mt-1">{test.details}</p>
                      )}
                      {test.errorCode && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Error Code: {test.errorCode}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {test.duration && (
                      <Badge variant="outline" className="text-xs">
                        {test.duration}ms
                      </Badge>
                    )}
                    {getStatusIcon(test.status)}
                  </div>
                </div>
                
                {test.recommendations && test.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                      {test.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <div className="grid gap-4">
            {schemaInfo.map((schema) => (
              <Card key={schema.schemaName} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{schema.schemaName}</h3>
                    <p className="text-sm text-gray-600">
                      {schema.accessible 
                        ? `${schema.tableCount} tables accessible` 
                        : 'Not accessible'}
                    </p>
                    {schema.error && (
                      <p className="text-xs text-red-600 mt-1">{schema.error}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={schema.accessible ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {schema.accessible ? 'Accessible' : 'Blocked'}
                    </Badge>
                    {schema.accessible ? 
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-red-500" />
                    }
                  </div>
                </div>
              </Card>
            ))}
            {schemaInfo.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No schema information available. Run diagnostics to detect database schemas.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <div className="grid gap-4">
            {tableInfo.map((table) => (
              <Card key={table.tableName} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{table.tableName}</h3>
                    <p className="text-sm text-gray-600">
                      {table.exists 
                        ? `Schema: ${table.schema}, ${table.columns?.length || 0} columns` 
                        : 'Table not found'}
                    </p>
                    {table.error && (
                      <p className="text-xs text-red-600 mt-1">{table.error}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={table.exists ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {table.exists ? 'Exists' : 'Missing'}
                    </Badge>
                    {table.exists ? 
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-red-500" />
                    }
                  </div>
                </div>
                
                {table.recommendations && table.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                      {table.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
            {tableInfo.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No table information available. Run diagnostics to check critical table existence.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="columns" className="space-y-4">
          <div className="grid gap-4">
            {columnInfo.map((column) => (
              <Card key={`${column.tableName}.${column.columnName}`} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{column.tableName}.{column.columnName}</h3>
                    <p className="text-sm text-gray-600">
                      {column.exists 
                        ? `Type: ${column.dataType}, Nullable: ${column.isNullable ? 'Yes' : 'No'}` 
                        : 'Column not found'}
                    </p>
                    {column.error && (
                      <p className="text-xs text-red-600 mt-1">{column.error}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={column.exists ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {column.exists ? 'Exists' : 'Missing'}
                    </Badge>
                    {column.exists ? 
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-red-500" />
                    }
                  </div>
                </div>
                
                {column.recommendations && column.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                      {column.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
            {columnInfo.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No column information available. Run diagnostics to check critical column existence.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Error Code Reference:</strong> 42P01 = Relation (table) does not exist, 42703 = Column does not exist. 
          This diagnostic tool specifically checks for these common PostgreSQL schema errors in your DFS Portal database.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DatabaseDiagnostics;