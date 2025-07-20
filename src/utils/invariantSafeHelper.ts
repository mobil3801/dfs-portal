/**
 * Utility functions to prevent common React invariant violations
 */
import React from 'react';

// Safe key generation for React lists
export const generateSafeKey = (item: any, index: number, prefix = 'item'): string => {
  if (item && typeof item === 'object') {
    // Try to use a unique identifier from the object
    const id = item.id || item.ID || item.key || item._id;
    if (id !== undefined && id !== null) {
      return `${prefix}_${id}`;
    }
  }

  // Fallback to index with timestamp for pseudo-uniqueness
  return `${prefix}_${index}_${Date.now()}`;
};

// Validate and sanitize props before rendering
export const sanitizeProps = (props: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  Object.keys(props).forEach((key) => {
    const value = props[key];

    // Skip undefined, null, or function values that shouldn't be passed as props
    if (value === undefined || value === null) {
      return;
    }

    // Handle special React props
    if (key === 'key' || key === 'ref') {
      // Ensure key is a string
      if (key === 'key' && typeof value !== 'string') {
        sanitized[key] = String(value);
      } else {
        sanitized[key] = value;
      }
      return;
    }

    // Handle className specifically
    if (key === 'className') {
      if (Array.isArray(value)) {
        sanitized[key] = value.filter(Boolean).join(' ');
      } else if (typeof value === 'string') {
        sanitized[key] = value;
      }
      return;
    }

    // Handle style objects
    if (key === 'style' && typeof value === 'object') {
      sanitized[key] = { ...value };
      return;
    }

    // For all other props, just copy them over
    sanitized[key] = value;
  });

  return sanitized;
};

// Safe wrapper for array mapping that ensures proper keys
export const safeMap = <T, R>(
array: T[],
mapFn: (item: T, index: number) => R,
keyExtractor?: (item: T, index: number) => string)
: R[] => {
  if (!Array.isArray(array)) {
    console.warn('safeMap: Expected array but received:', typeof array);
    return [];
  }

  return array.map((item, index) => {
    try {
      const result = mapFn(item, index);

      // If the result is a React element and doesn't have a key, add one
      if (
      result &&
      typeof result === 'object' &&
      'type' in result &&
      !('key' in result && result.key))
      {
        const key = keyExtractor ? keyExtractor(item, index) : generateSafeKey(item, index);
        return { ...result, key };
      }

      return result;
    } catch (error) {
      console.error(`Error in safeMap at index ${index}:`, error);
      return null as R;
    }
  }).filter(Boolean);
};

// Safe component wrapper that adds error boundaries
export const withInvariantSafety = <P extends object,>(
Component: React.ComponentType<P>) =>
{
  const SafeComponent = (props: P) => {
    try {
      const sanitizedProps = sanitizeProps(props as Record<string, any>) as P;
      return React.createElement(Component, sanitizedProps);
    } catch (error) {
      console.error('Component rendering error:', error);

      // Return a safe fallback using React.createElement to avoid JSX syntax issues
      return React.createElement('div',
      { className: 'p-4 border border-red-200 bg-red-50 rounded-md' },
      React.createElement('p',
      { className: 'text-red-800 text-sm' },
      'Component failed to render safely. Please check the props.'
      ),
      process.env.NODE_ENV === 'development' ?
      React.createElement('details',
      { className: 'mt-2' },
      React.createElement('summary',
      { className: 'text-xs cursor-pointer' },
      'Error Details'
      ),
      React.createElement('pre',
      { className: 'text-xs mt-1 p-2 bg-red-100 rounded overflow-auto' },
      error instanceof Error ? error.message : String(error)
      )
      ) : null
      );
    }
  };

  SafeComponent.displayName = `InvariantSafe(${Component.displayName || Component.name})`;
  return SafeComponent;
};

// Validate DOM nesting to prevent hydration mismatches
export const validateDOMNesting = (parent: string, child: string): boolean => {
  const invalidNesting = {
    p: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article'],
    span: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    a: ['a', 'button'],
    button: ['a', 'button', 'input'],
    table: ['tr', 'td', 'th'], // tr, td, th should be inside tbody, thead, etc.
    ul: ['tr', 'td', 'th'],
    ol: ['tr', 'td', 'th']
  };

  const invalidChildren = invalidNesting[parent as keyof typeof invalidNesting];
  if (invalidChildren && invalidChildren.includes(child)) {
    console.warn(`Invalid DOM nesting: <${child}> inside <${parent}>`);
    return false;
  }

  return true;
};

// Safe ref callback that handles cleanup
export const createSafeRef = <T,>(callback?: (instance: T | null) => void) => {
  return (instance: T | null) => {
    try {
      if (callback) {
        callback(instance);
      }
    } catch (error) {
      console.error('Ref callback error:', error);
    }
  };
};

// Batch state updates to prevent multiple renders
export const batchUpdates = (updates: (() => void)[]) => {
  // In React 18, automatic batching is enabled, but we can still be explicit
  if (typeof (window as any).ReactDOM?.unstable_batchedUpdates === 'function') {
    (window as any).ReactDOM.unstable_batchedUpdates(() => {
      updates.forEach((update) => update());
    });
  } else {
    // Fallback for newer React versions or when unstable_batchedUpdates is not available
    updates.forEach((update) => update());
  }
};

// Detect and prevent infinite re-renders
export const createRenderCounter = (componentName: string, maxRenders = 50) => {
  let renderCount = 0;
  let lastReset = Date.now();

  return () => {
    const now = Date.now();

    // Reset counter every second
    if (now - lastReset > 1000) {
      renderCount = 0;
      lastReset = now;
    }

    renderCount++;

    if (renderCount > maxRenders) {
      console.error(
        `Possible infinite re-render detected in ${componentName}. ` +
        `Rendered ${renderCount} times in the last second.`
      );

      // Throw an error to break the infinite loop
      throw new Error(
        `Infinite re-render prevented in ${componentName}. ` +
        `Component has rendered ${renderCount} times in 1 second.`
      );
    }
  };
};

// Safe event handler wrapper
export const createSafeEventHandler = <T extends Event,>(
handler: (event: T) => void,
errorHandler?: (error: Error, event: T) => void) =>
{
  return (event: T) => {
    try {
      handler(event);
    } catch (error) {
      console.error('Event handler error:', error);

      if (errorHandler) {
        errorHandler(error as Error, event);
      }
    }
  };
};

export default {
  generateSafeKey,
  sanitizeProps,
  safeMap,
  withInvariantSafety,
  validateDOMNesting,
  createSafeRef,
  batchUpdates,
  createRenderCounter,
  createSafeEventHandler
};