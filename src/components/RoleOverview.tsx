import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  Users,
  UserCheck,
  Star,
  Eye,
  Info,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Settings,
  Database,
  FileText,
  Package,
  DollarSign } from
'lucide-react';

const ROLE_DEFINITIONS = {
  'Super Admin': {
    icon: Shield,
    color: 'bg-red-100 text-red-800 border-red-200',
    level: 5,
    description: 'Complete system access with all permissions',
    responsibilities: [
    'Manage all users and their permissions',
    'Configure system settings and security',
    'Access all data and operations',
    'System maintenance and monitoring',
    'Final approval authority'],

    access: {
      dashboard: '✓ Full Access',
      products: '✓ All Operations',
      employees: '✓ All Operations',
      sales: '✓ All Operations',
      vendors: '✓ All Operations',
      orders: '✓ All Operations',
      inventory: '✓ All Operations',
      delivery: '✓ All Operations',
      licenses: '✓ All Operations',
      salary: '✓ All Operations',
      settings: '✓ All Operations',
      userManagement: '✓ Full Control',
      systemLogs: '✓ Full Access',
      security: '✓ Full Control'
    },
    whenToUse: 'For IT administrators and owners who need complete system control'
  },
  'Manager': {
    icon: UserCheck,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    level: 4,
    description: 'Full operational access with limited admin features',
    responsibilities: [
    'Oversee daily business operations',
    'Manage sales, inventory, and orders',
    'View and generate reports',
    'Supervise employee activities',
    'Handle vendor relationships'],

    access: {
      dashboard: '✓ Full Access',
      products: '✓ All Operations',
      employees: '✓ View, Create, Edit',
      sales: '✓ All Operations',
      vendors: '✓ All Operations',
      orders: '✓ All Operations',
      inventory: '✓ View, Edit',
      delivery: '✓ All Operations',
      licenses: '✓ View Only',
      salary: '✓ View, Create, Edit',
      settings: '✓ Basic Settings',
      userManagement: '✗ No Access',
      systemLogs: '✓ View Only',
      security: '✗ No Access'
    },
    whenToUse: 'For store managers and department heads who run day-to-day operations'
  },
  'Supervisor': {
    icon: Star,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    level: 3,
    description: 'Department oversight with specific area management',
    responsibilities: [
    'Supervise specific departments',
    'Review and approve reports',
    'Train and guide employees',
    'Monitor daily operations',
    'Assist with inventory management'],

    access: {
      dashboard: '✓ View Only',
      products: '✓ View, Edit',
      employees: '✓ View Only',
      sales: '✓ View, Create, Edit',
      vendors: '✓ View Only',
      orders: '✓ View, Create',
      inventory: '✓ View, Edit',
      delivery: '✓ View, Edit',
      licenses: '✓ View Only',
      salary: '✓ View Only',
      settings: '✗ No Access',
      userManagement: '✗ No Access',
      systemLogs: '✗ No Access',
      security: '✗ No Access'
    },
    whenToUse: 'For assistant managers and team leaders who oversee specific areas'
  },
  'Employee': {
    icon: Users,
    color: 'bg-green-100 text-green-800 border-green-200',
    level: 2,
    description: 'Daily operations access for routine tasks',
    responsibilities: [
    'Process sales transactions',
    'Handle delivery records',
    'Basic inventory monitoring',
    'Customer service',
    'Follow established procedures'],

    access: {
      dashboard: '✓ View Only',
      products: '✓ View Only',
      employees: '✗ No Access',
      sales: '✓ Create, Edit',
      vendors: '✗ No Access',
      orders: '✗ No Access',
      inventory: '✓ View Only',
      delivery: '✓ Create, Edit',
      licenses: '✗ No Access',
      salary: '✗ No Access',
      settings: '✗ No Access',
      userManagement: '✗ No Access',
      systemLogs: '✗ No Access',
      security: '✗ No Access'
    },
    whenToUse: 'For front-line staff who handle daily customer interactions and basic operations'
  },
  'Read Only': {
    icon: Eye,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    level: 1,
    description: 'View-only access for monitoring and reporting',
    responsibilities: [
    'View reports and data',
    'Monitor business metrics',
    'Export data for analysis',
    'Audit and compliance review',
    'Read-only system access'],

    access: {
      dashboard: '✓ View Only',
      products: '✓ View Only',
      employees: '✓ View Only',
      sales: '✓ View Only',
      vendors: '✓ View Only',
      orders: '✓ View Only',
      inventory: '✓ View Only',
      delivery: '✓ View Only',
      licenses: '✓ View Only',
      salary: '✗ No Access',
      settings: '✗ No Access',
      userManagement: '✗ No Access',
      systemLogs: '✗ No Access',
      security: '✗ No Access'
    },
    whenToUse: 'For auditors, accountants, and external reviewers who need read-only access'
  }
};

const ACCESS_ICONS = {
  dashboard: Database,
  products: Package,
  employees: Users,
  sales: FileText,
  vendors: Settings,
  orders: Settings,
  inventory: Package,
  delivery: Settings,
  licenses: Shield,
  salary: DollarSign,
  settings: Settings,
  userManagement: UserCheck,
  systemLogs: FileText,
  security: Shield
};

interface RoleOverviewProps {
  trigger?: React.ReactNode;
}

const RoleOverview: React.FC<RoleOverviewProps> = ({ trigger }) => {
  const defaultTrigger =
  <Button variant="outline" className="border-gray-300">
      <Info className="w-4 h-4 mr-2" />
      Role Guide
    </Button>;


  const getAccessIcon = (access: string) => {
    if (access.startsWith('✓')) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (access.startsWith('✗')) return <XCircle className="w-4 h-4 text-red-600" />;
    return <Eye className="w-4 h-4 text-blue-600" />;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Role Definitions & Permissions Guide</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Reference Guide
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* Role Hierarchy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>Role Hierarchy</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-gray-50 p-4 rounded-lg">
                  {Object.entries(ROLE_DEFINITIONS).map(([role, definition], index) =>
                  <div key={role} className="flex items-center">
                      <div className="text-center">
                        <div className={`p-3 rounded-lg border-2 ${definition.color}`}>
                          <definition.icon className="w-6 h-6 mx-auto" />
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold text-sm">{role}</div>
                          <div className="text-xs text-gray-500">Level {definition.level}</div>
                        </div>
                      </div>
                      {index < Object.keys(ROLE_DEFINITIONS).length - 1 &&
                    <ArrowRight className="w-5 h-5 text-gray-400 mx-4" />
                    }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Role Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(ROLE_DEFINITIONS).map(([role, definition]) =>
              <Card key={role} className="border-l-4" style={{ borderLeftColor: definition.color.includes('red') ? '#ef4444' : definition.color.includes('blue') ? '#3b82f6' : definition.color.includes('purple') ? '#8b5cf6' : definition.color.includes('green') ? '#10b981' : '#6b7280' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <definition.icon className="w-6 h-6" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span>{role}</span>
                          <Badge className={definition.color}>
                            Level {definition.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 font-normal mt-1">
                          {definition.description}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* When to Use */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-blue-700">When to Use:</h4>
                      <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        {definition.whenToUse}
                      </p>
                    </div>

                    {/* Responsibilities */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Key Responsibilities:</h4>
                      <ul className="space-y-1">
                        {definition.responsibilities.map((responsibility, index) =>
                      <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                            <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{responsibility}</span>
                          </li>
                      )}
                      </ul>
                    </div>

                    {/* System Access */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">System Access:</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.entries(definition.access).map(([area, access]) => {
                        const IconComponent = ACCESS_ICONS[area as keyof typeof ACCESS_ICONS] || Settings;
                        return (
                          <div key={area} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <IconComponent className="w-3 h-3 text-gray-600" />
                                <span className="capitalize">{area.replace(/([A-Z])/g, ' $1').trim()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {getAccessIcon(access)}
                                <span className={access.startsWith('✓') ? 'text-green-700' : 'text-red-700'}>
                                  {access.replace('✓ ', '').replace('✗ ', '')}
                                </span>
                              </div>
                            </div>);

                      })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Quick Reference</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">High Security Roles</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Super Admin - IT/Owners only</li>
                      <li>• Full system access</li>
                      <li>• Can manage other users</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Operational Roles</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Manager - Store operations</li>
                      <li>• Supervisor - Department oversight</li>
                      <li>• Employee - Daily tasks</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Special Access</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Read Only - Auditors/Reviewers</li>
                      <li>• View reports and data</li>
                      <li>• No modification rights</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>);

};

export default RoleOverview;