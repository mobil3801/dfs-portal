import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, AlertTriangle, Info } from "lucide-react";

interface AdminProtectionAlertProps {
  userEmail?: string;
  isProtectedAdmin?: boolean;
  showDetails?: boolean;
  className?: string;
}

const AdminProtectionAlert: React.FC<AdminProtectionAlertProps> = ({
  userEmail,
  isProtectedAdmin,
  showDetails = true,
  className = ""
}) => {
  const PROTECTED_EMAIL = 'admin@dfs-portal.com';
  const isProtected = isProtectedAdmin || userEmail === PROTECTED_EMAIL;

  if (!isProtected && userEmail !== PROTECTED_EMAIL) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Protection Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <Shield className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800 flex items-center gap-2">
          Admin Protection Active
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            PROTECTED
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-orange-700">
          The account <strong>{PROTECTED_EMAIL}</strong> is protected by the system security policy.
          Certain changes are restricted to maintain administrative access.
        </AlertDescription>
      </Alert>

      {showDetails &&
      <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5" />
              Protection Details
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Protected Operations */}
            <div>
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Restricted Operations
              </h4>
              <div className="space-y-2 ml-6">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">BLOCKED</Badge>
                  <span className="text-sm text-blue-700">Role changes from Administrator</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">BLOCKED</Badge>
                  <span className="text-sm text-blue-700">Account deactivation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">BLOCKED</Badge>
                  <span className="text-sm text-blue-700">Account deletion</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">BLOCKED</Badge>
                  <span className="text-sm text-blue-700">Email address changes</span>
                </div>
              </div>
            </div>

            {/* Allowed Operations */}
            <div>
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Allowed Operations
              </h4>
              <div className="space-y-2 ml-6">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">ALLOWED</Badge>
                  <span className="text-sm text-blue-700">Password changes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">ALLOWED</Badge>
                  <span className="text-sm text-blue-700">Profile information updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">ALLOWED</Badge>
                  <span className="text-sm text-blue-700">Station assignments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">ALLOWED</Badge>
                  <span className="text-sm text-blue-700">Permission modifications</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <Alert className="border-gray-200 bg-gray-50">
              <Info className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-gray-700">
                <strong>Security Notice:</strong> These protections ensure that the system always 
                has at least one administrator account with full access. Contact your system 
                administrator if you need to modify these restrictions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      }
    </div>);

};

export default AdminProtectionAlert;