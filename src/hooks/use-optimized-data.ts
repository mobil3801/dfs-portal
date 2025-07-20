import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { optimizedDataService } from '@/services/optimizedDataService';

interface UseOptimizedDataOptions {
  tableId: string;
  initialParams?: any;
  autoLoad?: boolean;
  cacheDuration?: number;
  priority?: 'low' | 'medium' | 'high';
  fields?: string[];
  viewport?: {start: number;end: number;};
  onError?: (error: Error) => void;
}

interface UseOptimizedDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  invalidateCache: () => void;
  updateData: (newData: Partial<T>) => void;
  metrics: {
    cacheHit: boolean;
    responseTime: number;
    dataSize: number;
  } | null;
}

/**
 * Hook for optimized data fetching with intelligent caching and performance monitoring
 */
export function useOptimizedData<T = any>(
options: UseOptimizedDataOptions)
: UseOptimizedDataReturn<T> {
  const { toast } = useToast();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    cacheHit: boolean;
    responseTime: number;
    dataSize: number;
  } | null>(null);

  const abortController = useRef<AbortController | null>(null);
  const lastParams = useRef<any>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  /**
   * Fetch data with optimization
   */
  const fetchData = useCallback(async (params?: any, forceRefresh = false) => {
    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    setLoading(true);
    setError(null);

    const finalParams = { ...options.initialParams, ...params };
    const startTime = performance.now();

    try {
      const result = await optimizedDataService.fetchData(
        options.tableId,
        finalParams,
        {
          priority: options.priority || 'medium',
          cache: !forceRefresh,
          viewport: options.viewport,
          fields: options.fields
        }
      );

      if (result.error) {
        throw new Error(result.error);
      }

      const endTime = performance.now();
      const responseTime = endTime - startTime;
      const dataSize = JSON.stringify(result.data).length;

      setData(result.data);
      setMetrics({
        cacheHit: !!result.fromCache,
        responseTime,
        dataSize
      });

      lastParams.current = finalParams;
      retryCount.current = 0;

      // Performance warning
      if (responseTime > 2000 && !result.fromCache) {
        console.warn(`Slow data fetch detected: ${responseTime.toFixed(0)}ms for table ${options.tableId}`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';

      // Retry logic for network errors
      if (retryCount.current < maxRetries && (
      errorMessage.includes('network') || errorMessage.includes('timeout'))) {
        retryCount.current++;
        console.log(`Retrying data fetch (${retryCount.current}/${maxRetries})...`);

        // Exponential backoff
        const delay = Math.pow(2, retryCount.current) * 1000;
        setTimeout(() => {
          fetchData(params, forceRefresh);
        }, delay);

        return;
      }

      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));

      toast({
        title: 'Data Fetch Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [options, toast]);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    await fetchData(lastParams.current, true);
  }, [fetchData]);

  /**
   * Invalidate cache
   */
  const invalidateCache = useCallback(() => {
    // Force refresh on next fetch
    lastParams.current = null;
  }, []);

  /**
   * Update data optimistically
   */
  const updateData = useCallback((newData: Partial<T>) => {
    setData((prevData) => {
      if (!prevData) return newData as T;

      // Merge with existing data
      if (typeof prevData === 'object' && typeof newData === 'object') {
        return { ...prevData, ...newData };
      }

      return newData as T;
    });
  }, []);

  /**
   * Auto-load on mount
   */
  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchData();
    }

    // Cleanup on unmount
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [options.tableId, options.autoLoad]);

  /**
   * Auto-refresh based on cache duration
   */
  useEffect(() => {
    if (!data || !options.cacheDuration) return;

    const refreshTimer = setTimeout(() => {
      refresh();
    }, options.cacheDuration);

    return () => clearTimeout(refreshTimer);
  }, [data, options.cacheDuration, refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidateCache,
    updateData,
    metrics
  };
}

/**
 * Hook for paginated data with virtual scrolling support
 */
export function usePaginatedOptimizedData<T = any>({
  tableId,
  pageSize = 50,
  initialParams = {},
  priority = 'medium',
  fields,
  onError







}: {tableId: string;pageSize?: number;initialParams?: any;priority?: 'low' | 'medium' | 'high';fields?: string[];onError?: (error: Error) => void;}) {
  const { toast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const currentPage = useRef(1);
  const isLoadingMore = useRef(false);

  /**
   * Load next page
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore.current || !hasMore) return;

    isLoadingMore.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await optimizedDataService.fetchData(
        tableId,
        {
          PageNo: currentPage.current,
          PageSize: pageSize,
          ...initialParams
        },
        {
          priority,
          cache: true,
          fields
        }
      );

      if (result.error) {
        throw new Error(result.error);
      }

      const newItems = result.data?.List || [];
      const virtualCount = result.data?.VirtualCount || 0;

      setItems((prev) => [...prev, ...newItems]);
      setTotalCount(virtualCount);

      // Check if we have more data
      if (newItems.length < pageSize || currentPage.current * pageSize >= virtualCount) {
        setHasMore(false);
      } else {
        currentPage.current++;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));

      toast({
        title: 'Data Load Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  }, [tableId, pageSize, initialParams, priority, fields, hasMore, onError, toast]);

  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    setItems([]);
    setHasMore(true);
    setError(null);
    setTotalCount(0);
    currentPage.current = 1;
  }, []);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    reset();
    await loadMore();
  }, [reset, loadMore]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadMore();
  }, []);

  return {
    items,
    loading,
    hasMore,
    error,
    totalCount,
    loadMore,
    reset,
    refresh
  };
}

/**
 * Hook for real-time data with automatic updates
 */
export function useRealtimeOptimizedData<T = any>({
  tableId,
  params = {},
  updateInterval = 30000, // 30 seconds
  priority = 'high',
  fields,
  onUpdate,
  onError








}: {tableId: string;params?: any;updateInterval?: number;priority?: 'low' | 'medium' | 'high';fields?: string[];onUpdate?: (data: T) => void;onError?: (error: Error) => void;}) {
  const { data, loading, error, refresh } = useOptimizedData<T>({
    tableId,
    initialParams: params,
    priority,
    fields,
    onError
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastData = useRef<T | null>(null);

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    if (updateInterval > 0) {
      intervalRef.current = setInterval(() => {
        refresh();
      }, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateInterval, refresh]);

  /**
   * Detect data changes
   */
  useEffect(() => {
    if (data && data !== lastData.current) {
      onUpdate?.(data);
      lastData.current = data;
    }
  }, [data, onUpdate]);

  return {
    data,
    loading,
    error,
    refresh,
    isRealtime: updateInterval > 0
  };
}

export default useOptimizedData;