import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import { MoreHorizontal, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  requiredRole: string | null;
}

interface OverflowNavigationProps {
  items: NavigationItem[];
  canAccessRoute: (requiredRole: string | null) => boolean;
  debug?: boolean;
}

const OverflowNavigation: React.FC<OverflowNavigationProps> = ({
  items,
  canAccessRoute,
  debug = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenContainerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<NavigationItem[]>([]);
  const [overflowItems, setOverflowItems] = useState<NavigationItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [calculationAttempts, setCalculationAttempts] = useState(0);
  const [forceShowAll, setForceShowAll] = useState(false);

  // Filter items based on permissions
  const accessibleItems = items.filter((item) => canAccessRoute(item.requiredRole));

  // Debug logging
  useEffect(() => {
    if (debug) {
      console.log('OverflowNavigation Debug:', {
        totalItems: items.length,
        accessibleItems: accessibleItems.length,
        visibleItems: visibleItems.length,
        overflowItems: overflowItems.length,
        isCalculating,
        hasError,
        calculationAttempts,
        forceShowAll
      });
    }
  }, [items.length, accessibleItems.length, visibleItems.length, overflowItems.length, isCalculating, hasError, calculationAttempts, debug, forceShowAll]);

  const isActiveRoute = (href: string) => {
    return location.pathname.startsWith(href);
  };

  const calculateOverflow = useCallback(() => {
    if (!containerRef.current || !hiddenContainerRef.current) {
      // If refs aren't ready yet, try again or fallback
      if (calculationAttempts < 5) {
        setCalculationAttempts((prev) => prev + 1);
        setTimeout(() => calculateOverflow(), 50);
      } else {
        // Fallback: show all items directly
        console.log('OverflowNavigation: Refs not ready after 5 attempts, showing all items');
        setVisibleItems(accessibleItems);
        setOverflowItems([]);
        setIsCalculating(false);
        setForceShowAll(true);
      }
      return;
    }

    try {
      const container = containerRef.current;
      const hiddenContainer = hiddenContainerRef.current;

      // Reset error state
      setHasError(false);

      // Check if container is properly sized
      if (container.offsetWidth === 0) {
        // Container not ready, try again or fallback
        if (calculationAttempts < 5) {
          setCalculationAttempts((prev) => prev + 1);
          setTimeout(() => calculateOverflow(), 50);
        } else {
          // Fallback: show all items
          console.log('OverflowNavigation: Container not ready after 5 attempts, showing all items');
          setVisibleItems(accessibleItems);
          setOverflowItems([]);
          setIsCalculating(false);
          setForceShowAll(true);
        }
        return;
      }

      // Calculate available space
      const containerWidth = container.offsetWidth;
      const moreButtonWidth = 100; // Approximate width of "More" button
      const padding = 32; // Container padding
      const availableWidth = containerWidth - moreButtonWidth - padding;

      // Get widths of all items from hidden container
      const hiddenItems = Array.from(hiddenContainer.children) as HTMLElement[];
      let totalWidth = 0;
      let visibleCount = 0;

      // If no hidden items, show all accessible items
      if (hiddenItems.length === 0) {
        setVisibleItems(accessibleItems);
        setOverflowItems([]);
        setIsCalculating(false);
        return;
      }

      // Calculate how many items can fit
      for (let i = 0; i < Math.min(hiddenItems.length, accessibleItems.length); i++) {
        const item = hiddenItems[i];
        if (!item) continue;

        const itemWidth = item.offsetWidth + 8; // Add margin
        if (totalWidth + itemWidth <= availableWidth) {
          totalWidth += itemWidth;
          visibleCount++;
        } else {
          break;
        }
      }

      // If all items fit, don't show the More button
      if (visibleCount >= accessibleItems.length) {
        setVisibleItems(accessibleItems);
        setOverflowItems([]);
      } else {
        // Ensure at least one item is visible if possible
        visibleCount = Math.max(0, Math.min(visibleCount, accessibleItems.length - 1));
        setVisibleItems(accessibleItems.slice(0, visibleCount));
        setOverflowItems(accessibleItems.slice(visibleCount));
      }

      setIsCalculating(false);
      setCalculationAttempts(0);
      setForceShowAll(false);
    } catch (error) {
      console.error('Error calculating overflow:', error);
      setHasError(true);
      // Fallback: show all items
      setVisibleItems(accessibleItems);
      setOverflowItems([]);
      setIsCalculating(false);
      setForceShowAll(true);
    }
  }, [accessibleItems, calculationAttempts]);

  // Initial calculation and resize handling
  useEffect(() => {
    const handleResize = () => {
      setIsCalculating(true);
      setCalculationAttempts(0);
      setForceShowAll(false);
      const timer = setTimeout(() => {
        calculateOverflow();
      }, 50);
      return () => clearTimeout(timer);
    };

    // Use ResizeObserver for better detection
    let resizeObserver: ResizeObserver | null = null;

    try {
      resizeObserver = new ResizeObserver(handleResize);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    } catch (error) {
      console.warn('ResizeObserver not available, falling back to window resize');
      window.addEventListener('resize', handleResize);
    }

    // Initial calculation
    const timer = setTimeout(() => {
      calculateOverflow();
    }, 100);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
      clearTimeout(timer);
    };
  }, [calculateOverflow]);

  // Recalculate when items change
  useEffect(() => {
    setIsCalculating(true);
    setCalculationAttempts(0);
    setForceShowAll(false);
    const timer = setTimeout(() => {
      calculateOverflow();
    }, 50);
    return () => clearTimeout(timer);
  }, [accessibleItems, calculateOverflow]);

  // Emergency fallback: if calculation takes too long, show all items
  useEffect(() => {
    if (isCalculating) {
      const emergencyTimer = setTimeout(() => {
        console.log('OverflowNavigation: Emergency fallback - showing all items');
        setVisibleItems(accessibleItems);
        setOverflowItems([]);
        setIsCalculating(false);
        setForceShowAll(true);
      }, 2000); // 2 seconds max calculation time

      return () => clearTimeout(emergencyTimer);
    }
  }, [isCalculating, accessibleItems]);

  // If no accessible items, show nothing
  if (accessibleItems.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm">
        {debug && <span>No accessible navigation items</span>}
      </div>);

  }

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
        data-testid={`nav-${item.name.toLowerCase()}`}>

        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="ml-2">{item.name}</span>
      </button>);

  };

  return (
    <div className="w-full relative">
      {/* Visible navigation container */}
      <div
        ref={containerRef}
        className="flex items-center justify-center space-x-1 px-4 w-full">

        {/* Error State */}
        {hasError &&
        <div className="flex items-center space-x-2 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Navigation error - showing fallback</span>
          </div>
        }

        {/* Show content based on state */}
        {!isCalculating && !hasError &&
        <>
            {/* Visible Navigation Items */}
            {(forceShowAll ? accessibleItems : visibleItems).map((item) =>
          <NavigationButton
            key={item.href}
            item={item} />

          )}

            {/* More Button for Overflow Items */}
            {!forceShowAll && overflowItems.length > 0 &&
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
          </>
        }

        {/* Fallback: Show all items if calculation fails */}
        {hasError &&
        <div className="flex items-center space-x-1 flex-wrap justify-center">
            {accessibleItems.map((item) =>
          <NavigationButton
            key={item.href}
            item={item} />

          )}
          </div>
        }
      </div>

      {/* Hidden container for measurement */}
      <div
        ref={hiddenContainerRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none overflow-hidden whitespace-nowrap"
        style={{ zIndex: -1 }}>

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
      {isCalculating && !hasError &&
      <div className="flex items-center justify-center space-x-2 px-4 py-2">
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      }

      {/* Debug information */}
      {debug &&
      <div className="absolute top-full left-0 right-0 bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-800 z-10">
          <div>Items: {accessibleItems.length} | Visible: {visibleItems.length} | Overflow: {overflowItems.length}</div>
          <div>Calculating: {isCalculating ? 'Yes' : 'No'} | Error: {hasError ? 'Yes' : 'No'} | Attempts: {calculationAttempts}</div>
          <div>ForceShowAll: {forceShowAll ? 'Yes' : 'No'}</div>
        </div>
      }
    </div>);

};

export default OverflowNavigation;