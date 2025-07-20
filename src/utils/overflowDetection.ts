
// Overflow Detection Utility
export interface OverflowDetectionConfig {
  checkInterval: number;
  thresholds: {
    horizontal: number;
    vertical: number;
  };
  enableLogging: boolean;
  enableReporting: boolean;
  excludeSelectors: string[];
}

export interface OverflowIssue {
  element: HTMLElement;
  type: 'horizontal' | 'vertical' | 'both';
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
  selector: string;
  timestamp: number;
  viewport: {
    width: number;
    height: number;
  };
}

export class OverflowDetector {
  private config: OverflowDetectionConfig;
  private issues: OverflowIssue[] = [];
  private observer: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: Partial<OverflowDetectionConfig> = {}) {
    this.config = {
      checkInterval: 5000, // 5 seconds
      thresholds: {
        horizontal: 10, // pixels
        vertical: 10
      },
      enableLogging: true,
      enableReporting: true,
      excludeSelectors: [
      '.overflow-auto',
      '.overflow-x-auto',
      '.overflow-y-auto',
      '.overflow-scroll',
      '.overflow-x-scroll',
      '.overflow-y-scroll',
      '[data-overflow-expected]'],

      ...config
    };
  }

  public startMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Start periodic checks
    this.startPeriodicChecks();

    // Setup resize observer
    this.setupResizeObserver();

    // Setup mutation observer
    this.setupMutationObserver();

    // Initial check
    this.checkForOverflow();
  }

  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  private startPeriodicChecks(): void {
    this.intervalId = setInterval(() => {
      this.checkForOverflow();
    }, this.config.checkInterval);
  }

  private setupResizeObserver(): void {
    if (!window.ResizeObserver) return;

    this.observer = new ResizeObserver((entries) => {
      // Debounce the check to avoid too many calls
      setTimeout(() => {
        this.checkForOverflow();
      }, 100);
    });

    // Observe the body element
    this.observer.observe(document.body);
  }

  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldCheck = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheck = true;
        }
      });

      if (shouldCheck) {
        setTimeout(() => {
          this.checkForOverflow();
        }, 100);
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private checkForOverflow(): void {
    const elements = document.querySelectorAll('*');
    const newIssues: OverflowIssue[] = [];

    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;

      // Skip if element should be excluded
      if (this.shouldExcludeElement(htmlElement)) {
        return;
      }

      const overflowIssue = this.detectOverflow(htmlElement);
      if (overflowIssue) {
        newIssues.push(overflowIssue);
      }
    });

    // Update issues array
    this.issues = newIssues;

    // Log issues if enabled
    if (this.config.enableLogging && newIssues.length > 0) {
      console.group('🔍 Overflow Detection Results');
      newIssues.forEach((issue) => {
        console.warn(`Overflow detected on ${issue.selector}:`, issue);
      });
      console.groupEnd();
    }

    // Report issues if enabled
    if (this.config.enableReporting && newIssues.length > 0) {
      this.reportIssues(newIssues);
    }
  }

  private shouldExcludeElement(element: HTMLElement): boolean {
    // Check if element matches any exclude selector
    return this.config.excludeSelectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch (e) {
        return false;
      }
    });
  }

  private detectOverflow(element: HTMLElement): OverflowIssue | null {
    const computedStyle = window.getComputedStyle(element);
    const overflow = computedStyle.overflow;
    const overflowX = computedStyle.overflowX;
    const overflowY = computedStyle.overflowY;

    // Skip elements with intentional overflow
    if (overflow === 'auto' || overflow === 'scroll' ||
    overflowX === 'auto' || overflowX === 'scroll' ||
    overflowY === 'auto' || overflowY === 'scroll') {
      return null;
    }

    const { scrollWidth, scrollHeight, clientWidth, clientHeight } = element;

    const horizontalOverflow = scrollWidth > clientWidth + this.config.thresholds.horizontal;
    const verticalOverflow = scrollHeight > clientHeight + this.config.thresholds.vertical;

    if (!horizontalOverflow && !verticalOverflow) {
      return null;
    }

    let type: 'horizontal' | 'vertical' | 'both';
    if (horizontalOverflow && verticalOverflow) {
      type = 'both';
    } else if (horizontalOverflow) {
      type = 'horizontal';
    } else {
      type = 'vertical';
    }

    return {
      element,
      type,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
      selector: this.getElementSelector(element),
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  private getElementSelector(element: HTMLElement): string {
    // Try to get a meaningful selector
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className.split(' ').filter((c) => c.length > 0);
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  private reportIssues(issues: OverflowIssue[]): void {
    // Send issues to reporting service (could be analytics, logging service, etc.)
    const report = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      issues: issues.map((issue) => ({
        selector: issue.selector,
        type: issue.type,
        dimensions: {
          scrollWidth: issue.scrollWidth,
          scrollHeight: issue.scrollHeight,
          clientWidth: issue.clientWidth,
          clientHeight: issue.clientHeight
        }
      }))
    };

    // In a real application, you would send this to your analytics service
    if (this.config.enableLogging) {
      console.log('📊 Overflow Report:', report);
    }

    // Store in localStorage for debugging
    try {
      const existingReports = JSON.parse(localStorage.getItem('overflowReports') || '[]');
      existingReports.push(report);

      // Keep only last 50 reports
      if (existingReports.length > 50) {
        existingReports.splice(0, existingReports.length - 50);
      }

      localStorage.setItem('overflowReports', JSON.stringify(existingReports));
    } catch (e) {
      console.warn('Failed to store overflow report:', e);
    }
  }

  public getIssues(): OverflowIssue[] {
    return [...this.issues];
  }

  public getReport(): any {
    return {
      timestamp: Date.now(),
      totalIssues: this.issues.length,
      issuesByType: {
        horizontal: this.issues.filter((i) => i.type === 'horizontal').length,
        vertical: this.issues.filter((i) => i.type === 'vertical').length,
        both: this.issues.filter((i) => i.type === 'both').length
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      issues: this.issues
    };
  }
}

// Singleton instance
let globalOverflowDetector: OverflowDetector | null = null;

export const startOverflowDetection = (config?: Partial<OverflowDetectionConfig>): OverflowDetector => {
  if (globalOverflowDetector) {
    globalOverflowDetector.stopMonitoring();
  }

  globalOverflowDetector = new OverflowDetector(config);
  globalOverflowDetector.startMonitoring();

  return globalOverflowDetector;
};

export const stopOverflowDetection = (): void => {
  if (globalOverflowDetector) {
    globalOverflowDetector.stopMonitoring();
    globalOverflowDetector = null;
  }
};

export const getOverflowReport = (): any => {
  return globalOverflowDetector?.getReport() || null;
};

// Automated CI/CD Testing Functions
export const runAutomatedOverflowTests = async (viewports: Array<{width: number;height: number;}>) => {
  const results: any[] = [];

  for (const viewport of viewports) {
    // Set viewport size
    if (window.innerWidth !== viewport.width || window.innerHeight !== viewport.height) {
      // In a real test environment, you'd use a testing framework to set viewport size
      console.log(`Testing viewport: ${viewport.width}x${viewport.height}`);
    }

    // Run overflow detection
    const detector = new OverflowDetector({
      checkInterval: 1000,
      enableLogging: false,
      enableReporting: false
    });

    await new Promise((resolve) => {
      detector.startMonitoring();
      setTimeout(() => {
        const report = detector.getReport();
        results.push({
          viewport,
          ...report
        });
        detector.stopMonitoring();
        resolve(null);
      }, 2000);
    });
  }

  return results;
};