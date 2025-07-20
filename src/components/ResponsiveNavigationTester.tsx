
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverflowNavigation from '@/components/OverflowNavigation';
import EnhancedOverflowNavigation from '@/components/EnhancedOverflowNavigation';
import {
  Monitor,
  Smartphone,
  Tablet,
  Plus,
  Minus,
  Eye,
  Settings,
  Home,
  Users,
  Package,
  FileText,
  Truck,
  Calendar,
  DollarSign,
  Building,
  Shield } from
'lucide-react';

const ResponsiveNavigationTester: React.FC = () => {
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [itemCount, setItemCount] = useState(8);
  const [useEnhanced, setUseEnhanced] = useState(false);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState('');

  const defaultNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, requiredRole: null },
  { name: 'Products', href: '/products', icon: Package, requiredRole: null },
  { name: 'Orders', href: '/orders', icon: FileText, requiredRole: null },
  { name: 'Customers', href: '/customers', icon: Users, requiredRole: null },
  { name: 'Delivery', href: '/delivery', icon: Truck, requiredRole: null },
  { name: 'Calendar', href: '/calendar', icon: Calendar, requiredRole: null },
  { name: 'Finance', href: '/finance', icon: DollarSign, requiredRole: null },
  { name: 'Buildings', href: '/buildings', icon: Building, requiredRole: null },
  { name: 'Administration', href: '/admin', icon: Shield, requiredRole: null },
  { name: 'Settings', href: '/settings', icon: Settings, requiredRole: null },
  { name: 'Analytics', href: '/analytics', icon: Monitor, requiredRole: null },
  { name: 'Reports', href: '/reports', icon: FileText, requiredRole: null }];


  const [testItems, setTestItems] = useState(defaultNavItems.slice(0, itemCount));

  useEffect(() => {
    setTestItems(defaultNavItems.slice(0, itemCount));
  }, [itemCount]);

  const canAccessRoute = () => true; // Mock permission check

  const addCustomItem = () => {
    if (newItemName.trim()) {
      const newItem = {
        name: newItemName,
        href: `/${newItemName.toLowerCase().replace(/\s+/g, '-')}`,
        icon: Package,
        requiredRole: null
      };
      setTestItems([...testItems, newItem]);
      setNewItemName('');
    }
  };

  const removeItem = (index: number) => {
    setTestItems(testItems.filter((_, i) => i !== index));
  };

  const getViewportIcon = (width: number) => {
    if (width <= 480) return Smartphone;
    if (width <= 768) return Tablet;
    return Monitor;
  };

  const getViewportLabel = (width: number) => {
    if (width <= 480) return 'Mobile';
    if (width <= 768) return 'Tablet';
    return 'Desktop';
  };

  const presetViewports = [
  { width: 375, label: 'iPhone SE' },
  { width: 414, label: 'iPhone 11' },
  { width: 768, label: 'iPad' },
  { width: 1024, label: 'Laptop' },
  { width: 1280, label: 'Desktop' },
  { width: 1920, label: 'Large Desktop' }];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Navigation Overflow Tester</h2>
          <p className="text-muted-foreground">Test navigation behavior across different viewport sizes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {testItems.length} items
          </Badge>
          <Badge variant="outline">
            {viewportWidth}px
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Viewport Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Viewport Width: {viewportWidth}px</Label>
              <div className="flex items-center space-x-2">
                {React.createElement(getViewportIcon(viewportWidth), { className: "h-4 w-4" })}
                <span className="text-sm text-muted-foreground">
                  {getViewportLabel(viewportWidth)}
                </span>
              </div>
            </div>
            
            <Slider
              value={[viewportWidth]}
              onValueChange={([value]) => setViewportWidth(value)}
              max={1920}
              min={320}
              step={10}
              className="w-full" />


            <div className="flex flex-wrap gap-2">
              {presetViewports.map((preset) =>
              <Button
                key={preset.width}
                variant={viewportWidth === preset.width ? "default" : "outline"}
                size="sm"
                onClick={() => setViewportWidth(preset.width)}>

                  {preset.label}
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Navigation Items: {testItems.length}</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItemCount(Math.max(1, itemCount - 1))}
                  disabled={itemCount <= 1}>

                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">{itemCount}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItemCount(Math.min(defaultNavItems.length, itemCount + 1))}
                  disabled={itemCount >= defaultNavItems.length}>

                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add custom item..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomItem()} />

              <Button onClick={addCustomItem} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={useEnhanced}
                onCheckedChange={setUseEnhanced}
                id="enhanced-nav" />

              <Label htmlFor="enhanced-nav">Use Enhanced Navigation</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Navigation Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                The navigation below is constrained to {viewportWidth}px width to simulate different viewport sizes.
                Watch how it adapts and handles overflow.
              </AlertDescription>
            </Alert>

            {/* Test Container */}
            <div
              className="border-2 border-dashed border-gray-300 bg-white rounded-lg p-4 mx-auto transition-all duration-300"
              style={{ width: `${viewportWidth}px`, maxWidth: '100%' }}>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Navigation Test</h3>
                  <Badge variant="outline">
                    {viewportWidth}px
                  </Badge>
                </div>

                {/* Navigation Component */}
                <div className="border border-gray-200 rounded-lg bg-white">
                  <div className="p-2">
                    {useEnhanced ?
                    <EnhancedOverflowNavigation
                      items={testItems}
                      canAccessRoute={canAccessRoute}
                      moreButtonWidth={100}
                      padding={32}
                      showLoadingIndicator={true} /> :


                    <OverflowNavigation
                      items={testItems}
                      canAccessRoute={canAccessRoute} />

                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis */}
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Item Management</TabsTrigger>
          <TabsTrigger value="behavior">Behavior Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testItems.map((item, index) =>
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      {React.createElement(item.icon, { className: "h-4 w-4" })}
                      <span>{item.name}</span>
                    </div>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={testItems.length <= 1}>

                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Behavior Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900">Viewport Category</h4>
                    <p className="text-blue-700">{getViewportLabel(viewportWidth)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900">Navigation Type</h4>
                    <p className="text-green-700">{useEnhanced ? 'Enhanced' : 'Standard'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Expected Behavior:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {viewportWidth <= 480 &&
                    <li>• Very limited space - most items should overflow</li>
                    }
                    {viewportWidth > 480 && viewportWidth <= 768 &&
                    <li>• Mobile/tablet - some items may overflow</li>
                    }
                    {viewportWidth > 768 && viewportWidth <= 1024 &&
                    <li>• Laptop size - should handle most standard navigation</li>
                    }
                    {viewportWidth > 1024 &&
                    <li>• Desktop - should display most or all items</li>
                    }
                    <li>• Items that don't fit should move to "More" dropdown</li>
                    <li>• Navigation should remain functional at all sizes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>For your current setup ({viewportWidth}px, {testItems.length} items):</strong>
                    <ul className="mt-2 space-y-1">
                      {viewportWidth <= 480 &&
                      <>
                          <li>• Consider using a mobile-first hamburger menu</li>
                          <li>• Prioritize most important navigation items</li>
                          <li>• Use shorter item names where possible</li>
                        </>
                      }
                      {viewportWidth > 480 && viewportWidth <= 768 &&
                      <>
                          <li>• The enhanced navigation should handle overflow well</li>
                          <li>• Consider grouping related items</li>
                          <li>• Test with different item counts</li>
                        </>
                      }
                      {viewportWidth > 768 &&
                      <>
                          <li>• You have good space for navigation</li>
                          <li>• Consider adding more functionality</li>
                          <li>• Test edge cases with many items</li>
                        </>
                      }
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertDescription>
                    <strong>General Best Practices:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• Always test with varying content lengths</li>
                      <li>• Ensure touch targets are adequate (44px minimum)</li>
                      <li>• Provide clear visual hierarchy</li>
                      <li>• Test keyboard navigation</li>
                      <li>• Consider accessibility requirements</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default ResponsiveNavigationTester;