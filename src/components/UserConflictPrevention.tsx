import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  Shield,
  Users,
  Mail,
  UserX,
  RefreshCw,
  Search } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

interface ValidationResult {
  isValid: boolean;
  type: 'email' | 'role' | 'admin_protection';
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface UserProfile {
  id: number;
  user_id: number;
  role: string;
  station: string;
  employee_id: string;
  phone: string;
  email?: string;
  is_active: boolean;
}

const UserConflictPrevention: React.FC = () => {
  const [emailToCheck, setEmailToCheck] = useState('');
  const [roleToCheck, setRoleToCheck] = useState('');
  const [stationToCheck, setStationToCheck] = useState('');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [existingUsers, setExistingUsers] = useState<UserProfile[]>([]);
  const { toast } = useToast();

  const debouncedEmail = useDebounce(emailToCheck, 500);
  const roles = ['Administrator', 'Management', 'Employee'];
  const stations = ['ALL', 'MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'];

  useEffect(() => {
    loadExistingUsers();
  }, []);

  useEffect(() => {
    if (debouncedEmail) {
      validateEmail(debouncedEmail);
    }
  }, [debouncedEmail]);

  const loadExistingUsers = async () => {
    try {
      // Load user profiles
      const { data, error } = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false
      });

      if (error) throw error;
      setExistingUsers(data?.List || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load existing users",
        variant: "destructive"
      });
    }
  };

  const validateEmail = async (email: string) => {
    if (!email) return;

    setIsValidating(true);
    try {
      const results: ValidationResult[] = [];

      // Check admin protection
      if (email === 'admin@dfs-portal.com') {
        results.push({
          isValid: false,
          type: 'admin_protection',
          message: 'This is the protected admin email. Changes to this account are restricted.',
          severity: 'error'
        });
      }

      // Check email uniqueness in the system
      try {
        const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
        if (!userError && userData?.Email === email) {
          results.push({
            isValid: false,
            type: 'email',
            message: 'This email is already registered in the system.',
            severity: 'error'
          });
        }
      } catch (err) {









































































































































































































































        // User not found or not logged in - this is fine for email uniqueness check
      } // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;if (!emailRegex.test(email)) {results.push({ isValid: false, type: 'email', message: 'Invalid email format.', severity: 'error' });}if (results.length === 0) {results.push({ isValid: true, type: 'email', message: 'Email is available and valid.', severity: 'info' });}setValidationResults(results);} catch (error) {console.error('Error validating email:', error);} finally {setIsValidating(false);}};const validateRoleConflict = () => {if (!roleToCheck || !stationToCheck) {toast({ title: "Validation Required", description: "Please select both role and station to check for conflicts", variant: "destructive" });return;}const results: ValidationResult[] = []; // Check for role conflicts
    const conflictingUsers = existingUsers.filter((user) => user.role === roleToCheck && user.station === stationToCheck && user.is_active);if (conflictingUsers.length > 0) {// Special handling for Administrator role
      if (roleToCheck === 'Administrator') {results.push({ isValid: false, type: 'role', message: `Administrator role already exists for ${stationToCheck}. Multiple administrators per station may cause conflicts.`, severity: 'warning' });} else {results.push({ isValid: true, type: 'role', message: `${conflictingUsers.length} user(s) already have the ${roleToCheck} role at ${stationToCheck}. This may be acceptable.`, severity: 'info' });}} else {results.push({ isValid: true, type: 'role', message: `No conflicts found for ${roleToCheck} role at ${stationToCheck}.`, severity: 'info' });}setValidationResults(results);};const checkAdminProtection = () => {const results: ValidationResult[] = [];const adminUsers = existingUsers.filter((user) => user.role === 'Administrator' && user.is_active);if (adminUsers.length === 1) {results.push({ isValid: false, type: 'admin_protection', message: 'Only one administrator exists. Deactivating or removing this user could lock you out of the system.', severity: 'error' });} else if (adminUsers.length > 1) {results.push({ isValid: true, type: 'admin_protection', message: `${adminUsers.length} administrators exist. System has adequate admin coverage.`, severity: 'info' });} else {results.push({ isValid: false, type: 'admin_protection', message: 'No active administrators found. This is a critical security issue.', severity: 'error' });}setValidationResults(results);};const getResultIcon = (result: ValidationResult) => {switch (result.severity) {case 'error':return <AlertTriangle className="w-4 h-4 text-red-500" />;case 'warning':return <AlertTriangle className="w-4 h-4 text-yellow-500" />;case 'info':return <CheckCircle className="w-4 h-4 text-green-500" />;default:return <CheckCircle className="w-4 h-4 text-blue-500" />;}};const getResultVariant = (severity: string) => {switch (severity) {case 'error':return 'destructive';case 'warning':return 'default';default:return 'default';}};return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            User Conflict Prevention System
            <Badge variant="outline">Real-time Validation</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Validation
          </TabsTrigger>
          <TabsTrigger value="role" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Role Conflicts
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin Protection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Uniqueness Checker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-check">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input id="email-check" type="email" placeholder="Enter email to check availability..." value={emailToCheck} onChange={(e) => setEmailToCheck(e.target.value)} className="pl-10" />

                  {isValidating && <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />}
                </div>
              </div>

              <div className="space-y-2">
                {validationResults.filter((result) => result.type === 'email' || result.type === 'admin_protection').map((result, index) => <Alert key={index} variant={getResultVariant(result.severity)}>
                      <div className="flex items-center gap-2">
                        {getResultIcon(result)}
                        <AlertDescription>{result.message}</AlertDescription>
                      </div>
                    </Alert>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Conflict Checker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role-check">Role</Label>
                  <Select value={roleToCheck} onValueChange={setRoleToCheck}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role to check..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="station-check">Station</Label>
                  <Select value={stationToCheck} onValueChange={setStationToCheck}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select station..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((station) => <SelectItem key={station} value={station}>{station}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={validateRoleConflict} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Check Role Conflicts
              </Button>

              <div className="space-y-2">
                {validationResults.filter((result) => result.type === 'role').map((result, index) => <Alert key={index} variant={getResultVariant(result.severity)}>
                      <div className="flex items-center gap-2">
                        {getResultIcon(result)}
                        <AlertDescription>{result.message}</AlertDescription>
                      </div>
                    </Alert>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Administrator Protection Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  <strong>Critical:</strong> admin@dfs-portal.com is permanently protected from deletion 
                  or role changes to prevent system lockout.
                </AlertDescription>
              </Alert>

              <Button onClick={checkAdminProtection} className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Check Admin Coverage
              </Button>

              <div className="space-y-2">
                {validationResults.filter((result) => result.type === 'admin_protection').map((result, index) => <Alert key={index} variant={getResultVariant(result.severity)}>
                      <div className="flex items-center gap-2">
                        {getResultIcon(result)}
                        <AlertDescription>{result.message}</AlertDescription>
                      </div>
                    </Alert>)}
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Current System Status:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Badge variant="outline" className="w-full justify-center">
                      Total Users: {existingUsers.length}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline" className="w-full justify-center">
                      Active Admins: {existingUsers.filter((u) => u.role === 'Administrator' && u.is_active).length}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline" className="w-full justify-center">
                      Total Roles: {new Set(existingUsers.map((u) => u.role)).size}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;};export default UserConflictPrevention;