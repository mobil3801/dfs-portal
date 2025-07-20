import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useBatchSelection } from '@/hooks/use-batch-selection';
import BatchActionBar from '@/components/BatchActionBar';
import BatchDeleteDialog from '@/components/BatchDeleteDialog';
import AccessDenied from '@/components/AccessDenied';
import useAdminAccess from '@/hooks/use-admin-access';
import {
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Database,
  Shield,
  Mail,
  Calendar } from
'lucide-react';

interface LogEntry {
  id: number;
  event_type: string;
  user_id: number;
  username: string;
  ip_address: string;
  user_agent: string;
  event_timestamp: string;
  event_status: string;
  resource_accessed: string;
  action_performed: string;
  failure_reason: string;
  session_id: string;
  risk_level: string;
  additional_data: string;
  station: string;
  geo_location: string;
}

const SystemLogs: React.FC = () => {
  const { isAdmin } = useAdminAccess();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState('today');
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const { toast } = useToast();

  // Batch selection hook
  const batchSelection = useBatchSelection<LogEntry>();

  const logLevels = ['Success', 'Failed', 'Blocked', 'Suspicious'];
  const categories = ['Login', 'Logout', 'Failed Login', 'Registration', 'Password Reset', 'Data Access', 'Data Modification', 'Permission Change', 'Admin Action'];
  const dateRanges = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'all', label: 'All time' }];


  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      console.log('Fetching audit logs from database...');
      const { data, error } = await window.ezsite.apis.tablePage(12706, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'event_timestamp',
        IsAsc: false,
        Filters: []
      });

      if (error) {
        console.error('Error fetching audit logs:', error);
        // Show empty state instead of fake data
        setLogs([]);
        return;
      }

      console.log('Audit logs data received:', data);
      setLogs(data?.List || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system logs",
        variant: "destructive"
      });
      setLogs([]);
    }
  };

  const refreshLogs = async () => {
    setLoading(true);
    try {
      await fetchAuditLogs();
      toast({
        title: "Logs Refreshed",
        description: "System logs have been updated"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    const filteredLogs = getFilteredLogs();
    const csvContent = [
    ['Timestamp', 'Event Type', 'Status', 'User', 'Action', 'Resource', 'IP Address', 'Station'],
    ...filteredLogs.map((log) => [
    log.event_timestamp,
    log.event_type,
    log.event_status,
    log.username || '',
    log.action_performed || '',
    log.resource_accessed || '',
    log.ip_address || '',
    log.station || '']
    )].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Audit logs have been exported to CSV file"
    });
  };

  // Batch operations
  const handleBatchDelete = () => {
    const selectedData = batchSelection.getSelectedData(filteredLogs, (log) => log.id);
    if (selectedData.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select log entries to delete",
        variant: "destructive"
      });
      return;
    }
    setIsBatchDeleteDialogOpen(true);
  };

  const confirmBatchDelete = async () => {
    setBatchActionLoading(true);
    try {
      const selectedData = batchSelection.getSelectedData(filteredLogs, (log) => log.id);
      const selectedIds = selectedData.map((log) => log.id);

      // Filter out selected logs
      const remainingLogs = logs.filter((log) => !selectedIds.includes(log.id));
      setLogs(remainingLogs);

      toast({
        title: "Success",
        description: `Deleted ${selectedData.length} log entries successfully`
      });

      setIsBatchDeleteDialogOpen(false);
      batchSelection.clearSelection();
    } catch (error) {
      console.error('Error in batch delete:', error);
      toast({
        title: "Error",
        description: `Failed to delete log entries: ${error}`,
        variant: "destructive"
      });
    } finally {
      setBatchActionLoading(false);
    }
  };

  const getFilteredLogs = () => {
    return logs.filter((log) => {
      const matchesSearch =
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_performed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel = selectedLevel === 'All' || log.event_status === selectedLevel;
      const matchesCategory = selectedCategory === 'All' || log.event_type === selectedCategory;

      // Date filtering logic based on dateRange
      const logDate = new Date(log.event_timestamp);
      const now = new Date();
      let matchesDate = true;

      switch (dateRange) {
        case 'today':
          matchesDate = logDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = logDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = logDate >= monthAgo;
          break;
        default:
          matchesDate = true;
      }

      return matchesSearch && matchesLevel && matchesCategory && matchesDate;
    });
  };

  const getLevelIcon = (status: string) => {
    switch (status) {
      case 'Failed':return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Blocked':return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'Success':return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Suspicious':return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLevelBadgeColor = (status: string) => {
    switch (status) {
      case 'Failed':return 'bg-red-100 text-red-800';
      case 'Blocked':return 'bg-yellow-100 text-yellow-800';
      case 'Success':return 'bg-green-100 text-green-800';
      case 'Suspicious':return 'bg-orange-100 text-orange-800';
      default:return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoryIcon = (eventType: string) => {
    switch (eventType) {
      case 'Login':
      case 'Logout':
      case 'Failed Login':
      case 'Registration':
      case 'Password Reset':
        return <User className="w-4 h-4" />;
      case 'Data Access':
      case 'Data Modification':
        return <Database className="w-4 h-4" />;
      case 'Permission Change':
      case 'Admin Action':
        return <Shield className="w-4 h-4" />;
      default:return <FileText className="w-4 h-4" />;
    }
  };

  const filteredLogs = getFilteredLogs();
  const errorCount = logs.filter((log) => log.event_status === 'Failed').length;
  const warningCount = logs.filter((log) => log.event_status === 'Blocked').length;
  const infoCount = logs.filter((log) => log.event_status === 'Success').length;

  // Check admin access first
  if (!isAdmin) {
    return (
      <AccessDenied
        feature="System Logs"
        requiredRole="Administrator" />);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={refreshLogs} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Info className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Info</p>
                <p className="text-2xl font-bold text-blue-600">{infoCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Action Bar */}
      <BatchActionBar
        selectedCount={batchSelection.selectedCount}
        onBatchDelete={handleBatchDelete}
        onClearSelection={batchSelection.clearSelection}
        isLoading={batchActionLoading}
        showEdit={false} />


      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />

            </div>
            
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Levels</SelectItem>
                {logLevels.map((level) =>
                <SelectItem key={level} value={level}>{level}</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((category) =>
                <SelectItem key={category} value={category}>{category}</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((range) =>
                <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedLevel('All');
                setSelectedCategory('All');
                setDateRange('today');
              }}>

              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredLogs.length > 0 && batchSelection.selectedCount === filteredLogs.length}
                      onCheckedChange={() => batchSelection.toggleSelectAll(filteredLogs, (log) => log.id)}
                      aria-label="Select all logs" />

                  </TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) =>
                <TableRow key={log.id} className={batchSelection.isSelected(log.id) ? "bg-blue-50" : ""}>
                    <TableCell>
                      <Checkbox
                      checked={batchSelection.isSelected(log.id)}
                      onCheckedChange={() => batchSelection.toggleItem(log.id)}
                      aria-label={`Select log ${log.id}`} />

                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{new Date(log.event_timestamp).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getLevelIcon(log.event_status)}
                        <Badge className={getLevelBadgeColor(log.event_status)}>
                          {log.event_status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(log.event_type)}
                        <span>{log.event_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={log.action_performed}>
                        {log.action_performed}
                      </div>
                      {log.failure_reason &&
                    <div className="text-xs text-red-600 mt-1">
                          Reason: {log.failure_reason}
                        </div>
                    }
                      {log.additional_data && log.additional_data !== '{}' &&
                    <details className="mt-1">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            View details
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(JSON.parse(log.additional_data), null, 2)}
                          </pre>
                        </details>
                    }
                    </TableCell>
                    <TableCell>
                      {log.username &&
                    <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{log.username}</span>
                        </div>
                    }
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ip_address}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredLogs.length === 0 &&
          <div className="text-center py-8 text-gray-500">
              No logs found matching the current filters.
            </div>
          }
        </CardContent>
      </Card>

      {/* Batch Delete Dialog */}
      <BatchDeleteDialog
        isOpen={isBatchDeleteDialogOpen}
        onClose={() => setIsBatchDeleteDialogOpen(false)}
        onConfirm={confirmBatchDelete}
        selectedCount={batchSelection.selectedCount}
        isLoading={batchActionLoading}
        itemName="log entries"
        selectedItems={batchSelection.getSelectedData(filteredLogs, (log) => log.id).map((log) => ({
          id: log.id,
          name: `${log.level} - ${log.category} - ${log.message.substring(0, 50)}...`
        }))} />

    </div>);

};

export default SystemLogs;