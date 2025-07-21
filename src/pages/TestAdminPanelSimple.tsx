import React, { useState, useEffect } from 'react';
import RealTimeAdminDashboard from '@/components/RealTimeAdminDashboard';

// Mock window.ezsite.apis for testing
const mockUserProfiles = [
  {
    id: 1,
    user_id: 1,
    role: 'Administrator',
    station: 'ALL',
    employee_id: 'EMP001',
    phone: '123-456-7890',
    hire_date: '2024-01-01',
    is_active: true,
    detailed_permissions: '{}'
  },
  {
    id: 2,
    user_id: 2,
    role: 'Management',
    station: 'MOBIL',
    employee_id: 'EMP002',
    phone: '234-567-8901',
    hire_date: '2024-02-01',
    is_active: true,
    detailed_permissions: '{}'
  },
  {
    id: 3,
    user_id: 3,
    role: 'Employee',
    station: 'AMOCO ROSEDALE',
    employee_id: null, // This will test our fix
    phone: null, // This will test our fix
    hire_date: '2024-03-01',
    is_active: false,
    detailed_permissions: '{}'
  },
  {
    id: 4,
    user_id: 4,
    role: undefined, // Edge case: undefined role
    station: 'MOBIL',
    employee_id: '', // Edge case: empty string
    phone: '', // Edge case: empty string
    hire_date: '2024-04-01',
    is_active: true,
    detailed_permissions: '{}'
  },
  {
    id: 5,
    user_id: 5,
    role: 'Employee',
    station: null, // Edge case: null station
    employee_id: '   ', // Edge case: whitespace only
    phone: '!@#$%^&*()', // Edge case: special characters
    hire_date: null,
    is_active: true,
    detailed_permissions: null
  },
  {
    id: 6,
    user_id: 6,
    role: 'ADMINISTRATOR', // Edge case: uppercase variation
    station: 'ALL',
    employee_id: 'VeryLongEmployeeIdThatMightCauseLayoutIssuesInTheTableDisplay123456789',
    phone: '+1 (555) 123-4567 ext. 890', // Edge case: formatted phone
    hire_date: '2024-05-01',
    is_active: true,
    detailed_permissions: '{}'
  }
];

// Override window.ezsite.apis for testing
if (!window.ezsite) {
  window.ezsite = { apis: {} };
}

window.ezsite.apis.tablePage = async (tableId: number, params: any) => {
  console.log('Mock tablePage called:', tableId, params);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return mock data for user profiles table
  if (tableId === 11725) {
    return {
      data: {
        List: mockUserProfiles,
        VirtualCount: mockUserProfiles.length
      },
      error: null
    };
  }
  
  // Return empty data for other tables
  return {
    data: {
      List: [],
      VirtualCount: 0
    },
    error: null
  };
};

const TestAdminPanelSimple = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-red-600">
          Test Admin Panel - Testing toLowerCase() Fix
        </h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Test Scenarios:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>User 3: null employee_id and phone (original bug scenario)</li>
            <li>User 4: undefined role, empty string employee_id and phone</li>
            <li>User 5: null station, whitespace-only employee_id, special characters in phone</li>
            <li>User 6: uppercase role variation, very long employee_id, formatted phone number</li>
          </ul>
          <p className="mt-2 font-semibold">All edge cases should be handled without errors.</p>
        </div>
        
        {/* Mock auth context for the component */}
        <div style={{ '--test-user': 'Test Admin' } as any}>
          <RealTimeAdminDashboard />
        </div>
      </div>
    </div>
  );
};

// Override useAuth hook for this test
const originalUseAuth = React.useContext;
React.useContext = function(context: any) {
  if (context && context._currentValue && context._currentValue.user !== undefined) {
    // This is the AuthContext
    return {
      user: { Name: 'Test Admin' },
      isAdmin: () => true
    };
  }
  return originalUseAuth.call(this, context);
};

export default TestAdminPanelSimple;
