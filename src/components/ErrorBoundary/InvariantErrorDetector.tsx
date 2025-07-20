import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Bug, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvariantError {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  component?: string;
  props?: any;
}

const InvariantErrorDetector: React.FC = () => {
  const [errors, setErrors] = useState<InvariantError[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isMonitoring) return;

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Override console.error to detect invariant violations
    console.error = (...args) => {
      const message = args.join(' ');

      if (message.includes('Invariant') || message.includes('invariant')) {
        const error: InvariantError = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          message,
          timestamp: new Date(),
          stack: new Error().stack
        };

        setErrors((prev) => [...prev, error].slice(-10)); // Keep only last 10 errors

        toast({
          title: "React Invariant Error Detected",
          description: "A rendering issue was detected and logged.",
          variant: "destructive"
        });
      }

      originalConsoleError.apply(console, args);
    };

    // Override console.warn to catch React warnings that might lead to invariants
    console.warn = (...args) => {
      const message = args.join(' ');

      if (message.includes('Warning: ') && (
      message.includes('key') ||
      message.includes('ref') ||
      message.includes('React.createElement') ||
      message.includes('validateDOMNesting'))) {

        console.log('React warning that might cause invariant:', message);
      }

      originalConsoleWarn.apply(console, args);
    };

    // Monitor for unhandled promise rejections that might be invariant-related
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason);

      if (reason.includes('Invariant') || reason.includes('invariant')) {
        const error: InvariantError = {
          id: `rej_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          message: `Promise Rejection: ${reason}`,
          timestamp: new Date()
        };

        setErrors((prev) => [...prev, error].slice(-10));
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [isMonitoring, toast]);

  const clearErrors = () => {
    setErrors([]);
    toast({
      title: "Errors Cleared",
      description: "All invariant errors have been cleared."
    });
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    toast({
      title: isMonitoring ? "Monitoring Stopped" : "Monitoring Started",
      description: `Invariant error detection is now ${!isMonitoring ? 'active' : 'inactive'}.`
    });
  };

  if (process.env.NODE_ENV !== 'development' && errors.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold">Invariant Error Detector</h3>
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={toggleMonitoring}
            variant="outline"
            size="sm">

            {isMonitoring ? "Stop" : "Start"} Monitoring
          </Button>
          
          {errors.length > 0 &&
          <Button
            onClick={clearErrors}
            variant="outline"
            size="sm">

              <RefreshCw className="h-4 w-4 mr-1" />
              Clear ({errors.length})
            </Button>
          }
        </div>
      </div>

      {errors.length === 0 ?
      <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No invariant errors detected. This tool monitors for React rendering issues in real-time.
          </AlertDescription>
        </Alert> :

      <div className="space-y-2 max-h-60 overflow-y-auto">
          {errors.map((error) =>
        <Alert key={error.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive" className="text-xs">
                      {error.id}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {error.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium">{error.message}</p>
                  
                  {process.env.NODE_ENV === 'development' && error.stack &&
              <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                        Show Stack Trace
                      </summary>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-20 mt-1 p-2 bg-gray-50 rounded">
                        {error.stack}
                      </pre>
                    </details>
              }
                </div>
              </AlertDescription>
            </Alert>
        )}
        </div>
      }
      
      <div className="text-xs text-gray-500 border-t pt-2">
        <p>
          This detector helps identify React invariant violations that can cause application crashes.
          Common causes include invalid keys, improper component nesting, or rendering inconsistencies.
        </p>
      </div>
    </Card>);

};

export default InvariantErrorDetector;