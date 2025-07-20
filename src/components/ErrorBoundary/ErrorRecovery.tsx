import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ErrorLogger, ErrorLogEntry } from '@/services/errorLogger';
import { useToast } from '@/hooks/use-toast';

const ErrorRecovery: React.FC = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const errorLogger = ErrorLogger.getInstance();

  useEffect(() => {
    loadErrorLogs();
  }, []);

  const loadErrorLogs = () => {
    try {
      setIsLoading(true);
      const logs = errorLogger.getLogs();
      setErrorLogs(logs);
    } catch (error) {
      console.error('Failed to load error logs:', error);
      toast({
        title: "Error Loading Logs",
        description: "Failed to load error recovery information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllLogs = () => {
    try {
      errorLogger.clearLogs();
      setErrorLogs([]);
      toast({
        title: "Logs Cleared",
        description: "All error logs have been cleared successfully."
      });
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear error logs.",
        variant: "destructive"
      });
    }
  };

  const exportLogs = () => {
    try {
      const logsData = JSON.stringify(errorLogs, null, 2);
      const blob = new Blob([logsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dfs-error-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Error logs exported successfully."
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export error logs.",
        variant: "destructive"
      });
    }
  };

  const getSeverityBadge = (severity: ErrorLogEntry['severity']) => {
    const variants = {
      low: { variant: 'secondary' as const, color: 'text-yellow-600' },
      medium: { variant: 'secondary' as const, color: 'text-orange-600' },
      high: { variant: 'destructive' as const, color: 'text-red-600' },
      critical: { variant: 'destructive' as const, color: 'text-red-800' }
    };
    return variants[severity] || variants.medium;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSummary = () => {
    return errorLogger.getLogsSummary();
  };

  const summary = getSummary();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <Clock className="animate-spin" size={20} />
            Loading error recovery information...
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Errors</p>
              <p className="text-2xl font-bold">{summary.total}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-gray-400" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">
                {summary.bySeverity.critical || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">High</p>
              <p className="text-2xl font-bold text-orange-600">
                {summary.bySeverity.high || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-400" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Medium/Low</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(summary.bySeverity.medium || 0) + (summary.bySeverity.low || 0)}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-yellow-400" />
          </CardContent>
        </Card>
      </div>

      {/* Error Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={20} />
              Error Recovery Center
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={exportLogs}
                variant="outline"
                size="sm"
                disabled={errorLogs.length === 0}>

                <Download size={16} className="mr-1" />
                Export
              </Button>
              <Button
                onClick={clearAllLogs}
                variant="outline"
                size="sm"
                disabled={errorLogs.length === 0}>

                <Trash2 size={16} className="mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {errorLogs.length === 0 ?
          <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Errors Detected
              </h3>
              <p className="text-gray-500">
                Great! Your application is running smoothly without any recorded errors.
              </p>
            </div> :

          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorLogs.slice(0, 20).map((log) =>
                <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                      variant={getSeverityBadge(log.severity).variant}
                      className={getSeverityBadge(log.severity).color}>

                          {log.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.component || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        <span title={log.error.message}>
                          {log.error.name}: {log.error.message}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        <span title={log.url}>
                          {new URL(log.url).pathname}
                        </span>
                      </TableCell>
                    </TableRow>
                )}
                </TableBody>
              </Table>
              
              {errorLogs.length > 20 &&
            <div className="mt-4 text-center text-sm text-gray-500">
                  Showing 20 of {errorLogs.length} errors. Export for full details.
                </div>
            }
            </div>
          }
        </CardContent>
      </Card>

      {/* Recovery Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Error Recovery Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">For Users:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Refresh the page to reset the component state</li>
                <li>• Clear browser cache and cookies</li>
                <li>• Try using a different browser</li>
                <li>• Check your internet connection</li>
                <li>• Contact support if errors persist</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Developers:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Check console for detailed error information</li>
                <li>• Export error logs for analysis</li>
                <li>• Review component stack traces</li>
                <li>• Implement additional error boundaries if needed</li>
                <li>• Monitor error patterns and frequency</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default ErrorRecovery;