import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Menu,
  MoreHorizontal,
  ClipboardList
} from 'lucide-react';

// Define navigation items with their icons
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, requiredRole: null },
  { name: 'Products', href: '/products', icon: Package, requiredRole: null },
  { name: 'Sales', href: '/sales', icon: FileText, requiredRole: null },
  { name: 'Delivery', href: '/delivery', icon: Truck, requiredRole: null },
  { name: 'Employees', href: '/employees', icon: Users, requiredRole: null },
  { name: 'Vendors', href: '/vendors', icon: Building, requiredRole: null },
  { name: 'Orders', href: '/orders', icon: ClipboardList, requiredRole: null },
  { name: 'Licenses', href: '/licenses', icon: Calendar, requiredRole: null },
  { name: 'Salary', href: '/salary', icon: DollarSign, requiredRole: null },
  { name: 'Settings', href: '/settings', icon: Settings, requiredRole: null },
  { name: 'Admin', href: '/admin', icon: Shield, requiredRole: 'admin' }
];

// Define navigation items from NavigationDebugger for comparison
const debuggerItems = [
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
  { name: 'Admin', href: '/admin', icon: Shield, requiredRole: 'admin' }
];

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
    refreshUserData,
    hasPermission
  } = useAuth();
  const location = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [showDiscrepancies, setShowDiscrepancies] = useState(true);

  // Role checking function for diagnostic purposes
  const canAccessRoute = (requiredRole: string | null) => {
    if (!requiredRole) {
      return true;
    }
    
    if (!isAuthenticated) {
      return false;
    }
    
    if (requiredRole.toLowerCase() === 'admin') {
      return isAdmin();
    }
    
    if (requiredRole.toLowerCase() === 'manager') {
      return isManager();
    }
    
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
  
  // Get accessible items from debugger items for comparison
  const accessibleDebuggerItems = debuggerItems.filter((item) => canAccessRoute(item.requiredRole));
  
  // Find discrepancies between the two sets of navigation items
  const discrepancies = navigationItems.map(item => {
    const debuggerItem = debuggerItems.find(di => di.href === item.href);
    if (!debuggerItem) return null;
    
    const hasDiscrepancy = item.requiredRole !== debuggerItem.requiredRole;
    const topNavAccess = canAccessRoute(item.requiredRole);
    const debuggerAccess = canAccessRoute(debuggerItem.requiredRole);
    
    return hasDiscrepancy ? {
      name: item.name,
      href: item.href,
      topNavRole: item.requiredRole,
      debuggerRole: debuggerItem.requiredRole,
      topNavAccess,
      debuggerAccess,
      accessDiffers: topNavAccess !== debuggerAccess
    } : null;
  }).filter(Boolean);

  // Get current page status
  const currentRoute = location.pathname;
  const currentPageItem = navigationItems.find((item) => currentRoute.startsWith(item.href));

  // Navigation health check
  const navigationHealth = {
    authInitialized: isInitialized,
    authLoading: isLoading,
    userAuthenticated: isAuthenticated,
    hasUser: !!user,
    hasProfile: !!userProfile,
    hasAccessibleItems: accessibleItems.length > 0,
    hasErrors: !!authError,
    hasDiscrepancies: discrepancies.length > 0,
    overallHealth: isInitialized && !isLoading && isAuthenticated && !!user && accessibleItems.length > 0 && discrepancies.length === 0
  };

  // Track diagnostic information for internal state
  useEffect(() => {
    // Only log critical discrepancies that affect navigation functionality
    if (discrepancies.length > 0 && navigationHealth.overallHealth === false) {
      console.warn('Navigation configuration discrepancies detected:', discrepancies.length);
    }
  }, [discrepancies.length, navigationHealth.overallHealth]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Navigation Debugger</h2>
          <p className="text-gray-600">Advanced diagnostics for navigation issues</p>
        </div>
        <div className="flex items-center space-x-2">
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
            Enhanced Navigation Health
          </CardTitle>
          <CardDescription>
            Comprehensive navigation system status
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
              <div className={`w-3 h-3 rounded-full ${navigationHealth.hasAccessibleItems ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Has Menu Items</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${!navigationHealth.hasDiscrepancies ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">No Discrepancies</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${navigationHealth.hasProfile ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Has User Profile</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Discrepancies Alert */}
      {discrepancies.length > 0 && showDiscrepancies && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Found {discrepancies.length} role discrepancies between navigation configurations</div>
            <p className="text-sm mt-1">
              There are differences in required roles between TopNavigation and NavigationDebugger components.
              This can cause inconsistent navigation behavior.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setShowDiscrepancies(false)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="discrepancies" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discrepancies">Discrepancies</TabsTrigger>
          <TabsTrigger value="permissions">Permission Tests</TabsTrigger>
          <TabsTrigger value="overflow">Overflow Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="discrepancies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Configuration Discrepancies</CardTitle>
              <CardDescription>
                Differences between TopNavigation and NavigationDebugger components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {discrepancies.length === 0 ? (
                <div className="bg-green-50 p-4 rounded-md text-green-700">
                  <CheckCircle className="h-5 w-5 inline-block mr-2" />
                  No discrepancies found. Navigation configurations are consistent.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>TopNav Role</TableHead>
                      <TableHead>Debugger Role</TableHead>
                      <TableHead>Access Differs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discrepancies.map((item, index) => (
                      <TableRow key={index} className={item.accessDiffers ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.topNavRole || 'null'}</TableCell>
                        <TableCell>{item.debuggerRole || 'null'}</TableCell>
                        <TableCell>
                          {item.accessDiffers ? (
                            <Badge variant="destructive">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Test Matrix</CardTitle>
              <CardDescription>
                Test permission checks for different actions and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>View</TableHead>
                    <TableHead>Create</TableHead>
                    <TableHead>Edit</TableHead>
                    <TableHead>Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['products', 'employees', 'sales', 'vendors', 'orders'].map((resource) => (
                    <TableRow key={resource}>
                      <TableCell className="font-medium capitalize">{resource}</TableCell>
                      {['view', 'create', 'edit', 'delete'].map((action) => (
                        <TableCell key={action}>
                          {hasPermission(action, resource) ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" /> Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-500">
                              <XCircle className="h-3 w-3 mr-1" /> No
                            </Badge>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overflow Navigation Analysis</CardTitle>
              <CardDescription>
                Analyze how navigation items are distributed between visible and overflow menus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-gray-500" />
                  <span>Products</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span>Sales</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-gray-500" />
                  <span>Delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  <span>More</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Overflow Calculation Factors</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-medium">Container Width</h4>
                    <p className="text-sm text-gray-600">Available space for navigation items</p>
                    <p className="text-lg font-medium mt-1">Varies by screen size</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-medium">Item Widths</h4>
                    <p className="text-sm text-gray-600">Space needed for each navigation item</p>
                    <p className="text-lg font-medium mt-1">Calculated dynamically</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-medium">More Button Width</h4>
                    <p className="text-sm text-gray-600">Space reserved for overflow menu button</p>
                    <p className="text-lg font-medium mt-1">~100px</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-medium">Padding</h4>
                    <p className="text-sm text-gray-600">Extra space reserved in container</p>
                    <p className="text-lg font-medium mt-1">~32px</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Common Overflow Issues</h3>
                <ul className="space-y-2 text-sm">
                  <li className="p-2 bg-red-50 rounded text-red-700">
                    <strong>Calculation Timing:</strong> Overflow calculation happens before DOM is fully rendered
                  </li>
                  <li className="p-2 bg-red-50 rounded text-red-700">
                    <strong>ResizeObserver Issues:</strong> Browser compatibility problems with ResizeObserver
                  </li>
                  <li className="p-2 bg-red-50 rounded text-red-700">
                    <strong>Race Conditions:</strong> Multiple resize events causing calculation conflicts
                  </li>
                  <li className="p-2 bg-red-50 rounded text-red-700">
                    <strong>Hidden Container Problems:</strong> Issues with measuring hidden items accurately
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedNavigationDebugger;