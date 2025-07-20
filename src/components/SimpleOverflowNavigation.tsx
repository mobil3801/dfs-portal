import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  requiredRole: string | null;
}

interface SimpleOverflowNavigationProps {
  items: NavigationItem[];
  canAccessRoute: (requiredRole: string | null) => boolean;
  maxVisibleItems?: number;
}

const SimpleOverflowNavigation: React.FC<SimpleOverflowNavigationProps> = ({
  items,
  canAccessRoute,
  maxVisibleItems = 6
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Filter items based on permissions
  const accessibleItems = items.filter((item) => canAccessRoute(item.requiredRole));

  // Simple approach: show first N items, put rest in overflow
  const visibleItems = accessibleItems.slice(0, maxVisibleItems);
  const overflowItems = accessibleItems.slice(maxVisibleItems);

  const isActiveRoute = (href: string) => {
    return location.pathname.startsWith(href);
  };

  const NavigationButton: React.FC<{
    item: NavigationItem;
    isOverflow?: boolean;
  }> = ({ item, isOverflow = false }) => {
    const Icon = item.icon;
    const isActive = isActiveRoute(item.href);

    const handleClick = () => {
      navigate(item.href);
    };

    if (isOverflow) {
      return (
        <DropdownMenuItem
          onClick={handleClick}
          className={`flex items-center space-x-2 px-3 py-2 text-left w-full transition-colors text-sm font-medium rounded-md ${
          isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`
          }>
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="ml-2">{item.name}</span>
        </DropdownMenuItem>);

    }

    return (
      <button
        onClick={handleClick}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 whitespace-nowrap text-sm font-medium hover:scale-105 min-w-fit ${
        isActive ?
        'bg-blue-600 text-white shadow-md' :
        'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'}`
        }
        data-testid={`nav-${item.name.toLowerCase()}`}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="ml-2">{item.name}</span>
      </button>);

  };

  // If no accessible items, show nothing
  if (accessibleItems.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm">
        <span>No accessible navigation items</span>
      </div>);

  }

  return (
    <div className="flex items-center justify-center space-x-1 px-4 w-full">
      {/* Visible Navigation Items */}
      {visibleItems.map((item) =>
      <NavigationButton
        key={item.href}
        item={item} />
      )}

      {/* More Button for Overflow Items */}
      {overflowItems.length > 0 &&
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-1 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium hover:bg-gray-100 hover:scale-105 min-w-fit">
              <MoreHorizontal className="h-4 w-4" />
              <span className="ml-1">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {overflowItems.map((item) =>
          <NavigationButton
            key={item.href}
            item={item}
            isOverflow={true} />
          )}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    </div>);

};

export default SimpleOverflowNavigation;