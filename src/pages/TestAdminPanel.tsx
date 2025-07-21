import React from 'react';
import AdminPanel from './Admin/AdminPanel';
import { AuthProvider } from '@/contexts/AuthContext';

const TestAdminPanel = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Test Admin Panel - Direct Access</h1>
          <AdminPanel />
        </div>
      </div>
    </AuthProvider>
  );
};

export default TestAdminPanel;
