import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Mail, UserX, CheckCircle } from "lucide-react";
import { UserValidationError } from '@/services/userValidationService';

interface UserValidationDisplayProps {
  errors: UserValidationError[];
  className?: string;
  showTitle?: boolean;
}

const UserValidationDisplay: React.FC<UserValidationDisplayProps> = ({
  errors,
  className = "",
  showTitle = true
}) => {
  const getErrorIcon = (type: UserValidationError['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'role':
        return <UserX className="h-4 w-4" />;
      case 'admin_protection':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorVariant = (type: UserValidationError['type']) => {
    switch (type) {
      case 'admin_protection':
        return 'destructive';
      case 'role':
      case 'email':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (errors.length === 0) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Validation Passed</AlertTitle>
        <AlertDescription className="text-green-700">
          All user data is valid and ready for processing.
        </AlertDescription>
      </Alert>);

  }

  // Group errors by type
  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, UserValidationError[]>);

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      {showTitle &&
      <CardHeader className="pb-3">
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            User Validation Errors ({errors.length})
          </CardTitle>
        </CardHeader>
      }
      
      <CardContent className="space-y-4">
        {Object.entries(errorsByType).map(([type, typeErrors]) =>
        <div key={type} className="space-y-2">
            <div className="flex items-center gap-2">
              {getErrorIcon(type as UserValidationError['type'])}
              <Badge variant={getErrorVariant(type as UserValidationError['type'])}>
                {type.replace('_', ' ').toUpperCase()} ({typeErrors.length})
              </Badge>
            </div>
            
            <div className="space-y-1 ml-6">
              {typeErrors.map((error, index) =>
            <Alert key={index} className="py-2">
                  <AlertDescription className="text-sm">
                    <span className="font-medium">{error.field}:</span> {error.message}
                  </AlertDescription>
                </Alert>
            )}
            </div>
          </div>
        )}
        
        {errorsByType.admin_protection &&
        <Alert className="border-orange-200 bg-orange-50">
            <Shield className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">Admin Protection Active</AlertTitle>
            <AlertDescription className="text-orange-700">
              The system is protecting the admin@dfs-portal.com account from unauthorized changes.
              This ensures continued system access and security.
            </AlertDescription>
          </Alert>
        }
      </CardContent>
    </Card>);

};

export default UserValidationDisplay;