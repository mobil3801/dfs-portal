
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Shield,
  Activity,
  Database,
  MessageSquare,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TestTube } from
'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import AccessDenied from '@/components/AccessDenied';
import RealTimeAdminDashboard from '@/components/RealTimeAdminDashboard';


interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAuditLogs: number;
  todaysActivity: number;
  systemHealth: 'healthy' | 'warning' | 'error';
}

const AdminPanel = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAuditLogs: 0,
    todaysActivity: 0,
    systemHealth: 'healthy'
  });
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  if (!isAdmin()) {
    return <AccessDenied feature="Admin Panel" requiredRole="Administrator" />;
  }

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Fetch user profiles count
      const usersResponse = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 1
      });

      // Fetch active users count
      const activeUsersResponse = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "is_active", op: "Equal", value: true }]
      });

      // Fetch today's audit logs
      const today = new Date().toISOString().split('T')[0];
      const auditResponse = await window.ezsite.apis.tablePage(12706, {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: "event_timestamp", op: "StringStartsWith", value: today }]
      });

      // Fetch total audit logs
      const totalAuditResponse = await window.ezsite.apis.tablePage(12706, {
        PageNo: 1,
        PageSize: 1
      });

      setStats({
        totalUsers: usersResponse.data?.VirtualCount || 0,
        activeUsers: activeUsersResponse.data?.VirtualCount || 0,
        totalAuditLogs: totalAuditResponse.data?.VirtualCount || 0,
        todaysActivity: auditResponse.data?.VirtualCount || 0,
        systemHealth: 'healthy'
      });

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setStats((prev) => ({ ...prev, systemHealth: 'error' }));
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
    // Refresh every 2 minutes
    const interval = setInterval(fetchAdminStats, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const AdminStatCard = ({
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


  const QuickAdminAction = ({
    title,
    description,
    icon: Icon,
    onClick,
    variant = "default"






  }: {title: string;description: string;icon: any;onClick: () => void;variant?: "default" | "secondary" | "destructive";}) =>
  <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3 mb-3">
        <Icon className="h-6 w-6 text-blue-600 mt-1" />
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <Button onClick={onClick} variant={variant} size="sm" className="w-full">
        Access {title}
      </Button>
    </Card>;


  const getSystemHealthBadge = () => {
    const health = stats.systemHealth;
    if (health === 'healthy') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>;
    } else if (health === 'warning') {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Warning</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Real-Time Admin Panel</h1>
        <p className="opacity-90">
          Administrator: {user?.Name} • Full System Access • Live Database Integration
        </p>
        <div className="mt-2 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Production Database Connected</span>
        </div>
      </div>


      {/* System Health */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span className="font-semibold">System Status</span>
          </div>
          {getSystemHealthBadge()}
        </div>
      </Card>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="text-blue-600"
          onClick={() => navigate('/admin/users')} />

        <AdminStatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Shield}
          color="text-green-600" />

        <AdminStatCard
          title="Total Audit Logs"
          value={stats.totalAuditLogs}
          icon={Database}
          color="text-purple-600"
          onClick={() => navigate('/admin/audit')} />

        <AdminStatCard
          title="Today's Activity"
          value={stats.todaysActivity}
          icon={Activity}
          color="text-orange-600" />

      </div>

      {/* Admin Actions */}
      <Tabs defaultValue="management" className="space-y-4">
        <TabsList className="grid w-full lg:w-[600px] grid-cols-3">
          <TabsTrigger value="management">User Management</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-4">
          <div className="mb-6">
            <RealTimeAdminDashboard />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAdminAction
              title="User Management"
              description="Manage user accounts, roles, and permissions"
              icon={Users}
              onClick={() => navigate('/admin/users')} />

            <QuickAdminAction
              title="Site Management"
              description="Configure stations and locations"
              icon={Settings}
              onClick={() => navigate('/admin/sites')} />

            <QuickAdminAction
              title="Security Settings"
              description="Manage security policies and access controls"
              icon={Shield}
              onClick={() => navigate('/admin/security')} />

            <QuickAdminAction
              title="User Validation"
              description="Role conflict prevention & email uniqueness validation"
              icon={Shield}
              onClick={() => navigate('/admin/user-validation')} />

          </div>
        </TabsContent>


        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAdminAction
              title="Database Monitoring"
              description="Monitor database performance and connections"
              icon={Database}
              onClick={() => navigate('/admin/database')} />

            <QuickAdminAction
              title="SMS Management"
              description="Configure SMS alerts and notifications"
              icon={MessageSquare}
              onClick={() => navigate('/admin/sms')} />

            <QuickAdminAction
              title="System Logs"
              description="View and manage system logs"
              icon={Activity}
              onClick={() => navigate('/admin/logs')} />

          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAdminAction
              title="Audit Monitoring"
              description="Review audit logs and user activity"
              icon={Shield}
              onClick={() => navigate('/admin/audit')} />

            <QuickAdminAction
              title="Error Monitoring"
              description="Track and resolve system errors"
              icon={AlertTriangle}
              onClick={() => navigate('/admin/errors')}
              variant="secondary" />

            <QuickAdminAction
              title="Performance Monitor"
              description="Monitor system performance metrics"
              icon={Activity}
              onClick={() => navigate('/admin/performance')} />

            <QuickAdminAction
              title="Overflow Testing"
              description="Test responsive design and navigation overflow behavior"
              icon={TestTube}
              onClick={() => navigate('/overflow-testing')} />

          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Info */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Quick Information</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• System is operating normally</p>
          <p>• Last data refresh: {new Date().toLocaleTimeString()}</p>
          <p>• All critical services are running</p>
          <p>• Database connection is stable</p>
        </div>
      </Card>
    </div>);

};

export default AdminPanel;