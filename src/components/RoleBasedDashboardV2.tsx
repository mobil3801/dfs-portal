import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3, Users, Package, FileText, Truck, Settings,
  DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Shield, Eye, Plus, Edit, Download, Bell, Zap, Calendar,
  Rocket, Target, Info, ChevronRight, X, RefreshCw,
  Building2, Gas, Receipt, CreditCard, Banknote, Fuel } from
'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedRoleAccess } from '@/hooks/use-enhanced-role-access';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import VisualEditToolbar from '@/components/VisualEditToolbar';

interface RealTimeData {
  employeeCount: number;
  stationCount: number;
  totalRevenue: number;
  todaySales: number;
  thisMonthSales: number;
  lowStockItems: number;
  activeOrders: number;
  expiringLicenses: number;
  myShiftSales: number;
  myStationSales: number;
  fuelGallonsToday: number;
  convenienceSalesToday: number;
  creditCardSales: number;
  cashSales: number;
  pendingReports: number;
  lastUpdated: Date;
}

interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
  actionPath?: string;
  actionLabel?: string;
  priority: 'high' | 'medium' | 'low';
}

const RoleBasedDashboardV2: React.FC = () => {
  const { userProfile } = useAuth();
  const roleAccess = useEnhancedRoleAccess();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    employeeCount: 0,
    stationCount: 0,
    totalRevenue: 0,
    todaySales: 0,
    thisMonthSales: 0,
    lowStockItems: 0,
    activeOrders: 0,
    expiringLicenses: 0,
    myShiftSales: 0,
    myStationSales: 0,
    fuelGallonsToday: 0,
    convenienceSalesToday: 0,
    creditCardSales: 0,
    cashSales: 0,
    pendingReports: 0,
    lastUpdated: new Date()
  });

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time data fetching
  const fetchRealTimeData = useCallback(async () => {
    try {
      console.log('🔄 Fetching real-time dashboard data...');

      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);
      const currentUser = userProfile?.station || '';

      // Fetch data from multiple tables in parallel
      const [
      employeesData,
      stationsData,
      salesData,
      todaySalesData,
      monthSalesData,
      productsData,
      ordersData,
      licensesData,
      userStationSalesData] =
      await Promise.all([
      // Employees count
      window.ezsite.apis.tablePage(11727, {
        PageNo: 1, PageSize: 1,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      }),
      // Stations count
      window.ezsite.apis.tablePage(12599, {
        PageNo: 1, PageSize: 10
      }),
      // All sales data
      window.ezsite.apis.tablePage(12356, {
        PageNo: 1, PageSize: 100,
        OrderByField: 'report_date', IsAsc: false
      }),
      // Today's sales
      window.ezsite.apis.tablePage(12356, {
        PageNo: 1, PageSize: 50,
        Filters: [{ name: 'report_date', op: 'StringContains', value: today }]
      }),
      // This month's sales
      window.ezsite.apis.tablePage(12356, {
        PageNo: 1, PageSize: 100,
        Filters: [{ name: 'report_date', op: 'StringContains', value: thisMonth }]
      }),
      // Products for inventory
      window.ezsite.apis.tablePage(11726, {
        PageNo: 1, PageSize: 200
      }),
      // Active orders
      window.ezsite.apis.tablePage(11730, {
        PageNo: 1, PageSize: 1,
        Filters: [{ name: 'status', op: 'Equal', value: 'Pending' }]
      }),
      // Licenses for expiry check
      window.ezsite.apis.tablePage(11731, {
        PageNo: 1, PageSize: 50,
        Filters: [{ name: 'status', op: 'Equal', value: 'Active' }]
      }),
      // User station specific sales
      currentUser && currentUser !== 'ALL' ? window.ezsite.apis.tablePage(12356, {
        PageNo: 1, PageSize: 50,
        Filters: [
        { name: 'station', op: 'Equal', value: currentUser },
        { name: 'report_date', op: 'StringContains', value: today }]

      }) : Promise.resolve({ data: null, error: null })]
      );

      // Process the data
      const employeeCount = employeesData.data?.VirtualCount || 0;
      const stationCount = stationsData.data?.VirtualCount || 0;
      const activeOrders = ordersData.data?.VirtualCount || 0;

      // Calculate sales metrics
      let totalRevenue = 0;
      let todaySales = 0;
      let thisMonthSales = 0;
      let fuelGallonsToday = 0;
      let convenienceSalesToday = 0;
      let creditCardSales = 0;
      let cashSales = 0;

      if (salesData.data?.List) {
        totalRevenue = salesData.data.List.reduce((sum: number, report: any) => {
          return sum + (report.total_sales || 0);
        }, 0);
      }

      if (todaySalesData.data?.List) {
        todaySales = todaySalesData.data.List.reduce((sum: number, report: any) => {
          return sum + (report.total_sales || 0);
        }, 0);

        fuelGallonsToday = todaySalesData.data.List.reduce((sum: number, report: any) => {
          return sum + (report.total_gallons || 0);
        }, 0);

        convenienceSalesToday = todaySalesData.data.List.reduce((sum: number, report: any) => {
          return sum + (report.grocery_sales || 0);
        }, 0);

        creditCardSales = todaySalesData.data.List.reduce((sum: number, report: any) => {
          return sum + (report.credit_card_amount || 0);
        }, 0);

        cashSales = todaySalesData.data.List.reduce((sum: number, report: any) => {
          return sum + (report.cash_amount || 0);
        }, 0);
      }

      if (monthSalesData.data?.List) {
        thisMonthSales = monthSalesData.data.List.reduce((sum: number, report: any) => {
          return sum + (report.total_sales || 0);
        }, 0);
      }

      // Calculate low stock items
      let lowStockItems = 0;
      if (productsData.data?.List) {
        lowStockItems = productsData.data.List.filter((product: any) =>
        product.quantity_in_stock <= product.minimum_stock && product.minimum_stock > 0
        ).length;
      }

      // Calculate expiring licenses
      let expiringLicenses = 0;
      if (licensesData.data?.List) {
        const currentDate = new Date();
        const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        expiringLicenses = licensesData.data.List.filter((license: any) => {
          const expiryDate = new Date(license.expiry_date);
          return expiryDate <= thirtyDaysFromNow;
        }).length;
      }

      // User station specific data
      let myStationSales = 0;
      if (userStationSalesData.data?.List) {
        myStationSales = userStationSalesData.data.List.reduce((sum: number, report: any) => {
          return sum + (report.total_sales || 0);
        }, 0);
      }

      const myShiftSales = roleAccess.userRole === 'Employee' ? myStationSales : todaySales;

      // Calculate pending reports (reports missing from today)
      const expectedReports = roleAccess.userRole === 'Administrator' ? stationCount * 2 : 2; // Day + Night shifts
      const actualReports = todaySalesData.data?.List?.length || 0;
      const pendingReports = Math.max(0, expectedReports - actualReports);

      setRealTimeData({
        employeeCount,
        stationCount,
        totalRevenue,
        todaySales,
        thisMonthSales,
        lowStockItems,
        activeOrders,
        expiringLicenses,
        myShiftSales,
        myStationSales,
        fuelGallonsToday,
        convenienceSalesToday,
        creditCardSales,
        cashSales,
        pendingReports,
        lastUpdated: new Date()
      });

      console.log('✅ Real-time dashboard data updated successfully');

      if (expiringLicenses > 0) {
        toast({
          title: "License Alert",
          description: `${expiringLicenses} license(s) expiring within 30 days`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Error fetching real-time dashboard data:', error);
      toast({
        title: "Data Error",
        description: "Failed to load dashboard data. Please refresh.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userProfile?.station, roleAccess.userRole, toast]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    fetchRealTimeData();

    if (autoRefresh) {
      const interval = setInterval(fetchRealTimeData, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchRealTimeData, autoRefresh]);

  // Management Role Dashboard Widgets
  const getManagementWidgets = (): DashboardWidget[] => [
  {
    id: 'daily-revenue',
    title: "Today's Revenue",
    description: 'Total revenue across all stations',
    icon: <DollarSign className="h-6 w-6" />,
    value: `$${realTimeData.todaySales.toLocaleString()}`,
    change: `vs ${((realTimeData.todaySales / (realTimeData.thisMonthSales / new Date().getDate() || 1) - 1) * 100).toFixed(1)}% daily avg`,
    trend: realTimeData.todaySales > (realTimeData.thisMonthSales / new Date().getDate() || 0) ? 'up' : 'down',
    color: 'bg-green-500',
    actionPath: '/sales',
    actionLabel: 'View Sales',
    priority: 'high'
  },
  {
    id: 'fuel-sales',
    title: 'Fuel Gallons Sold',
    description: 'Total fuel gallons sold today',
    icon: <Fuel className="h-6 w-6" />,
    value: realTimeData.fuelGallonsToday.toLocaleString(),
    change: 'gallons today',
    trend: 'neutral',
    color: 'bg-blue-500',
    actionPath: '/inventory/gas-delivery',
    actionLabel: 'Check Tanks',
    priority: 'high'
  },
  {
    id: 'convenience-sales',
    title: 'Convenience Store',
    description: 'Store sales excluding fuel',
    icon: <Building2 className="h-6 w-6" />,
    value: `$${realTimeData.convenienceSalesToday.toLocaleString()}`,
    change: 'store sales today',
    trend: 'up',
    color: 'bg-purple-500',
    actionPath: '/products',
    actionLabel: 'View Products',
    priority: 'medium'
  },
  {
    id: 'active-employees',
    title: 'Active Employees',
    description: 'Currently active staff members',
    icon: <Users className="h-6 w-6" />,
    value: realTimeData.employeeCount.toString(),
    change: 'total employees',
    trend: 'neutral',
    color: 'bg-indigo-500',
    actionPath: '/employees',
    actionLabel: 'Manage Staff',
    priority: 'medium'
  },
  {
    id: 'inventory-alerts',
    title: 'Inventory Alerts',
    description: 'Items requiring attention',
    icon: <Package className="h-6 w-6" />,
    value: realTimeData.lowStockItems.toString(),
    change: realTimeData.lowStockItems > 0 ? 'items low stock' : 'all stocked',
    trend: realTimeData.lowStockItems > 0 ? 'down' : 'up',
    color: realTimeData.lowStockItems > 0 ? 'bg-red-500' : 'bg-green-500',
    actionPath: '/inventory/alerts',
    actionLabel: 'Check Inventory',
    priority: realTimeData.lowStockItems > 0 ? 'high' : 'low'
  },
  {
    id: 'pending-reports',
    title: 'Pending Reports',
    description: 'Reports awaiting submission',
    icon: <FileText className="h-6 w-6" />,
    value: realTimeData.pendingReports.toString(),
    change: 'reports pending',
    trend: realTimeData.pendingReports > 0 ? 'down' : 'up',
    color: realTimeData.pendingReports > 0 ? 'bg-orange-500' : 'bg-green-500',
    actionPath: '/sales',
    actionLabel: 'Review Reports',
    priority: realTimeData.pendingReports > 0 ? 'high' : 'low'
  }];


  // Employee Role Dashboard Widgets
  const getEmployeeWidgets = (): DashboardWidget[] => [
  {
    id: 'my-shift-sales',
    title: 'My Shift Sales',
    description: 'Sales during my current shift',
    icon: <Receipt className="h-6 w-6" />,
    value: `$${realTimeData.myShiftSales.toLocaleString()}`,
    change: 'shift total',
    trend: 'up',
    color: 'bg-green-500',
    actionPath: '/sales/new',
    actionLabel: 'New Sale Report',
    priority: 'high'
  },
  {
    id: 'station-status',
    title: 'My Station',
    description: 'Station performance today',
    icon: <Building2 className="h-6 w-6" />,
    value: userProfile?.station || 'N/A',
    change: `$${realTimeData.myStationSales.toLocaleString()} today`,
    trend: 'neutral',
    color: 'bg-blue-500',
    priority: 'high'
  },
  {
    id: 'payment-breakdown',
    title: 'Payment Methods',
    description: 'Today\'s payment distribution',
    icon: <CreditCard className="h-6 w-6" />,
    value: `${Math.round(realTimeData.creditCardSales / (realTimeData.todaySales || 1) * 100)}%`,
    change: 'card vs cash',
    trend: 'neutral',
    color: 'bg-purple-500',
    priority: 'medium'
  },
  {
    id: 'my-tasks',
    title: 'Today\'s Tasks',
    description: 'Assigned tasks and duties',
    icon: <CheckCircle className="h-6 w-6" />,
    value: 'Ready',
    change: 'operational status',
    trend: 'up',
    color: 'bg-green-500',
    actionPath: '/products',
    actionLabel: 'Check Products',
    priority: 'medium'
  }];


  const getCurrentUserWidgets = (): DashboardWidget[] => {
    switch (roleAccess.userRole) {
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
  const highPriorityWidgets = widgets.filter((w) => w.priority === 'high');
  const mediumPriorityWidgets = widgets.filter((w) => w.priority === 'medium');

  if (!roleAccess.userRole || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Visual Edit Toolbar */}
      <VisualEditToolbar />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {roleAccess.userRole} Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {userProfile?.station || 'All Stations'} • Real-time data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={roleAccess.userRole === 'Management' ? 'default' : 'secondary'}>
            {roleAccess.userRole}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'text-green-600' : 'text-gray-600'}>

            <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRealTimeData}>

            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {realTimeData.expiringLicenses > 0 &&
      <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>License Alert:</strong> {realTimeData.expiringLicenses} license(s) expiring within 30 days.
            <Button
            variant="link"
            className="p-0 h-auto font-semibold text-red-600 ml-1"
            onClick={() => navigate('/licenses')}>

              Review licenses →
            </Button>
          </AlertDescription>
        </Alert>
      }

      {realTimeData.lowStockItems > 0 &&
      <Alert className="border-orange-500 bg-orange-50">
          <Package className="h-4 w-4" />
          <AlertDescription>
            <strong>Inventory Alert:</strong> {realTimeData.lowStockItems} item(s) need restocking.
            <Button
            variant="link"
            className="p-0 h-auto font-semibold text-orange-600 ml-1"
            onClick={() => navigate('/inventory/alerts')}>

              Check inventory →
            </Button>
          </AlertDescription>
        </Alert>
      }

      {/* High Priority Widgets */}
      {highPriorityWidgets.length > 0 &&
      <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <Target className="h-5 w-5 mr-2 text-red-500" />
            Priority Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highPriorityWidgets.map((widget) =>
          <Card key={widget.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${widget.color} text-white`}>
                      {widget.icon}
                    </div>
                    {getTrendIcon(widget.trend)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{widget.title}</h3>
                    <p className="text-sm text-gray-600">{widget.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{widget.value}</span>
                      {widget.change &&
                  <span className="text-sm text-gray-600">{widget.change}</span>
                  }
                    </div>
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
        </div>
      }

      {/* Medium Priority Widgets */}
      {mediumPriorityWidgets.length > 0 &&
      <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Additional Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediumPriorityWidgets.map((widget) =>
          <Card key={widget.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${widget.color} text-white`}>
                      {widget.icon}
                    </div>
                    {getTrendIcon(widget.trend)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{widget.title}</h3>
                    <p className="text-sm text-gray-600">{widget.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{widget.value}</span>
                      {widget.change &&
                  <span className="text-sm text-gray-600">{widget.change}</span>
                  }
                    </div>
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
        </div>
      }

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Rocket className="h-5 w-5 mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {roleAccess.hasFeatureAccess('sales', 'canCreate') &&
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate('/sales/new')}>

                <Plus className="h-4 w-4" />
                New Sale Report
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
              className="flex items-center gap-2"
              onClick={() => navigate('/sales')}>

                <Download className="h-4 w-4" />
                Export Reports
              </Button>
            }
          </div>
        </CardContent>
      </Card>

      {/* Data freshness indicator */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Last updated: {realTimeData.lastUpdated.toLocaleTimeString()}</span>
        <span>Auto-refresh: {autoRefresh ? 'Every 30 seconds' : 'Disabled'}</span>
      </div>
    </div>);

};

export default RoleBasedDashboardV2;