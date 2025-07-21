import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, AlertTriangle } from 'lucide-react';
import DatabaseDiagnostics from '@/components/DatabaseDiagnostics';
import AccessDenied from '@/components/AccessDenied';
import useAdminAccess from '@/hooks/use-admin-access';

const DatabaseDiagnosticsPage = () => {
  const { hasMonitoringAccess } = useAdminAccess();

  // Check admin access first
  if (!hasMonitoringAccess) {
    return (
      <AccessDenied
        feature="Database Schema Diagnostics"
        requiredRole="Administrator"
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Schema Diagnostics</h1>
          <p className="text-muted-foreground">
            Diagnose PostgreSQL schema issues including table and column existence errors
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Database className="h-4 w-4 mr-2" />
          Schema Validator
        </Badge>
      </div>

      {/* Important Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5" />
            <span>PostgreSQL Schema Diagnostics</span>
          </CardTitle>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            This tool diagnoses specific PostgreSQL errors: 42P01 (relation not existing) and 42703 (column not existing).
            Use this when encountering database schema-related issues with tables like module_access, products, sales_reports, 
            deliveries, or missing columns like licenses.expiry_date and audit_logs.event_timestamp.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Database Diagnostics Component */}
      <DatabaseDiagnostics />
    </div>
  );
};

export default DatabaseDiagnosticsPage;