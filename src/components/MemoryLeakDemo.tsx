import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Activity,
  Timer,
  MousePointer,
  Zap,
  Database } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Simple demo component without complex dependencies
const BadComponent: React.FC<{onStop: () => void;}> = ({ onStop }) => {
  const [count, setCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // ❌ Memory leak: Timer not cleared
    const interval = setInterval(() => {
      setCount((prev) => prev + 1);
    }, 1000);

    // Missing cleanup - intentional for demo
  }, []);

  useEffect(() => {
    if (count > 10) {
      toast({
        title: "Memory Leak Demo",
        description: "Timer has been running for 10 seconds without cleanup!",
        variant: "destructive"
      });
      onStop();
    }
  }, [count, onStop, toast]);

  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <h3 className="font-semibold text-red-900 mb-2">❌ Component with Memory Leaks</h3>
      <p className="text-red-700 text-sm mb-2">Count: {count}</p>
      <Alert className="mt-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          This component has active timers that won't be cleaned up!
        </AlertDescription>
      </Alert>
    </div>);

};

// Simple good component
const GoodComponent: React.FC<{onStop: () => void;}> = ({ onStop }) => {
  const [count, setCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // ✅ Safe timer with cleanup
    const timer = setTimeout(() => {
      setCount((prev) => prev + 1);
    }, 1000);

    // Proper cleanup
    return () => clearTimeout(timer);
  }, [count]);

  useEffect(() => {
    if (count > 10) {
      toast({
        title: "Memory Safe Demo",
        description: "Timer has been safely managed for 10 seconds!"
      });
      onStop();
    }
  }, [count, onStop, toast]);

  return (
    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
      <h3 className="font-semibold text-green-900 mb-2">✅ Component with Memory Protection</h3>
      <p className="text-green-700 text-sm mb-2">Count: {count}</p>
      <Alert className="mt-2">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="text-green-800">
          This component properly cleans up its resources!
        </AlertDescription>
      </Alert>
    </div>);

};

const MemoryLeakDemo: React.FC = () => {
  const [badComponentActive, setBadComponentActive] = useState(false);
  const [goodComponentActive, setGoodComponentActive] = useState(false);

  const startBadDemo = () => {
    setBadComponentActive(true);

    setTimeout(() => {
      setBadComponentActive(false);
    }, 15000); // Auto-stop after 15 seconds
  };

  const startGoodDemo = () => {
    setGoodComponentActive(true);

    setTimeout(() => {
      setGoodComponentActive(false);
    }, 15000); // Auto-stop after 15 seconds
  };

  const stopBadDemo = () => {
    setBadComponentActive(false);
  };

  const stopGoodDemo = () => {
    setGoodComponentActive(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Memory Leak Detection Demo</h2>
        <p className="text-muted-foreground">
          Compare components with and without memory leak protection
        </p>
      </div>

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Live Comparison</TabsTrigger>
          <TabsTrigger value="patterns">Leak Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bad Component Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Memory Leak Component
                </CardTitle>
                <CardDescription>
                  Demonstrates common memory leak patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={startBadDemo}
                    disabled={badComponentActive}
                    variant="destructive"
                    size="sm">

                    <Play className="h-4 w-4 mr-2" />
                    Start Leak Demo
                  </Button>
                  <Button
                    onClick={stopBadDemo}
                    disabled={!badComponentActive}
                    variant="outline"
                    size="sm">

                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                  {badComponentActive &&
                  <Badge variant="destructive">
                      <Activity className="h-3 w-3 mr-1" />
                      Active Leaks
                    </Badge>
                  }
                </div>
                
                {badComponentActive &&
                <BadComponent onStop={stopBadDemo} />
                }
              </CardContent>
            </Card>

            {/* Good Component Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Memory Safe Component
                </CardTitle>
                <CardDescription>
                  Uses proper cleanup patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={startGoodDemo}
                    disabled={goodComponentActive}
                    size="sm">

                    <Play className="h-4 w-4 mr-2" />
                    Start Safe Demo
                  </Button>
                  <Button
                    onClick={stopGoodDemo}
                    disabled={!goodComponentActive}
                    variant="outline"
                    size="sm">

                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                  {goodComponentActive &&
                  <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  }
                </div>
                
                {goodComponentActive &&
                <GoodComponent onStop={stopGoodDemo} />
                }
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              <strong>Monitor the Memory Dashboard:</strong> Run these demos and watch the memory 
              dashboard to see the difference in memory usage and leak detection between the two approaches.
              The bad component will trigger leak warnings, while the good component will show clean monitoring.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Timer className="h-5 w-5" />
                  Timer Leaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Timers that aren't cleared continue running after component unmount
                </p>
                <Badge variant="destructive">High Impact</Badge>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <MousePointer className="h-5 w-5" />
                  Event Listener Leaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Event listeners hold references preventing garbage collection
                </p>
                <Badge variant="secondary">Medium Impact</Badge>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <Zap className="h-5 w-5" />
                  Async Operation Leaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Fetch requests and promises completing after unmount
                </p>
                <Badge variant="secondary">Medium Impact</Badge>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Database className="h-5 w-5" />
                  Subscription Leaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Observables and subscriptions not properly unsubscribed
                </p>
                <Badge variant="secondary">High Impact</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>);

};

export default MemoryLeakDemo;