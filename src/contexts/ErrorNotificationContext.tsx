import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';

/**
 * Notification severity levels
 */
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

/**
 * Notification interface
 */
export interface ErrorNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  duration?: number; // Auto-dismiss duration in ms (null = manual dismiss only)
  actionLabel?: string;
  actionCallback?: () => void;
  errorCode?: string; // For technical reference
  timestamp: Date;
  dismissed: boolean;
  persistent?: boolean; // If true, won't auto-dismiss
}

/**
 * Context state interface
 */
interface ErrorNotificationState {
  notifications: ErrorNotification[];
  maxNotifications: number;
}

/**
 * Context actions
 */
type ErrorNotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<ErrorNotification, 'id' | 'timestamp' | 'dismissed'> }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'DISMISS_ALL' }
  | { type: 'AUTO_DISMISS_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_OLD_NOTIFICATIONS' };

/**
 * Context interface
 */
interface ErrorNotificationContextType {
  notifications: ErrorNotification[];
  addNotification: (notification: Omit<ErrorNotification, 'id' | 'timestamp' | 'dismissed'>) => string;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  
  // Convenience methods for common notification types
  showError: (title: string, message: string, options?: Partial<ErrorNotification>) => string;
  showWarning: (title: string, message: string, options?: Partial<ErrorNotification>) => string;
  showSuccess: (title: string, message: string, options?: Partial<ErrorNotification>) => string;
  showInfo: (title: string, message: string, options?: Partial<ErrorNotification>) => string;
  
  // Database-specific error handling
  showDatabaseError: (error: any, context?: string) => string;
  showConnectionError: (message?: string) => string;
}

const ErrorNotificationContext = createContext<ErrorNotificationContextType | undefined>(undefined);

/**
 * Initial state
 */
const initialState: ErrorNotificationState = {
  notifications: [],
  maxNotifications: 5 // Limit to prevent UI overflow
};

/**
 * Reducer for managing notification state
 */
function errorNotificationReducer(
  state: ErrorNotificationState,
  action: ErrorNotificationAction
): ErrorNotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotification: ErrorNotification = {
        ...action.payload,
        id: generateNotificationId(),
        timestamp: new Date(),
        dismissed: false
      };

      // Remove oldest notifications if we exceed the maximum
      const notifications = state.notifications.length >= state.maxNotifications
        ? state.notifications.slice(1)
        : state.notifications;

      return {
        ...state,
        notifications: [...notifications, newNotification]
      };
    }

    case 'DISMISS_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, dismissed: true }
            : notification
        )
      };
    }

    case 'AUTO_DISMISS_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
    }

    case 'DISMISS_ALL': {
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          dismissed: true
        }))
      };
    }

    case 'CLEAR_OLD_NOTIFICATIONS': {
      const now = new Date();
      const FIVE_MINUTES_AGO = now.getTime() - (5 * 60 * 1000);

      return {
        ...state,
        notifications: state.notifications.filter(
          notification => 
            !notification.dismissed || 
            notification.timestamp.getTime() > FIVE_MINUTES_AGO
        )
      };
    }

    default:
      return state;
  }
}

/**
 * Generate a unique notification ID
 */
function generateNotificationId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default notification durations by severity
 */
const DEFAULT_DURATIONS = {
  success: 4000,
  info: 6000,
  warning: 8000,
  error: 0 // Manual dismiss for errors
};

/**
 * Error Notification Provider Component
 */
export const ErrorNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(errorNotificationReducer, initialState);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Clean up timeouts on unmount
   */
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  /**
   * Periodic cleanup of old dismissed notifications
   */
  useEffect(() => {
    const cleanup = setInterval(() => {
      dispatch({ type: 'CLEAR_OLD_NOTIFICATIONS' });
    }, 60000); // Run every minute

    return () => clearInterval(cleanup);
  }, []);

  /**
   * Add a new notification
   */
  const addNotification = useCallback((
    notification: Omit<ErrorNotification, 'id' | 'timestamp' | 'dismissed'>
  ): string => {
    const id = generateNotificationId();
    
    dispatch({ 
      type: 'ADD_NOTIFICATION', 
      payload: {
        ...notification,
        duration: notification.duration ?? DEFAULT_DURATIONS[notification.severity]
      }
    });

    // Set up auto-dismiss if duration is specified
    const duration = notification.duration ?? DEFAULT_DURATIONS[notification.severity];
    if (duration > 0 && !notification.persistent) {
      const timeout = setTimeout(() => {
        dispatch({ type: 'AUTO_DISMISS_NOTIFICATION', payload: id });
        timeoutsRef.current.delete(id);
      }, duration);
      
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, []);

  /**
   * Dismiss a notification
   */
  const dismissNotification = useCallback((id: string) => {
    // Cancel auto-dismiss timeout if it exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    dispatch({ type: 'DISMISS_NOTIFICATION', payload: id });
    
    // Remove from DOM after animation
    setTimeout(() => {
      dispatch({ type: 'AUTO_DISMISS_NOTIFICATION', payload: id });
    }, 300); // Allow for dismiss animation
  }, []);

  /**
   * Dismiss all notifications
   */
  const dismissAll = useCallback(() => {
    // Cancel all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();

    dispatch({ type: 'DISMISS_ALL' });
    
    // Remove from DOM after animation
    setTimeout(() => {
      dispatch({ type: 'CLEAR_OLD_NOTIFICATIONS' });
    }, 300);
  }, []);

  /**
   * Convenience method for error notifications
   */
  const showError = useCallback((
    title: string, 
    message: string, 
    options: Partial<ErrorNotification> = {}
  ): string => {
    return addNotification({
      title,
      message,
      severity: 'error',
      ...options
    });
  }, [addNotification]);

  /**
   * Convenience method for warning notifications
   */
  const showWarning = useCallback((
    title: string, 
    message: string, 
    options: Partial<ErrorNotification> = {}
  ): string => {
    return addNotification({
      title,
      message,
      severity: 'warning',
      ...options
    });
  }, [addNotification]);

  /**
   * Convenience method for success notifications
   */
  const showSuccess = useCallback((
    title: string, 
    message: string, 
    options: Partial<ErrorNotification> = {}
  ): string => {
    return addNotification({
      title,
      message,
      severity: 'success',
      ...options
    });
  }, [addNotification]);

  /**
   * Convenience method for info notifications
   */
  const showInfo = useCallback((
    title: string, 
    message: string, 
    options: Partial<ErrorNotification> = {}
  ): string => {
    return addNotification({
      title,
      message,
      severity: 'info',
      ...options
    });
  }, [addNotification]);

  /**
   * Show database-specific errors with user-friendly messages
   */
  const showDatabaseError = useCallback((error: any, context?: string): string => {
    let title = 'Database Error';
    let message = 'An error occurred while accessing the database.';
    let errorCode: string | undefined;

    if (error?.code) {
      errorCode = error.code;
      
      // Handle specific PostgreSQL error codes
      switch (error.code) {
        case '42P01':
          title = 'Table Not Found';
          message = 'The requested data table is not available. Please contact support if this persists.';
          break;
        case '42703':
          title = 'Data Structure Issue';
          message = 'There is a mismatch in the expected data structure. Please try refreshing or contact support.';
          break;
        case '23505':
          title = 'Duplicate Entry';
          message = 'This record already exists. Please check your input and try again.';
          break;
        case '23503':
          title = 'Invalid Reference';
          message = 'This action references data that no longer exists. Please refresh and try again.';
          break;
        case '08001':
        case '08006':
          title = 'Connection Issue';
          message = 'Unable to connect to the database. Please check your internet connection and try again.';
          break;
        case '53300':
          title = 'Service Busy';
          message = 'The database service is currently busy. Please wait a moment and try again.';
          break;
        default:
          if (error.message) {
            message = `Database error: ${error.message}`;
          }
      }
    } else if (error?.message) {
      message = error.message;
    }

    if (context) {
      message += ` (Context: ${context})`;
    }

    return showError(title, message, {
      errorCode,
      persistent: true, // Database errors should be manually dismissed
      actionLabel: 'View Details',
      actionCallback: () => {
        console.group('Database Error Details');
        console.error('Error object:', error);
        console.error('Context:', context);
        console.groupEnd();
      }
    });
  }, [showError]);

  /**
   * Show connection-specific errors
   */
  const showConnectionError = useCallback((message?: string): string => {
    return showError(
      'Connection Error',
      message || 'Unable to connect to the server. Please check your internet connection and try again.',
      {
        persistent: true,
        actionLabel: 'Retry',
        actionCallback: () => window.location.reload()
      }
    );
  }, [showError]);

  const contextValue: ErrorNotificationContextType = {
    notifications: state.notifications,
    addNotification,
    dismissNotification,
    dismissAll,
    showError,
    showWarning,
    showSuccess,
    showInfo,
    showDatabaseError,
    showConnectionError
  };

  return (
    <ErrorNotificationContext.Provider value={contextValue}>
      {children}
    </ErrorNotificationContext.Provider>
  );
};

/**
 * Hook to use the Error Notification context
 */
export const useErrorNotification = (): ErrorNotificationContextType => {
  const context = useContext(ErrorNotificationContext);
  
  if (context === undefined) {
    throw new Error('useErrorNotification must be used within an ErrorNotificationProvider');
  }
  
  return context;
};

/**
 * Export the context for advanced usage
 */
export { ErrorNotificationContext };