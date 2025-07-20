import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOverflowNavigation } from '@/hooks/use-overflow-navigation';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  requiredRole: string | null;
}

interface EnhancedOverflowNavigationProps {
  items: NavigationItem[];
  canAccessRoute: (requiredRole: string | null) => boolean;
  moreButtonWidth?: number;
  padding?: number;
  showLoadingIndicator?: boolean;
  loadingIndicatorComponent?: React.ReactNode;
}

const EnhancedOverflowNavigation: React.FC<EnhancedOverflowNavigationProps> = ({
  items,
  canAccessRoute,
  moreButtonWidth = 100,
  padding = 32,
  showLoadingIndicator = true,
  loadingIndicatorComponent
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    containerRef,
    hiddenContainerRef,
    visibleItems,
    overflowItems,
    isCalculating,
    accessibleItems,
    hasOverflow
  } = useOverflowNavigation({
    items,
    canAccessRoute,
    moreButtonWidth,
    padding
  });

  const isActiveRoute = (href: string) => {
    return location.pathname.startsWith(href);
  };

  const NavigationButton: React.FC<{
    item: NavigationItem;
    isOverflow?: boolean;
    isHidden?: boolean;
  }> = ({ item, isOverflow = false, isHidden = false }) => {
    const Icon = item.icon;
    const isActive = isActiveRoute(item.href);

    const handleClick = () => {
      navigate(item.href);
    };

    const baseClasses = isOverflow ?
    "flex items-center space-x-2 px-3 py-2 text-left w-full transition-colors text-sm font-medium rounded-md" :
    "flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 whitespace-nowrap text-sm font-medium hover:scale-105 min-w-fit";

    const activeClasses = isActive ?
    isOverflow ?
    "bg-blue-50 text-blue-600" :
    "bg-blue-600 text-white shadow-md" :
    isOverflow ?
    "text-gray-700 hover:bg-gray-50 hover:text-gray-900" :
    "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm";

    if (isOverflow) {
      return (
        <DropdownMenuItem
          onClick={handleClick}
          className={`${baseClasses} ${activeClasses}`}>

          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="ml-2">{item.name}</span>
        </DropdownMenuItem>);

    }

    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} ${activeClasses}`}
        style={{ visibility: isHidden ? 'hidden' : 'visible' }}
        aria-label={`Navigate to ${item.name}`}>

        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="ml-2">{item.name}</span>
      </button>);

  };

  const LoadingIndicator = () => {
    if (loadingIndicatorComponent) {
      return <>{loadingIndicatorComponent}</>;
    }

    return (
      <div className="flex items-center justify-center space-x-2 px-4 py-2">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>);

  };

  return (
    <div className="w-full relative">
      {/* Visible navigation container */}
      <div
        ref={containerRef}
        className="flex items-center justify-center space-x-1 px-4 w-full">

        {!isCalculating &&
        <>
            {/* Visible Navigation Items */}
            {visibleItems.map((item) =>
          <NavigationButton
            key={item.href}
            item={item} />

          )}

            {/* More Button for Overflow Items */}
            {hasOverflow &&
          <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium hover:bg-gray-100 hover:scale-105 min-w-fit"
                aria-label={`Show ${overflowItems.length} more navigation items`}>

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
          </>
        }
      </div>

      {/* Hidden container for measurement */}
      <div
        ref={hiddenContainerRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none overflow-hidden whitespace-nowrap"
        style={{ zIndex: -1 }}
        aria-hidden="true">

        <div className="flex items-center space-x-1 px-4">
          {accessibleItems.map((item) =>
          <NavigationButton
            key={`hidden-${item.href}`}
            item={item}
            isHidden={true} />

          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isCalculating && showLoadingIndicator &&
      <LoadingIndicator />
      }
    </div>);

};

export default EnhancedOverflowNavigation;