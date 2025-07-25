import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useBatchSelection } from '@/hooks/use-batch-selection';
import BatchActionBar from '@/components/BatchActionBar';
import BatchDeleteDialog from '@/components/BatchDeleteDialog';
import AccessDenied from '@/components/AccessDenied';
import useAdminAccess from '@/hooks/use-admin-access';
import { supabase } from '@/lib/supabase';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Mail,
  UserCheck,
  Database,
  RefreshCw,
  Search,
  Eye,
  Trash2,
  Activity
} from 'lucide-react';

interface ValidationIssue {
  id: string;
  type: 'role_conflict' | 'duplicate_email' | 'invalid_role' | 'missing_data';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: string;
  employee_id?: string;
  email?: string;
  role?: string;
  description: string;
  detected_at: string;
  resolved: boolean;
  auto_fixable: boolean;
}

interface ValidationStats {
  totalUsers: number;
  validUsers: number;
  issuesFound: number;
  criticalIssues: number;
  autoFixableIssues: number;
  lastValidation: string;
}

const UserValidation: React.FC = () => {
  const { isAdmin } = useAdminAccess();
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [stats, setStats] = useState<ValidationStats>({
    totalUsers: 0,
    validUsers: 0,
    issuesFound: 0,
    criticalIssues: 0,
    autoFixableIssues: 0,
    lastValidation: ''
  });
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const { toast } = useToast();

  // Batch selection hook
  const batchSelection = useBatchSelection<ValidationIssue>();

  useEffect(() => {
    if (isAdmin) {
      fetchValidationData();
      
      if (realTimeEnabled) {
        // Set up real-time subscription for user profile changes
        const subscription = supabase
          .channel('user_validation_changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'user_profiles' 
            }, 
            (payload) => {
              console.log('Real-time user profile change detected:', payload);
              // Re-run validation when user data changes
              runValidation();
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }
    }
  }, [isAdmin, realTimeEnabled]);

  const fetchValidationData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserStats(),
        fetchValidationIssues()
      ]);
    } catch (error) {
      console.error('Error fetching validation data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch validation data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Fetch total users from Supabase
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, role, email, employee_id, is_active');

      if (usersError) throw usersError;

      const totalUsers = users?.length || 0;
      const validUsers = users?.filter(user => 
        user.role && 
        user.email && 
        user.employee_id && 
        user.is_active
      ).length || 0;

      setStats(prev => ({
        ...prev,
        totalUsers,
        validUsers,
        lastValidation: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchValidationIssues = async () => {
    try {
      // Fetch users and analyze for validation issues
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*');

      if (error) throw error;

      const issues: ValidationIssue[] = [];

      // Check for duplicate emails
      const emailMap = new Map();
      users?.forEach(user => {
        if (user.email) {
          if (emailMap.has(user.email)) {
            issues.push({
              id: `duplicate_email_${user.id}`,
              type: 'duplicate_email',
              severity: 'high',
              user_id: user.id,
              employee_id: user.employee_id,
              email: user.email,
              role: user.role,
              description: `Duplicate email address: ${user.email}`,
              detected_at: new Date().toISOString(),
              resolved: false,
              auto_fixable: false
            });
          } else {
            emailMap.set(user.email, user);
          }
        }
      });

      // Check for role conflicts
      users?.forEach(user => {
        if (user.role === 'admin' && user.station_access?.length > 1) {
          issues.push({
            id: `role_conflict_${user.id}`,
            type: 'role_conflict',
            severity: 'medium',
            user_id: user.id,
            employee_id: user.employee_id,
            role: user.role,
            description: `Admin user should not have multiple station access restrictions`,
            detected_at: new Date().toISOString(),
            resolved: false,
            auto_fixable: true
          });
        }
      });

      // Check for invalid roles
      const validRoles = ['admin', 'manager', 'employee'];
      users?.forEach(user => {
        if (user.role && !validRoles.includes(user.role)) {
          issues.push({
            id: `invalid_role_${user.id}`,
            type: 'invalid_role',
            severity: 'critical',
            user_id: user.id,
            employee_id: user.employee_id,
            role: user.role,
            description: `Invalid role: ${user.role}. Must be one of: ${validRoles.join(', ')}`,
            detected_at: new Date().toISOString(),
            resolved: false,
            auto_fixable: true
          });
        }
      });

      // Check for missing required data
      users?.forEach(user => {
        const missingFields = [];
        if (!user.employee_id) missingFields.push('employee_id');
        if (!user.email) missingFields.push('email');
        if (!user.role) missingFields.push('role');

        if (missingFields.length > 0) {
          issues.push({
            id: `missing_data_${user.id}`,
            type: 'missing_data',
            severity: 'high',
            user_id: user.id,
            employee_id: user.employee_id,
            description: `Missing required fields: ${missingFields.join(', ')}`,
            detected_at: new Date().toISOString(),
            resolved: false,
            auto_fixable: false
          });
        }
      });

      setValidationIssues(issues);
      setStats(prev => ({
        ...prev,
        issuesFound: issues.length,
        criticalIssues: issues.filter(issue => issue.severity === 'critical').length,
        autoFixableIssues: issues.filter(issue => issue.auto_fixable).length
      }));

    } catch (error) {
      console.error('Error fetching validation issues:', error);
    }
  };

  const runValidation = async () => {
    setValidating(true);
    try {
      await fetchValidationData();
      toast({
        title: "Validation Complete",
        description: "User validation scan completed successfully"
      });
    } catch (error) {
      console.error('Error running validation:', error);
      toast({
        title: "Validation Error",
        description: "Failed to complete validation scan",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  const autoFixIssue = async (issue: ValidationIssue) => {
    try {
      let updateData: any = {};

      switch (issue.type) {
        case 'role_conflict':
          if (issue.role === 'admin') {
            updateData = { station_access: [] }; // Remove station restrictions for admin
          }
          break;
        case 'invalid_role':
          updateData = { role: 'employee' }; // Default to employee role
          break;
        default:
          throw new Error('Issue is not auto-fixable');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', issue.user_id);

      if (error) throw error;

      // Mark issue as resolved
      setValidationIssues(prev => 
        prev.map(i => 
          i.id === issue.id ? { ...i, resolved: true } : i
        )
      );

      toast({
        title: "Issue Fixed",
        description: "Validation issue has been automatically resolved"
      });

    } catch (error) {
      console.error('Error auto-fixing issue:', error);
      toast({
        title: "Auto-Fix Failed",
        description: "Failed to automatically fix the issue",
        variant: "destructive"
      });
    }
  };

  const handleBatchDelete = () => {
    const selectedData = batchSelection.getSelectedData(filteredIssues, (issue) => issue.id);
    if (selectedData.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select issues to resolve",
        variant: "destructive"
      });
      return;
    }
    setIsBatchDeleteDialogOpen(true);
  };

  const confirmBatchDelete = async () => {
    setBatchActionLoading(true);
    try {
      const selectedData = batchSelection.getSelectedData(filteredIssues, (issue) => issue.id);
      const selectedIds = selectedData.map(issue => issue.id);

      // Mark issues as resolved
      setValidationIssues(prev => 
        prev.map(issue => 
          selectedIds.includes(issue.id) ? { ...issue, resolved: true } : issue
        )
      );

      toast({
        title: "Success",
        description: `Resolved ${selectedData.length} validation issues`
      });

      setIsBatchDeleteDialogOpen(false);
      batchSelection.clearSelection();
    } catch (error) {
      console.error('Error in batch resolve:', error);
      toast({
        title: "Error",
        description: "Failed to resolve validation issues",
        variant: "destructive"
      });
    } finally {
      setBatchActionLoading(false);
    }
  };

  const filteredIssues = validationIssues.filter(issue => {
    const matchesSearch = !searchTerm || 
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = selectedSeverity === 'All' || issue.severity === selectedSeverity;
    const matchesType = selectedType === 'All' || issue.type === selectedType;
    
    return matchesSearch && matchesSeverity && matchesType && !issue.resolved;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'role_conflict': return <Shield className="w-4 h-4" />;
      case 'duplicate_email': return <Mail className="w-4 h-4" />;
      case 'invalid_role': return <UserCheck className="w-4 h-4" />;
      case 'missing_data': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Check admin access first
  if (!isAdmin) {
    return (
      <AccessDenied
        feature="User Validation"
        requiredRole="Administrator"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading real-time user validation...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Real-Time User Validation</h1>
            <p className="text-sm text-green-600 font-medium">✓ Supabase Connected - Live Validation & Conflict Detection</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="w-3 h-3 mr-1" />
            Real-Time Active
          </Badge>
          <Button
            onClick={runValidation}
            disabled={validating}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
            <span>{validating ? 'Validating...' : 'Run Validation'}</span>
          </Button>
        </div>
      </div>

      {/* Validation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Valid Users</p>
                <p className="text-2xl font-bold">{stats.validUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Issues Found</p>
                <p className="text-2xl font-bold">{stats.issuesFound}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold">{stats.criticalIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Auto-Fixable</p>
                <p className="text-2xl font-bold">{stats.autoFixableIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-teal-600" />
              <div>
                <p className="text-sm text-gray-600">Validation Score</p>
                <p className="text-2xl font-bold">
                  {stats.totalUsers > 0 ? Math.round((stats.validUsers / stats.totalUsers) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Status Alert */}
      {stats.criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Issues Detected:</strong> {stats.criticalIssues} critical validation issues require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="All">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="All">All Types</option>
              <option value="role_conflict">Role Conflicts</option>
              <option value="duplicate_email">Duplicate Emails</option>
              <option value="invalid_role">Invalid Roles</option>
              <option value="missing_data">Missing Data</option>
            </select>
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedSeverity('All');
                setSelectedType('All');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Batch Action Bar */}
      <BatchActionBar
        selectedCount={batchSelection.selectedCount}
        onBatchDelete={handleBatchDelete}
        onClearSelection={batchSelection.clearSelection}
        isLoading={batchActionLoading}
        showEdit={false}
        deleteLabel="Resolve Selected"
      />

      {/* Validation Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Issues ({filteredIssues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredIssues.length > 0 && batchSelection.selectedCount === filteredIssues.length}
                      onCheckedChange={() => batchSelection.toggleSelectAll(filteredIssues, (issue) => issue.id)}
                      aria-label="Select all issues"
                    />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Detected</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-3">
                        <CheckCircle className="w-12 h-12 text-green-300" />
                        <div>
                          <p className="text-gray-500 font-medium">No Validation Issues Found</p>
                          <p className="text-sm text-gray-400">All users pass validation checks</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => (
                    <TableRow key={issue.id} className={batchSelection.isSelected(issue.id) ? "bg-blue-50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={batchSelection.isSelected(issue.id)}
                          onCheckedChange={() => batchSelection.toggleItem(issue.id)}
                          aria-label={`Select issue ${issue.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(issue.type)}
                          <span className="capitalize">{issue.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{issue.employee_id || 'N/A'}</div>
                          {issue.email && <div className="text-sm text-gray-500">{issue.email}</div>}
                          {issue.role && <Badge variant="outline" className="text-xs">{issue.role}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{issue.description}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(issue.detected_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {issue.auto_fixable && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => autoFixIssue(issue)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Auto-Fix
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Navigate to user details
                              window.open(`/admin/users?user=${issue.user_id}`, '_blank');
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Batch Delete Dialog */}
      <BatchDeleteDialog
        isOpen={isBatchDeleteDialogOpen}
        onClose={() => setIsBatchDeleteDialogOpen(false)}
        onConfirm={confirmBatchDelete}
        selectedCount={batchSelection.selectedCount}
        isLoading={batchActionLoading}
        itemName="validation issues"
        selectedItems={batchSelection.getSelectedData(filteredIssues, (issue) => issue.id).map((issue) => ({
          id: issue.id,
          name: `${issue.type} - ${issue.description.substring(0, 50)}...`
        }))}
      />
    </div>
  );
};

export default UserValidation;
