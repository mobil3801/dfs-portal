import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3, Users, Package, FileText, Truck, Settings,
  DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Shield, Eye, Plus, Edit, Download, Bell, Zap, Calendar } from
'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedRoleAccess } from '@/hooks/use-enhanced-role-access';
import { useNavigate } from 'react-router-dom';

interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  value?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
  actionPath?: string;
  actionLabel?: string;
  requiredPermission?: string;
}

const RoleBasedDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const roleAccess = useEnhancedRoleAccess();
  const navigate = useNavigate();

  const getAdministratorWidgets = (): DashboardWidget[] => [
  {
    id: 'system-health',
    title: 'System Health',
    description: 'Overall system performance and monitoring',
    icon: <Zap className="h-6 w-6" />,
    value: '98.5%',
    change: '+2.1%',
    trend: 'up',
    color: 'bg-green-500',
    actionPath: '/admin/monitoring',
    actionLabel: 'View Details'
  },
  {
    id: 'user-management',
    title: 'Active Users',
    description: 'Total system users and access levels',
    icon: <Users className="h-6 w-6" />,
    value: '24',
    change: '+3',
    trend: 'up',
    color: 'bg-blue-500',
    actionPath: '/admin/user-management',
    actionLabel: 'Manage Users'
  },
  {
    id: 'security-alerts',
    title: 'Security Alerts',
    description: 'Active security notifications',
    icon: <Shield className="h-6 w-6" />,
    value: '2',
    change: '-1',
    trend: 'down',
    color: 'bg-yellow-500',
    actionPath: '/admin/security',
    actionLabel: 'Review Alerts'
  },
  {
    id: 'revenue-overview',
    title: 'Total Revenue',
    description: 'All stations combined revenue',
    icon: <DollarSign className="h-6 w-6" />,
    value: '$48,250',
    change: '+12.3%',
    trend: 'up',
    color: 'bg-green-600',
    actionPath: '/sales',
    actionLabel: 'View Reports'
  },
  {
    id: 'station-status',
    title: 'Station Status',
    description: 'Operational status across all stations',
    icon: <CheckCircle className="h-6 w-6" />,
    value: '3/3',
    change: 'All Online',
    trend: 'up',
    color: 'bg-green-500',
    actionPath: '/admin/site-management',
    actionLabel: 'Manage Stations'
  },
  {
    id: 'license-alerts',
    title: 'License Alerts',
    description: 'Expiring licenses and certificates',
    icon: <Bell className="h-6 w-6" />,
    value: '4',
    change: '2 expiring soon',
    trend: 'neutral',
    color: 'bg-orange-500',
    actionPath: '/licenses',
    actionLabel: 'Review Licenses'
  }];


  const getManagementWidgets = (): DashboardWidget[] => [
  {
    id: 'daily-sales',
    title: 'Today\'s Sales',
    description: 'Current day sales performance',
    icon: <DollarSign className="h-6 w-6" />,
    value: '$12,450',
    change: '+8.2%',
    trend: 'up',
    color: 'bg-green-500',
    actionPath: '/sales',
    actionLabel: 'View Details'
  },
  {
    id: 'employee-overview',
    title: 'Active Employees',
    description: 'Currently working staff',
    icon: <Users className="h-6 w-6" />,
    value: '12',
    change: '8 on duty',
    trend: 'neutral',
    color: 'bg-blue-500',
    actionPath: '/employees',
    actionLabel: 'Manage Staff'
  },
  {
    id: 'inventory-status',
    title: 'Inventory Alerts',
    description: 'Low stock and reorder notifications',
    icon: <Package className="h-6 w-6" />,
    value: '6',
    change: '3 critical',
    trend: 'neutral',
    color: 'bg-yellow-500',
    actionPath: '/inventory/alerts',
    actionLabel: 'Check Inventory'
  },
  {
    id: 'fuel-levels',
    title: 'Fuel Inventory',
    description: 'Current fuel tank levels',
    icon: <Truck className="h-6 w-6" />,
    value: '85%',
    change: 'Regular: 90%, Plus: 80%',
    trend: 'up',
    color: 'bg-blue-600',
    actionPath: '/inventory/gas-delivery',
    actionLabel: 'View Tanks'
  },
  {
    id: 'reports-pending',
    title: 'Pending Reports',
    description: 'Reports requiring review',
    icon: <FileText className="h-6 w-6" />,
    value: '3',
    change: '2 from yesterday',
    trend: 'neutral',
    color: 'bg-purple-500',
    actionPath: '/sales/reports',
    actionLabel: 'Review Reports'
  },
  {
    id: 'vendor-orders',
    title: 'Active Orders',
    description: 'Pending vendor deliveries',
    icon: <Calendar className="h-6 w-6" />,
    value: '8',
    change: '2 arriving today',
    trend: 'neutral',
    color: 'bg-indigo-500',
    actionPath: '/orders',
    actionLabel: 'Track Orders'
  }];


  const getEmployeeWidgets = (): DashboardWidget[] => [
  {
    id: 'my-tasks',
    title: 'My Tasks',
    description: 'Assigned tasks for today',
    icon: <CheckCircle className="h-6 w-6" />,
    value: '5',
    change: '2 completed',
    trend: 'up',
    color: 'bg-green-500'
  },
  {
    id: 'shift-sales',
    title: 'Shift Sales',
    description: 'Sales during my shift',
    icon: <DollarSign className="h-6 w-6" />,
    value: '$3,240',
    change: '+15.5%',
    trend: 'up',
    color: 'bg-blue-500',
    actionPath: '/sales/new',
    actionLabel: 'Add Sale'
  },
  {
    id: 'inventory-check',
    title: 'Inventory Items',
    description: 'Items to check or restock',
    icon: <Package className="h-6 w-6" />,
    value: '12',
    change: '3 low stock',
    trend: 'neutral',
    color: 'bg-yellow-500',
    actionPath: '/products',
    actionLabel: 'View Products'
  },
  {
    id: 'delivery-schedule',
    title: 'Deliveries Today',
    description: 'Expected deliveries for processing',
    icon: <Truck className="h-6 w-6" />,
    value: '2',
    change: '1 in progress',
    trend: 'neutral',
    color: 'bg-purple-500',
    actionPath: '/delivery',
    actionLabel: 'Track Deliveries'
  }];


  const getCurrentUserWidgets = (): DashboardWidget[] => {
    switch (roleAccess.userRole) {
      case 'Administrator':
        return getAdministratorWidgets();
      case 'Management':
        return getManagementWidgets();
      case 'Employee':
        return getEmployeeWidgets();
      default:
        return [];
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleWidgetAction = (actionPath?: string) => {
    if (actionPath) {
      navigate(actionPath);
    }
  };

  const widgets = getCurrentUserWidgets();

  if (!roleAccess.userRole) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please log in to access your personalized dashboard.
        </AlertDescription>
      </Alert>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {roleAccess.userRole} Dashboard
          </h2>
          <p className="text-gray-600">
            Welcome back! Here's your personalized overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${
          roleAccess.userRole === 'Administrator' ? 'bg-red-500' :
          roleAccess.userRole === 'Management' ? 'bg-blue-500' : 'bg-green-500'}`
          }>
            {roleAccess.userRole}
          </Badge>
          <Badge variant="outline">
            {roleAccess.stationAccess}
          </Badge>
        </div>
      </div>

      {/* Role-specific alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          {roleAccess.getRestrictedMessage('dashboard access')}
        </AlertDescription>
      </Alert>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) =>
        <Card key={widget.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${widget.color} text-white`}>
                  {widget.icon}
                </div>
                {widget.trend && getTrendIcon(widget.trend)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{widget.title}</h3>
                <p className="text-sm text-gray-600">{widget.description}</p>
                
                {widget.value &&
              <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{widget.value}</span>
                    {widget.change &&
                <span className={`text-sm ${
                widget.trend === 'up' ? 'text-green-600' :
                widget.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`
                }>
                        {widget.change}
                      </span>
                }
                  </div>
              }
                
                {widget.actionPath && widget.actionLabel &&
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => handleWidgetAction(widget.actionPath)}>

                    {widget.actionLabel}
                  </Button>
              }
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {roleAccess.hasFeatureAccess('sales', 'canCreate') &&
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate('/sales/new')}>

                <Plus className="h-4 w-4" />
                New Sale
              </Button>
            }
            
            {roleAccess.hasFeatureAccess('products', 'canView') &&
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate('/products')}>

                <Eye className="h-4 w-4" />
                View Products
              </Button>
            }
            
            {roleAccess.hasFeatureAccess('delivery', 'canCreate') &&
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate('/delivery/new')}>

                <Truck className="h-4 w-4" />
                Log Delivery
              </Button>
            }
            
            {roleAccess.hasFeatureAccess('sales', 'canExport') &&
            <Button
              variant="outline"
              className="flex items-center gap-2">

                <Download className="h-4 w-4" />
                Export Reports
              </Button>
            }
          </div>
        </CardContent>
      </Card>

      {/* Access Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Your Access Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {roleAccess.hasFeatureAccess('dashboard', 'canView') ? '✓' : '✗'}
              </div>
              <div className="text-sm">Dashboard</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {roleAccess.canAccessAdminArea ? '✓' : '✗'}
              </div>
              <div className="text-sm">Admin Area</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {roleAccess.canAccessMonitoringArea ? '✓' : '✗'}
              </div>
              <div className="text-sm">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {roleAccess.canManageOtherUsers ? '✓' : '✗'}
              </div>
              <div className="text-sm">User Management</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default RoleBasedDashboard;