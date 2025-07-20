import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, Users, Package, FileText, Truck, Settings,
  DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Shield, Eye, Plus, Edit, Download, Bell, Zap, Calendar,
  Rocket, Target, Info, ChevronRight, X } from
'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedRoleAccess } from '@/hooks/use-enhanced-role-access';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SetupGuidance from '@/components/SetupGuidance';
import QuickStartGuide from '@/components/QuickStartGuide';

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

interface SystemStatus {
  setupProgress: number;
  criticalAlerts: number;
  pendingTasks: number;
  systemHealth: number;
}

const EnhancedDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const roleAccess = useEnhancedRoleAccess();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSetupGuide, setShowSetupGuide] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    setupProgress: 0,
    criticalAlerts: 0,
    pendingTasks: 0,
    systemHealth: 98.5
  });

  // Real-time data states
  const [realTimeData, setRealTimeData] = useState({
    userCount: 0,
    employeeCount: 0,
    totalRevenue: 0,
    stationCount: 0,
    todaySales: 0,
    activeEmployees: 0,
    lowStockItems: 0,
    activeOrders: 0,
    myShiftSales: 0,
    inventoryItems: 0,
    todayDeliveries: 0
  });

  useEffect(() => {
    checkSystemStatus();
    fetchRealTimeData();
  }, []);

  const fetchRealTimeData = async () => {
    try {
      console.log('Fetching real-time dashboard data...');

      // Fetch all data in parallel
      const [userData, empData, stationData, salesData, orderData, prodData, deliveryData] = await Promise.all([
      window.ezsite.apis.tablePage(11725, { PageNo: 1, PageSize: 1, Filters: [] }),
      window.ezsite.apis.tablePage(11727, { PageNo: 1, PageSize: 1, Filters: [] }),
      window.ezsite.apis.tablePage(12599, { PageNo: 1, PageSize: 100, Filters: [] }),
      window.ezsite.apis.tablePage(12356, { PageNo: 1, PageSize: 100, OrderByField: "report_date", IsAsc: false, Filters: [] }),
      window.ezsite.apis.tablePage(11730, { PageNo: 1, PageSize: 1, Filters: [{ name: "status", op: "Equal", value: "Pending" }] }),
      window.ezsite.apis.tablePage(11726, { PageNo: 1, PageSize: 100, Filters: [] }),
      window.ezsite.apis.tablePage(12196, { PageNo: 1, PageSize: 1, Filters: [] })]
      );

      // Calculate values
      const userCount = userData.data?.VirtualCount || 0;
      const employeeCount = empData.data?.VirtualCount || 0;
      const stationCount = stationData.data?.VirtualCount || 0;
      const activeOrders = orderData.data?.VirtualCount || 0;
      const inventoryItems = prodData.data?.VirtualCount || 0;
      const todayDeliveries = deliveryData.data?.VirtualCount || 0;

      // Calculate revenue
      let totalRevenue = 0;
      let todaySales = 0;
      if (salesData.data?.List) {
        totalRevenue = salesData.data.List.reduce((sum: number, report: any) => {
          return sum + (report.total_sales || 0);
        }, 0);

        // Today's sales
        const today = new Date().toISOString().split('T')[0];
        const todayReports = salesData.data.List.filter((report: any) =>
        report.report_date?.includes(today)
        );
        todaySales = todayReports.reduce((sum: number, report: any) => {
          return sum + (report.total_sales || 0);
        }, 0);
      }

      // Calculate low stock items
      let lowStockItems = 0;
      if (prodData.data?.List) {
        lowStockItems = prodData.data.List.filter((product: any) =>
        product.quantity_in_stock <= product.minimum_stock && product.minimum_stock > 0
        ).length;
      }

      // Active employees (assume all are active if not specified)
      const activeEmployees = employeeCount;
      const myShiftSales = todaySales; // For employee view

      setRealTimeData({
        userCount,
        employeeCount,
        totalRevenue,
        stationCount,
        todaySales,
        activeEmployees,
        lowStockItems,
        activeOrders,
        myShiftSales,
        inventoryItems,
        todayDeliveries
      });

      console.log('Real-time dashboard data loaded successfully');
    } catch (error) {
      console.error('Error fetching real-time dashboard data:', error);
    }
  };

  const checkSystemStatus = async () => {
    try {
      // Check if basic setup is completed
      const setupChecks = await Promise.all([
      checkAdminUsers(),
      checkStationsSetup(),
      checkSMSConfig(),
      checkLicensesSetup()]
      );

      const completedTasks = setupChecks.filter(Boolean).length;
      const setupProgress = Math.round(completedTasks / setupChecks.length * 100);

      // Check for critical alerts
      const criticalAlerts = await checkCriticalAlerts();

      // Check pending tasks
      const pendingTasks = await checkPendingTasks();

      setSystemStatus({
        setupProgress,
        criticalAlerts,
        pendingTasks,
        systemHealth: 98.5 // Mock value
      });

      // Auto-hide setup guide if setup is mostly complete
      if (setupProgress >= 80) {
        setShowSetupGuide(false);
      }
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  };

  const checkAdminUsers = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(11725, {
        "PageNo": 1,
        "PageSize": 1,
        "Filters": [{ "name": "role", "op": "Equal", "value": "Administrator" }]
      });
      return !error && data?.List?.length > 0;
    } catch {
      return false;
    }
  };

  const checkStationsSetup = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12599, {
        "PageNo": 1,
        "PageSize": 5
      });
      return !error && data?.List?.length >= 3;
    } catch {
      return false;
    }
  };

  const checkSMSConfig = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12640, {
        "PageNo": 1,
        "PageSize": 1,
        "Filters": [{ "name": "is_active", "op": "Equal", "value": true }]
      });
      return !error && data?.List?.length > 0;
    } catch {
      return false;
    }
  };

  const checkLicensesSetup = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(11731, {
        "PageNo": 1,
        "PageSize": 1
      });
      return !error && data?.List?.length > 0;
    } catch {
      return false;
    }
  };

  const checkCriticalAlerts = async () => {
    try {
      // Check for expiring licenses
      const { data, error } = await window.ezsite.apis.tablePage(11731, {
        "PageNo": 1,
        "PageSize": 10,
        "Filters": [{ "name": "status", "op": "Equal", "value": "Active" }]
      });

      if (error) return 0;

      const currentDate = new Date();
      const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      let expiringCount = 0;
      data?.List?.forEach((license: any) => {
        const expiryDate = new Date(license.expiry_date);
        if (expiryDate <= thirtyDaysFromNow) {
          expiringCount++;
        }
      });

      return expiringCount;
    } catch {
      return 0;
    }
  };

  const checkPendingTasks = async () => {
    try {
      // Check for pending sales reports
      const { data, error } = await window.ezsite.apis.tablePage(12356, {
        "PageNo": 1,
        "PageSize": 10,
        "OrderByField": "report_date",
        "IsAsc": false
      });

      if (error) return 0;

      // Count reports from today that might need review
      const today = new Date().toISOString().split('T')[0];
      const todayReports = data?.List?.filter((report: any) =>
      report.report_date?.includes(today)
      ) || [];

      return Math.max(0, 3 - todayReports.length); // Mock pending tasks
    } catch {
      return 0;
    }
  };

  // Widget definitions remain the same as RoleBasedDashboard
  const getAdministratorWidgets = (): DashboardWidget[] => [
  {
    id: 'system-health',
    title: 'System Health',
    description: 'Overall system performance and monitoring',
    icon: <Zap className="h-6 w-6" />,
    value: `${systemStatus.systemHealth}%`,
    change: 'Operational',
    trend: 'up',
    color: 'bg-green-500',
    actionPath: '/admin/database-monitoring',
    actionLabel: 'View Details'
  },
  {
    id: 'setup-progress',
    title: 'Setup Progress',
    description: 'Initial system configuration completion',
    icon: <Target className="h-6 w-6" />,
    value: `${systemStatus.setupProgress}%`,
    change: systemStatus.setupProgress === 100 ? 'Complete' : 'In Progress',
    trend: systemStatus.setupProgress === 100 ? 'up' : 'neutral',
    color: systemStatus.setupProgress === 100 ? 'bg-green-500' : 'bg-blue-500',
    actionPath: '/dashboard?tab=setup',
    actionLabel: 'Continue Setup'
  },
  {
    id: 'critical-alerts',
    title: 'Critical Alerts',
    description: 'Licenses expiring and urgent notifications',
    icon: <AlertTriangle className="h-6 w-6" />,
    value: systemStatus.criticalAlerts.toString(),
    change: systemStatus.criticalAlerts > 0 ? 'Needs attention' : 'All clear',
    trend: systemStatus.criticalAlerts > 0 ? 'down' : 'up',
    color: systemStatus.criticalAlerts > 0 ? 'bg-red-500' : 'bg-green-500',
    actionPath: '/licenses',
    actionLabel: 'Review Alerts'
  },
  {
    id: 'user-management',
    title: 'Active Users',
    description: 'Total system users and access levels',
    icon: <Users className="h-6 w-6" />,
    value: realTimeData.userCount.toString(),
    change: `${realTimeData.employeeCount} employees`,
    trend: 'up',
    color: 'bg-blue-500',
    actionPath: '/admin/user-management',
    actionLabel: 'Manage Users'
  },
  {
    id: 'revenue-overview',
    title: 'Total Revenue',
    description: 'All stations combined revenue',
    icon: <DollarSign className="h-6 w-6" />,
    value: `$${realTimeData.totalRevenue.toLocaleString()}`,
    change: 'From sales reports',
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
    value: `${realTimeData.stationCount}/3`,
    change: realTimeData.stationCount === 3 ? 'All Online' : 'Setup Required',
    trend: realTimeData.stationCount === 3 ? 'up' : 'neutral',
    color: realTimeData.stationCount === 3 ? 'bg-green-500' : 'bg-yellow-500',
    actionPath: '/admin/site-management',
    actionLabel: 'Manage Stations'
  }];



  const getManagementWidgets = (): DashboardWidget[] => [
  {
    id: 'daily-sales',
    title: 'Today\'s Sales',
    description: 'Current day sales performance',
    icon: <DollarSign className="h-6 w-6" />,
    value: `$${realTimeData.todaySales.toLocaleString()}`,
    change: 'Today\'s total',
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
    value: realTimeData.activeEmployees.toString(),
    change: 'On duty',
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
    value: realTimeData.lowStockItems.toString(),
    change: realTimeData.lowStockItems > 0 ? 'Need restocking' : 'All stocked',
    trend: realTimeData.lowStockItems > 0 ? 'down' : 'up',
    color: realTimeData.lowStockItems > 0 ? 'bg-red-500' : 'bg-green-500',
    actionPath: '/inventory/alerts',
    actionLabel: 'Check Inventory'
  },
  {
    id: 'fuel-levels',
    title: 'Fuel Inventory',
    description: 'Current fuel tank levels',
    icon: <Truck className="h-6 w-6" />,
    value: 'Monitor',
    change: 'Check tank levels',
    trend: 'neutral',
    color: 'bg-blue-600',
    actionPath: '/inventory/gas-delivery',
    actionLabel: 'View Tanks'
  },
  {
    id: 'reports-pending',
    title: 'Pending Reports',
    description: 'Reports requiring review',
    icon: <FileText className="h-6 w-6" />,
    value: systemStatus.pendingTasks.toString(),
    change: `${systemStatus.pendingTasks} from today`,
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
    value: realTimeData.activeOrders.toString(),
    change: 'Pending delivery',
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
    value: 'Ready',
    change: 'All systems operational',
    trend: 'up',
    color: 'bg-green-500'
  },
  {
    id: 'shift-sales',
    title: 'Shift Sales',
    description: 'Sales during my shift',
    icon: <DollarSign className="h-6 w-6" />,
    value: `$${realTimeData.myShiftSales.toLocaleString()}`,
    change: 'Current shift',
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
    value: realTimeData.inventoryItems.toString(),
    change: 'Total products',
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
    value: realTimeData.todayDeliveries.toString(),
    change: realTimeData.todayDeliveries > 0 ? 'In progress' : 'None scheduled',
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
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to DFS Manager Portal
          </h1>
          <p className="text-gray-600 mt-1">
            {roleAccess.userRole} Dashboard • {roleAccess.stationAccess}
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

      {/* Setup Progress Alert for Administrators */}
      {roleAccess.userRole === 'Administrator' && systemStatus.setupProgress < 100 && showSetupGuide &&
      <Alert className="border-blue-500 bg-blue-50">
          <Rocket className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Complete your setup:</strong> You're {systemStatus.setupProgress}% done with initial configuration. 
              <Button
              variant="link"
              className="p-0 h-auto font-semibold text-blue-600 ml-1"
              onClick={() => setActiveTab('setup')}>

                Continue setup →
              </Button>
            </div>
            <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSetupGuide(false)}>

              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      }

      {/* Critical Alerts */}
      {systemStatus.criticalAlerts > 0 &&
      <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Attention Required:</strong> {systemStatus.criticalAlerts} license(s) expiring within 30 days. 
            <Button
            variant="link"
            className="p-0 h-auto font-semibold text-red-600 ml-1"
            onClick={() => navigate('/licenses')}>

              Review licenses →
            </Button>
          </AlertDescription>
        </Alert>
      }

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Health</p>
                    <p className="text-2xl font-bold text-green-600">{systemStatus.systemHealth}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Setup Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{systemStatus.setupProgress}%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                    <p className="text-2xl font-bold text-red-600">{systemStatus.criticalAlerts}</p>
                  </div>
                  <Bell className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                    <p className="text-2xl font-bold text-purple-600">{systemStatus.pendingTasks}</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Widgets Grid */}
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
        </TabsContent>

        <TabsContent value="quickstart">
          <QuickStartGuide />
        </TabsContent>

        <TabsContent value="setup">
          <SetupGuidance />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              Advanced analytics and reporting features will be available here. 
              Complete the basic setup first to unlock full analytics capabilities.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon: Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Analytics Dashboard
                </h3>
                <p className="text-gray-500 mb-4">
                  Comprehensive reporting and analytics will be available once you complete the initial setup.
                </p>
                <Button onClick={() => setActiveTab('setup')}>
                  Complete Setup First
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default EnhancedDashboard;