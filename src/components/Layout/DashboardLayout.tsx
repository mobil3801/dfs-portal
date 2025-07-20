import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNavigation from '@/components/TopNavigation';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Top Navigation - Horizontal Layout Only */}
      <TopNavigation />
      
      {/* Main Content Area - Full Width Below Navigation */}
      <main className="flex-1">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ComponentErrorBoundary>
            <Outlet />
          </ComponentErrorBoundary>
        </div>
      </main>
    </div>);

};

export default DashboardLayout;