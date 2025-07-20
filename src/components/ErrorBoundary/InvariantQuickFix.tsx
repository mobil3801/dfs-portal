import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Key,
  Code,
  Trash2,
  Play,
  Shield } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { invariantErrorFixer, FixResult } from '@/utils/invariantErrorFixer';

const InvariantQuickFix: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResults, setLastResults] = useState<FixResult[]>([]);
  const [validationResult, setValidationResult] = useState<{isValid: boolean;issues: string[];} | null>(null);
  const { toast } = useToast();

  const runSingleFix = async (fixType: string, fixFunction: () => Promise<FixResult>) => {
    setIsRunning(true);
    try {
      const result = await fixFunction();
      setLastResults([result]);

      toast({
        title: result.fixed ? "Fix Applied" : "No Issues Found",
        description: result.message,
        variant: result.fixed ? "default" : "secondary"
      });
    } catch (error) {
      toast({
        title: "Fix Failed",
        description: `Error running ${fixType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAllFixes = async () => {
    setIsRunning(true);
    try {
      const results = await invariantErrorFixer.fixAllIssues();
      setLastResults(results);

      const fixedCount = results.filter((r) => r.fixed).length;

      toast({
        title: fixedCount > 0 ? "Fixes Applied" : "No Issues Found",
        description: `Applied ${fixedCount} out of ${results.length} available fixes`,
        variant: fixedCount > 0 ? "default" : "secondary"
      });
    } catch (error) {
      toast({
        title: "Fix Failed",
        description: `Error running comprehensive fixes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const validateDOM = () => {
    try {
      const result = invariantErrorFixer.validateDOMStructure();
      setValidationResult(result);

      toast({
        title: result.isValid ? "DOM Valid" : "Issues Found",
        description: result.isValid ?
        "No DOM structure issues detected" :
        `Found ${result.issues.length} potential issues`,
        variant: result.isValid ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: `Error validating DOM: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const forceReload = () => {
    window.location.reload();
  };

  const clearResults = () => {
    setLastResults([]);
    setValidationResult(null);
    toast({
      title: "Results Cleared",
      description: "All fix results have been cleared"
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          Invariant Error Quick Fix
        </CardTitle>
        <CardDescription>
          Automated tools to detect and fix common React invariant violations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={() => runSingleFix('duplicate keys', () => invariantErrorFixer.fixDuplicateKeys())}
            disabled={isRunning}
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3">

            <Key className="h-4 w-4" />
            <span className="text-xs">Fix Keys</span>
          </Button>
          
          <Button
            onClick={() => runSingleFix('invalid nesting', () => invariantErrorFixer.fixInvalidNesting())}
            disabled={isRunning}
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3">

            <Code className="h-4 w-4" />
            <span className="text-xs">Fix Nesting</span>
          </Button>
          
          <Button
            onClick={() => runSingleFix('event cleanup', () => invariantErrorFixer.cleanupEventListeners())}
            disabled={isRunning}
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3">

            <Trash2 className="h-4 w-4" />
            <span className="text-xs">Cleanup</span>
          </Button>
          
          <Button
            onClick={validateDOM}
            disabled={isRunning}
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3">

            <Shield className="h-4 w-4" />
            <span className="text-xs">Validate</span>
          </Button>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={runAllFixes}
            disabled={isRunning}
            className="flex items-center gap-2">

            {isRunning ?
            <RefreshCw className="h-4 w-4 animate-spin" /> :

            <Play className="h-4 w-4" />
            }
            {isRunning ? 'Running Fixes...' : 'Run All Fixes'}
          </Button>
          
          <Button
            onClick={forceReload}
            variant="outline"
            className="flex items-center gap-2">

            <RefreshCw className="h-4 w-4" />
            Force Reload
          </Button>
          
          {(lastResults.length > 0 || validationResult) &&
          <Button
            onClick={clearResults}
            variant="outline"
            size="sm">

              Clear Results
            </Button>
          }
        </div>

        {/* Fix Results */}
        {lastResults.length > 0 &&
        <div className="space-y-2">
            <h4 className="font-semibold text-sm">Fix Results:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lastResults.map((result, index) =>
            <Alert
              key={index}
              className={result.fixed ?
              'bg-green-50 border-green-200' :
              'bg-gray-50 border-gray-200'
              }>

                  <div className="flex items-start gap-2">
                    {result.fixed ?
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" /> :

                <AlertTriangle className="h-4 w-4 text-gray-500 mt-0.5" />
                }
                    <div className="flex-1">
                      <AlertDescription className="text-sm">
                        {result.message}
                      </AlertDescription>
                      {result.details &&
                  <div className="text-xs text-gray-600 mt-1">
                          {JSON.stringify(result.details, null, 2).slice(0, 100)}...
                        </div>
                  }
                    </div>
                    <Badge variant={result.fixed ? "default" : "secondary"} className="text-xs">
                      {result.fixed ? "Fixed" : "No Change"}
                    </Badge>
                  </div>
                </Alert>
            )}
            </div>
          </div>
        }

        {/* Validation Results */}
        {validationResult &&
        <div className="space-y-2">
            <h4 className="font-semibold text-sm">DOM Validation:</h4>
            <Alert className={validationResult.isValid ?
          'bg-green-50 border-green-200' :
          'bg-red-50 border-red-200'
          }>
              <div className="flex items-start gap-2">
                {validationResult.isValid ?
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" /> :

              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              }
                <div className="flex-1">
                  <AlertDescription>
                    {validationResult.isValid ?
                  "DOM structure is valid - no issues detected" :
                  `Found ${validationResult.issues.length} potential issues`
                  }
                  </AlertDescription>
                  {!validationResult.isValid &&
                <div className="mt-2 space-y-1">
                      {validationResult.issues.slice(0, 5).map((issue, index) =>
                  <div key={index} className="text-xs text-red-700 bg-red-100 p-1 rounded">
                          {issue}
                        </div>
                  )}
                      {validationResult.issues.length > 5 &&
                  <div className="text-xs text-gray-600">
                          ... and {validationResult.issues.length - 5} more issues
                        </div>
                  }
                    </div>
                }
                </div>
              </div>
            </Alert>
          </div>
        }

        {/* Help Text */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Quick Fix Tools:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
              <li><strong>Fix Keys:</strong> Removes duplicate React keys and adds missing ones</li>
              <li><strong>Fix Nesting:</strong> Corrects invalid DOM element nesting</li>
              <li><strong>Cleanup:</strong> Removes problematic inline event handlers</li>
              <li><strong>Validate:</strong> Checks DOM structure for potential issues</li>
              <li><strong>Run All Fixes:</strong> Applies all available fixes automatically</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>);

};

export default InvariantQuickFix;