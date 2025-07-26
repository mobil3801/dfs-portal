/**
 * Safe String Utilities for Debug Mode
 * Provides safe alternatives to common string operations that can fail with undefined/null
 */

export const safeToLowerCase = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value.toLowerCase();
  if (typeof value === 'number') return String(value).toLowerCase();
  if (typeof value === 'boolean') return String(value).toLowerCase();
  if (Array.isArray(value)) return value.join(', ').toLowerCase();
  if (typeof value === 'object') return JSON.stringify(value).toLowerCase();
  return String(value).toLowerCase();
};

export const safeString = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const debugLog = (context: string, data: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG ${context}]:`, data);
  }
};

export const errorLog = (context: string, error: any, data?: any) => {
  console.error(`[ERROR ${context}]:`, error, data ? { data } : '');
};