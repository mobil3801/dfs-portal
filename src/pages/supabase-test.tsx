import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SupabaseConnectionTest } from '@/utils/supabaseConnectionTest';
import { SupabaseMigrationHelper } from '@/services/supabaseMigrationHelper';
import { AutomaticMigration, MigrationStep } from '@/utils/automaticMigration';

interface ConnectionStatus {
  connected: boolean;
  error?: string;
  details: {
    clientConfigured: boolean;
    databaseReachable: boolean;
    tablesExist: boolean;
    tableCount: number;
  };
}

export default function SupabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrationHelper, setMigrationHelper] = useState<SupabaseMigrationHelper | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<MigrationStep[]>([]);
  const [migrationRunning, setMigrationRunning] = useState(false);

  useEffect(() => {
    // Initialize migration helper
    const helper = SupabaseMigrationHelper.getInstance();
    setMigrationHelper(helper);
    
    // Test connection on load
    testConnection();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await SupabaseConnectionTest.testConnection();
      setConnectionStatus(result);
      
      // Also log to console for detailed info
      await SupabaseConnectionTest.logConnectionStatus();
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!connectionStatus) return <Badge variant="secondary">Testing...</Badge>;
    
    if (connectionStatus.connected) {
      return <Badge variant="default" className="bg-green-500">🟢 CONNECTED</Badge>;
    } else if (connectionStatus.details.databaseReachable) {
      return <Badge variant="secondary" className="bg-yellow-500 text-black">🟡 SETUP NEEDED</Badge>;
    } else if (connectionStatus.details.clientConfigured) {
      return <Badge variant="secondary" className="bg-orange-500">🟠 CONFIG ERROR</Badge>;
    } else {
      return <Badge variant="destructive">🔴 NOT CONFIGURED</Badge>;
    }
  };

  const testMigrationHelper = async () => {
    if (!migrationHelper) return;
    
    console.log('\n=== TESTING MIGRATION HELPER ===');
    
    // Test if migration helper is working
    try {
      const testResult = await migrationHelper.callApi('tablePage', 12599, {
        PageNo: 1,
        PageSize: 5,
        OrderByField: 'id',
        IsAsc: true
      });
      
      console.log('Migration Helper Test Result:', testResult);
      alert('Migration helper test completed - check browser console for details');
    } catch (error) {
      console.error('Migration helper test failed:', error);
      alert('Migration helper test failed - check browser console for details');
    }
  };

  const runAutomaticMigration = async () => {
    setMigrationRunning(true);
    setMigrationProgress([]);
    
    const migration = new AutomaticMigration((steps) => {
      setMigrationProgress(steps);
    });
    
    try {
      const success = await migration.runCompleteMigration();
      
      if (success) {
        alert('🎉 Migration completed successfully! Refresh the page to see updated connection status.');
        // Refresh connection test
        await testConnection();
      } else {
        alert('⚠️ Migration completed with issues. Check the progress below for details.');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      alert('❌ Migration failed. Check browser console for details.');
    } finally {
      setMigrationRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>🚀 Supabase Connection Status</span>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl">
                  {connectionStatus.details.clientConfigured ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-600">Client Configured</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">
                  {connectionStatus.details.databaseReachable ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-600">Database Reachable</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">
                  {connectionStatus.details.tablesExist ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-600">Tables Exist</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {connectionStatus.details.tableCount}/11
                </div>
                <div className="text-sm text-gray-600">Tables Found</div>
              </div>
            </div>
          )}

          {connectionStatus?.error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h4 className="font-medium text-red-800">Error:</h4>
              <p className="text-red-700 text-sm mt-1">{connectionStatus.error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={testConnection}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : '🔄 Test Connection'}
            </Button>
            
            <Button
              onClick={testMigrationHelper}
              variant="outline"
            >
              🧪 Test Migration Helper
            </Button>
            
            <Button
              onClick={runAutomaticMigration}
              disabled={migrationRunning}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {migrationRunning ? '🔄 Running Migration...' : '🚀 Run Automatic Migration'}
            </Button>
          </div>

          {!connectionStatus?.connected && connectionStatus?.details.clientConfigured && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h4 className="font-medium text-blue-800">📋 Next Steps:</h4>
              <ol className="text-blue-700 text-sm mt-2 list-decimal list-inside space-y-1">
                <li>Go to your Supabase dashboard: <a href="https://app.supabase.com/project/nehhjsiuhthflfwkfequ" target="_blank" className="underline">Open Dashboard</a></li>
                <li>Go to SQL Editor</li>
                <li>Run the schema file: <code className="bg-blue-100 px-1 rounded">src/database/supabase-schema.sql</code></li>
                <li>Refresh this page to test again</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Progress */}
      {migrationProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔄 Migration Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {migrationProgress.map((step, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0">
                    {step.status === 'completed' && <span className="text-green-500 text-lg">✅</span>}
                    {step.status === 'failed' && <span className="text-red-500 text-lg">❌</span>}
                    {step.status === 'running' && <span className="text-blue-500 text-lg">🔄</span>}
                    {step.status === 'pending' && <span className="text-gray-400 text-lg">⏳</span>}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.step}</div>
                    <div className="text-sm text-gray-600">{step.message}</div>
                    {step.error && (
                      <div className="text-xs text-red-600 mt-1">Error: {step.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>🔧 Migration Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Migration Status:</strong> Infrastructure Complete ✅</p>
            <p><strong>Supabase URL:</strong> https://nehhjsiuhthflfwkfequ.supabase.co</p>
            <p><strong>Fallback Behavior:</strong> Currently using original database until Supabase setup is complete</p>
            <p><strong>Tables to Create:</strong> 11 tables with Row Level Security</p>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">🕒 Why you see old data:</h4>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Migration is designed with <strong>fallback protection</strong></li>
              <li>If Supabase tables don't exist, it uses the original database</li>
              <li>Once you set up the Supabase database, it will automatically switch</li>
              <li>This ensures zero downtime during migration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}