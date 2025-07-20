import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Search, Download, Filter } from 'lucide-react';

const AuditLogViewer: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);

  // Sample audit log data
  const sampleLogs = [
  {
    id: 1,
    timestamp: '2024-01-15 14:30:22',
    eventType: 'Login',
    user: 'admin@dfsmanager.com',
    status: 'Success',
    riskLevel: 'Low',
    resource: '/dashboard',
    action: 'View',
    station: 'MOBIL',
    ipAddress: '192.168.1.100'
  },
  {
    id: 2,
    timestamp: '2024-01-15 14:25:15',
    eventType: 'Failed Login',
    user: 'unknown',
    status: 'Failed',
    riskLevel: 'Medium',
    resource: '/login',
    action: 'Authenticate',
    station: 'N/A',
    ipAddress: '203.0.113.10'
  },
  {
    id: 3,
    timestamp: '2024-01-15 14:20:08',
    eventType: 'Data Access',
    user: 'manager@dfsmanager.com',
    status: 'Success',
    riskLevel: 'Low',
    resource: '/sales/reports',
    action: 'View',
    station: 'AMOCO ROSEDALE',
    ipAddress: '192.168.1.150'
  }];


  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical':return 'bg-red-500 hover:bg-red-600';
      case 'High':return 'bg-orange-500 hover:bg-orange-600';
      case 'Medium':return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Low':return 'bg-green-500 hover:bg-green-600';
      default:return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Success':return 'bg-green-500 hover:bg-green-600';
      case 'Failed':return 'bg-red-500 hover:bg-red-600';
      case 'Blocked':return 'bg-orange-500 hover:bg-orange-600';
      case 'Suspicious':return 'bg-purple-500 hover:bg-purple-600';
      default:return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const exportLogs = () => {
    // Sample CSV export functionality
    const csv = [
    'Timestamp,Event Type,User,Status,Risk Level,Resource,Action,Station,IP Address',
    ...sampleLogs.map((log) =>
    `"${log.timestamp}","${log.eventType}","${log.user}","${log.status}","${log.riskLevel}","${log.resource}","${log.action}","${log.station}","${log.ipAddress}"`
    )].
    join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Audit Log Viewer</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}>

                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}>

                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        {showFilters &&
        <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Event Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Events</SelectItem>
                    <SelectItem value="Login">Login</SelectItem>
                    <SelectItem value="Logout">Logout</SelectItem>
                    <SelectItem value="Failed Login">Failed Login</SelectItem>
                    <SelectItem value="Data Access">Data Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Risk Level</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All risk levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Risk Levels</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Username</label>
                <Input placeholder="Search username..." />
              </div>
            </div>
          </CardContent>
        }

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleLogs.map((log) =>
                <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.eventType}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.user}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-white ${getStatusBadgeColor(log.status)}`}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-white ${getRiskBadgeColor(log.riskLevel)}`}>
                        {log.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.resource}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.action}
                    </TableCell>
                    <TableCell>
                      {log.station}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default AuditLogViewer;