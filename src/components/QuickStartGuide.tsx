import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play, CheckCircle, Clock, ArrowRight, Users, Building,
  MessageSquare, Package, FileText, Shield, Zap, Database,
  Rocket, Target, Calendar, Book } from
'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface QuickStartTask {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  category: 'essential' | 'recommended' | 'optional';
  actionPath: string;
  actionLabel: string;
  benefits: string[];
}

const QuickStartGuide: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const quickStartTasks: QuickStartTask[] = [
  {
    id: 'create-admin',
    title: 'Create Your First Admin Account',
    description: 'Set up an administrator account to manage your gas station system',
    icon: <Users className="h-5 w-5" />,
    duration: '5 min',
    difficulty: 'easy',
    category: 'essential',
    actionPath: '/admin/user-management',
    actionLabel: 'Create Admin',
    benefits: [
    'Full system access and control',
    'Ability to manage other users',
    'Access to all administrative features']

  },
  {
    id: 'setup-stations',
    title: 'Configure Your Gas Stations',
    description: 'Add information for MOBIL, AMOCO ROSEDALE, and AMOCO BROOKLYN',
    icon: <Building className="h-5 w-5" />,
    duration: '10 min',
    difficulty: 'easy',
    category: 'essential',
    actionPath: '/admin/site-management',
    actionLabel: 'Setup Stations',
    benefits: [
    'Organize operations by location',
    'Track station-specific performance',
    'Manage location-based permissions']

  },
  {
    id: 'configure-sms',
    title: 'Enable SMS Alerts',
    description: 'Set up automatic notifications for license renewals and critical alerts',
    icon: <MessageSquare className="h-5 w-5" />,
    duration: '15 min',
    difficulty: 'medium',
    category: 'essential',
    actionPath: '/admin/sms-alert-management',
    actionLabel: 'Setup SMS',
    benefits: [
    'Never miss license renewal deadlines',
    'Instant alerts for critical issues',
    'Automated compliance notifications']

  },
  {
    id: 'add-employees',
    title: 'Add Your Team Members',
    description: 'Create employee profiles and assign appropriate access levels',
    icon: <Users className="h-5 w-5" />,
    duration: '20 min',
    difficulty: 'easy',
    category: 'recommended',
    actionPath: '/employees',
    actionLabel: 'Add Employees',
    benefits: [
    'Track employee information',
    'Manage payroll and schedules',
    'Control system access by role']

  },
  {
    id: 'upload-licenses',
    title: 'Upload Business Licenses',
    description: 'Add all required licenses and certificates with expiry tracking',
    icon: <FileText className="h-5 w-5" />,
    duration: '25 min',
    difficulty: 'medium',
    category: 'essential',
    actionPath: '/licenses',
    actionLabel: 'Upload Licenses',
    benefits: [
    'Automatic expiry notifications',
    'Compliance tracking',
    'Digital document storage']

  },
  {
    id: 'import-products',
    title: 'Add Your Product Inventory',
    description: 'Import existing products or start adding items with barcode scanning',
    icon: <Package className="h-5 w-5" />,
    duration: '30 min',
    difficulty: 'medium',
    category: 'recommended',
    actionPath: '/products',
    actionLabel: 'Manage Inventory',
    benefits: [
    'Track stock levels automatically',
    'Monitor profit margins',
    'Automate reorder alerts']

  },
  {
    id: 'test-visual-editing',
    title: 'Test Visual Editing Features',
    description: 'Try the visual editing tools to customize your interface',
    icon: <Zap className="h-5 w-5" />,
    duration: '10 min',
    difficulty: 'easy',
    category: 'optional',
    actionPath: '/',
    actionLabel: 'Test Editing',
    benefits: [
    'Customize interface without coding',
    'Update content in real-time',
    'Personalize user experience']

  },
  {
    id: 'setup-security',
    title: 'Configure Security Settings',
    description: 'Enable audit logging and set up access controls',
    icon: <Shield className="h-5 w-5" />,
    duration: '15 min',
    difficulty: 'advanced',
    category: 'recommended',
    actionPath: '/admin/security',
    actionLabel: 'Setup Security',
    benefits: [
    'Track all user actions',
    'Prevent unauthorized access',
    'Meet compliance requirements']

  },
  {
    id: 'monitor-database',
    title: 'Enable System Monitoring',
    description: 'Set up performance monitoring and automated alerts',
    icon: <Database className="h-5 w-5" />,
    duration: '10 min',
    difficulty: 'advanced',
    category: 'optional',
    actionPath: '/admin/database-monitoring',
    actionLabel: 'Setup Monitoring',
    benefits: [
    'Proactive issue detection',
    'Performance optimization',
    'System health insights']

  }];


  const getDifficultyBadge = (difficulty: QuickStartTask['difficulty']) => {
    const config = {
      easy: { label: 'Easy', className: 'bg-green-100 text-green-800' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
      advanced: { label: 'Advanced', className: 'bg-red-100 text-red-800' }
    };
    return <Badge className={config[difficulty].className}>{config[difficulty].label}</Badge>;
  };

  const getCategoryBadge = (category: QuickStartTask['category']) => {
    const config = {
      essential: { label: 'Essential', className: 'bg-red-500 text-white' },
      recommended: { label: 'Recommended', className: 'bg-blue-500 text-white' },
      optional: { label: 'Optional', className: 'bg-gray-500 text-white' }
    };
    return <Badge className={config[category].className}>{config[category].label}</Badge>;
  };

  const handleTaskAction = (task: QuickStartTask) => {
    navigate(task.actionPath);
    toast({
      title: "Starting Setup Task",
      description: `Opening ${task.title} configuration...`
    });
  };

  const markTaskCompleted = (taskId: string) => {
    if (!completedTasks.includes(taskId)) {
      setCompletedTasks([...completedTasks, taskId]);
      toast({
        title: "Task Completed!",
        description: "Great job! You're making excellent progress."
      });
    }
  };

  const getTasksByCategory = (category: string) => {
    return quickStartTasks.filter((task) => task.category === category);
  };

  const essentialTasks = getTasksByCategory('essential');
  const recommendedTasks = getTasksByCategory('recommended');
  const optionalTasks = getTasksByCategory('optional');

  const completionPercentage = Math.round(completedTasks.length / quickStartTasks.length * 100);

  return (
    <div className="space-y-6">
      {/* Quick Start Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Rocket className="h-8 w-8" />
                Quick Start Guide
              </CardTitle>
              <p className="text-blue-100 mt-2 text-lg">
                Get your DFS Manager Portal up and running in under an hour
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{completionPercentage}%</div>
              <p className="text-blue-100">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{essentialTasks.length}</div>
              <p className="text-blue-100">Essential Tasks</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{recommendedTasks.length}</div>
              <p className="text-blue-100">Recommended</p>
            </div>
            <div>
              <div className="text-2xl font-bold">~60 min</div>
              <p className="text-blue-100">Total Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            Your Quick Start Checklist
          </CardTitle>
          <p className="text-gray-600">
            Follow these steps in order for the best setup experience
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="essential">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="essential">
                Essential ({essentialTasks.length})
              </TabsTrigger>
              <TabsTrigger value="recommended">
                Recommended ({recommendedTasks.length})
              </TabsTrigger>
              <TabsTrigger value="optional">
                Optional ({optionalTasks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="essential" className="space-y-4">
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  These tasks are essential for basic system functionality. Complete these first to get started.
                </AlertDescription>
              </Alert>
              
              {essentialTasks.map((task, index) =>
              <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    {completedTasks.includes(task.id) ?
                  <CheckCircle className="h-8 w-8 text-green-500" /> :

                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                        {index + 1}
                      </div>
                  }
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{task.title}</h4>
                      {getCategoryBadge(task.category)}
                      {getDifficultyBadge(task.difficulty)}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.duration}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!completedTasks.includes(task.id) &&
                  <Button onClick={() => handleTaskAction(task)}>
                        {task.actionLabel}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                  }
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markTaskCompleted(task.id)}
                    disabled={completedTasks.includes(task.id)}>

                      {completedTasks.includes(task.id) ? 'Completed' : 'Mark Done'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommended" className="space-y-4">
              <Alert>
                <Book className="h-4 w-4" />
                <AlertDescription>
                  These tasks will enhance your system's functionality and help you get the most out of the platform.
                </AlertDescription>
              </Alert>
              
              {recommendedTasks.map((task, index) =>
              <div key={task.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {task.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{task.title}</h4>
                          {getCategoryBadge(task.category)}
                          {getDifficultyBadge(task.difficulty)}
                        </div>
                        <p className="text-gray-600 text-sm">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {task.duration}
                    </div>
                  </div>
                  
                  <div className="ml-11 space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h5 className="text-sm font-medium text-green-800 mb-2">Benefits:</h5>
                      <ul className="text-sm text-green-700 space-y-1">
                        {task.benefits.map((benefit, i) =>
                      <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {benefit}
                          </li>
                      )}
                      </ul>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={() => handleTaskAction(task)}>
                        {task.actionLabel}
                      </Button>
                      <Button
                      variant="outline"
                      onClick={() => markTaskCompleted(task.id)}
                      disabled={completedTasks.includes(task.id)}>

                        {completedTasks.includes(task.id) ? 'Completed' : 'Mark Done'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="optional" className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  These optional tasks will help you explore advanced features and customize your experience.
                </AlertDescription>
              </Alert>
              
              {optionalTasks.map((task) =>
              <div key={task.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        {task.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{task.title}</h4>
                          {getCategoryBadge(task.category)}
                          {getDifficultyBadge(task.difficulty)}
                        </div>
                        <p className="text-gray-600 text-sm">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {task.duration}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleTaskAction(task)}>
                      {task.actionLabel}
                    </Button>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markTaskCompleted(task.id)}
                    disabled={completedTasks.includes(task.id)}>

                      {completedTasks.includes(task.id) ? '✓ Done' : 'Mark Done'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Success Message */}
      {completionPercentage === 100 &&
      <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-800 mb-2">
                Congratulations! 🎉
              </h3>
              <p className="text-green-700 mb-4">
                You've completed the quick start guide. Your DFS Manager Portal is ready to use!
              </p>
              <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => navigate('/dashboard')}>

                Go to Full Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default QuickStartGuide;