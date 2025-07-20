import { useCallback, useEffect, useRef } from 'react';
import useMemoryLeakDetector from './use-memory-leak-detector';

export interface SafeAsyncOptions {
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

export function useSafeAsync(componentName: string, options: SafeAsyncOptions = {}) {
  const {
    onError,
    retryCount = 0,
    retryDelay = 1000,
    timeout = 30000
  } = options;

  const memoryTools = useMemoryLeakDetector(componentName);
  const activeRequests = useRef<Set<AbortController>>(new Set());
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Cancel all active requests
      activeRequests.current.forEach((controller) => controller.abort());
      activeRequests.current.clear();
    };
  }, []);

  const safeAsync = useCallback(async <T,>(
  asyncFn: (signal: AbortSignal) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    retries?: number;
  } = {})
  : Promise<T | null> => {
    const controller = new AbortController();
    activeRequests.current.add(controller);

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const executeWithRetry = async (attempt: number): Promise<T> => {
        try {
          if (controller.signal.aborted) {
            throw new Error('Operation was cancelled');
          }

          const result = await asyncFn(controller.signal);

          if (!isMounted.current) {
            console.warn(`Async operation completed after component unmount: ${componentName}`);
            return result;
          }

          return result;
        } catch (error) {
          if (controller.signal.aborted) {
            throw new Error('Operation was cancelled');
          }

          const retriesLeft = (options.retries ?? retryCount) - attempt;
          if (retriesLeft > 0 && isMounted.current) {
            console.log(`Retrying async operation (${attempt + 1}/${options.retries ?? retryCount + 1}) in ${retryDelay}ms`);

            await new Promise((resolve) =>
            memoryTools.safeSetTimeout(() => resolve(void 0), retryDelay)
            );

            if (isMounted.current && !controller.signal.aborted) {
              return executeWithRetry(attempt + 1);
            }
          }

          throw error;
        }
      };

      const result = await executeWithRetry(0);

      if (isMounted.current && options.onSuccess) {
        memoryTools.safeSetState(() => options.onSuccess!(result));
      }

      return result;

    } catch (error) {
      const err = error as Error;

      if (err.message !== 'Operation was cancelled') {
        console.error(`Safe async error in ${componentName}:`, err);

        if (isMounted.current) {
          const errorHandler = options.onError || onError;
          if (errorHandler) {
            memoryTools.safeSetState(() => errorHandler(err));
          }
        }
      }

      return null;
    } finally {
      clearTimeout(timeoutId);
      activeRequests.current.delete(controller);
    }
  }, [componentName, memoryTools, onError, retryCount, retryDelay, timeout]);

  const safeApiCall = useCallback(async <T,>(
  apiCall: () => Promise<{data?: T;error?: string;}>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    showToast?: boolean;
  } = {})
  : Promise<{data?: T;error?: string;}> => {
    return memoryTools.trackAsyncOperation(async (signal) => {
      try {
        const result = await apiCall();

        if (signal.aborted) {
          return { error: 'Operation was cancelled' };
        }

        if (result.error) {
          if (options.onError && isMounted.current) {
            memoryTools.safeSetState(() => options.onError!(result.error!));
          }
          return result;
        }

        if (result.data && options.onSuccess && isMounted.current) {
          memoryTools.safeSetState(() => options.onSuccess!(result.data!));
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        if (options.onError && isMounted.current) {
          memoryTools.safeSetState(() => options.onError!(errorMessage));
        }

        return { error: errorMessage };
      }
    });
  }, [memoryTools]);

  const cancelAllRequests = useCallback(() => {
    activeRequests.current.forEach((controller) => controller.abort());
    activeRequests.current.clear();
  }, []);

  const getActiveRequestCount = useCallback(() => {
    return activeRequests.current.size;
  }, []);

  return {
    safeAsync,
    safeApiCall,
    cancelAllRequests,
    getActiveRequestCount,
    isComponentMounted: () => isMounted.current
  };
}

// Higher-order component for automatic safe async handling
export function withSafeAsync<P extends object>(
WrappedComponent: React.ComponentType<P>,
componentName?: string)
{
  return function SafeAsyncComponent(props: P) {
    const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const safeAsync = useSafeAsync(displayName);

    return <WrappedComponent {...props} safeAsync={safeAsync} />;
  };
}

export default useSafeAsync;