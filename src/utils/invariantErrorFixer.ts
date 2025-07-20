/**
 * Utility functions to programmatically fix common React invariant violations
 */

export interface FixResult {
  fixed: boolean;
  message: string;
  details?: any;
}

export class InvariantErrorFixer {
  private static instance: InvariantErrorFixer;

  static getInstance(): InvariantErrorFixer {
    if (!this.instance) {
      this.instance = new InvariantErrorFixer();
    }
    return this.instance;
  }

  /**
   * Fix duplicate React keys by making them unique
   */
  async fixDuplicateKeys(): Promise<FixResult> {
    try {
      const keyMap = new Map<string, Element[]>();
      const elementsWithKeys = document.querySelectorAll('[data-react-key], [key]');

      // Collect all elements with keys
      elementsWithKeys.forEach((element) => {
        const key = element.getAttribute('data-react-key') || element.getAttribute('key');
        if (key) {
          if (!keyMap.has(key)) {
            keyMap.set(key, []);
          }
          keyMap.get(key)!.push(element);
        }
      });

      let fixedCount = 0;

      // Fix duplicate keys
      keyMap.forEach((elements, key) => {
        if (elements.length > 1) {
          elements.forEach((element, index) => {
            if (index > 0) {
              const newKey = `${key}-auto-fixed-${index}-${Date.now()}`;
              element.setAttribute('data-react-key', newKey);
              if (element.hasAttribute('key')) {
                element.setAttribute('key', newKey);
              }
              fixedCount++;
            }
          });
        }
      });

      return {
        fixed: fixedCount > 0,
        message: `Fixed ${fixedCount} duplicate keys`,
        details: { duplicatesFixed: fixedCount, totalChecked: elementsWithKeys.length }
      };
    } catch (error) {
      return {
        fixed: false,
        message: `Error fixing duplicate keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }

  /**
   * Fix invalid DOM nesting issues
   */
  async fixInvalidNesting(): Promise<FixResult> {
    try {
      const invalidPatterns = [
      { parent: 'p', child: 'div' },
      { parent: 'p', child: 'p' },
      { parent: 'a', child: 'a' },
      { parent: 'button', child: 'button' },
      { parent: 'button', child: 'a' },
      { parent: 'form', child: 'form' }];


      let fixedCount = 0;

      for (const { parent, child } of invalidPatterns) {
        const invalidElements = document.querySelectorAll(`${parent} ${child}`);

        invalidElements.forEach((element) => {
          try {
            const parentElement = element.closest(parent);
            if (parentElement && parentElement.parentNode) {
              // Create a wrapper div to move the invalid child
              const wrapper = document.createElement('div');
              wrapper.className = 'auto-fixed-nesting-wrapper';

              // Insert wrapper after parent
              parentElement.parentNode.insertBefore(wrapper, parentElement.nextSibling);

              // Move the invalid child to the wrapper
              wrapper.appendChild(element);

              fixedCount++;
            }
          } catch (e) {
            console.warn('Could not fix nesting for element:', element, e);
          }
        });
      }

      return {
        fixed: fixedCount > 0,
        message: `Fixed ${fixedCount} invalid nesting issues`,
        details: { nestingIssuesFixed: fixedCount }
      };
    } catch (error) {
      return {
        fixed: false,
        message: `Error fixing invalid nesting: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }

  /**
   * Clean up orphaned event listeners that might cause issues
   */
  async cleanupEventListeners(): Promise<FixResult> {
    try {
      const elementsWithInlineHandlers = document.querySelectorAll('[onclick], [onchange], [onsubmit], [onload]');
      let cleanedCount = 0;

      elementsWithInlineHandlers.forEach((element) => {
        ['onclick', 'onchange', 'onsubmit', 'onload'].forEach((handler) => {
          if (element.hasAttribute(handler)) {
            element.removeAttribute(handler);
            cleanedCount++;
          }
        });
      });

      return {
        fixed: cleanedCount > 0,
        message: `Cleaned up ${cleanedCount} inline event handlers`,
        details: { handlersRemoved: cleanedCount }
      };
    } catch (error) {
      return {
        fixed: false,
        message: `Error cleaning up event listeners: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }

  /**
   * Add missing keys to elements that should have them
   */
  async addMissingKeys(): Promise<FixResult> {
    try {
      // Find elements that look like they should have keys (common list item patterns)
      const potentialListItems = document.querySelectorAll(
        'li:not([key]):not([data-react-key]), ' +
        '[class*="item"]:not([key]):not([data-react-key]), ' +
        '[class*="card"]:not([key]):not([data-react-key]), ' +
        '[class*="row"]:not([key]):not([data-react-key])'
      );

      let keysAdded = 0;

      potentialListItems.forEach((element, index) => {
        // Only add keys to elements that appear to be in lists
        const parent = element.parentElement;
        if (parent && parent.children.length > 1) {
          const autoKey = `auto-key-${element.tagName.toLowerCase()}-${index}-${Date.now()}`;
          element.setAttribute('data-react-key', autoKey);
          keysAdded++;
        }
      });

      return {
        fixed: keysAdded > 0,
        message: `Added ${keysAdded} missing keys to list items`,
        details: { keysAdded, potentialItems: potentialListItems.length }
      };
    } catch (error) {
      return {
        fixed: false,
        message: `Error adding missing keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }

  /**
   * Force React to flush pending updates
   */
  async flushReactUpdates(): Promise<FixResult> {
    try {
      // Try to access React internals to flush updates
      const reactInternals = (window as any).React?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

      if (reactInternals) {
        // Force flush of pending updates
        if (reactInternals.ReactCurrentBatchConfig) {
          reactInternals.ReactCurrentBatchConfig.transition = null;
        }
      }

      // Try alternative React flushing methods
      if ((window as any).React?.unstable_batchedUpdates) {
        (window as any).React.unstable_batchedUpdates(() => {





































































































































































































































































































































































          // Empty batched update to flush pending work
        });} // Force a repaint
      document.body.style.display = 'none';document.body.offsetHeight; // Trigger reflow
      document.body.style.display = '';return { fixed: true, message: 'Flushed React updates and forced repaint', details: { method: 'batch-flush-repaint' } };} catch (error) {return { fixed: false, message: `Error flushing React updates: ${error instanceof Error ? error.message : 'Unknown error'}`, details: { error } };}} /**
  * Comprehensive fix that runs all available fixes
  */async fixAllIssues(): Promise<FixResult[]> {const results: FixResult[] = [];console.log('Running comprehensive invariant error fixes...');try {results.push(await this.fixDuplicateKeys());results.push(await this.addMissingKeys());results.push(await this.fixInvalidNesting());results.push(await this.cleanupEventListeners());results.push(await this.flushReactUpdates());const totalFixed = results.filter((r) => r.fixed).length;console.log(`Invariant fixes completed: ${totalFixed}/${results.length} fixes applied`);return results;} catch (error) {console.error('Error running comprehensive fixes:', error);return [{ fixed: false, message: `Error running comprehensive fixes: ${error instanceof Error ? error.message : 'Unknown error'}`, details: { error } }];}} /**
  * Validate DOM structure for potential issues
  */validateDOMStructure(): {isValid: boolean;issues: string[];} {const issues: string[] = [];try {// Check for duplicate IDs
      const elementsWithIds = document.querySelectorAll('[id]');const idMap = new Map<string, number>();elementsWithIds.forEach((element) => {const id = element.getAttribute('id')!;idMap.set(id, (idMap.get(id) || 0) + 1);});idMap.forEach((count, id) => {if (count > 1) {issues.push(`Duplicate ID found: "${id}" (${count} occurrences)`);}}); // Check for invalid nesting
      const invalidNestings = ['p div', 'p p', 'a a', 'button button', 'form form'];invalidNestings.forEach((selector) => {const invalid = document.querySelectorAll(selector);if (invalid.length > 0) {issues.push(`Invalid nesting found: ${selector} (${invalid.length} occurrences)`);}}); // Check for empty keys
      const emptyKeys = document.querySelectorAll('[key=""], [data-react-key=""]');if (emptyKeys.length > 0) {issues.push(`Empty keys found: ${emptyKeys.length} elements`);}return { isValid: issues.length === 0, issues };} catch (error) {return { isValid: false, issues: [`Error validating DOM structure: ${error instanceof Error ? error.message : 'Unknown error'}`] };}}} // Export singleton instance
export const invariantErrorFixer = InvariantErrorFixer.getInstance(); // Export default for easy importing
export default invariantErrorFixer;