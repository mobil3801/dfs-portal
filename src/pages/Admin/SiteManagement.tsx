import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useBatchSelection } from '@/hooks/use-batch-selection';
import BatchActionBar from '@/components/BatchActionBar';
import BatchDeleteDialog from '@/components/BatchDeleteDialog';
import BatchEditDialog from '@/components/BatchEditDialog';
import StationEditDialog from '@/components/StationEditDialog';
import StationFormDialog from '@/components/StationFormDialog';
import AccessDenied from '@/components/AccessDenied';
import useAdminAccess from '@/hooks/use-admin-access';
import { stationService } from '@/services/stationService';
import {
  Settings,
  Database,
  Shield,
  Mail,
  Bell,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Building2,
  MapPin,
  Phone,
  Calendar,
  Edit,
  Plus,
  Trash2 } from
'lucide-react';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  enableRegistration: boolean;
  enableNotifications: boolean;
  enableMaintenance: boolean;
  maintenanceMessage: string;
  emailFromAddress: string;
  emailFromName: string;
  maxFileSize: number;
  allowedFileTypes: string;
  sessionTimeout: number;
  passwordMinLength: number;
  requirePasswordComplexity: boolean;
  enableTwoFactor: boolean;
  backupFrequency: string;
  logRetentionDays: number;
}

interface Station {
  id: number;
  station_name: string;
  address: string;
  phone: string;
  operating_hours: string;
  manager_name: string;
  status: string;
  last_updated: string;
  created_by: number;
}

const SiteManagement: React.FC = () => {
  const { isAdmin } = useAdminAccess();
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'DFS Manager Portal',
    siteDescription: 'Comprehensive gas station management system',
    enableRegistration: false,
    enableNotifications: true,
    enableMaintenance: false,
    maintenanceMessage: 'System is under maintenance. Please check back later.',
    emailFromAddress: 'support@ezsite.ai',
    emailFromName: 'DFS Manager Support',
    maxFileSize: 10,
    allowedFileTypes: 'jpg,jpeg,png,pdf,doc,docx,xls,xlsx',
    sessionTimeout: 30,
    passwordMinLength: 8,
    requirePasswordComplexity: true,
    enableTwoFactor: false,
    backupFrequency: 'daily',
    logRetentionDays: 30
  });

  const [stations, setStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stationFormDialogOpen, setStationFormDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [isBatchEditDialogOpen, setIsBatchEditDialogOpen] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  const [showApiKeys, setShowApiKeys] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Batch selection hook
  const batchSelection = useBatchSelection<Station>();

  // Batch edit form data
  const [batchEditData, setBatchEditData] = useState({
    status: '',
    manager_name: '',
    operating_hours: ''
  });

  // Load stations from centralized service
  const loadStations = async () => {
    try {
      console.log('Loading stations from centralized service...');
      const { data, error } = await window.ezsite.apis.tablePage(12599, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'station_name',
        IsAsc: true,
        Filters: []
      });

      if (error) throw error;

      console.log('Loaded stations:', data);
      setStations(data?.List || []);
    } catch (error) {
      console.error('Error loading stations:', error);
      toast({
        title: "Error",
        description: "Failed to load station information",
        variant: "destructive"
      });
    } finally {
      setLoadingStations(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const handleEditStation = (station: Station) => {
    console.log('Editing station:', station);
    setEditingStation(station);
    setDialogMode('edit');
    setStationFormDialogOpen(true);
  };

  const handleStationSaved = () => {
    // Clear the centralized station cache when stations are updated
    stationService.clearCache();
    loadStations();
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Site settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const { error } = await window.ezsite.apis.sendEmail({
        from: `${settings.emailFromName} <${settings.emailFromAddress}>`,
        to: [settings.emailFromAddress],
        subject: 'DFS Manager - Email Configuration Test',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <p><strong>Site:</strong> ${settings.siteName}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p>If you received this email, your configuration is working properly.</p>
        `
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the test email"
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (isEnabled: boolean) => {
    return isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Batch operations
  const handleBatchEdit = () => {
    const selectedData = batchSelection.getSelectedData(stations, (station) => station.id);
    if (selectedData.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select stations to edit",
        variant: "destructive"
      });
      return;
    }
    setIsBatchEditDialogOpen(true);
  };

  const handleBatchDelete = () => {
    const selectedData = batchSelection.getSelectedData(stations, (station) => station.id);
    if (selectedData.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select stations to delete",
        variant: "destructive"
      });
      return;
    }
    setIsBatchDeleteDialogOpen(true);
  };

  const confirmBatchEdit = async () => {
    setBatchActionLoading(true);
    try {
      const selectedData = batchSelection.getSelectedData(stations, (station) => station.id);
      const updates = selectedData.map((station) => ({
        id: station.id,
        ...(batchEditData.status && { status: batchEditData.status }),
        ...(batchEditData.manager_name && { manager_name: batchEditData.manager_name }),
        ...(batchEditData.operating_hours && { operating_hours: batchEditData.operating_hours }),
        last_updated: new Date().toISOString()
      }));

      for (const update of updates) {
        const { error } = await window.ezsite.apis.tableUpdate(12599, update);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Updated ${selectedData.length} stations successfully`
      });

      setIsBatchEditDialogOpen(false);
      batchSelection.clearSelection();
      // Clear the centralized station cache when stations are updated
      stationService.clearCache();
      loadStations();
    } catch (error) {
      console.error('Error in batch edit:', error);
      toast({
        title: "Error",
        description: `Failed to update stations: ${error}`,
        variant: "destructive"
      });
    } finally {
      setBatchActionLoading(false);
    }
  };

  const confirmBatchDelete = async () => {
    setBatchActionLoading(true);
    try {
      const selectedData = batchSelection.getSelectedData(stations, (station) => station.id);

      for (const station of selectedData) {
        const { error } = await window.ezsite.apis.tableDelete(12599, { id: station.id });
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Deleted ${selectedData.length} stations successfully`
      });

      setIsBatchDeleteDialogOpen(false);
      batchSelection.clearSelection();
      // Clear the centralized station cache when stations are deleted
      stationService.clearCache();
      loadStations();
    } catch (error) {
      console.error('Error in batch delete:', error);
      toast({
        title: "Error",
        description: `Failed to delete stations: ${error}`,
        variant: "destructive"
      });
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Check admin access first
  if (!isAdmin) {
    return (
      <AccessDenied
        feature="Site Management"
        requiredRole="Administrator" />);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Site Management</h1>
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

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">System Status</p>
                <p className="text-lg font-semibold text-green-600">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <p className="text-lg font-semibold text-blue-600">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Email Service</p>
                <p className="text-lg font-semibold text-purple-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Security</p>
                <p className="text-lg font-semibold text-orange-600">Protected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Action Bar for Stations */}
      <BatchActionBar
        selectedCount={batchSelection.selectedCount}
        onBatchEdit={handleBatchEdit}
        onBatchDelete={handleBatchDelete}
        onClearSelection={batchSelection.clearSelection}
        isLoading={batchActionLoading} />


      {/* Station Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Station Information</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setEditingStation(null);
                  setDialogMode('add');
                  setStationFormDialogOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm">

                <Plus className="w-4 h-4 mr-2" />
                Add Station
              </Button>
              {stations.length === 0 &&
              <Button
                onClick={() => window.open('/dashboard?tab=setup', '_blank')}
                variant="outline"
                size="sm">

                  <Settings className="w-4 h-4 mr-2" />
                  Setup Guide
                </Button>
              }
              {stations.length > 0 &&
              <Checkbox
                checked={stations.length > 0 && batchSelection.selectedCount === stations.length}
                onCheckedChange={() => batchSelection.toggleSelectAll(stations, (station) => station.id)}
                aria-label="Select all stations" />

              }
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStations ?
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) =>
            <Card key={i} className="border animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            )}
            </div> : stations.length === 0 ?
          <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Stations Configured
              </h3>
              <p className="text-gray-500 mb-4">
                Set up your gas stations (MOBIL, AMOCO ROSEDALE, AMOCO BROOKLYN) to get started.
              </p>
              <Button
              onClick={() => window.open('/dashboard?tab=setup', '_blank')}
              className="bg-blue-600 hover:bg-blue-700">

                <Settings className="w-4 h-4 mr-2" />
                Go to Setup Guide
              </Button>
            </div> :

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stations.map((station, index) =>
            <Card key={station.id || index} className={`border ${batchSelection.isSelected(station.id) ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                        checked={batchSelection.isSelected(station.id)}
                        onCheckedChange={() => batchSelection.toggleItem(station.id)}
                        aria-label={`Select station ${station.station_name}`} />

                          <h3 className="font-semibold text-lg">{station.station_name}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${
                      station.status === 'Active' ?
                      'bg-green-100 text-green-800' :
                      station.status === 'Inactive' ?
                      'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}`
                      }>
                            {station.status}
                          </Badge>
                          <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditStation(station)}
                        className="h-8 w-8 p-0">

                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${station.station_name}"?`)) {
                            (async () => {
                              try {
                                const { error } = await window.ezsite.apis.tableDelete(12599, { id: station.id });
                                if (error) throw error;

                                toast({
                                  title: "Success",
                                  description: "Station deleted successfully"
                                });

                                // Clear the centralized station cache when stations are deleted
                                stationService.clearCache();
                                loadStations();
                              } catch (error) {
                                console.error('Error deleting station:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to delete station",
                                  variant: "destructive"
                                });
                              }
                            })();
                          }
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">

                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <span className="text-sm text-gray-600">{station.address}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{station.phone}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{station.operating_hours}</span>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium">Manager: {station.manager_name}</p>
                          <p className="text-xs text-gray-500">
                            Updated: {new Date(station.last_updated).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            )}
            </div>
          }
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>General Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />

            </div>
            
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} />

            </div>
          </div>
          
          <div>
            <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
            <Textarea
              id="maintenanceMessage"
              value={settings.maintenanceMessage}
              onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
              rows={3} />

          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>User Registration</Label>
                <p className="text-sm text-gray-500">Allow new user registration</p>
              </div>
              <Switch
                checked={settings.enableRegistration}
                onCheckedChange={(checked) => setSettings({ ...settings, enableRegistration: checked })} />

            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Notifications</Label>
                <p className="text-sm text-gray-500">Enable system notifications</p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, enableNotifications: checked })} />

            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Put site in maintenance</p>
              </div>
              <Switch
                checked={settings.enableMaintenance}
                onCheckedChange={(checked) => setSettings({ ...settings, enableMaintenance: checked })} />

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Email Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emailFromName">From Name</Label>
              <Input
                id="emailFromName"
                value={settings.emailFromName}
                onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })} />

            </div>
            
            <div>
              <Label htmlFor="emailFromAddress">From Address</Label>
              <Input
                id="emailFromAddress"
                type="email"
                value={settings.emailFromAddress}
                onChange={(e) => setSettings({ ...settings, emailFromAddress: e.target.value })} />

            </div>
          </div>
          
          <Button onClick={handleTestEmail} variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Send Test Email
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })} />

            </div>
            
            <div>
              <Label htmlFor="passwordMinLength">Password Min Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) || 8 })} />

            </div>
            
            <div>
              <Label htmlFor="logRetentionDays">Log Retention (days)</Label>
              <Input
                id="logRetentionDays"
                type="number"
                value={settings.logRetentionDays}
                onChange={(e) => setSettings({ ...settings, logRetentionDays: parseInt(e.target.value) || 30 })} />

            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Password Complexity</Label>
                <p className="text-sm text-gray-500">Require complex passwords</p>
              </div>
              <Switch
                checked={settings.requirePasswordComplexity}
                onCheckedChange={(checked) => setSettings({ ...settings, requirePasswordComplexity: checked })} />

            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Enable 2FA for all users</p>
              </div>
              <Switch
                checked={settings.enableTwoFactor}
                onCheckedChange={(checked) => setSettings({ ...settings, enableTwoFactor: checked })} />

            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>File Upload Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) || 10 })} />

            </div>
            
            <div>
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                value={settings.allowedFileTypes}
                onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
                placeholder="jpg,png,pdf,doc" />

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>Current Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Registration</p>
              <Badge className={getStatusColor(settings.enableRegistration)}>
                {settings.enableRegistration ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Notifications</p>
              <Badge className={getStatusColor(settings.enableNotifications)}>
                {settings.enableNotifications ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Maintenance</p>
              <Badge className={getStatusColor(settings.enableMaintenance)}>
                {settings.enableMaintenance ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Two-Factor</p>
              <Badge className={getStatusColor(settings.enableTwoFactor)}>
                {settings.enableTwoFactor ? 'Required' : 'Optional'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Station Form Dialog */}
      <StationFormDialog
        open={stationFormDialogOpen}
        onOpenChange={setStationFormDialogOpen}
        station={editingStation}
        onSave={handleStationSaved}
        mode={dialogMode} />


      {/* Station Edit Dialog */}
      <StationEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        station={editingStation}
        onSave={handleStationSaved} />

      {/* Batch Edit Dialog */}
      <BatchEditDialog
        isOpen={isBatchEditDialogOpen}
        onClose={() => setIsBatchEditDialogOpen(false)}
        onSave={confirmBatchEdit}
        selectedCount={batchSelection.selectedCount}
        isLoading={batchActionLoading}
        itemName="stations">

        <div className="space-y-4">
          <div>
            <Label htmlFor="batch_status">Status</Label>
            <select
              id="batch_status"
              value={batchEditData.status}
              onChange={(e) => setBatchEditData({ ...batchEditData, status: e.target.value })}
              className="w-full p-2 border rounded-md">

              <option value="">Keep existing status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <Label htmlFor="batch_manager">Manager Name</Label>
            <Input
              id="batch_manager"
              value={batchEditData.manager_name}
              onChange={(e) => setBatchEditData({ ...batchEditData, manager_name: e.target.value })}
              placeholder="Leave empty to keep existing managers" />

          </div>
          <div>
            <Label htmlFor="batch_hours">Operating Hours</Label>
            <Input
              id="batch_hours"
              value={batchEditData.operating_hours}
              onChange={(e) => setBatchEditData({ ...batchEditData, operating_hours: e.target.value })}
              placeholder="Leave empty to keep existing hours" />

          </div>
        </div>
      </BatchEditDialog>

      {/* Batch Delete Dialog */}
      <BatchDeleteDialog
        isOpen={isBatchDeleteDialogOpen}
        onClose={() => setIsBatchDeleteDialogOpen(false)}
        onConfirm={confirmBatchDelete}
        selectedCount={batchSelection.selectedCount}
        isLoading={batchActionLoading}
        itemName="stations"
        selectedItems={batchSelection.getSelectedData(stations, (station) => station.id).map((station) => ({
          id: station.id,
          name: station.station_name
        }))} />


    </div>);

};

export default SiteManagement;