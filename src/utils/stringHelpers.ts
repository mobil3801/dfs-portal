/**
 * String utility functions for safe string operations
 */

/**
 * Safely checks if a value (which might not be a string) includes a search string
 * @param value - The value to check (can be any type)
 * @param searchString - The string to search for
 * @returns boolean - true if the value is a string and includes the search string
 */
export const safeIncludes = (value: any, searchString: string): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  return value.includes(searchString);
};

/**
 * Safely converts a value to string and checks if it includes a search string
 * @param value - The value to check (can be any type)
 * @param searchString - The string to search for
 * @returns boolean - true if the stringified value includes the search string
 */
export const safeStringIncludes = (value: any, searchString: string): boolean => {
  if (value == null) {
    return false;
  }
  return String(value).includes(searchString);
};

/**
 * Safely checks if a date string or Date object includes a date pattern
 * @param dateValue - The date value to check (string, Date, or any type)
 * @param searchPattern - The pattern to search for (e.g., '2024-01-01')
 * @returns boolean - true if the date includes the pattern
 */
export const safeDateIncludes = (dateValue: any, searchPattern: string): boolean => {
  if (dateValue == null) {
    return false;
  }
  
  // If it's a Date object, convert to ISO string
  if (dateValue instanceof Date) {
    return dateValue.toISOString().includes(searchPattern);
  }
  
  // If it's a string, check directly
  if (typeof dateValue === 'string') {
    return dateValue.includes(searchPattern);
  }
  
  // For other types, convert to string and check
  return String(dateValue).includes(searchPattern);
};

/**
 * Safely checks if an error object's message includes a search string
 * @param error - The error object
 * @param searchString - The string to search for
 * @returns boolean - true if the error message includes the search string
 */
export const safeErrorIncludes = (error: any, searchString: string): boolean => {
  if (!error) {
    return false;
  }
  
  // Check message property
  if (error.message && typeof error.message === 'string') {
    return error.message.includes(searchString);
  }
  
  // Check if error itself is a string
  if (typeof error === 'string') {
    return error.includes(searchString);
  }
  
  return false;
};

/**
 * Safely checks if an error object's stack includes a search string
 * @param error - The error object
 * @param searchString - The string to search for
 * @returns boolean - true if the error stack includes the search string
 */
export const safeErrorStackIncludes = (error: any, searchString: string): boolean => {
  if (!error || !error.stack) {
    return false;
  }
  
  if (typeof error.stack === 'string') {
    return error.stack.includes(searchString);
  }
  
  return false;
};
