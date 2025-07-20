import { lazy } from 'react';

// Utility function to create lazy imports with error handling
export const createLazyImport = <T extends React.ComponentType<any>,>(
importFn: () => Promise<{default: T;}>) =>
{
  return lazy(() =>
  importFn().catch((error) => {
    console.error('Failed to load component:', error);
    // Return a fallback component in case of import failure
    return {
      default: (() =>
      <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Component</h3>
              <p className="text-gray-600 mb-4">The component could not be loaded. Please try refreshing the page.</p>
              <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">

                Refresh Page
              </button>
            </div>
          </div>) as
      T
    };
  })
  );
};

// Pre-defined lazy imports for commonly used components
export const lazyImports = {
  // Chart components
  SalesChart: createLazyImport(() => import('@/components/SalesChart')),

  // Heavy UI components
  EnhancedFileUpload: createLazyImport(() => import('@/components/EnhancedFileUpload')),
  ProfilePicture: createLazyImport(() => import('@/components/ProfilePicture')),

  // Admin components
  ErrorAnalyticsDashboard: createLazyImport(() => import('@/components/ErrorAnalyticsDashboard')),
  MemoryLeakDashboard: createLazyImport(() => import('@/components/MemoryLeakDashboard')),

  // Complex forms
  ComprehensivePermissionDialog: createLazyImport(() => import('@/components/ComprehensivePermissionDialog')),

  // Specialized components
  BarcodeScanner: createLazyImport(() => import('@/components/BarcodeScanner')),
  SMSTestManager: createLazyImport(() => import('@/components/SMSTestManager'))
};

export default lazyImports;