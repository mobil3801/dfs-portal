import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Home,
  Users,
  Package,
  FileText,
  Settings,
  Calendar,
  Building,
  DollarSign,
  Shield,
  Truck,
  Info,
  Monitor,
  Smartphone,
  Tablet } from
'lucide-react';
import OverflowNavigation from '@/components/OverflowNavigation';
import EnhancedOverflowNavigation from '@/components/EnhancedOverflowNavigation';

const OverflowNavigationDemo: React.FC = () => {
  const [containerWidth, setContainerWidth] = useState(800);
  const [showAllItems, setShowAllItems] = useState(true);

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


  const canAccessRoute = (requiredRole: string | null) => {
    if (!showAllItems && requiredRole === 'manager') return false;
    if (!showAllItems && requiredRole === 'admin') return false;
    return true;
  };

  const presetWidths = [
  { name: 'Mobile', width: 320, icon: Smartphone },
  { name: 'Tablet', width: 768, icon: Tablet },
  { name: 'Desktop', width: 1024, icon: Monitor },
  { name: 'Wide', width: 1400, icon: Monitor }];


  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Overflow Navigation Demo</h1>
        <p className="text-gray-600">
          Responsive navigation that automatically moves items to a "More" menu when they don't fit
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This demo shows how the navigation automatically adapts when there's not enough space to display all menu items. 
          Items that don't fit are moved to a three-dot "More" dropdown menu.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
          <TabsTrigger value="basic">Basic Implementation</TabsTrigger>
          <TabsTrigger value="enhanced">Enhanced Features</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Interactive Demo</span>
                <Badge variant="outline">
                  {containerWidth}px wide
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Width Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Container Width:</span>
                  <div className="flex items-center space-x-2">
                    {presetWidths.map((preset) =>
                    <Button
                      key={preset.name}
                      variant={containerWidth === preset.width ? "default" : "outline"}
                      size="sm"
                      onClick={() => setContainerWidth(preset.width)}
                      className="flex items-center space-x-1">

                        <preset.icon className="h-3 w-3" />
                        <span>{preset.name}</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="300"
                    max="1600"
                    value={containerWidth}
                    onChange={(e) => setContainerWidth(Number(e.target.value))}
                    className="flex-1" />

                  <span className="text-sm text-gray-500 min-w-[80px]">
                    {containerWidth}px
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={showAllItems ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAllItems(!showAllItems)}>

                    {showAllItems ? "Show All Items" : "Limited Items"}
                  </Button>
                  <span className="text-sm text-gray-500">
                    ({showAllItems ? navigationItems.length : navigationItems.filter((item) => canAccessRoute(item.requiredRole)).length} items)
                  </span>
                </div>
              </div>

              {/* Demo Navigation */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div
                  className="bg-white border border-gray-200 rounded-lg shadow-sm"
                  style={{ width: `${containerWidth}px`, maxWidth: '100%' }}>

                  <div className="flex items-center justify-between h-16 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Demo App</span>
                    </div>
                    
                    <div className="flex-1 mx-4">
                      <OverflowNavigation
                        items={navigationItems}
                        canAccessRoute={canAccessRoute} />

                    </div>

                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Visible Items</h4>
                  <div className="space-y-1">
                    {navigationItems.filter((item) => canAccessRoute(item.requiredRole)).slice(0, Math.floor(containerWidth / 120)).map((item) =>
                    <div key={item.href} className="flex items-center space-x-2">
                        <item.icon className="h-3 w-3 text-blue-600" />
                        <span>{item.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Overflow Items</h4>
                  <div className="space-y-1">
                    {navigationItems.filter((item) => canAccessRoute(item.requiredRole)).slice(Math.floor(containerWidth / 120)).map((item) =>
                    <div key={item.href} className="flex items-center space-x-2">
                        <item.icon className="h-3 w-3 text-gray-600" />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Implementation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Basic overflow navigation with standard functionality:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <OverflowNavigation
                    items={navigationItems}
                    canAccessRoute={canAccessRoute} />

                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enhanced overflow navigation with additional features:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <EnhancedOverflowNavigation
                    items={navigationItems}
                    canAccessRoute={canAccessRoute}
                    showLoadingIndicator={true}
                    moreButtonWidth={110}
                    padding={40} />

                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Customizable more button width</li>
                      <li>• Adjustable padding</li>
                      <li>• Loading indicator</li>
                      <li>• ARIA accessibility</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• ResizeObserver for accuracy</li>
                      <li>• Debounced calculations</li>
                      <li>• Optimized re-renders</li>
                      <li>• Memory leak prevention</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>How it works:</h4>
            <ol className="text-sm space-y-2">
              <li>The component measures the available width using ResizeObserver</li>
              <li>It calculates how many navigation items can fit in the available space</li>
              <li>Items that don't fit are moved to the "More" dropdown menu</li>
              <li>The layout automatically updates when the container is resized</li>
              <li>All items remain accessible through either the main navigation or the dropdown</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default OverflowNavigationDemo;