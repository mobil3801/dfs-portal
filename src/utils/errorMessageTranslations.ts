import { type NotificationSeverity } from '@/contexts/ErrorNotificationContext';

/**
 * Interface for translated error messages
 */
export interface TranslatedError {
  title: string;
  message: string;
  severity: NotificationSeverity;
  actionable: boolean;
  actionLabel?: string;
  persistent?: boolean;
  category: 'database' | 'network' | 'validation' | 'authentication' | 'permission' | 'system' | 'business';
}

/**
 * PostgreSQL Error Code Mappings
 * Based on the PostgreSQL documentation and common error scenarios
 */
const POSTGRESQL_ERRORS: Record<string, TranslatedError> = {
  // Connection and Protocol Errors
  '08001': {
    title: 'Connection Failed',
    message: 'Unable to establish a connection to the database. Please check your internet connection and try again.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Retry Connection',
    persistent: true,
    category: 'network'
  },
  '08006': {
    title: 'Connection Lost',
    message: 'The connection to the database was lost. Your work may not be saved. Please refresh the page.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Refresh Page',
    persistent: true,
    category: 'network'
  },
  '08P01': {
    title: 'Protocol Error',
    message: 'A communication error occurred with the database. Please try again.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Try Again',
    category: 'system'
  },

  // Authentication and Authorization
  '28000': {
    title: 'Authentication Failed',
    message: 'Invalid credentials provided. Please check your login information.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Try Again',
    category: 'authentication'
  },
  '28P01': {
    title: 'Password Authentication Failed',
    message: 'The password you entered is incorrect. Please try again.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Reset Password',
    category: 'authentication'
  },

  // Data Integrity Violations
  '23505': {
    title: 'Duplicate Entry',
    message: 'This record already exists in the system. Please check your information and try again.',
    severity: 'warning',
    actionable: true,
    actionLabel: 'View Existing',
    category: 'validation'
  },
  '23503': {
    title: 'Reference Error',
    message: 'This action cannot be completed because it references data that no longer exists. Please refresh and try again.',
    severity: 'warning',
    actionable: true,
    actionLabel: 'Refresh Data',
    category: 'business'
  },
  '23502': {
    title: 'Missing Required Information',
    message: 'A required field is missing or empty. Please fill in all required information.',
    severity: 'warning',
    actionable: true,
    category: 'validation'
  },

  // Schema and Structure Errors
  '42P01': {
    title: 'Data Source Not Available',
    message: 'The requested information is temporarily unavailable. Our team has been notified.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Contact Support',
    persistent: true,
    category: 'system'
  },
  '42703': {
    title: 'Data Structure Issue',
    message: 'There is a mismatch in the expected data format. Please try refreshing the page.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Refresh Page',
    category: 'system'
  },
  '42P02': {
    title: 'System Configuration Error',
    message: 'A system configuration issue was detected. Please contact support if this persists.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Contact Support',
    category: 'system'
  },

  // Data Type and Format Errors
  '22P02': {
    title: 'Invalid Data Format',
    message: 'The data you entered is in an invalid format. Please check your input and try again.',
    severity: 'warning',
    actionable: true,
    category: 'validation'
  },
  '22003': {
    title: 'Value Out of Range',
    message: 'The value you entered is too large or too small. Please enter a valid value.',
    severity: 'warning',
    actionable: true,
    category: 'validation'
  },
  '22001': {
    title: 'Text Too Long',
    message: 'The text you entered exceeds the maximum allowed length. Please shorten your input.',
    severity: 'warning',
    actionable: true,
    category: 'validation'
  },

  // Transaction and Concurrency Errors
  '25P02': {
    title: 'Transaction Error',
    message: 'An error occurred while processing your request. Please try again.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Try Again',
    category: 'system'
  },
  '40P01': {
    title: 'Conflict Detected',
    message: 'Another user may have modified this data. Please refresh and try again.',
    severity: 'warning',
    actionable: true,
    actionLabel: 'Refresh Data',
    category: 'business'
  },
  '40001': {
    title: 'Data Conflict',
    message: 'Multiple users are trying to modify the same data. Please wait a moment and try again.',
    severity: 'warning',
    actionable: true,
    actionLabel: 'Try Again',
    category: 'business'
  },

  // Resource and Performance Errors
  '53100': {
    title: 'Storage Full',
    message: 'The system storage is full. Please contact support immediately.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Contact Support',
    persistent: true,
    category: 'system'
  },
  '53200': {
    title: 'Memory Limit Exceeded',
    message: 'The system is experiencing high load. Please try again in a few moments.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Try Again Later',
    category: 'system'
  },
  '53300': {
    title: 'Service Busy',
    message: 'The system is currently busy processing other requests. Please wait a moment and try again.',
    severity: 'warning',
    actionable: true,
    actionLabel: 'Try Again',
    category: 'system'
  },

  // Administration and Shutdown Errors
  '57P01': {
    title: 'System Maintenance',
    message: 'The system is currently undergoing maintenance. Please try again later.',
    severity: 'info',
    actionable: true,
    actionLabel: 'Check Status',
    persistent: true,
    category: 'system'
  },
  '57P02': {
    title: 'System Restart',
    message: 'The system has been restarted. Please refresh the page and try again.',
    severity: 'warning',
    actionable: true,
    actionLabel: 'Refresh Page',
    category: 'system'
  },
  '57P03': {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again in a few minutes.',
    severity: 'warning',
    actionable: true,
    actionLabel: 'Try Again Later',
    persistent: true,
    category: 'system'
  }
};

/**
 * Common Application Error Mappings
 */
const APPLICATION_ERRORS: Record<string, TranslatedError> = {
  // Network Errors
  'NETWORK_ERROR': {
    title: 'Connection Problem',
    message: 'Unable to connect to the server. Please check your internet connection.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Try Again',
    persistent: true,
    category: 'network'
  },
  'TIMEOUT_ERROR': {
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please try again.',
    severity: 'warning',
    actionable: true,
    actionLabel: 'Try Again',
    category: 'network'
  },
  'SERVER_ERROR': {
    title: 'Server Error',
    message: 'An unexpected server error occurred. Our team has been notified.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Contact Support',
    category: 'system'
  },

  // Authentication Errors
  'AUTH_INVALID_CREDENTIALS': {
    title: 'Login Failed',
    message: 'Invalid email or password. Please check your credentials and try again.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Reset Password',
    category: 'authentication'
  },
  'AUTH_SESSION_EXPIRED': {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again to continue.',
    severity: 'warning',
    actionable: true,
    actionLabel: 'Log In',
    category: 'authentication'
  },
  'AUTH_INSUFFICIENT_PERMISSIONS': {
    title: 'Access Denied',
    message: 'You do not have permission to perform this action.',
    severity: 'warning',
    actionable: true,
    actionLabel: 'Contact Administrator',
    category: 'permission'
  },

  // Validation Errors
  'VALIDATION_REQUIRED_FIELD': {
    title: 'Missing Information',
    message: 'Please fill in all required fields before continuing.',
    severity: 'warning',
    actionable: true,
    category: 'validation'
  },
  'VALIDATION_INVALID_EMAIL': {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    severity: 'warning',
    actionable: true,
    category: 'validation'
  },
  'VALIDATION_INVALID_PHONE': {
    title: 'Invalid Phone Number',
    message: 'Please enter a valid phone number.',
    severity: 'warning',
    actionable: true,
    category: 'validation'
  },

  // File Upload Errors
  'UPLOAD_FILE_TOO_LARGE': {
    title: 'File Too Large',
    message: 'The selected file is too large. Please choose a smaller file.',
    severity: 'warning',
    actionable: true,
    category: 'validation'
  },
  'UPLOAD_INVALID_FILE_TYPE': {
    title: 'Invalid File Type',
    message: 'This file type is not supported. Please select a different file.',
    severity: 'warning',
    actionable: true,
    category: 'validation'
  },
  'UPLOAD_FAILED': {
    title: 'Upload Failed',
    message: 'The file could not be uploaded. Please try again.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Try Again',
    category: 'system'
  }
};

/**
 * React/JavaScript Error Mappings
 */
const JAVASCRIPT_ERRORS: Record<string, TranslatedError> = {
  'TypeError': {
    title: 'Application Error',
    message: 'An unexpected error occurred. Please refresh the page and try again.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Refresh Page',
    category: 'system'
  },
  'ReferenceError': {
    title: 'Application Error',
    message: 'An unexpected error occurred. Please refresh the page and try again.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Refresh Page',
    category: 'system'
  },
  'ChunkLoadError': {
    title: 'Loading Error',
    message: 'Failed to load application components. Please refresh the page.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Refresh Page',
    persistent: true,
    category: 'system'
  }
};

/**
 * Main error translation function
 */
export function translateError(error: any, context?: string): TranslatedError {
  // Handle null/undefined errors
  if (!error) {
    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred. Please try again.',
      severity: 'error',
      actionable: true,
      actionLabel: 'Try Again',
      category: 'system'
    };
  }

  // Handle PostgreSQL error codes
  if (error.code && POSTGRESQL_ERRORS[error.code]) {
    const translated = POSTGRESQL_ERRORS[error.code];
    
    // Add context to message if provided
    if (context) {
      return {
        ...translated,
        message: `${translated.message} (Context: ${context})`
      };
    }
    
    return translated;
  }

  // Handle application error codes
  if (typeof error === 'string' && APPLICATION_ERRORS[error]) {
    return APPLICATION_ERRORS[error];
  }

  // Handle JavaScript errors by name
  if (error.name && JAVASCRIPT_ERRORS[error.name]) {
    return JAVASCRIPT_ERRORS[error.name];
  }

  // Handle Supabase-specific errors
  if (error.message) {
    // Network/connection errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return APPLICATION_ERRORS['NETWORK_ERROR'];
    }
    
    // Timeout errors
    if (error.message.includes('timeout')) {
      return APPLICATION_ERRORS['TIMEOUT_ERROR'];
    }
    
    // Authentication errors
    if (error.message.includes('Invalid login credentials')) {
      return APPLICATION_ERRORS['AUTH_INVALID_CREDENTIALS'];
    }
    
    if (error.message.includes('JWT expired')) {
      return APPLICATION_ERRORS['AUTH_SESSION_EXPIRED'];
    }
  }

  // Default fallback for unknown errors
  const defaultError: TranslatedError = {
    title: 'Unexpected Error',
    message: error.message || 'An unexpected error occurred. Please try again.',
    severity: 'error',
    actionable: true,
    actionLabel: 'Try Again',
    category: 'system'
  };

  // Add context if provided
  if (context) {
    defaultError.message = `${defaultError.message} (Context: ${context})`;
  }

  return defaultError;
}

/**
 * Utility function to get a user-friendly error message quickly
 */
export function getErrorMessage(error: any, context?: string): string {
  const translated = translateError(error, context);
  return translated.message;
}

/**
 * Utility function to get error title quickly
 */
export function getErrorTitle(error: any): string {
  const translated = translateError(error);
  return translated.title;
}

/**
 * Check if an error should be displayed persistently
 */
export function isErrorPersistent(error: any): boolean {
  const translated = translateError(error);
  return translated.persistent || false;
}

/**
 * Get error severity level
 */
export function getErrorSeverity(error: any): NotificationSeverity {
  const translated = translateError(error);
  return translated.severity;
}

/**
 * Check if error has actionable solutions
 */
export function isErrorActionable(error: any): boolean {
  const translated = translateError(error);
  return translated.actionable;
}

/**
 * Get error category for analytics/logging
 */
export function getErrorCategory(error: any): string {
  const translated = translateError(error);
  return translated.category;
}

/**
 * Utility function to create a standardized error object for notifications
 */
export function createNotificationFromError(error: any, context?: string) {
  const translated = translateError(error, context);
  
  return {
    title: translated.title,
    message: translated.message,
    severity: translated.severity,
    persistent: translated.persistent,
    actionLabel: translated.actionLabel,
    errorCode: error?.code || undefined
  };
}

export default translateError;