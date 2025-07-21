import React from 'react';
import ProductSearchBar from './ProductSearchBar';
import ErrorBoundary from './ErrorBoundary';

/**
 * Example of how to use the ErrorBoundary component with ProductSearchBar
 * 
 * This implementation wraps the ProductSearchBar with our ErrorBoundary to catch
 * and handle potential rendering errors, particularly those related to
 * calling .toLowerCase() on undefined values.
 */
interface ProductSearchBarWithErrorBoundaryProps {
  onProductSelect: (product: any) => void;
  placeholder?: string;
  showAllProducts?: boolean;
}

const ProductSearchBarWithErrorBoundary: React.FC<ProductSearchBarWithErrorBoundaryProps> = (props) => {
  // Custom error handler function
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log the error to a monitoring service
    console.error('ProductSearchBar Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    
    // In a production app, you would send this to your monitoring service, e.g.:
    // errorMonitoringService.captureError(error, {
    //   componentStack: errorInfo.componentStack,
    //   componentName: 'ProductSearchBar',
    //   additionalData: { ...props }
    // });
  };

  return (
    <ErrorBoundary
      componentName="ProductSearchBar"
      onError={handleError}
    >
      <ProductSearchBar {...props} />
    </ErrorBoundary>
  );
};

export default ProductSearchBarWithErrorBoundary;

/**
 * Usage Example:
 * 
 * import ProductSearchBarWithErrorBoundary from '@/components/ProductSearchBarWithErrorBoundary';
 * 
 * const MyComponent = () => {
 *   const handleProductSelect = (product) => {
 *     console.log('Selected product:', product);
 *     // Handle product selection logic
 *   };
 * 
 *   return (
 *     <div>
 *       <h1>Product Search</h1>
 *       <ProductSearchBarWithErrorBoundary
 *         onProductSelect={handleProductSelect}
 *         placeholder="Search for products..."
 *         showAllProducts={true}
 *       />
 *     </div>
 *   );
 * };
 */