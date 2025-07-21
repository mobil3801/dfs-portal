import { useState, useEffect, useRef, useCallback } from 'react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  requiredRole: string | null;
}

interface UseOverflowNavigationProps {
  items: NavigationItem[];
  canAccessRoute: (requiredRole: string | null) => boolean;
  moreButtonWidth?: number;
  padding?: number;
}

export const useOverflowNavigation = ({
  items,
  canAccessRoute,
  moreButtonWidth = 100,
  padding = 32
}: UseOverflowNavigationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenContainerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<NavigationItem[]>([]);
  const [overflowItems, setOverflowItems] = useState<NavigationItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(true);
  const [debugMode] = useState(() => process.env.NODE_ENV === 'development');

  // Filter items based on permissions with enhanced logging
  const accessibleItems = items.filter((item) => {
    console.log(`🔐 HOOK: Checking access for "${item.name}" (role: ${item.requiredRole || 'none'})`);
    const hasAccess = canAccessRoute(item.requiredRole);
    console.log(`${hasAccess ? '✅' : '❌'} HOOK: Access check result for "${item.name}": ${hasAccess}`);
    return hasAccess;
  });

  console.log('📋 HOOK: Accessible items summary:', {
    total: items.length,
    accessible: accessibleItems.length,
    filtered: items.length - accessibleItems.length,
    accessibleItems: accessibleItems.map(item => ({
      name: item.name,
      href: item.href,
      requiredRole: item.requiredRole
    }))
  });

  const calculateOverflow = useCallback(() => {
    if (debugMode) console.log('🧮 HOOK: Starting overflow calculation');
    
    if (!containerRef.current || !hiddenContainerRef.current) {
      if (debugMode) console.log('⚠️ HOOK: Refs not ready, skipping calculation');
      return;
    }

    const container = containerRef.current;
    const hiddenContainer = hiddenContainerRef.current;
    const containerWidth = container.offsetWidth;
    const availableWidth = containerWidth - moreButtonWidth - padding;

    if (debugMode) console.log('📏 HOOK: Space calculation', {
      containerWidth,
      moreButtonWidth,
      padding,
      availableWidth
    });

    // Get widths of all items from hidden container
    const hiddenItems = Array.from(hiddenContainer.children) as HTMLElement[];
    
    if (debugMode) {
      console.log(`🔢 HOOK: Measuring ${hiddenItems.length} items against ${accessibleItems.length} accessible items`);
      if (hiddenItems.length !== accessibleItems.length) {
        console.warn('⚠️ HOOK: Mismatch between hidden items and accessible items count');
      }
    }
    
    let totalWidth = 0;
    let visibleCount = 0;

    for (let i = 0; i < hiddenItems.length; i++) {
      if (i >= accessibleItems.length) break;
      
      const item = hiddenItems[i];
      const itemWidth = item.offsetWidth + 8; // Add some margin
      
      if (debugMode && i < 5) {
        console.log(`📏 HOOK: Item ${i} (${accessibleItems[i]?.name}) width: ${itemWidth}px`);
      }
      
      if (totalWidth + itemWidth <= availableWidth) {
        totalWidth += itemWidth;
        visibleCount++;
      } else {
        if (debugMode) console.log(`🛑 HOOK: Stopping at item ${i}, total width would exceed available space`);
        break;
      }
    }

    if (debugMode) console.log('📊 HOOK: Calculation result', {
      visibleCount,
      totalWidth,
      availableWidth,
      accessibleItemsCount: accessibleItems.length
    });

    // If all items fit, don't show the More button
    if (visibleCount >= accessibleItems.length) {
      if (debugMode) console.log('✅ HOOK: All items fit, no overflow needed');
      setVisibleItems(accessibleItems);
      setOverflowItems([]);
    } else {
      // Ensure at least one item is visible if possible
      visibleCount = Math.max(0, visibleCount);
      if (debugMode) console.log(`✂️ HOOK: Splitting items - visible: ${visibleCount}, overflow: ${accessibleItems.length - visibleCount}`);
      setVisibleItems(accessibleItems.slice(0, visibleCount));
      setOverflowItems(accessibleItems.slice(visibleCount));
    }

    setIsCalculating(false);
    if (debugMode) console.log('✅ HOOK: Calculation completed successfully');
  }, [accessibleItems, moreButtonWidth, padding, debugMode]);

  // Setup ResizeObserver and initial calculation
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      setIsCalculating(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        calculateOverflow();
      }, 100);
    };

    const resizeObserver = new ResizeObserver(handleResize);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial calculation
    handleResize();

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [calculateOverflow]);

  // Recalculate when items change
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      calculateOverflow();
    }, 100);
    return () => clearTimeout(timer);
  }, [accessibleItems, calculateOverflow]);

  return {
    containerRef,
    hiddenContainerRef,
    visibleItems,
    overflowItems,
    isCalculating,
    accessibleItems,
    hasOverflow: overflowItems.length > 0
  };
};

export default useOverflowNavigation;