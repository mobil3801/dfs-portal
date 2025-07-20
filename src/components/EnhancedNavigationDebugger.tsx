import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  Users,
  Package,
  FileText,
  Truck,
  Calendar,
  Shield,
  Home,
  DollarSign,
  Building,
  RefreshCw,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Tablet } from
'lucide-react';

const EnhancedNavigationDebugger: React.FC = () => {
  const {
    user,
    userProfile,
    isAuthenticated,
    isLoading,
    isInitialized,
    isAdmin,
    isManager,
    authError,
    refreshUserData
  } = useAuth();
  const location = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');
  const [navigationVisible, setNavigationVisible] = useState(false);

  // Navigation items for testing
  const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, requiredRole: null },
  { name: 'Products', href: '/products', icon: Package, requiredRole: null },
  { name: 'Sales', href: '/sales', icon: FileText, requiredRole: null },
  { name: 'Delivery', href: '/delivery', icon: Truck, requiredRole: null },
  { name: 'Employees', href: '/employees', icon: Users, requiredRole: 'manager' },
  { name: 'Vendors', href: '/vendors', icon: Building, requiredRole: 'manager' },
  { name: 'Orders', href: '/orders', icon: Package, requiredRole: 'manager' },
  { name: 'Licenses', href: '/licenses', icon: Calendar, requiredRole: 'manager' },
  { name: 'Salary', href: '/salary', icon: DollarSign, requiredRole: 'manager' },
  { name: 'Settings', href: '/settings', icon: Settings, requiredRole: null },
  { name: 'Admin', href: '/admin', icon: Shield, requiredRole: 'admin' }];


  // Monitor screen size changes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if navigation is visible
  useEffect(() => {
    const checkNavigationVisibility = () => {
      const navElement = document.querySelector('nav');
      const navButtons = document.querySelectorAll('[data-testid^="nav-"]');

      setNavigationVisible(navElement !== null && navButtons.length > 0);
    };

    // Check immediately and then periodically
    checkNavigationVisibility();
    const interval = setInterval(checkNavigationVisibility, 1000);
    return () => clearInterval(interval);
  }, []);

  // Role checking function
  const canAccessRoute = (requiredRole: string | null) => {
    if (!requiredRole) return true;
    if (!isAuthenticated) return false;
    if (requiredRole === 'admin') return isAdmin();
    if (requiredRole === 'manager') return isManager();
    return true;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Get accessible items
  const accessibleItems = navigationItems.filter((item) => canAccessRoute(item.requiredRole));
  const inaccessibleItems = navigationItems.filter((item) => !canAccessRoute(item.requiredRole));

  // Get current page status
  const currentRoute = location.pathname;
  const currentPageAccess = navigationItems.find((item) => currentRoute.startsWith(item.href));

  // Navigation health check
  const navigationHealth = {
    authInitialized: isInitialized,
    authLoading: isLoading,
    userAuthenticated: isAuthenticated,
    hasUser: !!user,
    hasProfile: !!userProfile,
    hasAccessibleItems: accessibleItems.length > 0,
    hasErrors: !!authError,
    navigationVisible,
    overallHealth: isInitialized && !isLoading && isAuthenticated && !!user && accessibleItems.length > 0 && navigationVisible
  };

  const getScreenIcon = () => {
    switch (screenSize) {
      case 'mobile':return <Smartphone className="h-4 w-4" />;
      case 'tablet':return <Tablet className="h-4 w-4" />;
      default:return <Monitor className="h-4 w-4" />;
    }
  };

  const runNavigationDiagnostics = () => {
    const diagnostics = [];

    // Check if navigation container exists
    const navContainer = document.querySelector('nav');
    diagnostics.push({
      test: 'Navigation Container',
      passed: !!navContainer,
      message: navContainer ? 'Navigation container found' : 'Navigation container not found'
    });

    // Check if navigation items exist
    const navItems = document.querySelectorAll('[data-testid^="nav-"]');
    diagnostics.push({
      test: 'Navigation Items',
      passed: navItems.length > 0,
      message: `${navItems.length} navigation items found`
    });

    // Check if user dropdown exists
    const userDropdown = document.querySelector('[data-testid="user-dropdown"]');
    diagnostics.push({
      test: 'User Dropdown',
      passed: !!userDropdown,
      message: userDropdown ? 'User dropdown found' : 'User dropdown not found'
    });

    // Check if mobile menu button exists
    const mobileMenuButton = document.querySelector('[data-testid="mobile-menu-button"]');
    diagnostics.push({
      test: 'Mobile Menu Button',
      passed: !!mobileMenuButton,
      message: mobileMenuButton ? 'Mobile menu button found' : 'Mobile menu button not found'
    });

    return diagnostics;
  };

  const diagnostics = runNavigationDiagnostics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Navigation Debugger</h2>
          <p className="text-gray-600">Comprehensive navigation analysis and troubleshooting</p>
        </div>
        <div className="flex items-center space-x-2">
          {getScreenIcon()}
          <span className="text-sm font-medium">{screenSize}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSensitiveData(!showSensitiveData)}>
            {showSensitiveData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showSensitiveData ? 'Hide' : 'Show'} Details
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Navigation Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {navigationHealth.overallHealth ?
            <CheckCircle className="h-5 w-5 text-green-500" /> :
            <XCircle className="h-5 w-5 text-red-500" />
            }
            Navigation Health Status
          </CardTitle>
          <CardDescription>
            Overall navigation system health and visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${navigationHealth.authInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Auth Initialized</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${!navigationHealth.authLoading ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm">Not Loading</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${navigationHealth.userAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Authenticated</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${navigationHealth.navigationVisible ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Navigation Visible</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="diagnostics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Diagnostics</CardTitle>
              <CardDescription>Automated tests for navigation components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diagnostics.map((diagnostic, index) =>
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {diagnostic.passed ?
                    <CheckCircle className="h-5 w-5 text-green-500" /> :
                    <XCircle className="h-5 w-5 text-red-500" />
                    }
                      <div>
                        <div className="font-medium">{diagnostic.test}</div>
                        <div className="text-sm text-gray-600">{diagnostic.message}</div>
                      </div>
                    </div>
                    <Badge variant={diagnostic.passed ? 'default' : 'destructive'}>
                      {diagnostic.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Authentication Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Initialized:</span>
                  <Badge variant={isInitialized ? 'default' : 'secondary'}>
                    {isInitialized ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Loading:</span>
                  <Badge variant={isLoading ? 'destructive' : 'default'}>
                    {isLoading ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Authenticated:</span>
                  <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
                    {isAuthenticated ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Has User:</span>
                  <Badge variant={user ? 'default' : 'destructive'}>
                    {user ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Has Profile:</span>
                  <Badge variant={userProfile ? 'default' : 'destructive'}>
                    {userProfile ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Name:</span>
                  <span className="font-medium">{user?.Name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email:</span>
                  <span className="font-medium">
                    {showSensitiveData ? user?.Email || 'N/A' : user?.Email ? '***@***.com' : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Role:</span>
                  <Badge variant={
                  isAdmin() ? 'default' :
                  isManager() ? 'secondary' :
                  'outline'
                  }>
                    {isAdmin() ? 'Admin' : isManager() ? 'Manager' : 'Employee'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>User ID:</span>
                  <span className="font-medium">{user?.ID || 'N/A'}</span>
                </div>
                {showSensitiveData && userProfile &&
                <div className="flex items-center justify-between">
                    <span>Profile Role:</span>
                    <span className="font-medium">{userProfile.role || 'N/A'}</span>
                  </div>
                }
              </CardContent>
            </Card>
          </div>

          {authError &&
          <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Authentication Error:</strong> {authError}
              </AlertDescription>
            </Alert>
          }
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Accessible Items ({accessibleItems.length})</CardTitle>
                <CardDescription>Navigation items the current user can access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {accessibleItems.map((item) =>
                  <div key={item.href} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        {item.requiredRole || 'All'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Inaccessible Items ({inaccessibleItems.length})</CardTitle>
                <CardDescription>Navigation items the current user cannot access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inaccessibleItems.map((item) =>
                  <div key={item.href} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                      <Badge variant="outline" className="text-red-600">
                        {item.requiredRole || 'All'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Navigation Items</CardTitle>
              <CardDescription>Complete list of navigation items and their access requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const hasAccess = canAccessRoute(item.requiredRole);
                  const isCurrentPage = currentRoute.startsWith(item.href);

                  return (
                    <div key={item.href} className={`flex items-center justify-between p-3 rounded border ${
                    isCurrentPage ? 'bg-blue-50 border-blue-200' : 'bg-white'}`
                    }>
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.href}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {item.requiredRole || 'All Users'}
                        </Badge>
                        {hasAccess ?
                        <CheckCircle className="h-5 w-5 text-green-500" /> :
                        <XCircle className="h-5 w-5 text-red-500" />
                        }
                        {isCurrentPage &&
                        <Badge variant="default">Current</Badge>
                        }
                      </div>
                    </div>);

                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">✅ FIXED: Navigation Items Not Showing</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Simplified navigation rendering logic</li>
                    <li>• Removed complex overflow calculations</li>
                    <li>• Direct item rendering without complex state management</li>
                    <li>• Improved authentication state handling</li>
                  </ul>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Navigation Health Check</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Authentication: {navigationHealth.userAuthenticated ? '✅ Active' : '❌ Failed'}</li>
                    <li>• User Data: {navigationHealth.hasUser ? '✅ Loaded' : '❌ Missing'}</li>
                    <li>• Navigation Items: {navigationHealth.hasAccessibleItems ? '✅ Available' : '❌ None'}</li>
                    <li>• Visual Elements: {navigationHealth.navigationVisible ? '✅ Visible' : '❌ Hidden'}</li>
                  </ul>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Performance Improvements</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Removed ResizeObserver complexity</li>
                    <li>• Simplified responsive design</li>
                    <li>• Eliminated overflow calculation loops</li>
                    <li>• Fixed mobile navigation state management</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2 font-mono bg-gray-50 p-3 rounded">
                <div>Current Path: {currentRoute}</div>
                <div>Screen Size: {screenSize} ({typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px)</div>
                <div>Navigation Items: {navigationItems.length}</div>
                <div>Accessible Items: {accessibleItems.length}</div>
                <div>Navigation Visible: {navigationVisible ? 'Yes' : 'No'}</div>
                <div>APIs Available: {typeof window !== 'undefined' && window.ezsite?.apis ? 'Yes' : 'No'}</div>
                <div>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</div>
                <div>Timestamp: {new Date().toISOString()}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default EnhancedNavigationDebugger;