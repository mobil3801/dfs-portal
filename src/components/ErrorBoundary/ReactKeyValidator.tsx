import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KeyIssue {
  id: string;
  type: 'missing' | 'duplicate' | 'invalid';
  element: string;
  timestamp: Date;
  suggestion: string;
}

const ReactKeyValidator: React.FC = () => {
  const [issues, setIssues] = useState<KeyIssue[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const scanForKeyIssues = () => {
    setIsScanning(true);
    const foundIssues: KeyIssue[] = [];

    try {
      // Scan for elements that should have keys
      const listElements = document.querySelectorAll('[data-react-key-missing]');
      const duplicateKeys = new Map<string, number>();

      // Check for missing keys in lists
      document.querySelectorAll('ul, ol, [role="list"]').forEach((list, index) => {
        const children = list.children;
        if (children.length > 1) {
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const reactKey = child.getAttribute('data-reactkey') || child.getAttribute('key');

            if (!reactKey) {
              foundIssues.push({
                id: `missing_${index}_${i}_${Date.now()}`,
                type: 'missing',
                element: `${child.tagName.toLowerCase()} in ${list.tagName.toLowerCase()}`,
                timestamp: new Date(),
                suggestion: 'Add a unique key prop to each list item'
              });
            } else {
              // Check for duplicate keys
              const count = duplicateKeys.get(reactKey) || 0;
              duplicateKeys.set(reactKey, count + 1);

              if (count > 0) {
                foundIssues.push({
                  id: `duplicate_${reactKey}_${Date.now()}`,
                  type: 'duplicate',
                  element: `${child.tagName.toLowerCase()} with key "${reactKey}"`,
                  timestamp: new Date(),
                  suggestion: 'Ensure each key is unique within the list'
                });
              }
            }
          }
        }
      });

      // Check for invalid key types
      document.querySelectorAll('[key]').forEach((element) => {
        const key = element.getAttribute('key');
        if (key && (key.includes(' ') || key.includes('undefined') || key.includes('null'))) {
          foundIssues.push({
            id: `invalid_${key}_${Date.now()}`,
            type: 'invalid',
            element: `${element.tagName.toLowerCase()} with key "${key}"`,
            timestamp: new Date(),
            suggestion: 'Use stable, unique identifiers as keys (avoid spaces, undefined, or null)'
          });
        }
      });

      setIssues(foundIssues);

      if (foundIssues.length === 0) {
        toast({
          title: "No Key Issues Found",
          description: "All React keys appear to be properly configured.",
          variant: "default"
        });
      } else {
        toast({
          title: `${foundIssues.length} Key Issues Found`,
          description: "Review the issues below to prevent potential rendering problems.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error scanning for key issues:', error);
      toast({
        title: "Scan Error",
        description: "Failed to scan for key issues.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const clearIssues = () => {
    setIssues([]);
    toast({
      title: "Issues Cleared",
      description: "All key issues have been cleared."
    });
  };

  useEffect(() => {
    // Initial scan
    const timer = setTimeout(() => {
      scanForKeyIssues();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getIssueIcon = (type: KeyIssue['type']) => {
    switch (type) {
      case 'missing':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'duplicate':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'invalid':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getIssueColor = (type: KeyIssue['type']) => {
    switch (type) {
      case 'missing':
        return 'destructive';
      case 'duplicate':
        return 'destructive';
      case 'invalid':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">React Key Validator</h3>
          {issues.length === 0 &&
          <Badge variant="outline" className="text-green-600 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              No Issues
            </Badge>
          }
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={scanForKeyIssues}
            disabled={isScanning}
            variant="outline"
            size="sm">

            {isScanning ?
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> :

            <RefreshCw className="h-4 w-4 mr-1" />
            }
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </Button>
          
          {issues.length > 0 &&
          <Button
            onClick={clearIssues}
            variant="outline"
            size="sm">

              Clear ({issues.length})
            </Button>
          }
        </div>
      </div>

      {issues.length === 0 ?
      <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            No React key issues detected. All list items appear to have proper keys.
          </AlertDescription>
        </Alert> :

      <div className="space-y-2 max-h-60 overflow-y-auto">
          {issues.map((issue) =>
        <Alert key={issue.id} variant={getIssueColor(issue.type)}>
              {getIssueIcon(issue.type)}
              <AlertDescription>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant={getIssueColor(issue.type)} className="text-xs">
                      {issue.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {issue.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium">
                    {issue.element}
                  </p>
                  
                  <p className="text-xs text-gray-600">
                    💡 {issue.suggestion}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
        )}
        </div>
      }
      
      <div className="text-xs text-gray-500 border-t pt-2 space-y-1">
        <p>
          <strong>Key Issues Can Cause:</strong> Rendering inconsistencies, component state loss, and React invariant violations.
        </p>
        <p>
          <strong>Best Practices:</strong> Use stable, unique IDs as keys. Avoid array indices for dynamic lists.
        </p>
      </div>
    </Card>);

};

export default ReactKeyValidator;