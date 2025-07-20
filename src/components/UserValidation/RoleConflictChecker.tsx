import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Users, RefreshCw, CheckCircle } from "lucide-react";
import { useUserValidation } from '@/hooks/use-user-validation';

interface RoleConflictCheckerProps {
  selectedRole?: string;
  selectedStation?: string;
  excludeUserId?: number;
  onConflictsFound?: (conflicts: any[]) => void;
  autoCheck?: boolean;
  className?: string;
}

const RoleConflictChecker: React.FC<RoleConflictCheckerProps> = ({
  selectedRole,
  selectedStation,
  excludeUserId,
  onConflictsFound,
  autoCheck = true,
  className = ""
}) => {
  const [role, setRole] = useState(selectedRole || '');
  const [station, setStation] = useState(selectedStation || '');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const { checkRoleConflicts } = useUserValidation({ showToasts: false });

  const roles = ['Administrator', 'Management', 'Employee'];
  const stations = ['MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'];

  const checkForConflicts = async () => {
    if (!role || !station) return;

    setIsChecking(true);
    try {
      const foundConflicts = await checkRoleConflicts(role, station, excludeUserId);
      setConflicts(foundConflicts);
      onConflictsFound?.(foundConflicts);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (selectedRole) setRole(selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    if (selectedStation) setStation(selectedStation);
  }, [selectedStation]);

  useEffect(() => {
    if (autoCheck && role && station) {
      checkForConflicts();
    }
  }, [role, station, excludeUserId, autoCheck]);

  const getRoleConflictSeverity = (conflictType: string) => {
    if (conflictType.includes('Administrator')) return 'destructive';
    if (conflictType.includes('Management')) return 'default';
    return 'secondary';
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Role Conflict Checker
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role-select">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) =>
                <SelectItem key={r} value={r}>{r}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="station-select">Station</Label>
            <Select value={station} onValueChange={setStation}>
              <SelectTrigger id="station-select">
                <SelectValue placeholder="Select station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((s) =>
                <SelectItem key={s} value={s}>{s}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={checkForConflicts}
              disabled={!role || !station || isChecking}
              className="w-full">

              {isChecking ?
              <RefreshCw className="h-4 w-4 animate-spin mr-2" /> :

              <AlertTriangle className="h-4 w-4 mr-2" />
              }
              Check Conflicts
            </Button>
          </div>
        </div>

        {/* Results */}
        {role && station &&
        <div className="space-y-3">
            {conflicts.length === 0 ?
          <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  No role conflicts found for {role} at {station}
                </AlertDescription>
              </Alert> :

          <div className="space-y-2">
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700">
                    {conflicts.length} role conflict(s) found for {role} at {station}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  {conflicts.map((conflict, index) =>
              <Card key={index} className="border-red-200 bg-red-50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-red-800">
                              User ID: {conflict.user_id}
                            </p>
                            <p className="text-sm text-red-700">
                              Current Role: {conflict.role} at {conflict.station}
                            </p>
                            <p className="text-sm text-red-600">
                              Employee ID: {conflict.employee_id}
                            </p>
                          </div>
                          <Badge variant={getRoleConflictSeverity(conflict.conflictType)}>
                            Conflict
                          </Badge>
                        </div>
                        <Alert className="mt-2 py-1">
                          <AlertDescription className="text-sm">
                            {conflict.conflictType}
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
              )}
                </div>
              </div>
          }
          </div>
        }
      </CardContent>
    </Card>);

};

export default RoleConflictChecker;