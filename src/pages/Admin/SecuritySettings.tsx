import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useBatchSelection } from '@/hooks/use-batch-selection';
import BatchActionBar from '@/components/BatchActionBar';
import BatchDeleteDialog from '@/components/BatchDeleteDialog';
import AccessDenied from '@/components/AccessDenied';
import useAdminAccess from '@/hooks/use-admin-access';
import {
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Globe,
  Database,
  Mail,
  Wifi,
  Server,
  Monitor,
  Smartphone,
  Save,
  RefreshCw } from
'lucide-react';

interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    passwordExpiry: number;
    preventReuse: number;
  };
  accountSecurity: {
    maxFailedAttempts: number;
    lockoutDuration: number;
    requireEmailVerification: boolean;
    requireTwoFactor: boolean;
    sessionTimeout: number;
    allowMultipleSessions: boolean;
  };
  systemSecurity: {
    enableSSL: boolean;
    enableFirewall: boolean;
    enableIPWhitelist: boolean;
    ipWhitelist: string[];
    enableAuditLogging: boolean;
    enableDataEncryption: boolean;
    enableBackupEncryption: boolean;
  };
  accessControl: {
    enableRoleBasedAccess: boolean;
    requireApprovalForNewUsers: boolean;
    defaultUserRole: string;
    enableGuestAccess: boolean;
    maxConcurrentUsers: number;
  };
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'login_failure' | 'suspicious_activity' | 'security_breach' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user?: string;
  ip_address?: string;
  description: string;
  action_taken?: string;
}

const SecuritySettings: React.FC = () => {
  const { isAdmin } = useAdminAccess();
  const [settings, setSettings] = useState<SecuritySettings>({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      passwordExpiry: 90,
      preventReuse: 12
    },
    accountSecurity: {
      maxFailedAttempts: 5,
      lockoutDuration: 30,
      requireEmailVerification: true,
      requireTwoFactor: false,
      sessionTimeout: 60,
      allowMultipleSessions: false
    },
    systemSecurity: {
      enableSSL: true,
      enableFirewall: true,
      enableIPWhitelist: false,
      ipWhitelist: ['192.168.1.0/24'],
      enableAuditLogging: true,
      enableDataEncryption: true,
      enableBackupEncryption: true
    },
    accessControl: {
      enableRoleBasedAccess: true,
      requireApprovalForNewUsers: true,
      defaultUserRole: 'Employee',
      enableGuestAccess: false,
      maxConcurrentUsers: 50
    }
  });

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [newIPAddress, setNewIPAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const { toast } = useToast();

  // Batch selection hook for security events
  const batchSelection = useBatchSelection<SecurityEvent>();

  useEffect(() => {
    generateSampleSecurityEvents();
  }, []);

  const generateSampleSecurityEvents = () => {
    const events: SecurityEvent[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      type: 'login_failure',
      severity: 'medium',
      user: 'unknown',
      ip_address: '203.0.113.10',
      description: '5 consecutive failed login attempts',
      action_taken: 'IP temporarily blocked'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'suspicious_activity',
      severity: 'high',
      user: 'admin@dfsmanager.com',
      ip_address: '198.51.100.15',
      description: 'Login from unusual geographic location',
      action_taken: 'Email alert sent to user'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      type: 'policy_violation',
      severity: 'low',
      user: 'employee@dfsmanager.com',
      description: 'Password does not meet complexity requirements',
      action_taken: 'User prompted to update password'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: 'security_breach',
      severity: 'critical',
      description: 'Unauthorized API access attempt detected',
      action_taken: 'System locked, admin notified'
    }];


    setSecurityEvents(events);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Security settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save security settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addIPToWhitelist = () => {
    if (newIPAddress && !settings.systemSecurity.ipWhitelist.includes(newIPAddress)) {
      setSettings((prev) => ({
        ...prev,
        systemSecurity: {
          ...prev.systemSecurity,
          ipWhitelist: [...prev.systemSecurity.ipWhitelist, newIPAddress]
        }
      }));
      setNewIPAddress('');
      toast({
        title: "IP Added",
        description: "IP address added to whitelist"
      });
    }
  };

  const removeIPFromWhitelist = (ip: string) => {
    setSettings((prev) => ({
      ...prev,
      systemSecurity: {
        ...prev.systemSecurity,
        ipWhitelist: prev.systemSecurity.ipWhitelist.filter((item) => item !== ip)
      }
    }));
    toast({
      title: "IP Removed",
      description: "IP address removed from whitelist"
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':return 'bg-red-100 text-red-800';
      case 'high':return 'bg-orange-100 text-orange-800';
      case 'medium':return 'bg-yellow-100 text-yellow-800';
      case 'low':return 'bg-blue-100 text-blue-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  // Batch operations for security events
  const handleBatchDelete = () => {
    const selectedData = batchSelection.getSelectedData(securityEvents, (event) => event.id);
    if (selectedData.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select security events to delete",
        variant: "destructive"
      });
      return;
    }
    setIsBatchDeleteDialogOpen(true);
  };

  const confirmBatchDelete = async () => {
    setBatchActionLoading(true);
    try {
      const selectedData = batchSelection.getSelectedData(securityEvents, (event) => event.id);
      const selectedIds = selectedData.map((event) => event.id);

      // Filter out selected events
      const remainingEvents = securityEvents.filter((event) => !selectedIds.includes(event.id));
      setSecurityEvents(remainingEvents);

      toast({
        title: "Success",
        description: `Deleted ${selectedData.length} security events successfully`
      });

      setIsBatchDeleteDialogOpen(false);
      batchSelection.clearSelection();
    } catch (error) {
      console.error('Error in batch delete:', error);
      toast({
        title: "Error",
        description: `Failed to delete security events: ${error}`,
        variant: "destructive"
      });
    } finally {
      setBatchActionLoading(false);
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    const maxScore = 20;

    // Password policy checks
    if (settings.passwordPolicy.minLength >= 8) score++;
    if (settings.passwordPolicy.requireUppercase) score++;
    if (settings.passwordPolicy.requireNumbers) score++;
    if (settings.passwordPolicy.requireSpecialChars) score++;
    if (settings.passwordPolicy.passwordExpiry <= 90) score++;

    // Account security checks
    if (settings.accountSecurity.maxFailedAttempts <= 5) score++;
    if (settings.accountSecurity.requireEmailVerification) score++;
    if (settings.accountSecurity.requireTwoFactor) score += 2;
    if (settings.accountSecurity.sessionTimeout <= 60) score++;

    // System security checks
    if (settings.systemSecurity.enableSSL) score += 2;
    if (settings.systemSecurity.enableFirewall) score += 2;
    if (settings.systemSecurity.enableAuditLogging) score++;
    if (settings.systemSecurity.enableDataEncryption) score += 2;
    if (settings.systemSecurity.enableBackupEncryption) score++;

    // Access control checks
    if (settings.accessControl.enableRoleBasedAccess) score++;
    if (settings.accessControl.requireApprovalForNewUsers) score++;

    return Math.round(score / maxScore * 100);
  };

  const securityScore = getSecurityScore();

  // Check admin access first
  if (!isAdmin) {
    return (
      <AccessDenied
        feature="Security Settings"
        requiredRole="Administrator" />);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        </div>
        
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700">

          {isSaving ?
          <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </> :

          <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          }
        </Button>
      </div>

      {/* Security Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Security Score</h3>
              <p className="text-sm text-gray-600">Overall security posture assessment</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{securityScore}%</div>
              <div className="flex items-center space-x-1">
                {securityScore >= 80 ?
                <CheckCircle className="w-4 h-4 text-green-500" /> :
                securityScore >= 60 ?
                <AlertTriangle className="w-4 h-4 text-yellow-500" /> :

                <XCircle className="w-4 h-4 text-red-500" />
                }
                <span className="text-sm text-gray-600">
                  {securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Protections</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Security Events</p>
                <p className="text-2xl font-bold text-yellow-600">{securityEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-blue-600">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Failed Attempts</p>
                <p className="text-2xl font-bold text-purple-600">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Password Policy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minLength">Minimum Length</Label>
              <Input
                id="minLength"
                type="number"
                value={settings.passwordPolicy.minLength}
                onChange={(e) => setSettings((prev) => ({
                  ...prev,
                  passwordPolicy: {
                    ...prev.passwordPolicy,
                    minLength: parseInt(e.target.value) || 8
                  }
                }))} />

            </div>
            
            <div>
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                value={settings.passwordPolicy.passwordExpiry}
                onChange={(e) => setSettings((prev) => ({
                  ...prev,
                  passwordPolicy: {
                    ...prev.passwordPolicy,
                    passwordExpiry: parseInt(e.target.value) || 90
                  }
                }))} />

            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Require Uppercase</Label>
                <p className="text-sm text-gray-500">At least one uppercase letter</p>
              </div>
              <Switch
                checked={settings.passwordPolicy.requireUppercase}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  passwordPolicy: {
                    ...prev.passwordPolicy,
                    requireUppercase: checked
                  }
                }))} />

            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Require Numbers</Label>
                <p className="text-sm text-gray-500">At least one number</p>
              </div>
              <Switch
                checked={settings.passwordPolicy.requireNumbers}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  passwordPolicy: {
                    ...prev.passwordPolicy,
                    requireNumbers: checked
                  }
                }))} />

            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Require Special Characters</Label>
                <p className="text-sm text-gray-500">At least one special character</p>
              </div>
              <Switch
                checked={settings.passwordPolicy.requireSpecialChars}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  passwordPolicy: {
                    ...prev.passwordPolicy,
                    requireSpecialChars: checked
                  }
                }))} />

            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Require Lowercase</Label>
                <p className="text-sm text-gray-500">At least one lowercase letter</p>
              </div>
              <Switch
                checked={settings.passwordPolicy.requireLowercase}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  passwordPolicy: {
                    ...prev.passwordPolicy,
                    requireLowercase: checked
                  }
                }))} />

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Account Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxFailedAttempts">Max Failed Attempts</Label>
              <Input
                id="maxFailedAttempts"
                type="number"
                value={settings.accountSecurity.maxFailedAttempts}
                onChange={(e) => setSettings((prev) => ({
                  ...prev,
                  accountSecurity: {
                    ...prev.accountSecurity,
                    maxFailedAttempts: parseInt(e.target.value) || 5
                  }
                }))} />

            </div>
            
            <div>
              <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                value={settings.accountSecurity.lockoutDuration}
                onChange={(e) => setSettings((prev) => ({
                  ...prev,
                  accountSecurity: {
                    ...prev.accountSecurity,
                    lockoutDuration: parseInt(e.target.value) || 30
                  }
                }))} />

            </div>
            
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.accountSecurity.sessionTimeout}
                onChange={(e) => setSettings((prev) => ({
                  ...prev,
                  accountSecurity: {
                    ...prev.accountSecurity,
                    sessionTimeout: parseInt(e.target.value) || 60
                  }
                }))} />

            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Email Verification</Label>
                <p className="text-sm text-gray-500">Require email verification for new accounts</p>
              </div>
              <Switch
                checked={settings.accountSecurity.requireEmailVerification}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  accountSecurity: {
                    ...prev.accountSecurity,
                    requireEmailVerification: checked
                  }
                }))} />

            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Require 2FA for all users</p>
              </div>
              <Switch
                checked={settings.accountSecurity.requireTwoFactor}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  accountSecurity: {
                    ...prev.accountSecurity,
                    requireTwoFactor: checked
                  }
                }))} />

            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>System Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>SSL/TLS Encryption</Label>
                <p className="text-sm text-gray-500">Enable secure connections</p>
              </div>
              <Switch
                checked={settings.systemSecurity.enableSSL}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  systemSecurity: {
                    ...prev.systemSecurity,
                    enableSSL: checked
                  }
                }))} />

            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Firewall Protection</Label>
                <p className="text-sm text-gray-500">Enable network firewall</p>
              </div>
              <Switch
                checked={settings.systemSecurity.enableFirewall}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  systemSecurity: {
                    ...prev.systemSecurity,
                    enableFirewall: checked
                  }
                }))} />

            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Audit Logging</Label>
                <p className="text-sm text-gray-500">Log all system activities</p>
              </div>
              <Switch
                checked={settings.systemSecurity.enableAuditLogging}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  systemSecurity: {
                    ...prev.systemSecurity,
                    enableAuditLogging: checked
                  }
                }))} />

            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Data Encryption</Label>
                <p className="text-sm text-gray-500">Encrypt stored data</p>
              </div>
              <Switch
                checked={settings.systemSecurity.enableDataEncryption}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  systemSecurity: {
                    ...prev.systemSecurity,
                    enableDataEncryption: checked
                  }
                }))} />

            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Backup Encryption</Label>
                <p className="text-sm text-gray-500">Encrypt backup files</p>
              </div>
              <Switch
                checked={settings.systemSecurity.enableBackupEncryption}
                onCheckedChange={(checked) => setSettings((prev) => ({
                  ...prev,
                  systemSecurity: {
                    ...prev.systemSecurity,
                    enableBackupEncryption: checked
                  }
                }))} />

            </div>
          </div>
        </CardContent>
      </Card>

      {/* IP Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>IP Address Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable IP Whitelist</Label>
              <p className="text-sm text-gray-500">Only allow access from specified IP addresses</p>
            </div>
            <Switch
              checked={settings.systemSecurity.enableIPWhitelist}
              onCheckedChange={(checked) => setSettings((prev) => ({
                ...prev,
                systemSecurity: {
                  ...prev.systemSecurity,
                  enableIPWhitelist: checked
                }
              }))} />

          </div>
          
          {settings.systemSecurity.enableIPWhitelist &&
          <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                placeholder="Enter IP address or CIDR (e.g., 192.168.1.0/24)"
                value={newIPAddress}
                onChange={(e) => setNewIPAddress(e.target.value)} />

                <Button onClick={addIPToWhitelist}>Add</Button>
              </div>
              
              <div className="space-y-2">
                {settings.systemSecurity.ipWhitelist.map((ip, index) =>
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-mono text-sm">{ip}</span>
                    <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeIPFromWhitelist(ip)}
                  className="text-red-600">

                      Remove
                    </Button>
                  </div>
              )}
              </div>
            </div>
          }
        </CardContent>
      </Card>

      {/* Batch Action Bar for Security Events */}
      <BatchActionBar
        selectedCount={batchSelection.selectedCount}
        onBatchDelete={handleBatchDelete}
        onClearSelection={batchSelection.clearSelection}
        isLoading={batchActionLoading}
        showEdit={false} />


      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Recent Security Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={securityEvents.length > 0 && batchSelection.selectedCount === securityEvents.length}
                      onCheckedChange={() => batchSelection.toggleSelectAll(securityEvents, (event) => event.id)}
                      aria-label="Select all security events" />

                  </TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>User/IP</TableHead>
                  <TableHead>Action Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityEvents.map((event) =>
                <TableRow key={event.id} className={batchSelection.isSelected(event.id) ? "bg-blue-50" : ""}>
                    <TableCell>
                      <Checkbox
                      checked={batchSelection.isSelected(event.id)}
                      onCheckedChange={() => batchSelection.toggleItem(event.id)}
                      aria-label={`Select security event ${event.id}`} />

                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.type.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.description}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.user && <div>{event.user}</div>}
                      {event.ip_address && <div className="text-gray-500">{event.ip_address}</div>}
                    </TableCell>
                    <TableCell>{event.action_taken || 'No action taken'}</TableCell>
                  </TableRow>
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
        itemName="security events"
        selectedItems={batchSelection.getSelectedData(securityEvents, (event) => event.id).map((event) => ({
          id: event.id,
          name: `${event.type} - ${event.severity.toUpperCase()} - ${event.description.substring(0, 50)}...`
        }))} />

    </div>);

};

export default SecuritySettings;