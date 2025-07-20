import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Bug, AlertOctagon, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvariantViolation {
  id: string;
  type: 'duplicate-key' | 'invalid-nesting' | 'state-mutation' | 'memory-leak' | 'react-error' | 'fiber-error' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  component?: string;
  timestamp: number;
  stackTrace?: string;
  autoFixed?: boolean;
  fixSuggestion?: string;
  rawError?: any;
}

const EnhancedInvariantDetector: React.FC = () => {
  const [violations, setViolations] = useState<InvariantViolation[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastInvariantError, setLastInvariantError] = useState<string | null>(null);
  const { toast } = useToast();
  const renderCountRef = useRef(0);
  const componentTrackerRef = useRef(new Set<string>());

  const addViolation = useCallback((violation: Omit<InvariantViolation, 'id' | 'timestamp'>) => {
    const newViolation: InvariantViolation = {
      ...violation,
      id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setViolations((prev) => {
      const combined = [...prev, newViolation];
      return combined.slice(-100);
    });

    if (violation.severity === 'critical' || violation.severity === 'high') {
      toast({
        title: "Critical React Error Detected",
        description: violation.message,
        variant: "destructive"
      });
    }

    return newViolation;
  }, [toast]);

  // Enhanced key detection with React Fiber integration
  const detectDuplicateKeys = useCallback(() => {
    const violations: Omit<InvariantViolation, 'id' | 'timestamp'>[] = [];

    try {
      const keyMap = new Map<string, {element: Element;fiberKey?: any;count: number;}>();

      // Get all DOM elements
      const allElements = document.querySelectorAll('*');

      allElements.forEach((element) => {
        try {
          // Check React Fiber keys (multiple possible patterns)
          const reactFiber = (element as any)._reactInternalFiber ||
          (element as any).__reactInternalInstance ||
          (element as any)._reactInternalNode ||
          (element as any).__reactFiber$;

          let key = null;

          if (reactFiber) {
            key = reactFiber.key || reactFiber.memoizedProps?.key;
          }

          // Fallback to data attributes
          if (!key) {
            key = element.getAttribute('data-key') ||
            element.getAttribute('key') ||
            element.getAttribute('data-react-key');
          }

          if (key !== null) {
            const keyStr = String(key);
            if (keyMap.has(keyStr)) {
              keyMap.get(keyStr)!.count++;
            } else {
              keyMap.set(keyStr, { element, fiberKey: reactFiber?.key, count: 1 });
            }
          }
        } catch (e) {





































































































































































































































































































































































          // Silent catch for individual element processing
        }});keyMap.forEach((data, key) => {if (data.count > 1) {violations.push({ type: 'duplicate-key', severity: 'high', message: `Duplicate React key detected: "${key}" used ${data.count} times. This can cause invariant violations.`, fixSuggestion: 'Use unique keys for each element in lists. Consider using item.id + index or UUID.', component: data.element.tagName?.toLowerCase() });}});} catch (error) {console.warn('Error detecting duplicate keys:', error);}return violations;}, []); // Enhanced React Fiber state detection
  const detectFiberInconsistencies = useCallback(() => {const violations: Omit<InvariantViolation, 'id' | 'timestamp'>[] = [];try {const reactRoots = document.querySelectorAll('[data-reactroot], #root, [id*="react"]');reactRoots.forEach((root) => {try {const fiber = (root as any)._reactInternalFiber || (root as any).__reactInternalInstance || (root as any)._reactRootContainer;if (fiber) {// Check for common fiber inconsistencies
                const checkFiber = (fiberNode: any, depth = 0) => {if (!fiberNode || depth > 50) return; // Prevent infinite recursion
                  try {// Check for null child references that should exist
                    if (fiberNode.child === null && fiberNode.memoizedProps?.children) {violations.push({ type: 'fiber-error', severity: 'high', message: 'React Fiber tree inconsistency: null child with existing children props', fixSuggestion: 'Check for conditional rendering issues or improper component structure.' });} // Check for circular references
                    if (fiberNode.return && fiberNode.return.child === fiberNode && fiberNode.sibling === fiberNode) {violations.push({ type: 'fiber-error', severity: 'critical', message: 'Circular reference detected in React Fiber tree', fixSuggestion: 'Check for improper component nesting or state mutations during render.' });} // Recursively check child fibers
                    if (fiberNode.child) {checkFiber(fiberNode.child, depth + 1);}if (fiberNode.sibling) {checkFiber(fiberNode.sibling, depth + 1);}} catch (e) {





























































                    // Silent catch for fiber inspection
                  }};if (fiber.current) {checkFiber(fiber.current);} else if (fiber.child) {checkFiber(fiber);}}} catch (e) {









              // Silent catch for root processing
            }});} catch (error) {console.warn('Error detecting fiber inconsistencies:', error);}return violations;}, []); // Enhanced DOM nesting detection
  const detectInvalidNesting = useCallback(() => {const violations: Omit<InvariantViolation, 'id' | 'timestamp'>[] = [];try {const invalidCombinations = [{ parent: 'p', child: 'div', message: 'Block elements cannot be nested inside paragraphs' }, { parent: 'p', child: 'p', message: 'Paragraphs cannot be nested inside other paragraphs' }, { parent: 'a', child: 'a', message: 'Anchor tags cannot be nested inside other anchor tags' }, { parent: 'button', child: 'button', message: 'Buttons cannot be nested inside other buttons' }, { parent: 'button', child: 'a', message: 'Interactive elements should not be nested' }, { parent: 'form', child: 'form', message: 'Forms cannot be nested inside other forms' }, { parent: 'table', child: 'div', message: 'Invalid table structure - div inside table without proper wrapper' }, { parent: 'tr', child: 'div', message: 'Table row cannot contain div elements directly' }, { parent: 'ul', child: 'div', message: 'List should only contain li elements' }, { parent: 'ol', child: 'div', message: 'Ordered list should only contain li elements' }];invalidCombinations.forEach(({ parent, child, message }) => {const invalidElements = document.querySelectorAll(`${parent} ${child}`);if (invalidElements.length > 0) {violations.push({ type: 'invalid-nesting', severity: 'medium', message: `Invalid DOM nesting: ${message} (${invalidElements.length} occurrences)`, fixSuggestion: `Review your component structure and ensure proper HTML semantics.` });}});} catch (error) {console.warn('Error detecting invalid nesting:', error);}return violations;}, []); // Component tracking for render cycles
  const trackComponentRenders = useCallback(() => {renderCountRef.current++; // If render count is excessive, it might indicate infinite render loops
      if (renderCountRef.current > 1000) {addViolation({ type: 'react-error', severity: 'high', message: `Excessive render cycles detected (${renderCountRef.current}). Possible infinite render loop.`, fixSuggestion: 'Check for state updates during render or missing dependencies in useEffect.' });renderCountRef.current = 0; // Reset to prevent spam
      }}, [addViolation]);const scanForViolations = useCallback(() => {if (!isActive) return;try {trackComponentRenders();const newViolations = [...detectDuplicateKeys(), ...detectInvalidNesting(), ...detectFiberInconsistencies()];newViolations.forEach((violation) => addViolation(violation));setScanCount((prev) => prev + 1);if (newViolations.length > 0) {setErrorCount((prev) => prev + newViolations.length);}} catch (error) {console.error('Error during violation scan:', error);addViolation({ type: 'unknown', severity: 'medium', message: `Scanner error: ${error instanceof Error ? error.message : 'Unknown error'}`, fixSuggestion: 'Check browser console for detailed error information.' });}}, [isActive, detectDuplicateKeys, detectInvalidNesting, detectFiberInconsistencies, addViolation, trackComponentRenders]); // Enhanced error boundary integration with React error capture
  useEffect(() => {const originalError = console.error;const originalWarn = console.warn;console.error = (...args) => {const errorMessage = args.join(' '); // Detect the specific "Invariant failed" error
        if (errorMessage.includes('Invariant failed') || errorMessage.includes('invariant') || errorMessage.includes('Minified React error')) {setLastInvariantError(errorMessage);addViolation({ type: 'react-error', severity: 'critical', message: `React Invariant Violation: ${errorMessage}`, stackTrace: args.find((arg) => typeof arg === 'object' && arg?.stack)?.stack || new Error().stack, fixSuggestion: 'Check for duplicate keys, invalid DOM nesting, state mutations during render, or circular references.', rawError: args[0] });} // Detect React warnings that might lead to invariants
        if (errorMessage.includes('Warning:') && (errorMessage.includes('Each child in a list should have a unique "key"') || errorMessage.includes('validateDOMNesting') || errorMessage.includes('Cannot update a component') || errorMessage.includes('Maximum update depth exceeded'))) {addViolation({ type: 'react-error', severity: 'high', message: `React Warning (potential invariant): ${errorMessage}`, fixSuggestion: 'Address this warning to prevent potential invariant violations.' });}originalError.apply(console, args);};console.warn = (...args) => {const warnMessage = args.join(' ');if (warnMessage.includes('Warning:') && (warnMessage.includes('key') || warnMessage.includes('ref') || warnMessage.includes('React.createElement') || warnMessage.includes('validateDOMNesting'))) {addViolation({ type: 'react-error', severity: 'medium', message: `React Warning: ${warnMessage}`, fixSuggestion: 'Address this warning to maintain React consistency.' });}originalWarn.apply(console, args);}; // Enhanced unhandled rejection handling
      const handleRejection = (event: PromiseRejectionEvent) => {const reason = String(event.reason);if (reason.includes('Invariant') || reason.includes('invariant')) {addViolation({ type: 'react-error', severity: 'high', message: `Unhandled Promise Rejection (Invariant): ${reason}`, fixSuggestion: 'Handle promises properly and check for async state updates.' });}};window.addEventListener('unhandledrejection', handleRejection); // Global error handler
      const handleGlobalError = (event: ErrorEvent) => {const message = event.message || String(event.error);if (message.includes('Invariant') || message.includes('invariant')) {addViolation({ type: 'react-error', severity: 'critical', message: `Global Error (Invariant): ${message}`, stackTrace: event.error?.stack, fixSuggestion: 'Check the stack trace for the source of the invariant violation.' });}};window.addEventListener('error', handleGlobalError);return () => {console.error = originalError;console.warn = originalWarn;window.removeEventListener('unhandledrejection', handleRejection);window.removeEventListener('error', handleGlobalError);};}, [addViolation]);useEffect(() => {if (!isActive) return; // Initial scan
      scanForViolations();const interval = setInterval(scanForViolations, 2000); // Enhanced mutation observer
      const observer = new MutationObserver((mutations) => {let shouldScan = false;mutations.forEach((mutation) => {if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {shouldScan = true;}if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'key' || mutation.attributeName === 'data-key' || mutation.attributeName?.startsWith('data-react'))) {shouldScan = true;}});if (shouldScan) {setTimeout(scanForViolations, 100);}});observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'key', 'data-key', 'style', 'data-react-key'] });return () => {clearInterval(interval);observer.disconnect();};}, [isActive, scanForViolations]);const clearViolations = () => {setViolations([]);setScanCount(0);setErrorCount(0);setLastInvariantError(null);renderCountRef.current = 0;toast({ title: "Violations Cleared", description: "All detected violations have been cleared" });};const getSeverityIcon = (severity: string) => {switch (severity) {case 'critical':return <AlertOctagon className="h-4 w-4 text-red-600" />;case 'high':return <XCircle className="h-4 w-4 text-red-500" />;case 'medium':return <AlertTriangle className="h-4 w-4 text-yellow-500" />;default:return <Bug className="h-4 w-4 text-blue-500" />;}};const getSeverityColor = (severity: string) => {switch (severity) {case 'critical':return 'bg-red-50 text-red-900 border-red-200';case 'high':return 'bg-orange-50 text-orange-900 border-orange-200';case 'medium':return 'bg-yellow-50 text-yellow-900 border-yellow-200';default:return 'bg-blue-50 text-blue-900 border-blue-200';}};const criticalViolations = violations.filter((v) => v.severity === 'critical');const highViolations = violations.filter((v) => v.severity === 'high');const mediumViolations = violations.filter((v) => v.severity === 'medium');const lowViolations = violations.filter((v) => v.severity === 'low');return <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-red-500" />
              Enhanced Invariant Error Detector
            </CardTitle>
            <CardDescription>
              Advanced real-time detection and analysis of React consistency violations
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Paused"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setIsActive(!isActive)}>

              {isActive ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastInvariantError && <Alert className="bg-red-50 border-red-200">
            <AlertOctagon className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="font-semibold text-red-800 mb-1">Last Invariant Error Detected:</div>
              <div className="text-sm text-red-700">{lastInvariantError}</div>
            </AlertDescription>
          </Alert>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{criticalViolations.length}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{highViolations.length}</div>
            <div className="text-sm text-gray-600">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{mediumViolations.length}</div>
            <div className="text-sm text-gray-600">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{lowViolations.length}</div>
            <div className="text-sm text-gray-600">Low</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Scans: {scanCount} | Renders: {renderCountRef.current} | Errors: {errorCount}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={scanForViolations} disabled={!isActive}>

              <RefreshCw className="h-4 w-4 mr-1" />
              Scan Now
            </Button>
            <Button variant="outline" size="sm" onClick={clearViolations}>

              Clear All
            </Button>
          </div>
        </div>

        {violations.length === 0 ? <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              No React invariant violations detected. Your application appears stable.
            </AlertDescription>
          </Alert> : <div className="space-y-2 max-h-96 overflow-y-auto">
            {violations.slice(-30).reverse().map((violation) => <Alert key={violation.id} className={getSeverityColor(violation.severity)}>
                <div className="flex items-start gap-2">
                  {getSeverityIcon(violation.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {violation.type.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {violation.severity}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </span>
                      {violation.autoFixed && <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                          Auto-Fixed
                        </Badge>}
                    </div>
                    <AlertDescription className="text-sm mb-2">
                      {violation.message}
                    </AlertDescription>
                    {violation.fixSuggestion && <div className="text-xs text-gray-700 bg-gray-100 p-2 rounded mb-2">
                        💡 Fix Suggestion: {violation.fixSuggestion}
                      </div>}
                    {violation.component && <div className="text-xs text-gray-600 mb-1">
                        Component: {violation.component}
                      </div>}
                    {violation.stackTrace && <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Show Stack Trace
                        </summary>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32 mt-1 p-2 bg-gray-50 rounded">
                          {violation.stackTrace}
                        </pre>
                      </details>}
                  </div>
                </div>
              </Alert>)}
          </div>}
      </CardContent>
    </Card>;};export default EnhancedInvariantDetector;