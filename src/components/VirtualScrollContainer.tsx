import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VirtualScrollItem {
  id: string | number;
  height?: number;
  data: any;
}

interface VirtualScrollContainerProps {
  items: VirtualScrollItem[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: VirtualScrollItem, index: number) => React.ReactNode;
  loadMore?: () => Promise<void>;
  hasMore?: boolean;
  loading?: boolean;
  overscan?: number;
  onScroll?: (scrollTop: number, isScrolling: boolean) => void;
  className?: string;
  estimatedItemSize?: number;
  getItemSize?: (index: number) => number;
}

const VirtualScrollContainer: React.FC<VirtualScrollContainerProps> = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  loadMore,
  hasMore = false,
  loading = false,
  overscan = 5,
  onScroll,
  className = '',
  estimatedItemSize,
  getItemSize
}) => {
  const { toast } = useToast();
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const itemSizeCache = useRef<Map<number, number>>(new Map());
  const totalHeightCache = useRef<number>(0);

  // Calculate dynamic item sizes if getItemSize is provided
  const getItemHeight = useCallback((index: number): number => {
    if (getItemSize) {
      if (!itemSizeCache.current.has(index)) {
        itemSizeCache.current.set(index, getItemSize(index));
      }
      return itemSizeCache.current.get(index) || estimatedItemSize || itemHeight;
    }
    return items[index]?.height || itemHeight;
  }, [getItemSize, estimatedItemSize, itemHeight, items]);

  // Calculate total height with caching
  const totalHeight = useMemo(() => {
    if (getItemSize || items.some((item) => item.height)) {
      let height = 0;
      for (let i = 0; i < items.length; i++) {
        height += getItemHeight(i);
      }
      totalHeightCache.current = height;
      return height;
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, getItemHeight, getItemSize]);

  // Find visible range with binary search for performance
  const getVisibleRange = useCallback(() => {
    if (!items.length) return { start: 0, end: 0 };

    let start = 0;
    let end = items.length - 1;
    let currentOffset = 0;

    // Binary search for start index
    let low = 0;
    let high = items.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midOffset = getMidOffset(mid);

      if (midOffset < scrollTop) {
        start = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // Find end index
    currentOffset = getMidOffset(start);
    end = start;

    while (end < items.length && currentOffset < scrollTop + containerHeight) {
      currentOffset += getItemHeight(end);
      end++;
    }

    // Apply overscan
    start = Math.max(0, start - overscan);
    end = Math.min(items.length - 1, end + overscan);

    return { start, end };
  }, [scrollTop, containerHeight, items.length, overscan, getItemHeight]);

  // Helper function to get offset at index
  const getMidOffset = useCallback((index: number): number => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  }, [getItemHeight]);

  const visibleRange = getVisibleRange();
  const offsetY = getMidOffset(visibleRange.start);

  // Handle scroll events with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    onScroll?.(newScrollTop, true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set new timeout for scroll end
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      onScroll?.(newScrollTop, false);
    }, 150);

    // Load more data when near bottom
    const threshold = 0.8;
    const isNearBottom =
    newScrollTop + containerHeight >= totalHeight * threshold;

    if (isNearBottom && hasMore && !loading && loadMore) {
      loadMore().catch((error) => {
        console.error('Failed to load more data:', error);
        toast({
          title: 'Loading Error',
          description: 'Failed to load more data. Please try again.',
          variant: 'destructive'
        });
      });
    }
  }, [onScroll, containerHeight, totalHeight, hasMore, loading, loadMore, toast]);

  // Render visible items
  const renderVisibleItems = () => {
    const visibleItems = [];

    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= items.length) break;

      const item = items[i];
      const itemTop = getMidOffset(i) - offsetY;

      visibleItems.push(
        <motion.div
          key={`${item.id}-${i}`}
          style={{
            position: 'absolute',
            top: itemTop,
            left: 0,
            right: 0,
            height: getItemHeight(i)
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}>

          {renderItem(item, i)}
        </motion.div>
      );
    }

    return visibleItems;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      itemSizeCache.current.clear();
    };
  }, []);

  // Performance monitoring
  useEffect(() => {
    const monitor = () => {
      const renderedItems = visibleRange.end - visibleRange.start + 1;
      console.log(`VirtualScroll: Rendering ${renderedItems}/${items.length} items`);

      if (renderedItems > 50) {
        console.warn('VirtualScroll: High number of rendered items, consider reducing overscan');
      }
    };

    monitor();
  }, [visibleRange, items.length]);

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}>

      {/* Virtual container with total height */}
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}>

        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'relative'
          }}>

          {renderVisibleItems()}
        </div>
        
        {/* Loading indicator */}
        {loading &&
        <motion.div
          className="flex items-center justify-center p-4"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}>

            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading more data...
          </motion.div>
        }
      </div>
      
      {/* Scroll indicator for debugging */}
      {process.env.NODE_ENV === 'development' &&
      <div
        className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs"
        style={{ zIndex: 1000 }}>

          <div>Scroll: {Math.round(scrollTop)}px</div>
          <div>Visible: {visibleRange.start}-{visibleRange.end}</div>
          <div>Total: {items.length}</div>
          <div>Height: {Math.round(totalHeight)}px</div>
          <div>Memory: {Math.round(totalHeightCache.current / 1024)}KB</div>
        </div>
      }
    </div>);

};

export default VirtualScrollContainer;

// Hook for virtual scrolling with data fetching
export const useVirtualScrollData = <T,>({
  tableId,
  pageSize = 50,
  initialParams = {}




}: {tableId: string;pageSize?: number;initialParams?: any;}) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await window.ezsite.apis.tablePage(
        tableId,
        {
          PageNo: pageRef.current,
          PageSize: pageSize,
          ...initialParams
        }
      );

      if (apiError) throw new Error(apiError);

      const newItems = data?.List || [];

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => [...prev, ...newItems]);
        pageRef.current += 1;

        if (newItems.length < pageSize) {
          setHasMore(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tableId, pageSize, initialParams, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setHasMore(true);
    setError(null);
    pageRef.current = 1;
  }, []);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []);

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  };
};