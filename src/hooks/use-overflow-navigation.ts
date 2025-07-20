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

  // Filter items based on permissions
  const accessibleItems = items.filter((item) => canAccessRoute(item.requiredRole));

  const calculateOverflow = useCallback(() => {
    if (!containerRef.current || !hiddenContainerRef.current) return;

    const container = containerRef.current;
    const hiddenContainer = hiddenContainerRef.current;
    const containerWidth = container.offsetWidth;
    const availableWidth = containerWidth - moreButtonWidth - padding;

    // Get widths of all items from hidden container
    const hiddenItems = Array.from(hiddenContainer.children) as HTMLElement[];
    let totalWidth = 0;
    let visibleCount = 0;

    for (let i = 0; i < hiddenItems.length; i++) {
      const itemWidth = hiddenItems[i].offsetWidth + 8; // Add some margin
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
      visibleCount = Math.max(0, visibleCount);
      setVisibleItems(accessibleItems.slice(0, visibleCount));
      setOverflowItems(accessibleItems.slice(visibleCount));
    }

    setIsCalculating(false);
  }, [accessibleItems, moreButtonWidth, padding]);

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