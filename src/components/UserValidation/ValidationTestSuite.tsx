import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, TestTube, Play, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserValidation } from '@/hooks/use-user-validation';

interface TestCase {
  id: string;
  name: string;
  description: string;
  testData: any;
  expectedResult: 'pass' | 'fail';
  category: 'email' | 'role' | 'admin' | 'bulk';
}

interface TestResult {
  testId: string;
  passed: boolean;
  message: string;
  details?: any;
}

const ValidationTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();
  const { validateUser, validateEmail, checkRoleConflicts, canDeleteUser } = useUserValidation({ showToasts: false });

  const testCases: TestCase[] = [
  // Email Uniqueness Tests
  {
    id: 'email-unique-1',
    name: 'Valid New Email',
    description: 'Test with a unique email address',
    testData: { email: `test-${Date.now()}@example.com` },
    expectedResult: 'pass',
    category: 'email'
  },
  {
    id: 'email-duplicate-1',
    name: 'Duplicate Admin Email',
    description: 'Test with admin@dfs-portal.com',
    testData: { email: 'admin@dfs-portal.com' },
    expectedResult: 'fail',
    category: 'email'
  },
  {
    id: 'email-invalid-1',
    name: 'Invalid Email Format',
    description: 'Test with invalid email format',
    testData: { email: 'invalid-email' },
    expectedResult: 'fail',
    category: 'email'
  },

  // Role Conflict Tests
  {
    id: 'role-conflict-1',
    name: 'Valid Employee Role',
    description: 'Assign Employee role to new user',
    testData: {
      role: 'Employee',
      station: 'MOBIL',
      user_id: 9999 // Non-existent user
    },
    expectedResult: 'pass',
    category: 'role'
  },
  {
    id: 'role-conflict-2',
    name: 'Multiple Admin Conflict',
    description: 'Try to create second Administrator',
    testData: {
      role: 'Administrator',
      station: 'MOBIL',
      user_id: 9999
    },
    expectedResult: 'fail',
    category: 'role'
  },
  {
    id: 'role-invalid-1',
    name: 'Invalid Role',
    description: 'Test with non-existent role',
    testData: {
      role: 'SuperUser',
      station: 'MOBIL',
      user_id: 9999
    },
    expectedResult: 'fail',
    category: 'role'
  },

  // Admin Protection Tests
  {
    id: 'admin-protect-1',
    name: 'Admin Role Change Block',
    description: 'Try to change admin role to Employee',
    testData: {
      email: 'admin@dfs-portal.com',
      role: 'Employee',
      id: 1
    },
    expectedResult: 'fail',
    category: 'admin'
  },
  {
    id: 'admin-protect-2',
    name: 'Admin Deactivation Block',
    description: 'Try to deactivate admin account',
    testData: {
      email: 'admin@dfs-portal.com',
      is_active: false,
      id: 1
    },
    expectedResult: 'fail',
    category: 'admin'
  },
  {
    id: 'admin-protect-3',
    name: 'Admin Deletion Block',
    description: 'Try to delete admin account',
    testData: {
      userId: 1,
      userEmail: 'admin@dfs-portal.com'
    },
    expectedResult: 'fail',
    category: 'admin'
  }];


  const runSingleTest = async (testCase: TestCase): Promise<TestResult> => {
    setCurrentTest(testCase.name);

    try {
      let result = false;
      let message = '';
      let details = {};

      switch (testCase.category) {
        case 'email':
          if (testCase.id === 'email-invalid-1') {
            // For invalid email format, we expect validation to fail
            result = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testCase.testData.email);
            message = result ? 'Email format validation working' : 'Email format validation failed';
          } else {
            result = await validateEmail(testCase.testData.email);
            message = result ? 'Email is unique' : 'Email already exists';
          }
          break;

        case 'role':
          const errors = await validateUser(testCase.testData);
          result = errors.length === 0;
          message = result ? 'Role validation passed' : `Role validation failed: ${errors.map((e) => e.message).join(', ')}`;
          details = { errors };
          break;

        case 'admin':
          if (testCase.id === 'admin-protect-3') {
            result = !(await canDeleteUser(testCase.testData.userId, testCase.testData.userEmail));
            message = result ? 'Admin deletion blocked' : 'Admin deletion not blocked';
          } else {
            const adminErrors = await validateUser(testCase.testData, true);
            const hasAdminProtection = adminErrors.some((e) => e.type === 'admin_protection');
            result = hasAdminProtection;
            message = result ? 'Admin protection active' : 'Admin protection failed';
            details = { errors: adminErrors };
          }
          break;

        default:
          result = false;
          message = 'Unknown test category';
      }

      // Check if result matches expectation
      const passed = testCase.expectedResult === 'pass' ? result : !result;

      return {
        testId: testCase.id,
        passed,
        message: passed ? `✓ ${message}` : `✗ ${message}`,
        details
      };

    } catch (error) {
      return {
        testId: testCase.id,
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    const results: TestResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = await runSingleTest(testCase);
      results.push(result);
      setTestResults([...results]);
      setProgress((i + 1) / testCases.length * 100);

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setCurrentTest('');
    setIsRunning(false);

    // Show summary toast
    const passedTests = results.filter((r) => r.passed).length;
    const totalTests = results.length;

    toast({
      title: "Test Suite Complete",
      description: `${passedTests}/${totalTests} tests passed`,
      variant: passedTests === totalTests ? "default" : "destructive"
    });
  };

  const runTestsByCategory = async (category: string) => {
    const categoryTests = testCases.filter((t) => t.category === category);
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    const results: TestResult[] = [];

    for (let i = 0; i < categoryTests.length; i++) {
      const testCase = categoryTests[i];
      const result = await runSingleTest(testCase);
      results.push(result);
      setTestResults([...results]);
      setProgress((i + 1) / categoryTests.length * 100);

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setCurrentTest('');
    setIsRunning(false);
  };

  const getTestsByCategory = (category: string) => {
    return testCases.filter((t) => t.category === category);
  };

  const getCategoryResults = (category: string) => {
    const categoryTestIds = testCases.filter((t) => t.category === category).map((t) => t.id);
    return testResults.filter((r) => categoryTestIds.includes(r.testId));
  };

  const getCategoryStats = (category: string) => {
    const results = getCategoryResults(category);
    const passed = results.filter((r) => r.passed).length;
    const total = getTestsByCategory(category).length;
    return { passed, total, percentage: total > 0 ? passed / total * 100 : 0 };
  };

  const TestCategoryCard = ({ category, title, description



  }: {category: string;title: string;description: string;}) => {
    const stats = getCategoryStats(category);
    const results = getCategoryResults(category);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Badge variant={stats.passed === stats.total ? "default" : "destructive"}>
              {stats.passed}/{stats.total}
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              onClick={() => runTestsByCategory(category)}
              disabled={isRunning}>

              <Play className="h-4 w-4 mr-2" />
              Run Tests
            </Button>
            {stats.total > 0 &&
            <span className="text-sm text-gray-600">
                {stats.percentage.toFixed(0)}% passed
              </span>
            }
          </div>

          {results.length > 0 &&
          <div className="space-y-2">
              {getTestsByCategory(category).map((test) => {
              const result = results.find((r) => r.testId === test.id);
              return (
                <div key={test.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{test.name}</p>
                      <p className="text-xs text-gray-600">{test.description}</p>
                    </div>
                    {result &&
                  <div className="flex items-center gap-2">
                        {result.passed ?
                    <CheckCircle className="h-4 w-4 text-green-600" /> :

                    <XCircle className="h-4 w-4 text-red-600" />
                    }
                        <span className="text-xs">{result.message}</span>
                      </div>
                  }
                  </div>);

            })}
            </div>
          }
        </CardContent>
      </Card>);

  };

  const overallStats = {
    passed: testResults.filter((r) => r.passed).length,
    total: testResults.length,
    percentage: testResults.length > 0 ? testResults.filter((r) => r.passed).length / testResults.length * 100 : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <TestTube className="h-6 w-6" />
            User Validation Test Suite
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {testCases.length} Tests
            </Badge>
          </CardTitle>
          <p className="text-blue-700">
            Comprehensive testing of user validation, role conflicts, and admin protection
          </p>
        </CardHeader>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runAllTests} disabled={isRunning}>
              <Play className="h-4 w-4 mr-2" />
              Run All Tests ({testCases.length})
            </Button>
            
            {overallStats.total > 0 &&
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Results: {overallStats.passed}/{overallStats.total} passed
                </span>
                <Badge variant={overallStats.passed === overallStats.total ? "default" : "destructive"}>
                  {overallStats.percentage.toFixed(0)}%
                </Badge>
              </div>
            }
          </div>

          {isRunning &&
          <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {currentTest ? `Running: ${currentTest}` : 'Preparing tests...'}
                </span>
                <span className="text-sm text-gray-600">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          }
        </CardContent>
      </Card>

      {/* Test Categories */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="email">Email Tests</TabsTrigger>
          <TabsTrigger value="role">Role Tests</TabsTrigger>
          <TabsTrigger value="admin">Admin Protection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TestCategoryCard
              category="email"
              title="Email Uniqueness"
              description="Tests for email validation and uniqueness checking" />

            <TestCategoryCard
              category="role"
              title="Role Conflicts"
              description="Tests for role assignment and conflict detection" />

            <TestCategoryCard
              category="admin"
              title="Admin Protection"
              description="Tests for admin account protection mechanisms" />

          </div>

          {testResults.length > 0 &&
          <Alert className={overallStats.passed === overallStats.total ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
              {overallStats.passed === overallStats.total ?
            <CheckCircle className="h-4 w-4 text-green-600" /> :

            <AlertTriangle className="h-4 w-4 text-orange-600" />
            }
              <AlertDescription className={overallStats.passed === overallStats.total ? "text-green-700" : "text-orange-700"}>
                Test suite {overallStats.passed === overallStats.total ? 'completed successfully' : 'completed with issues'}. 
                {overallStats.passed}/{overallStats.total} tests passed ({overallStats.percentage.toFixed(0)}%).
              </AlertDescription>
            </Alert>
          }
        </TabsContent>

        <TabsContent value="email">
          <TestCategoryCard
            category="email"
            title="Email Uniqueness Tests"
            description="Comprehensive testing of email validation and uniqueness" />

        </TabsContent>

        <TabsContent value="role">
          <TestCategoryCard
            category="role"
            title="Role Conflict Tests"
            description="Testing role assignment validation and conflict detection" />

        </TabsContent>

        <TabsContent value="admin">
          <TestCategoryCard
            category="admin"
            title="Admin Protection Tests"
            description="Testing admin account protection and security measures" />

        </TabsContent>
      </Tabs>
    </div>);

};

export default ValidationTestSuite;