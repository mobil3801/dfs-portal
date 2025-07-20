import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Code,
  Lightbulb,
  BookOpen,
  Target,
  Shield,
  Zap } from
'lucide-react';

interface CodeExample {
  title: string;
  description: string;
  badCode: string;
  goodCode: string;
  explanation: string;
}

const MemoryLeakPreventionGuide: React.FC = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionId)) {
      newOpenSections.delete(sectionId);
    } else {
      newOpenSections.add(sectionId);
    }
    setOpenSections(newOpenSections);
  };

  const commonPatterns: CodeExample[] = [
  {
    title: "Timer Cleanup",
    description: "Always clear timers when components unmount",
    badCode: `// ❌ BAD: Timer not cleared
function BadComponent() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setInterval(() => {
      setCount(prev => prev + 1); // Memory leak!
    }, 1000);
  }, []);
  
  return <div>{count}</div>;
}`,
    goodCode: `// ✅ GOOD: Timer properly cleaned up
function GoodComponent() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval); // Cleanup
  }, []);
  
  return <div>{count}</div>;
}`,
    explanation: "Timers continue running even after component unmount unless explicitly cleared, causing memory leaks and potential state updates on unmounted components."
  },
  {
    title: "Event Listener Cleanup",
    description: "Remove event listeners to prevent memory leaks",
    badCode: `// ❌ BAD: Event listener not removed
function BadComponent() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    // Missing cleanup!
  }, []);
  
  return <div>Mouse: {position.x}, {position.y}</div>;
}`,
    goodCode: `// ✅ GOOD: Event listener properly removed
function GoodComponent() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return <div>Mouse: {position.x}, {position.y}</div>;
}`,
    explanation: "Event listeners hold references to components, preventing garbage collection. Always remove them in cleanup functions."
  },
  {
    title: "Async Operations",
    description: "Cancel async operations when component unmounts",
    badCode: `// ❌ BAD: Async operation not cancelled
function BadComponent({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    async function fetchUser() {
      const response = await fetch(\`/api/users/\${userId}\`);
      const userData = await response.json();
      setUser(userData); // May run after unmount!
    }
    
    fetchUser();
  }, [userId]);
  
  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}`,
    goodCode: `// ✅ GOOD: Async operation cancelled on unmount
function GoodComponent({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const abortController = new AbortController();
    
    async function fetchUser() {
      try {
        const response = await fetch(\`/api/users/\${userId}\`, {
          signal: abortController.signal
        });
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
        }
      }
    }
    
    fetchUser();
    
    return () => abortController.abort();
  }, [userId]);
  
  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}`,
    explanation: "Async operations can complete after component unmount, leading to state updates on unmounted components. Use AbortController to cancel them."
  }];


  const bestPractices = [
  {
    title: "Use Memory Leak Detection Hooks",
    description: "Implement our custom hooks for automatic cleanup",
    icon: <Shield className="h-5 w-5" />,
    tips: [
    "Use useMemoryLeakDetector for automatic resource tracking",
    "Implement useSafeAsync for protected async operations",
    "Wrap components with withMemoryLeakDetection HOC"]

  },
  {
    title: "Monitor Component Lifecycle",
    description: "Track mount/unmount cycles and resource usage",
    icon: <Target className="h-5 w-5" />,
    tips: [
    "Use refs to track component mount status",
    "Log resource allocation and cleanup",
    "Monitor memory usage during development"]

  },
  {
    title: "Implement Proper Error Boundaries",
    description: "Catch and handle errors to prevent resource leaks",
    icon: <Zap className="h-5 w-5" />,
    tips: [
    "Use error boundaries to prevent cascading failures",
    "Clean up resources in error scenarios",
    "Log errors with memory context"]

  }];


  const checklistItems = [
  "✅ All timers are cleared in useEffect cleanup",
  "✅ Event listeners are removed on unmount",
  "✅ Async operations use AbortController",
  "✅ Subscriptions are properly unsubscribed",
  "✅ Large objects are not captured in closures",
  "✅ State updates check component mount status",
  "✅ WebSocket connections are closed",
  "✅ ResizeObserver and IntersectionObserver are disconnected",
  "✅ File readers and streams are closed",
  "✅ Animation frames are cancelled"];


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Memory Leak Prevention Guide</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive guide to preventing memory leaks in React applications. 
          Learn patterns, best practices, and use our monitoring tools.
        </p>
      </div>

      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns">Common Patterns</TabsTrigger>
          <TabsTrigger value="practices">Best Practices</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="tools">Our Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These examples show common memory leak patterns and their solutions. 
              Click on each section to expand the code examples.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {commonPatterns.map((pattern, index) =>
            <Card key={index}>
                <div>
                  <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSection(`pattern-${index}`)}>

                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Code className="h-5 w-5" />
                          {pattern.title}
                        </CardTitle>
                        <CardDescription>{pattern.description}</CardDescription>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${
                    openSections.has(`pattern-${index}`) ? 'rotate-180' : ''}`
                    } />
                    </div>
                  </CardHeader>
                  {openSections.has(`pattern-${index}`) &&
                <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-red-600 mb-2">❌ Problematic Code</h4>
                          <pre className="bg-red-50 border border-red-200 rounded p-3 text-sm overflow-x-auto">
                            <code>{pattern.badCode}</code>
                          </pre>
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-600 mb-2">✅ Correct Code</h4>
                          <pre className="bg-green-50 border border-green-200 rounded p-3 text-sm overflow-x-auto">
                            <code>{pattern.goodCode}</code>
                          </pre>
                        </div>
                      </div>
                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>{pattern.explanation}</AlertDescription>
                      </Alert>
                    </CardContent>
                }
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="practices" className="space-y-4">
          <div className="grid gap-4">
            {bestPractices.map((practice, index) =>
            <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {practice.icon}
                    {practice.title}
                  </CardTitle>
                  <CardDescription>{practice.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {practice.tips.map((tip, tipIndex) =>
                  <li key={tipIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{tip}</span>
                      </li>
                  )}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Memory Leak Prevention Checklist
              </CardTitle>
              <CardDescription>
                Use this checklist when reviewing components for potential memory leaks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {checklistItems.map((item, index) =>
                <div key={index} className="flex items-start gap-2 p-2 rounded hover:bg-muted/50">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item.replace('✅ ', '')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>useMemoryLeakDetector Hook</CardTitle>
                <CardDescription>
                  Automatically track and clean up component resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import useMemoryLeakDetector from '@/hooks/use-memory-leak-detector';

function MyComponent() {
  const memoryTools = useMemoryLeakDetector('MyComponent');
  
  useEffect(() => {
    // Safe timer that auto-cleans
    const timer = memoryTools.safeSetTimeout(() => {
      console.log('Timer executed');
    }, 1000);
    
    // Safe event listener that auto-removes
    memoryTools.safeAddEventListener(window, 'scroll', handleScroll);
    
    return memoryTools.cleanup.all;
  }, []);
  
  return <div>Component content</div>;
}`}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>useSafeAsync Hook</CardTitle>
                <CardDescription>
                  Handle async operations with automatic cancellation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import useSafeAsync from '@/hooks/use-safe-async';

function MyComponent() {
  const { safeApiCall } = useSafeAsync('MyComponent');
  const [data, setData] = useState(null);
  
  useEffect(() => {
    safeApiCall(
      () => window.ezsite.apis.tablePage(tableId, params),
      {
        onSuccess: (result) => setData(result.data),
        onError: (error) => console.error(error)
      }
    );
  }, []);
  
  return <div>{data ? 'Loaded' : 'Loading...'}</div>;
}`}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Leak Dashboard</CardTitle>
                <CardDescription>
                  Real-time monitoring of memory usage and leak detection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Badge>Real-time monitoring</Badge>
                  <Badge>Component tracking</Badge>
                  <Badge>Leak detection</Badge>
                  <Badge>Memory reports</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Access the dashboard at /admin/memory-monitoring to view detailed 
                  memory usage statistics and potential leak reports.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>);

};

export default MemoryLeakPreventionGuide;