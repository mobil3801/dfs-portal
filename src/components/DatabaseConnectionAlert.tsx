import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAdminAccess from '@/hooks/use-admin-access';

interface DatabaseConnectionAlertProps {
  connections: number;
  max: number;
  showDetails?: boolean;
  className?: string;
}

const DatabaseConnectionAlert: React.FC<DatabaseConnectionAlertProps> = ({
  connections = 85,
  max = 100,
  showDetails = true,
  className = ""
}) => {
  const { hasMonitoringAccess } = useAdminAccess();
  const navigate = useNavigate();
  const percentage = connections / max * 100;

  // Return null if user doesn't have monitoring access
  if (!hasMonitoringAccess) {
    return null;
  }

  // Only show alert if connection usage is high
  if (percentage < 70) {
    return null;
  }

  const getVariant = () => {
    if (percentage >= 85) return 'destructive';
    return 'default';
  };

  const getStatusText = () => {
    if (percentage >= 85) return 'CRITICAL';
    if (percentage >= 70) return 'WARNING';
    return 'NORMAL';
  };

  const handleViewDetails = () => {
    navigate('/admin/database-monitoring');
  };

  return (
    <Alert variant={getVariant()} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>High Database Connection Usage</span>
        <Badge variant="outline" className="ml-2">
          <Database className="h-3 w-3 mr-1" />
          {getStatusText()}
        </Badge>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="flex items-center justify-between">
          <span>Current connections: <strong>{connections}/{max}</strong></span>
          <span className="text-sm">({percentage.toFixed(1)}% capacity)</span>
        </div>
        
        {showDetails &&
        <>
            <div className="text-sm text-muted-foreground">
              {percentage >= 85 ?
            "Database connections are critically high. Immediate action required to prevent service disruption." :

            "Database connection usage is elevated. Monitor closely and consider optimization."
            }
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              className="flex items-center space-x-1">

                <ExternalLink className="h-3 w-3" />
                <span>View Details</span>
              </Button>
            </div>
          </>
        }
      </AlertDescription>
    </Alert>);

};

export default DatabaseConnectionAlert;