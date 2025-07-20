import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle, Circle, Clock, AlertTriangle, Settings, Users,
  Building, Shield, MessageSquare, Package, FileText, Database,
  ArrowRight, ExternalLink, Info, Lightbulb, Zap } from
'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'in_progress' | 'pending' | 'attention_needed';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  actionPath?: string;
  actionLabel: string;
  category: 'admin' | 'operations' | 'security' | 'testing';
  dependencies?: string[];
  tips?: string[];
}

const SetupGuidance: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);

  useEffect(() => {
    initializeSetupSteps();
  }, []);

  const initializeSetupSteps = async () => {
    const steps: SetupStep[] = [
    // Admin Setup Steps
    {
      id: 'admin-accounts',
      title: 'Create Admin User Accounts',
      description: 'Set up initial administrator accounts for system management',
      icon: <Users className="h-5 w-5" />,
      status: await checkAdminAccountsStatus(),
      priority: 'high',
      estimatedTime: '10 minutes',
      actionPath: '/admin/user-management',
      actionLabel: 'Manage Users',
      category: 'admin',
      tips: [
      'Create separate admin accounts for each key manager',
      'Use strong passwords and enable two-factor authentication',
      'Assign roles based on responsibility levels']

    },
    {
      id: 'station-config',
      title: 'Configure Station Information',
      description: 'Set up details for MOBIL, AMOCO ROSEDALE, and AMOCO BROOKLYN',
      icon: <Building className="h-5 w-5" />,
      status: await checkStationConfigStatus(),
      priority: 'high',
      estimatedTime: '15 minutes',
      actionPath: '/admin/site-management',
      actionLabel: 'Configure Stations',
      category: 'admin',
      dependencies: ['admin-accounts'],
      tips: [
      'Include accurate address and contact information',
      'Set proper operating hours for each station',
      'Configure manager assignments']

    },
    {
      id: 'sms-alerts',
      title: 'Configure SMS Alert Settings',
      description: 'Set up SMS notifications for license expiry and critical alerts',
      icon: <MessageSquare className="h-5 w-5" />,
      status: await checkSMSConfigStatus(),
      priority: 'high',
      estimatedTime: '20 minutes',
      actionPath: '/admin/sms-alert-management',
      actionLabel: 'Setup SMS Alerts',
      category: 'admin',
      dependencies: ['admin-accounts'],
      tips: [
      'Configure Twilio credentials for SMS delivery',
      'Add contact numbers for each station',
      'Test SMS delivery before going live']

    },
    {
      id: 'employee-profiles',
      title: 'Set Up Employee Profiles',
      description: 'Create employee accounts and assign proper access permissions',
      icon: <Users className="h-5 w-5" />,
      status: await checkEmployeeProfilesStatus(),
      priority: 'medium',
      estimatedTime: '30 minutes',
      actionPath: '/employees',
      actionLabel: 'Manage Employees',
      category: 'operations',
      dependencies: ['admin-accounts', 'station-config'],
      tips: [
      'Upload identification documents for each employee',
      'Set appropriate salary and position information',
      'Assign station-specific access rights']

    },
    {
      id: 'product-inventory',
      title: 'Import Product Inventory',
      description: 'Add existing product data and set up inventory tracking',
      icon: <Package className="h-5 w-5" />,
      status: await checkProductInventoryStatus(),
      priority: 'medium',
      estimatedTime: '45 minutes',
      actionPath: '/products',
      actionLabel: 'Manage Products',
      category: 'operations',
      dependencies: ['admin-accounts'],
      tips: [
      'Use barcode scanning for efficient product entry',
      'Set minimum stock levels for automatic alerts',
      'Configure pricing and profit margins']

    },
    {
      id: 'licenses-certificates',
      title: 'Upload Licenses & Certificates',
      description: 'Add all business licenses and set expiry notifications',
      icon: <FileText className="h-5 w-5" />,
      status: await checkLicensesStatus(),
      priority: 'high',
      estimatedTime: '25 minutes',
      actionPath: '/licenses',
      actionLabel: 'Manage Licenses',
      category: 'operations',
      dependencies: ['sms-alerts'],
      tips: [
      'Scan and upload all license documents',
      'Set reminder alerts 30-60 days before expiry',
      'Include renewal contact information']

    },
    {
      id: 'dashboard-customization',
      title: 'Customize Dashboard Widgets',
      description: 'Configure dashboard layout based on operational needs',
      icon: <Settings className="h-5 w-5" />,
      status: 'pending',
      priority: 'low',
      estimatedTime: '15 minutes',
      actionPath: '/admin/role-testing',
      actionLabel: 'Customize Dashboard',
      category: 'operations',
      dependencies: ['employee-profiles'],
      tips: [
      'Set up role-based dashboard views',
      'Configure relevant widgets for each user type',
      'Test different user perspectives']

    },
    {
      id: 'visual-editing',
      title: 'Test Visual Editing Tools',
      description: 'Verify visual editing functionality across components',
      icon: <Zap className="h-5 w-5" />,
      status: 'pending',
      priority: 'low',
      estimatedTime: '10 minutes',
      actionPath: '/',
      actionLabel: 'Test Editing',
      category: 'testing',
      tips: [
      'Try editing text content in different sections',
      'Test image uploads and replacements',
      'Verify changes are saved properly']

    },
    {
      id: 'security-settings',
      title: 'Configure Security Settings',
      description: 'Set up access controls and security policies',
      icon: <Shield className="h-5 w-5" />,
      status: 'pending',
      priority: 'medium',
      estimatedTime: '20 minutes',
      actionPath: '/admin/security',
      actionLabel: 'Security Settings',
      category: 'security',
      dependencies: ['admin-accounts'],
      tips: [
      'Enable audit logging for all user actions',
      'Set session timeout policies',
      'Configure password requirements']

    },
    {
      id: 'database-monitoring',
      title: 'Setup Database Monitoring',
      description: 'Configure performance monitoring and alerts',
      icon: <Database className="h-5 w-5" />,
      status: 'pending',
      priority: 'medium',
      estimatedTime: '15 minutes',
      actionPath: '/admin/database-monitoring',
      actionLabel: 'Setup Monitoring',
      category: 'admin',
      dependencies: ['admin-accounts'],
      tips: [
      'Configure performance thresholds',
      'Set up automated backups',
      'Monitor connection health']

    }];


    setSetupSteps(steps);
  };

  // Status checking functions (mock implementations)
  const checkAdminAccountsStatus = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(11725, {
        "PageNo": 1,
        "PageSize": 5,
        "Filters": [
        { "name": "role", "op": "Equal", "value": "Administrator" }]

      });
      if (error) return 'attention_needed';
      return data?.List?.length > 0 ? 'completed' : 'pending';
    } catch {
      return 'pending';
    }
  };

  const checkStationConfigStatus = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12599, {
        "PageNo": 1,
        "PageSize": 5
      });
      if (error) return 'attention_needed';
      return data?.List?.length >= 3 ? 'completed' : 'pending';
    } catch {
      return 'pending';
    }
  };

  const checkSMSConfigStatus = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12640, {
        "PageNo": 1,
        "PageSize": 1,
        "Filters": [
        { "name": "is_active", "op": "Equal", "value": true }]

      });
      if (error) return 'attention_needed';
      return data?.List?.length > 0 ? 'completed' : 'pending';
    } catch {
      return 'pending';
    }
  };

  const checkEmployeeProfilesStatus = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(11727, {
        "PageNo": 1,
        "PageSize": 5
      });
      if (error) return 'attention_needed';
      return data?.List?.length > 0 ? 'completed' : 'pending';
    } catch {
      return 'pending';
    }
  };

  const checkProductInventoryStatus = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(11726, {
        "PageNo": 1,
        "PageSize": 5
      });
      if (error) return 'attention_needed';
      return data?.List?.length > 0 ? 'completed' : 'pending';
    } catch {
      return 'pending';
    }
  };

  const checkLicensesStatus = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(11731, {
        "PageNo": 1,
        "PageSize": 5
      });
      if (error) return 'attention_needed';
      return data?.List?.length > 0 ? 'completed' : 'pending';
    } catch {
      return 'pending';
    }
  };

  const getStatusIcon = (status: SetupStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'attention_needed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: SetupStep['status']) => {
    const statusConfig = {
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      attention_needed: { label: 'Needs Attention', className: 'bg-red-100 text-red-800' },
      pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: SetupStep['priority']) => {
    const priorityConfig = {
      high: { label: 'High Priority', className: 'bg-red-100 text-red-800' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Low', className: 'bg-green-100 text-green-800' }
    };

    const config = priorityConfig[priority];
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const calculateProgress = () => {
    const completed = setupSteps.filter((step) => step.status === 'completed').length;
    return Math.round(completed / setupSteps.length * 100);
  };

  const getHighPrioritySteps = () => {
    return setupSteps.filter((step) =>
    step.priority === 'high' && step.status !== 'completed'
    ).slice(0, 3);
  };

  const getStepsByCategory = (category: string) => {
    return setupSteps.filter((step) => step.category === category);
  };

  const handleStepAction = (step: SetupStep) => {
    if (step.actionPath) {
      navigate(step.actionPath);
      toast({
        title: "Navigating to Setup",
        description: `Opening ${step.title} configuration...`
      });
    }
  };

  const progress = calculateProgress();
  const highPrioritySteps = getHighPrioritySteps();

  return (
    <div className="space-y-6">
      {/* Setup Progress Overview */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6" />
                DFS Manager Setup Progress
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Complete these essential steps to get your gas station management system ready
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{progress}%</div>
              <p className="text-sm text-gray-500">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {setupSteps.filter((s) => s.status === 'completed').length}
              </div>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {setupSteps.filter((s) => s.status === 'in_progress').length}
              </div>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {setupSteps.filter((s) => s.status === 'attention_needed').length}
              </div>
              <p className="text-sm text-gray-600">Need Attention</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Priority Next Steps */}
      {highPrioritySteps.length > 0 &&
      <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Immediate Action Required
            </CardTitle>
            <p className="text-gray-600">
              These high-priority steps should be completed first for optimal system operation
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highPrioritySteps.map((step) =>
            <div key={step.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.status)}
                    <div>
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPriorityBadge(step.priority)}
                        <span className="text-xs text-gray-500">
                          Est. {step.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                onClick={() => handleStepAction(step)}
                className="bg-red-600 hover:bg-red-700">

                    {step.actionLabel}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
            )}
            </div>
          </CardContent>
        </Card>
      }

      {/* Detailed Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Setup Guide</CardTitle>
          <p className="text-gray-600">
            Follow these steps to fully configure your DFS Manager Portal
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="admin">Admin Setup</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This overview shows all setup steps across categories. Use the tabs above to focus on specific areas.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                {setupSteps.map((step) =>
                <div key={step.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(step.status)}
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{step.title}</h4>
                          {getStatusBadge(step.status)}
                          {getPriorityBadge(step.priority)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>⏱️ {step.estimatedTime}</span>
                          <span>📁 {step.category}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                    variant="outline"
                    onClick={() => handleStepAction(step)}
                    disabled={step.status === 'completed'}>

                      {step.actionLabel}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="admin" className="space-y-4">
              {getStepsByCategory('admin').map((step) =>
              <div key={step.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(step.status)}
                      <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(step.status)}
                      {getPriorityBadge(step.priority)}
                    </div>
                  </div>
                  
                  {step.tips &&
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Setup Tips:</span>
                      </div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {step.tips.map((tip, index) =>
                    <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {tip}
                          </li>
                    )}
                      </ul>
                    </div>
                }
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">
                      Estimated time: {step.estimatedTime}
                    </span>
                    <Button onClick={() => handleStepAction(step)}>
                      {step.actionLabel}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="operations" className="space-y-4">
              {getStepsByCategory('operations').map((step) =>
              <div key={step.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(step.status)}
                      <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(step.status)}
                      {getPriorityBadge(step.priority)}
                    </div>
                  </div>
                  
                  {step.dependencies &&
                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                      <span className="font-medium text-yellow-800">Prerequisites:</span>
                      <span className="text-yellow-700"> Complete {step.dependencies.join(', ')} first</span>
                    </div>
                }
                  
                  {step.tips &&
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Best Practices:</span>
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        {step.tips.map((tip, index) =>
                    <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {tip}
                          </li>
                    )}
                      </ul>
                    </div>
                }
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">
                      Estimated time: {step.estimatedTime}
                    </span>
                    <Button onClick={() => handleStepAction(step)}>
                      {step.actionLabel}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4">
              {getStepsByCategory('security').concat(getStepsByCategory('testing')).map((step) =>
              <div key={step.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(step.status)}
                      <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(step.status)}
                      {getPriorityBadge(step.priority)}
                    </div>
                  </div>
                  
                  {step.tips &&
                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Security Notes:</span>
                      </div>
                      <ul className="text-sm text-purple-700 space-y-1">
                        {step.tips.map((tip, index) =>
                    <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            {tip}
                          </li>
                    )}
                      </ul>
                    </div>
                }
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">
                      Estimated time: {step.estimatedTime}
                    </span>
                    <Button onClick={() => handleStepAction(step)}>
                      {step.actionLabel}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>);

};

export default SetupGuidance;