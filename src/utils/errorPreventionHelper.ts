import { sanitizeUserInput, sanitizeTextContent, isValidAttributeValue, removeBOM } from './sanitizeHelper';

/**
 * Utility functions to prevent InvalidCharacterError in common scenarios
 */

/**
 * Safely creates DOM elements with sanitized attributes
 */
export const safeCreateElement = (
tagName: string,
attributes: Record<string, any> = {},
textContent?: string)
: HTMLElement => {
  try {
    const element = document.createElement(tagName);

    // Set attributes safely
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const stringValue = String(value);
        if (isValidAttributeValue(stringValue)) {
          element.setAttribute(key, sanitizeTextContent(stringValue));
        }
      }
    });

    // Set text content safely
    if (textContent) {
      element.textContent = sanitizeTextContent(textContent);
    }

    return element;
  } catch (error) {
    console.error('Error creating element:', error);
    // Return a fallback div element
    const fallback = document.createElement('div');
    fallback.textContent = 'Content unavailable';
    return fallback;
  }
};

/**
 * Safely sets innerHTML with sanitized content
 */
export const safeSetInnerHTML = (element: HTMLElement, content: string): void => {
  try {
    const sanitizedContent = sanitizeTextContent(content);
    element.innerHTML = sanitizedContent;
  } catch (error) {
    console.error('Error setting innerHTML:', error);
    element.textContent = 'Content unavailable';
  }
};

/**
 * Safely handles form data to prevent InvalidCharacterError during submission
 */
export const safeProcessFormData = (formData: FormData): FormData => {
  const safeFormData = new FormData();

  try {
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        const sanitizedValue = sanitizeTextContent(removeBOM(value));
        safeFormData.append(key, sanitizedValue);
      } else {
        safeFormData.append(key, value);
      }
    }
  } catch (error) {
    console.error('Error processing form data:', error);
  }

  return safeFormData;
};

/**
 * Safely handles JSON data to prevent InvalidCharacterError
 */
export const safeJSONParse = (jsonString: string): any => {
  try {
    const cleanedString = removeBOM(jsonString);
    return JSON.parse(cleanedString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
};

/**
 * Safely handles JSON stringification
 */
export const safeJSONStringify = (data: any): string => {
  try {
    const sanitizedData = sanitizeUserInput(data);
    return JSON.stringify(sanitizedData);
  } catch (error) {
    console.error('Error stringifying JSON:', error);
    return '{}';
  }
};

/**
 * Safely handles localStorage operations
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? removeBOM(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      const sanitizedValue = sanitizeTextContent(removeBOM(value));
      localStorage.setItem(key, sanitizedValue);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

/**
 * Safely handles URL parameters
 */
export const safeURLSearchParams = (search: string): URLSearchParams => {
  try {
    const cleanedSearch = removeBOM(search);
    return new URLSearchParams(cleanedSearch);
  } catch (error) {
    console.error('Error parsing URL search params:', error);
    return new URLSearchParams();
  }
};

/**
 * Prevents InvalidCharacterError when working with file content
 */
export const safeFileReader = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const cleanContent = removeBOM(sanitizeTextContent(content));
        resolve(cleanContent);
      } catch (error) {
        console.error('Error reading file:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Safely handles clipboard operations
 */
export const safeClipboard = {
  read: async (): Promise<string> => {
    try {
      const text = await navigator.clipboard.readText();
      return removeBOM(sanitizeTextContent(text));
    } catch (error) {
      console.error('Error reading from clipboard:', error);
      return '';
    }
  },

  write: async (text: string): Promise<void> => {
    try {
      const sanitizedText = sanitizeTextContent(removeBOM(text));
      await navigator.clipboard.writeText(sanitizedText);
    } catch (error) {
      console.error('Error writing to clipboard:', error);
    }
  }
};

/**
 * Monitor for InvalidCharacterError and provide debugging information
 */
export const setupInvalidCharacterErrorMonitor = (): void => {
  // Override console.error to catch InvalidCharacterError
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    if (errorMessage.includes('InvalidCharacterError') ||
    errorMessage.includes('invalid characters')) {

      // Provide additional debugging information
      console.group('InvalidCharacterError Debug Info');
      console.error('Original error:', ...args);
      console.error('Stack trace:', new Error().stack);
      console.error('Current URL:', window.location.href);
      console.error('User agent:', navigator.userAgent);
      console.error('Form elements count:', document.forms.length);

      // Check for problematic form data
      Array.from(document.forms).forEach((form, index) => {
        console.error(`Form ${index} action:`, form.action);
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
          if (typeof value === 'string' && !isValidAttributeValue(value)) {
            console.error(`Problematic form field found - ${key}:`, value);
          }
        }
      });

      console.groupEnd();
    }

    originalError.apply(console, args);
  };

  // Monitor DOM mutations that might cause InvalidCharacterError
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;

          // Check for problematic attributes
          Array.from(element.attributes || []).forEach((attr) => {
            if (!isValidAttributeValue(attr.value)) {
              console.warn('Potentially problematic attribute detected:', {
                element: element.tagName,
                attribute: attr.name,
                value: attr.value
              });
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
  });
};

export default {
  safeCreateElement,
  safeSetInnerHTML,
  safeProcessFormData,
  safeJSONParse,
  safeJSONStringify,
  safeLocalStorage,
  safeURLSearchParams,
  safeFileReader,
  safeClipboard,
  setupInvalidCharacterErrorMonitor
};