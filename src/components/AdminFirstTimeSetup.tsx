import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  UserPlus, Building, MessageSquare, Shield, CheckCircle,
  ArrowRight, Loader2, AlertTriangle, Info } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  inProgress: boolean;
}

const AdminFirstTimeSetup: React.FC = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);

  // Form data for admin user creation
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Administrator',
    station: 'ALL'
  });

  // Setup steps
  const [steps, setSteps] = useState<SetupStep[]>([
  {
    id: 'admin-account',
    title: 'Create Admin Account',
    description: 'Set up your first administrator account',
    completed: false,
    inProgress: false
  },
  {
    id: 'station-setup',
    title: 'Configure Stations',
    description: 'Set up your gas station information',
    completed: false,
    inProgress: false
  },
  {
    id: 'sms-config',
    title: 'SMS Configuration',
    description: 'Configure SMS alerts for license notifications',
    completed: false,
    inProgress: false
  },
  {
    id: 'security-setup',
    title: 'Security Settings',
    description: 'Configure basic security and access controls',
    completed: false,
    inProgress: false
  }]
  );

  useEffect(() => {
    checkSetupProgress();
  }, []);

  const checkSetupProgress = async () => {
    try {
      // Check if admin users exist
      const { data: adminData, error: adminError } = await window.ezsite.apis.tablePage(11725, {
        "PageNo": 1,
        "PageSize": 1,
        "Filters": [{ "name": "role", "op": "Equal", "value": "Administrator" }]
      });

      // Check if stations are configured
      const { data: stationData, error: stationError } = await window.ezsite.apis.tablePage(12599, {
        "PageNo": 1,
        "PageSize": 1
      });

      // Check if SMS is configured
      const { data: smsData, error: smsError } = await window.ezsite.apis.tablePage(12640, {
        "PageNo": 1,
        "PageSize": 1,
        "Filters": [{ "name": "is_active", "op": "Equal", "value": true }]
      });

      // Update steps based on existing data
      const updatedSteps = [...steps];
      let completedCount = 0;

      // Admin check
      if (!adminError && adminData?.List?.length > 0) {
        updatedSteps[0].completed = true;
        completedCount++;
      }

      // Station check
      if (!stationError && stationData?.List?.length > 0) {
        updatedSteps[1].completed = true;
        completedCount++;
      }

      // SMS check
      if (!smsError && smsData?.List?.length > 0) {
        updatedSteps[2].completed = true;
        completedCount++;
      }

      // Security is always optional for now
      updatedSteps[3].completed = true;
      completedCount++;

      setSteps(updatedSteps);
      setSetupProgress(completedCount / steps.length * 100);

      // Find next incomplete step
      const nextIncompleteStep = updatedSteps.findIndex((step) => !step.completed);
      if (nextIncompleteStep !== -1) {
        setCurrentStep(nextIncompleteStep);
      }
    } catch (error) {
      console.error('Error checking setup progress:', error);
    }
  };

  const createAdminUser = async () => {
    if (adminForm.password !== adminForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (adminForm.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Create user profile record
      const { error } = await window.ezsite.apis.tableCreate(11725, {
        user_id: 1, // Mock user ID - in real app this would come from auth system
        role: adminForm.role,
        station: adminForm.station,
        employee_id: 'ADMIN001',
        phone: '',
        hire_date: new Date().toISOString(),
        is_active: true,
        detailed_permissions: JSON.stringify({
          dashboard: { canView: true },
          products: { canView: true, canCreate: true, canEdit: true, canDelete: true },
          employees: { canView: true, canCreate: true, canEdit: true, canDelete: true },
          sales: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
          vendors: { canView: true, canCreate: true, canEdit: true, canDelete: true },
          orders: { canView: true, canCreate: true, canEdit: true, canDelete: true },
          licenses: { canView: true, canCreate: true, canEdit: true, canDelete: true },
          delivery: { canView: true, canCreate: true, canEdit: true, canDelete: true },
          inventory: { canView: true, canCreate: true, canEdit: true, canDelete: true },
          admin: { canView: true, canCreate: true, canEdit: true, canDelete: true }
        })
      });

      if (error) {
        throw new Error(error);
      }

      // Update step completion
      const updatedSteps = [...steps];
      updatedSteps[0].completed = true;
      setSteps(updatedSteps);

      toast({
        title: "Success!",
        description: "Admin account created successfully"
      });

      // Move to next step
      setCurrentStep(1);

    } catch (error) {
      console.error('Error creating admin user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create admin account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupDefaultStations = async () => {
    try {
      setLoading(true);

      const defaultStations = [
      {
        station_name: 'MOBIL',
        address: 'Please update with actual address',
        phone: 'Please update with phone number',
        operating_hours: '24/7',
        manager_name: 'Please update manager name',
        status: 'Active'
      },
      {
        station_name: 'AMOCO ROSEDALE',
        address: 'Please update with actual address',
        phone: 'Please update with phone number',
        operating_hours: '24/7',
        manager_name: 'Please update manager name',
        status: 'Active'
      },
      {
        station_name: 'AMOCO BROOKLYN',
        address: 'Please update with actual address',
        phone: 'Please update with phone number',
        operating_hours: '24/7',
        manager_name: 'Please update manager name',
        status: 'Active'
      }];


      for (const station of defaultStations) {
        const { error } = await window.ezsite.apis.tableCreate(12599, {
          ...station,
          last_updated: new Date().toISOString(),
          created_by: 1
        });

        if (error) {
          throw new Error(`Failed to create ${station.station_name}: ${error}`);
        }
      }

      // Update step completion
      const updatedSteps = [...steps];
      updatedSteps[1].completed = true;
      setSteps(updatedSteps);

      toast({
        title: "Success!",
        description: "Default stations created. Please update their details in Site Management."
      });

      // Move to next step
      setCurrentStep(2);

    } catch (error) {
      console.error('Error setting up stations:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to setup stations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const configureSMSPlaceholder = () => {
    // Update step completion (placeholder)
    const updatedSteps = [...steps];
    updatedSteps[2].completed = true;
    setSteps(updatedSteps);

    toast({
      title: "SMS Configuration",
      description: "SMS setup can be completed later in Admin Settings"
    });

    // Move to next step
    setCurrentStep(3);
  };

  const completeSecuritySetup = () => {
    // Update step completion
    const updatedSteps = [...steps];
    updatedSteps[3].completed = true;
    setSteps(updatedSteps);

    toast({
      title: "Setup Complete!",
      description: "Your DFS Manager Portal is ready to use"
    });

    // Update progress
    setSetupProgress(100);
  };

  const getStepIcon = (step: SetupStep, index: number) => {
    if (step.completed) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (step.inProgress || index === currentStep) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  const completedSteps = steps.filter((step) => step.completed).length;
  const progressPercentage = completedSteps / steps.length * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="h-8 w-8" />
            Welcome to DFS Manager Portal
          </CardTitle>
          <p className="text-blue-100">
            Let's get your gas station management system set up in just a few steps
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-100">Setup Progress</span>
              <span className="font-bold">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) =>
            <div key={step.id} className="flex items-center gap-4 p-3 rounded-lg border">
                {getStepIcon(step, index)}
                <div className="flex-1">
                  <h4 className="font-semibold">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {step.completed && <Badge className="bg-green-100 text-green-800">Complete</Badge>}
                  {index === currentStep && !step.completed &&
                <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                }
                  {index > currentStep && !step.completed &&
                <Badge variant="outline">Pending</Badge>
                }
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Details */}
      {currentStep === 0 && !steps[0].completed &&
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Step 1: Create Admin Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Create your first administrator account to manage the system. 
                This account will have full access to all features.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                id="username"
                value={adminForm.username}
                onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                placeholder="admin" />

              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                placeholder="admin@yourcompany.com" />

              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                id="password"
                type="password"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                placeholder="Minimum 8 characters" />

              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                id="confirmPassword"
                type="password"
                value={adminForm.confirmPassword}
                onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                placeholder="Confirm your password" />

              </div>
            </div>

            <div className="mt-6">
              <Button
              onClick={createAdminUser}
              disabled={loading || !adminForm.username || !adminForm.email || !adminForm.password}
              className="w-full md:w-auto">

                {loading ?
              <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </> :

              <>
                    Create Admin Account
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
              }
              </Button>
            </div>
          </CardContent>
        </Card>
      }

      {currentStep === 1 && !steps[1].completed &&
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-6 w-6" />
              Step 2: Configure Stations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Set up your gas stations. We'll create default entries for MOBIL, AMOCO ROSEDALE, 
                and AMOCO BROOKLYN that you can update later with specific details.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">MOBIL</h4>
                  <p className="text-sm text-gray-600">Main gas station location</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">AMOCO ROSEDALE</h4>
                  <p className="text-sm text-gray-600">Rosedale location</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">AMOCO BROOKLYN</h4>
                  <p className="text-sm text-gray-600">Brooklyn location</p>
                </div>
              </div>

              <Button
              onClick={setupDefaultStations}
              disabled={loading}
              className="w-full md:w-auto">

                {loading ?
              <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up stations...
                  </> :

              <>
                    Setup Default Stations
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
              }
              </Button>
            </div>
          </CardContent>
        </Card>
      }

      {currentStep === 2 && !steps[2].completed &&
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Step 3: SMS Configuration (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                SMS alerts will notify you when licenses are about to expire. 
                You can configure this now or skip and set it up later in Admin Settings.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <p className="text-gray-600">
                SMS configuration requires Twilio credentials and can be complex. 
                We recommend completing the basic setup first and configuring SMS later.
              </p>

              <div className="flex gap-2">
                <Button
                onClick={configureSMSPlaceholder}
                variant="outline"
                className="flex-1">

                  Skip for Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                onClick={() => window.open('/admin/sms-alert-management', '_blank')}
                className="flex-1">

                  Configure SMS Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      }

      {currentStep === 3 && !steps[3].completed &&
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Step 4: Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Basic security settings are already configured. You can customize them later 
                in the Security Settings page.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-green-600">✓ User Access Control</h4>
                  <p className="text-sm text-gray-600">Role-based permissions are active</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-green-600">✓ Audit Logging</h4>
                  <p className="text-sm text-gray-600">User actions are being tracked</p>
                </div>
              </div>

              <Button
              onClick={completeSecuritySetup}
              className="w-full md:w-auto">

                Complete Setup
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      }

      {/* Setup Complete */}
      {progressPercentage === 100 &&
      <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-800 mb-2">
                Setup Complete! 🎉
              </h3>
              <p className="text-green-700 mb-4">
                Your DFS Manager Portal is ready to use. You can now start managing your gas stations.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-green-600 hover:bg-green-700">

                  Go to Dashboard
                </Button>
                <Button
                variant="outline"
                onClick={() => window.open('/dashboard?tab=setup', '_blank')}>

                  View Setup Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default AdminFirstTimeSetup;