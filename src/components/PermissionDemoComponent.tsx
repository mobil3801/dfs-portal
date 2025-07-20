import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePagePermissions } from '@/hooks/use-page-permissions';
import {
  Shield,
  Eye,
  Plus,
  Edit,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  Settings,
  MoreHorizontal,
  AlertTriangle,
  Database,
  Users } from
'lucide-react';

interface PermissionDemoProps {
  pageKey: string;
  pageName: string;
}

const PermissionDemoComponent: React.FC<PermissionDemoProps> = ({ pageKey, pageName }) => {
  const {
    permissions,
    userProfile,
    loading,
    hasPermission,
    checkPermissionAndNotify,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canPrint,
    canApprove,
    canBulkOperations,
    canAdvancedFeatures
  } = usePagePermissions(pageKey);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-pulse" />
            <p>Loading permissions...</p>
          </div>
        </CardContent>
      </Card>);

  }

  if (!canView) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>Access Denied</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    You don't have permission to view {pageName}. Contact your administrator for access.
                  </p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>);

  }

  const permissionItems = [
  { key: 'view', label: 'View', icon: Eye, color: 'text-blue-600', enabled: canView },
  { key: 'create', label: 'Create', icon: Plus, color: 'text-green-600', enabled: canCreate },
  { key: 'edit', label: 'Edit', icon: Edit, color: 'text-yellow-600', enabled: canEdit },
  { key: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-600', enabled: canDelete },
  { key: 'export', label: 'Export', icon: Download, color: 'text-purple-600', enabled: canExport },
  { key: 'print', label: 'Print', icon: Printer, color: 'text-indigo-600', enabled: canPrint },
  { key: 'approve', label: 'Approve', icon: CheckCircle2, color: 'text-green-700', enabled: canApprove },
  { key: 'bulk_operations', label: 'Bulk Ops', icon: MoreHorizontal, color: 'text-orange-600', enabled: canBulkOperations },
  { key: 'advanced_features', label: 'Advanced', icon: Settings, color: 'text-gray-700', enabled: canAdvancedFeatures }];


  return (
    <div className="space-y-6">
      {/* User Profile Info */}
      {userProfile &&
      <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Current User Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="font-medium">{userProfile.employee_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <Badge className="bg-blue-100 text-blue-800">{userProfile.role}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Station</p>
                <Badge className="bg-purple-100 text-purple-800">{userProfile.station}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={userProfile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {userProfile.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      }

      {/* Page Permissions Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Real-Time Permissions for {pageName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Permission Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {permissionItems.map((item) =>
            <div
              key={item.key}
              className={`p-3 border rounded-lg text-center ${
              item.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`
              }>
                <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.enabled ? item.color : 'text-gray-400'}`} />
                <p className={`text-xs font-medium ${item.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                  {item.label}
                </p>
                <Badge
                variant={item.enabled ? "default" : "secondary"}
                className={`mt-1 text-xs ${
                item.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`
                }>
                  {item.enabled ? 'Allowed' : 'Denied'}
                </Badge>
              </div>
            )}
          </div>

          {/* Action Buttons Demo */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Button Controls Demo</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <Button
                variant={canCreate ? "default" : "secondary"}
                disabled={!canCreate}
                onClick={() => checkPermissionAndNotify('create', 'create new records')}
                className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add New</span>
              </Button>

              <Button
                variant={canEdit ? "default" : "secondary"}
                disabled={!canEdit}
                onClick={() => checkPermissionAndNotify('edit', 'edit records')}
                className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Button>

              <Button
                variant={canDelete ? "destructive" : "secondary"}
                disabled={!canDelete}
                onClick={() => checkPermissionAndNotify('delete', 'delete records')}
                className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </Button>

              <Button
                variant={canExport ? "outline" : "secondary"}
                disabled={!canExport}
                onClick={() => checkPermissionAndNotify('export', 'export data')}
                className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>

              <Button
                variant={canPrint ? "outline" : "secondary"}
                disabled={!canPrint}
                onClick={() => checkPermissionAndNotify('print', 'print reports')}
                className="flex items-center space-x-2">
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </Button>

              <Button
                variant={canApprove ? "default" : "secondary"}
                disabled={!canApprove}
                onClick={() => checkPermissionAndNotify('approve', 'approve records')}
                className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve</span>
              </Button>

              <Button
                variant={canBulkOperations ? "outline" : "secondary"}
                disabled={!canBulkOperations}
                onClick={() => checkPermissionAndNotify('bulk_operations', 'perform bulk operations')}
                className="flex items-center space-x-2">
                <MoreHorizontal className="w-4 h-4" />
                <span>Bulk Ops</span>
              </Button>

              <Button
                variant={canAdvancedFeatures ? "outline" : "secondary"}
                disabled={!canAdvancedFeatures}
                onClick={() => checkPermissionAndNotify('advanced_features', 'access advanced features')}
                className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Advanced</span>
              </Button>
            </div>
          </div>

          {/* Permission Summary */}
          <Alert className="mt-6">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Real-Time Permission System Active</p>
                <p className="text-sm text-gray-600">
                  Permissions are loaded from the production database and control button visibility/functionality throughout the application.
                  Changes to user permissions are reflected immediately upon page refresh or navigation.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">
                    Page: {pageKey}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    User: {userProfile?.employee_id || 'N/A'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Role: {userProfile?.role || 'N/A'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Active Permissions: {permissionItems.filter((p) => p.enabled).length}/{permissionItems.length}
                  </Badge>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>);

};

export default PermissionDemoComponent;