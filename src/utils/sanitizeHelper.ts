/**
 * Utility functions to sanitize data and prevent InvalidCharacterError
 */

/**
 * Sanitizes strings to be safe for use as HTML element IDs
 * @param str The string to sanitize
 * @returns A sanitized string safe for use as an element ID
 */
export const sanitizeElementId = (str: string): string => {
  if (!str) return '';

  // Remove or replace invalid characters for HTML IDs
  // HTML IDs must start with a letter and can only contain letters, digits, hyphens, and underscores
  return str.
  replace(/[^a-zA-Z0-9\-_]/g, '_') // Replace invalid chars with underscore
  .replace(/^[^a-zA-Z]/, 'id_') // Ensure it starts with a letter
  .substring(0, 50); // Limit length
};

/**
 * Sanitizes strings to be safe for use as CSS class names
 * @param str The string to sanitize
 * @returns A sanitized string safe for use as a CSS class
 */
export const sanitizeClassName = (str: string): string => {
  if (!str) return '';

  // CSS class names should not contain special characters
  return str.
  replace(/[^a-zA-Z0-9\-_]/g, '-').
  replace(/^[^a-zA-Z]/, 'class-').
  substring(0, 50);
};

/**
 * Sanitizes text content to prevent HTML injection and invalid characters
 * @param str The string to sanitize
 * @returns A sanitized string safe for display
 */
export const sanitizeTextContent = (str: string): string => {
  if (!str) return '';

  // Escape HTML entities and remove control characters
  return str.
  replace(/&/g, '&amp;').
  replace(/</g, '&lt;').
  replace(/>/g, '&gt;').
  replace(/"/g, '&quot;').
  replace(/'/g, '&#x27;').
  replace(/\//g, '&#x2F;').
  replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
};

/**
 * Sanitizes form field names to be safe for use in forms
 * @param str The string to sanitize
 * @returns A sanitized string safe for use as a form field name
 */
export const sanitizeFieldName = (str: string): string => {
  if (!str) return '';

  return str.
  replace(/[^a-zA-Z0-9_]/g, '_').
  replace(/^[^a-zA-Z]/, 'field_').
  substring(0, 50);
};

/**
 * Validates and sanitizes data attribute values
 * @param value The value to sanitize
 * @returns A sanitized value safe for use in data attributes
 */
export const sanitizeDataAttribute = (value: any): string => {
  if (value === null || value === undefined) return '';

  const str = String(value);
  // Data attributes should not contain quotes or control characters
  return str.
  replace(/"/g, '&quot;').
  replace(/'/g, '&#x27;').
  replace(/[\x00-\x1F\x7F-\x9F]/g, '');
};

/**
 * Creates a safe component key from any string
 * @param str The string to convert to a safe key
 * @param prefix Optional prefix for the key
 * @returns A safe key for React components
 */
export const createSafeKey = (str: string, prefix = 'item'): string => {
  if (!str) return `${prefix}_${Date.now()}`;

  return `${prefix}_${str.
  replace(/[^a-zA-Z0-9]/g, '_').
  substring(0, 30)}_${Date.now()}`;
};

/**
 * Removes BOM (Byte Order Mark) and other problematic Unicode characters
 * @param str The string to clean
 * @returns A cleaned string
 */
export const removeBOM = (str: string): string => {
  if (!str) return '';

  // Remove BOM and other problematic Unicode characters
  return str.
  replace(/^\uFEFF/, '') // Remove BOM
  .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''); // Remove control characters
};

/**
 * Validates if a string is safe for use in HTML attributes
 * @param str The string to validate
 * @returns true if the string is safe, false otherwise
 */
export const isValidAttributeValue = (str: string): boolean => {
  if (!str) return true;

  // Check for problematic characters
  const problemChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/;
  return !problemChars.test(str);
};

/**
 * Comprehensive sanitization for any user input
 * @param input The input to sanitize
 * @returns A sanitized version of the input
 */
export const sanitizeUserInput = (input: any): any => {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    return removeBOM(sanitizeTextContent(input));
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeUserInput);
  }

  if (typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      const sanitizedKey = sanitizeFieldName(key);
      sanitized[sanitizedKey] = sanitizeUserInput(value);
    }
    return sanitized;
  }

  return input;
};

export default {
  sanitizeElementId,
  sanitizeClassName,
  sanitizeTextContent,
  sanitizeFieldName,
  sanitizeDataAttribute,
  createSafeKey,
  removeBOM,
  isValidAttributeValue,
  sanitizeUserInput
};