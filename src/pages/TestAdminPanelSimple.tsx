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
          <p className="font-bold">Test Scenario:</p>
          <p>This page tests the RealTimeAdminDashboard with mock data including null values for employee_id and phone fields.</p>
          <p>The third user (EMP003) has null values which previously caused the TypeError.</p>
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
