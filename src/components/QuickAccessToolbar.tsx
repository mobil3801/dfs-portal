import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit3, Trash2, Eye, Settings, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const QuickAccessToolbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const getQuickActions = () => {
    const path = location.pathname;

    if (path.startsWith('/products')) {
      return [
      {
        label: 'Add Product',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/products/new'),
        color: 'bg-green-600 hover:bg-green-700'
      },
      {
        label: 'View All',
        icon: <Eye className="w-4 h-4" />,
        action: () => navigate('/products'),
        color: 'bg-brand-600 hover:bg-brand-700'
      }];

    } else if (path.startsWith('/employees')) {
      return [
      {
        label: 'Add Employee',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/employees/new'),
        color: 'bg-green-600 hover:bg-green-700'
      },
      {
        label: 'View All',
        icon: <Eye className="w-4 h-4" />,
        action: () => navigate('/employees'),
        color: 'bg-brand-600 hover:bg-brand-700'
      }];

    } else if (path.startsWith('/sales')) {
      return [
      {
        label: 'New Report',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/sales/new'),
        color: 'bg-green-600 hover:bg-green-700'
      },
      {
        label: 'View Reports',
        icon: <Eye className="w-4 h-4" />,
        action: () => navigate('/sales'),
        color: 'bg-brand-600 hover:bg-brand-700'
      }];

    } else if (path.startsWith('/vendors')) {
      return [
      {
        label: 'Add Vendor',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/vendors/new'),
        color: 'bg-green-600 hover:bg-green-700'
      },
      {
        label: 'View All',
        icon: <Eye className="w-4 h-4" />,
        action: () => navigate('/vendors'),
        color: 'bg-brand-600 hover:bg-brand-700'
      }];

    } else if (path.startsWith('/orders')) {
      return [
      {
        label: 'Create Order',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/orders/new'),
        color: 'bg-green-600 hover:bg-green-700'
      },
      {
        label: 'View Orders',
        icon: <Eye className="w-4 h-4" />,
        action: () => navigate('/orders'),
        color: 'bg-brand-600 hover:bg-brand-700'
      }];

    } else if (path.startsWith('/licenses')) {
      return [
      {
        label: 'Add License',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/licenses/new'),
        color: 'bg-green-600 hover:bg-green-700'
      },
      {
        label: 'View All',
        icon: <Eye className="w-4 h-4" />,
        action: () => navigate('/licenses'),
        color: 'bg-brand-600 hover:bg-brand-700'
      }];

    }

    return [
    {
      label: 'Dashboard',
      icon: <Eye className="w-4 h-4" />,
      action: () => navigate('/dashboard'),
      color: 'bg-brand-600 hover:bg-brand-700'
    }];

  };

  const quickActions = getQuickActions();

  return (
    <Card className="fixed bottom-6 right-6 z-50 shadow-lg border-2 border-brand-200 bg-white/95 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-700">Visual Edit Mode</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-auto">

            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        
        {isExpanded &&
        <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 gap-2 min-w-[200px]">
              <div className="text-xs font-medium text-gray-500 mb-2">Quick Actions:</div>
              {quickActions.map((action, index) =>
            <Button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white text-xs h-8 justify-start`}>

                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </Button>
            )}
              
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="text-xs text-gray-500 flex items-center space-x-1">
                  <Settings className="w-3 h-3" />
                  <span>All features unlocked</span>
                </div>
              </div>
            </div>
          </div>
        }
      </CardContent>
    </Card>);

};

export default QuickAccessToolbar;