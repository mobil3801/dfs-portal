/**
 * Safely checks if a value includes a search string or element
 * Handles undefined, null, and non-string/non-array values gracefully
 */
export function safeIncludes<T>(
  value: string | T[] | undefined | null,
  searchElement: string | T
): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.includes(searchElement as T);
  }

  if (typeof value === 'string') {
    return value.includes(searchElement as string);
  }

  return false;
}

/**
 * Safely checks if a string includes a search string
 * Handles undefined and null values gracefully
 */
export function safeStringIncludes(
  value: string | undefined | null,
  searchString: string
): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return value.includes(searchString);
}

/**
 * Safely checks if an array includes an element
 * Handles undefined and null values gracefully
 */
export function safeArrayIncludes<T>(
  value: T[] | undefined | null,
  element: T
): boolean {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.includes(element);
}
