
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Users,
  Package,
  FileText,
  Truck,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Activity } from
'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalEmployees: number;
  activeProducts: number;
  todayReports: number;
  pendingDeliveries: number;
  expiringLicenses: number;
  totalSales: number;
}

const Dashboard = () => {
  const { user, userProfile, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeProducts: 0,
    todayReports: 0,
    pendingDeliveries: 0,
    expiringLicenses: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch employees count
      const employeesResponse = await window.ezsite.apis.tablePage(11727, {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "is_active", op: "Equal", value: true }]
      });

      // Fetch active products count
      const productsResponse = await window.ezsite.apis.tablePage(11726, {
        PageNo: 1,
        PageSize: 1
      });

      // Fetch today's sales reports
      const today = new Date().toISOString().split('T')[0];
      const salesResponse = await window.ezsite.apis.tablePage(12356, {
        PageNo: 1,
        PageSize: 10,
        Filters: [{ name: "report_date", op: "StringStartsWith", value: today }]
      });

      // Fetch pending deliveries
      const deliveriesResponse = await window.ezsite.apis.tablePage(12196, {
        PageNo: 1,
        PageSize: 1
      });

      // Fetch expiring licenses (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const licensesResponse = await window.ezsite.apis.tablePage(11731, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
        { name: "expiry_date", op: "LessThanOrEqual", value: thirtyDaysFromNow.toISOString() },
        { name: "status", op: "Equal", value: "Active" }]

      });

      // Calculate total sales from today's reports
      let totalSales = 0;
      if (salesResponse.data?.List) {
        totalSales = salesResponse.data.List.reduce((sum: number, report: any) =>
        sum + (report.total_sales || 0), 0
        );
      }

      setStats({
        totalEmployees: employeesResponse.data?.VirtualCount || 0,
        activeProducts: productsResponse.data?.VirtualCount || 0,
        todayReports: salesResponse.data?.VirtualCount || 0,
        pendingDeliveries: deliveriesResponse.data?.VirtualCount || 0,
        expiringLicenses: licensesResponse.data?.VirtualCount || 0,
        totalSales
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const QuickStatCard = ({
    title,
    value,
    icon: Icon,
    color,
    onClick






  }: {title: string;value: number | string;icon: any;color: string;onClick?: () => void;}) =>
  <Card
    className={`p-6 cursor-pointer hover:shadow-lg transition-shadow ${onClick ? 'hover:bg-gray-50' : ''}`}
    onClick={onClick}>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{loading ? '...' : value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </Card>;


  const QuickAction = ({
    title,
    description,
    icon: Icon,
    onClick,
    color = "text-blue-600"






  }: {title: string;description: string;icon: any;onClick: () => void;color?: string;}) =>
  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start space-x-3">
        <Icon className={`h-6 w-6 ${color} mt-1`} />
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Card>;


  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.Name || 'User'}!</h1>
        <p className="opacity-90">
          {userProfile?.station || 'All Stations'} • {userProfile?.role || 'User'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <QuickStatCard
          title="Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="text-blue-600"
          onClick={() => navigate('/employees')} />

        <QuickStatCard
          title="Products"
          value={stats.activeProducts}
          icon={Package}
          color="text-green-600"
          onClick={() => navigate('/products')} />

        <QuickStatCard
          title="Today's Reports"
          value={stats.todayReports}
          icon={FileText}
          color="text-purple-600"
          onClick={() => navigate('/sales')} />

        <QuickStatCard
          title="Deliveries"
          value={stats.pendingDeliveries}
          icon={Truck}
          color="text-orange-600"
          onClick={() => navigate('/delivery')} />

        <QuickStatCard
          title="Expiring Licenses"
          value={stats.expiringLicenses}
          icon={AlertTriangle}
          color="text-red-600"
          onClick={() => navigate('/licenses')} />

        <QuickStatCard
          title="Today's Sales"
          value={`$${stats.totalSales.toLocaleString()}`}
          icon={TrendingUp}
          color="text-emerald-600" />

      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full lg:w-[400px] grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Alerts and Notifications */}
          {stats.expiringLicenses > 0 &&
          <Card className="p-4 border-orange-200 bg-orange-50">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <h4 className="font-semibold text-orange-800">License Expiry Alert</h4>
                  <p className="text-sm text-orange-700">
                    {stats.expiringLicenses} license(s) expiring within 30 days
                  </p>
                </div>
                <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => navigate('/licenses')}>

                  View Licenses
                </Button>
              </div>
            </Card>
          }

          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="h-5 w-5" />
              <h3 className="text-lg font-semibold">System Status</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Data Sync</span>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User Session</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">Active</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="quick-actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAction
              title="New Sales Report"
              description="Create a daily sales report"
              icon={FileText}
              onClick={() => navigate('/sales/new')} />

            <QuickAction
              title="Record Delivery"
              description="Log a new fuel delivery"
              icon={Truck}
              onClick={() => navigate('/delivery/new')} />

            <QuickAction
              title="Add Product"
              description="Register a new product"
              icon={Package}
              onClick={() => navigate('/products/new')} />

            {isManager() &&
            <>
                <QuickAction
                title="Manage Employees"
                description="View and edit employee records"
                icon={Users}
                onClick={() => navigate('/employees')} />

                <QuickAction
                title="Check Licenses"
                description="Review license status and renewals"
                icon={Calendar}
                onClick={() => navigate('/licenses')} />

              </>
            }
            {isAdmin() &&
            <QuickAction
              title="Admin Panel"
              description="System administration and settings"
              icon={BarChart3}
              onClick={() => navigate('/admin')}
              color="text-red-600" />

            }
          </div>
        </TabsContent>
      </Tabs>
    </div>);

};

export default Dashboard;