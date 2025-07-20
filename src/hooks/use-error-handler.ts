import React, { useCallback } from 'react';
import { useToast } from './use-toast';
import { ErrorLogger } from '@/services/errorLogger';

interface UseErrorHandlerOptions {
  component?: string;
  showToast?: boolean;
  logError?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { toast } = useToast();
  const errorLogger = ErrorLogger.getInstance();

  const {
    component = 'Unknown Component',
    showToast = true,
    logError = true,
    severity = 'medium'
  } = options;

  const handleError = useCallback((
  error: Error | string,
  customMessage?: string,
  context?: Record<string, any>) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Log the error
    if (logError) {
      errorLogger.log(
        errorObj,
        severity,
        component,
        undefined,
        context
      );
    }

    // Show toast notification
    if (showToast) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: customMessage || errorObj.message || 'An unexpected error occurred'
      });
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${component}] Error:`, errorObj);
      if (context) {
        console.error('Context:', context);
      }
    }
  }, [component, showToast, logError, severity, toast, errorLogger]);

  // Async wrapper that automatically handles errors
  const handleAsync = useCallback(async <T,>(
  asyncFn: () => Promise<T>,
  errorMessage?: string,
  context?: Record<string, any>)
  : Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error(String(error)),
        errorMessage,
        context
      );
      return null;
    }
  }, [handleError]);

  // API call wrapper with built-in error handling
  const handleApiCall = useCallback(async <T,>(
  apiCall: () => Promise<{data?: T;error?: string;}>,
  errorMessage?: string,
  context?: Record<string, any>)
  : Promise<T | null> => {
    try {
      const result = await apiCall();

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data || null;
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error(String(error)),
        errorMessage,
        context
      );
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsync,
    handleApiCall
  };
};

// HOC for wrapping components with error handling
export const withErrorHandler = <P extends object,>(
Component: React.ComponentType<P>,
errorHandlerOptions?: UseErrorHandlerOptions) => {
  return React.forwardRef<any, P & {errorHandler?: ReturnType<typeof useErrorHandler>;}>((props, ref) => {
    const errorHandler = useErrorHandler(errorHandlerOptions);

    return React.createElement(Component, {
      ...props,
      ref,
      errorHandler
    });
  });
};

export default useErrorHandler;