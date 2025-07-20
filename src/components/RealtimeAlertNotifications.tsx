import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Volume2,
  VolumeX,
  Settings,
  X,
  Mail,
  MessageSquare,
  Smartphone } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'motion/react';

interface AlertNotification {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  source: string;
  metrics?: {
    currentValue: number;
    threshold: number;
    unit: string;
  };
}

interface NotificationSettings {
  enableSound: boolean;
  enableDesktop: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  severityFilter: ('critical' | 'high' | 'medium' | 'low')[];
}

const RealtimeAlertNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enableSound: true,
    enableDesktop: true,
    enableEmail: true,
    enableSMS: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    severityFilter: ['critical', 'high', 'medium', 'low']
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isMonitoring) {
      interval = setInterval(() => {
        // Simulate random alerts for demonstration
        if (Math.random() < 0.1) {// 10% chance every 3 seconds
          generateMockAlert();
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const generateMockAlert = () => {
    const alertTypes = ['critical', 'high', 'medium', 'low'] as const;
    const sources = ['Database Connection', 'Query Performance', 'Memory Usage', 'CPU Usage', 'Error Rate'];
    const metrics = [
    { name: 'Connection Time', unit: 'ms', threshold: 2000 },
    { name: 'Query Response', unit: 'ms', threshold: 1000 },
    { name: 'Memory Usage', unit: '%', threshold: 80 },
    { name: 'CPU Usage', unit: '%', threshold: 90 },
    { name: 'Error Rate', unit: '%', threshold: 5 }];


    const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];

    const currentValue = randomMetric.threshold + Math.random() * 50;

    const newAlert: AlertNotification = {
      id: Date.now().toString(),
      type: randomType,
      title: `${randomType.toUpperCase()}: ${randomSource} Alert`,
      message: `${randomMetric.name} has exceeded threshold: ${currentValue.toFixed(2)}${randomMetric.unit} > ${randomMetric.threshold}${randomMetric.unit}`,
      timestamp: new Date(),
      acknowledged: false,
      source: randomSource,
      metrics: {
        currentValue,
        threshold: randomMetric.threshold,
        unit: randomMetric.unit
      }
    };

    if (settings.severityFilter.includes(randomType)) {
      addNotification(newAlert);
    }
  };

  const addNotification = (notification: AlertNotification) => {
    setNotifications((prev) => [notification, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount((prev) => prev + 1);

    // Play sound if enabled
    if (settings.enableSound && !isQuietHours()) {
      playNotificationSound(notification.type);
    }

    // Show desktop notification if enabled
    if (settings.enableDesktop && Notification.permission === 'granted' && !isQuietHours()) {
      showDesktopNotification(notification);
    }

    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'critical' ? 'destructive' : 'default'
    });

    // Simulate email/SMS sending
    if (settings.enableEmail && (notification.type === 'critical' || notification.type === 'high')) {
      console.log('Sending email alert:', notification);
    }
    if (settings.enableSMS && notification.type === 'critical') {
      console.log('Sending SMS alert:', notification);
    }
  };

  const playNotificationSound = (type: string) => {
    // Create audio context for different alert sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different alert types
    const frequencies = {
      critical: 800,
      high: 600,
      medium: 400,
      low: 300
    };

    oscillator.frequency.setValueAtTime(frequencies[type as keyof typeof frequencies] || 400, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const showDesktopNotification = (notification: AlertNotification) => {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id
    });
  };

  const isQuietHours = () => {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  const acknowledgeNotification = (id: string) => {
    setNotifications((prev) =>
    prev.map((notif) =>
    notif.id === id ? { ...notif, acknowledged: true } : notif
    )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const acknowledgeAll = () => {
    setNotifications((prev) =>
    prev.map((notif) => ({ ...notif, acknowledged: true }))
    );
    setUnreadCount(0);
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'critical':return 'text-red-600 border-red-200 bg-red-50';
      case 'high':return 'text-orange-600 border-orange-200 bg-orange-50';
      case 'medium':return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'low':return 'text-blue-600 border-blue-200 bg-blue-50';
      default:return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'critical':return <XCircle className="h-4 w-4" />;
      case 'high':return <AlertTriangle className="h-4 w-4" />;
      case 'medium':return <Clock className="h-4 w-4" />;
      case 'low':return <CheckCircle className="h-4 w-4" />;
      default:return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Real-time Alert Notifications
            {unreadCount > 0 &&
            <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            }
          </CardTitle>
          <CardDescription>
            Live monitoring alerts with configurable notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setIsMonitoring(!isMonitoring)}
                variant={isMonitoring ? "destructive" : "default"}
                className="flex items-center gap-2">

                {isMonitoring ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </Button>
              
              {notifications.length > 0 &&
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={acknowledgeAll}>
                    Mark All Read
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear All
                  </Button>
                </div>
              }
            </div>

            <div className="flex items-center gap-2">
              {isQuietHours() &&
              <Badge variant="secondary" className="flex items-center gap-1">
                  <VolumeX className="h-3 w-3" />
                  Quiet Hours
                </Badge>
              }
              <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                {isMonitoring ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how and when you receive alert notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm font-medium">Sound Alerts</span>
              </div>
              <Button
                variant={settings.enableSound ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings((prev) => ({ ...prev, enableSound: !prev.enableSound }))}>

                {settings.enableSound ? 'On' : 'Off'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">Desktop</span>
              </div>
              <Button
                variant={settings.enableDesktop ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings((prev) => ({ ...prev, enableDesktop: !prev.enableDesktop }))}>

                {settings.enableDesktop ? 'On' : 'Off'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <Button
                variant={settings.enableEmail ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings((prev) => ({ ...prev, enableEmail: !prev.enableEmail }))}>

                {settings.enableEmail ? 'On' : 'Off'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm font-medium">SMS</span>
              </div>
              <Button
                variant={settings.enableSMS ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings((prev) => ({ ...prev, enableSMS: !prev.enableSMS }))}>

                {settings.enableSMS ? 'On' : 'Off'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Live Alert Feed
            </span>
            {notifications.length > 0 &&
            <Badge variant="outline">
                {notifications.length} notifications
              </Badge>
            }
          </CardTitle>
          <CardDescription>
            Real-time alerts and system notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ?
          <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm">Start monitoring to receive real-time alerts</p>
            </div> :

          <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {notifications.map((notification) =>
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className={`p-4 border rounded-lg ${getSeverityColor(notification.type)} ${
                notification.acknowledged ? 'opacity-60' : ''}`
                }>

                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">
                          {getSeverityIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            {!notification.acknowledged &&
                        <Badge variant="destructive" className="text-xs">
                                New
                              </Badge>
                        }
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          
                          {notification.metrics &&
                      <div className="text-xs text-muted-foreground mb-2">
                              <Progress
                          value={notification.metrics.currentValue / (notification.metrics.threshold * 1.5) * 100}
                          className="h-1 mb-1" />

                              Current: {notification.metrics.currentValue.toFixed(2)}{notification.metrics.unit} | 
                              Threshold: {notification.metrics.threshold}{notification.metrics.unit}
                            </div>
                      }
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {notification.source} • {formatTimestamp(notification.timestamp)}
                            </span>
                            <div className="flex items-center gap-1">
                              {!notification.acknowledged &&
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeNotification(notification.id)}
                            className="h-6 px-2 text-xs">

                                  Acknowledge
                                </Button>
                          }
                              <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearNotification(notification.id)}
                            className="h-6 w-6 p-0">

                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
              )}
              </AnimatePresence>
            </div>
          }
        </CardContent>
      </Card>

      {/* Demo Alert */}
      {isMonitoring &&
      <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Monitoring is active. Demo alerts will be generated randomly to showcase the notification system.
            In production, alerts would be triggered by actual performance threshold violations.
          </AlertDescription>
        </Alert>
      }
    </div>);

};

export default RealtimeAlertNotifications;