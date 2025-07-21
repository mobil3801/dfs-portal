import React from 'react';
import AdminPanel from './Admin/AdminPanel';
import { AuthContext } from '@/contexts/AuthContext';

// Mock auth context to bypass authentication
const mockAuthContextValue = {
  user: { 
    ID: 1, 
    Name: 'Test Admin',
    Email: 'admin@test.com',
    CreateTime: new Date().toISOString(),
    Roles: 'Administrator'
  },
  isAdmin: () => true,
  isManagement: () => false,
  isEmployee: () => false,
  hasRole: (role: string) => role === 'Administrator',
  login: async () => ({ success: true }),
  logout: async () => {},
  loading: false,
  isAuthenticated: true,
  userProfile: {
    id: 1,
    user_id: 1,
    role: 'Administrator',
    station: 'ALL',
    employee_id: 'EMP001',
    phone: '123-456-7890',
    hire_date: '2024-01-01',
    is_active: true,
    detailed_permissions: '{}'
  }
};

const TestAdminPanel = () => {
  return (
    <AuthContext.Provider value={mockAuthContextValue}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Test Admin Panel - Direct Access</h1>
          <AdminPanel />
        </div>
      </div>
    </AuthContext.Provider>
  );
};

export default TestAdminPanel;
