import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  Navigation } from
'lucide-react';

const NavigationStatusWidget: React.FC = () => {
  const { isAuthenticated, isAdmin, isManager, user } = useAuth();
  const [expanded, setExpanded] = useState(false);

  // Only show for admin users and only if there might be issues
  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  const navigationItems = [
  { name: 'Dashboard', accessible: true },
  { name: 'Products', accessible: true },
  { name: 'Sales', accessible: true },
  { name: 'Delivery', accessible: true },
  { name: 'Employees', accessible: isManager() },
  { name: 'Vendors', accessible: isManager() },
  { name: 'Orders', accessible: isManager() },
  { name: 'Licenses', accessible: isManager() },
  { name: 'Salary', accessible: isManager() },
  { name: 'Settings', accessible: true },
  { name: 'Admin', accessible: isAdmin() }];


  const accessibleCount = navigationItems.filter((item) => item.accessible).length;
  const totalCount = navigationItems.length;

  return (
    <Card className="border-dashed border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Navigation Status</span>
            </div>
            <Badge variant="outline" className="bg-white">
              {accessibleCount}/{totalCount} Items
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}>

              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {expanded &&
        <div className="mt-4 space-y-3">
            <div className="text-sm text-blue-700">
              <strong>User:</strong> {user?.Name} ({isAdmin() ? 'Admin' : isManager() ? 'Manager' : 'Employee'})
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              {navigationItems.map((item) =>
            <div key={item.name} className="flex items-center justify-between">
                  <span className={item.accessible ? 'text-gray-700' : 'text-gray-400'}>
                    {item.name}
                  </span>
                  {item.accessible ?
              <CheckCircle className="h-4 w-4 text-green-500" /> :

              <AlertCircle className="h-4 w-4 text-gray-400" />
              }
                </div>
            )}
            </div>

            <div className="flex justify-between pt-2 border-t border-blue-200">
              <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/admin/navigation-debug', '_blank')}>

                <Settings className="h-4 w-4 mr-2" />
                Debug Tools
              </Button>
              <div className="text-xs text-blue-600">
                Admin diagnostic widget
              </div>
            </div>
          </div>
        }
      </CardContent>
    </Card>);

};

export default NavigationStatusWidget;