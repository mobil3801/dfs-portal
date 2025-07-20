import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, TestTube } from "lucide-react";
import EnhancedUserManagementWithValidation from '@/components/EnhancedUserManagementWithValidation';
import ValidationTestSuite from '@/components/UserValidation/ValidationTestSuite';
import AccessDenied from '@/components/AccessDenied';
import { useAdminAccess } from '@/hooks/use-admin-access';

const UserValidationTestPage: React.FC = () => {
  const { hasAdminAccess } = useAdminAccess();

  if (!hasAdminAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Shield className="h-6 w-6" />
            User Validation & Protection System
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              ADMIN ONLY
            </Badge>
          </CardTitle>
          <p className="text-blue-700">
            Comprehensive user management with role conflict prevention, email uniqueness validation, 
            and admin account protection.
          </p>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Validation Testing
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="management">
          <EnhancedUserManagementWithValidation />
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <ValidationTestSuite />
        </TabsContent>
      </Tabs>
    </div>);

};

export default UserValidationTestPage;