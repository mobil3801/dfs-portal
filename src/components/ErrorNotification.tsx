import React, { useState } from 'react';
import { useErrorNotification, type ErrorNotification } from '@/contexts/ErrorNotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  XCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Icon mapping for notification severities
 */
const SEVERITY_ICONS = {
  error: XCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info
};

/**
 * Color schemes for different severities
 */
const SEVERITY_STYLES = {
  error: {
    toast: 'border-red-200 bg-red-50 text-red-800',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-800',
    button: 'hover:bg-red-100'
  },
  warning: {
    toast: 'border-orange-200 bg-orange-50 text-orange-800',
    icon: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-800',
    button: 'hover:bg-orange-100'
  },
  success: {
    toast: 'border-green-200 bg-green-50 text-green-800',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-800',
    button: 'hover:bg-green-100'
  },
  info: {
    toast: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800',
    button: 'hover:bg-blue-100'
  }
};

/**
 * Individual Toast Notification Component
 */
interface ToastNotificationProps {
  notification: ErrorNotification;
  onDismiss: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ notification, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const Icon = SEVERITY_ICONS[notification.severity];
  const styles = SEVERITY_STYLES[notification.severity];

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 150); // Allow for exit animation
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={cn(
        "transform transition-all duration-300 ease-in-out mb-2",
        isExiting ? "translate-x-full opacity-0 scale-95" : "translate-x-0 opacity-100 scale-100",
        notification.dismissed ? "translate-x-full opacity-0" : ""
      )}
    >
      <Alert className={cn("relative pr-12", styles.toast, "shadow-md border-l-4")}>
        <div className="flex items-start space-x-3">
          <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", styles.icon)} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-sm leading-tight">
                  {notification.title}
                </h4>
                
                <AlertDescription className="mt-1 text-sm">
                  {notification.message}
                </AlertDescription>

                {/* Error Code Badge */}
                {notification.errorCode && (
                  <Badge variant="outline" className={cn("mt-2 text-xs", styles.badge)}>
                    Code: {notification.errorCode}
                  </Badge>
                )}

                {/* Expandable Content */}
                {(notification.actionLabel || notification.errorCode) && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleExpanded}
                      className={cn("h-6 px-2 text-xs", styles.button)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          More
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {notification.timestamp.toLocaleTimeString()}
                    </div>
                    
                    {notification.actionCallback && notification.actionLabel && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={notification.actionCallback}
                        className="h-7 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {notification.actionLabel}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-black/10 rounded-full"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </Alert>
    </div>
  );
};

/**
 * Modal Notification Component for Critical Errors
 */
interface ModalNotificationProps {
  notification: ErrorNotification;
  isOpen: boolean;
  onDismiss: (id: string) => void;
}

const ModalNotification: React.FC<ModalNotificationProps> = ({ 
  notification, 
  isOpen, 
  onDismiss 
}) => {
  const Icon = SEVERITY_ICONS[notification.severity];
  const styles = SEVERITY_STYLES[notification.severity];

  const handleDismiss = () => {
    onDismiss(notification.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => handleDismiss()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className={cn("p-2 rounded-full", styles.toast)}>
              <Icon className={cn("h-6 w-6", styles.icon)} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {notification.title}
              </DialogTitle>
              {notification.errorCode && (
                <Badge variant="outline" className={cn("mt-1", styles.badge)}>
                  Error Code: {notification.errorCode}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-base leading-relaxed">
          {notification.message}
        </DialogDescription>

        {/* Additional Details */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {notification.timestamp.toLocaleString()}
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          {notification.actionCallback && notification.actionLabel && (
            <Button
              variant="outline"
              onClick={() => {
                notification.actionCallback?.();
                handleDismiss();
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {notification.actionLabel}
            </Button>
          )}
          <Button onClick={handleDismiss}>
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Main Error Notification Container Component
 */
interface ErrorNotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  maxToasts?: number;
  showModalForCritical?: boolean;
}

export const ErrorNotificationContainer: React.FC<ErrorNotificationContainerProps> = ({
  position = 'top-right',
  maxToasts = 5,
  showModalForCritical = true
}) => {
  const { notifications, dismissNotification, dismissAll } = useErrorNotification();
  
  // Filter out dismissed notifications for display
  const activeNotifications = notifications.filter(n => !n.dismissed);
  
  // Separate critical errors that should show as modals
  const criticalNotifications = showModalForCritical 
    ? activeNotifications.filter(n => n.severity === 'error' && n.persistent)
    : [];
    
  // Toast notifications (limit to maxToasts)
  const toastNotifications = activeNotifications
    .filter(n => !showModalForCritical || n.severity !== 'error' || !n.persistent)
    .slice(-maxToasts);

  // Position classes
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50'
  };

  if (activeNotifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toast Notifications */}
      {toastNotifications.length > 0 && (
        <div className={cn(positionClasses[position], "w-80 max-w-sm")}>
          {/* Dismiss All Button */}
          {toastNotifications.length > 1 && (
            <div className="mb-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissAll}
                className="text-xs h-6 px-2 bg-black/5 hover:bg-black/10"
              >
                Dismiss All ({toastNotifications.length})
              </Button>
            </div>
          )}

          {/* Toast Notifications */}
          <div className="space-y-2">
            {toastNotifications.map((notification) => (
              <ToastNotification
                key={notification.id}
                notification={notification}
                onDismiss={dismissNotification}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal Notifications for Critical Errors */}
      {criticalNotifications.map((notification) => (
        <ModalNotification
          key={notification.id}
          notification={notification}
          isOpen={true}
          onDismiss={dismissNotification}
        />
      ))}
    </>
  );
};

/**
 * Export the main container component as default
 */
export default ErrorNotificationContainer;

/**
 * Hook for easy access to error notifications in components
 */
export const useNotification = () => {
  const context = useErrorNotification();
  return context;
};