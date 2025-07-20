# Error Handling System - DFS Manager Portal

## Overview

The DFS Manager Portal implements a comprehensive error handling system using React Error Boundaries to gracefully catch and handle errors throughout the application. This system ensures that users experience minimal disruption when errors occur and provides administrators with detailed error information for debugging.

## Components

### 1. Error Boundary Components

#### GlobalErrorBoundary
- **Purpose**: Catches all unhandled errors at the application level
- **Location**: `src/components/ErrorBoundary/GlobalErrorBoundary.tsx`
- **Usage**: Wraps the entire application in `App.tsx`
- **Features**:
  - Critical error severity logging
  - Full-page fallback UI
  - Application reload options

#### PageErrorBoundary
- **Purpose**: Isolates errors to individual pages
- **Location**: `src/components/ErrorBoundary/PageErrorBoundary.tsx`
- **Usage**: Wraps page content in `DashboardLayout.tsx`
- **Features**:
  - Page-specific error isolation
  - Navigation to other pages
  - Customizable severity levels

#### ComponentErrorBoundary
- **Purpose**: Protects individual components
- **Location**: `src/components/ErrorBoundary/ComponentErrorBoundary.tsx`
- **Usage**: Wrap specific components that might fail
- **Features**:
  - Compact fallback UI
  - Component retry functionality
  - Minimal height settings

#### FormErrorBoundary
- **Purpose**: Specialized error handling for forms
- **Location**: `src/components/ErrorBoundary/FormErrorBoundary.tsx`
- **Usage**: Wrap form components and data entry areas
- **Features**:
  - Form data recovery
  - Reset form functionality
  - Draft saving capabilities

### 2. Error Logging Service

#### ErrorLogger
- **Location**: `src/services/errorLogger.ts`
- **Features**:
  - Centralized error logging
  - Severity classification
  - Local storage persistence
  - Console logging for development
  - Export capabilities for production debugging

### 3. Error Recovery Tools

#### ErrorRecovery Component
- **Location**: `src/components/ErrorBoundary/ErrorRecovery.tsx`
- **Features**:
  - Error log visualization
  - Export functionality
  - Error statistics
  - Recovery tips and guidance

#### Error Recovery Page
- **Location**: `src/pages/Admin/ErrorRecoveryPage.tsx`
- **Route**: `/admin/error-recovery`
- **Features**:
  - Interactive error boundary demo
  - Comprehensive error management
  - System status monitoring

### 4. Error Handling Hook

#### useErrorHandler
- **Location**: `src/hooks/use-error-handler.ts`
- **Purpose**: Provides consistent error handling for async operations
- **Features**:
  - API call error handling
  - Async function wrapping
  - Toast notifications
  - Automatic error logging

## Implementation Examples

### Basic Component Protection

```tsx
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';

<ComponentErrorBoundary 
  componentName="ProductCard" 
  severity="medium"
>
  <ProductCard product={product} />
</ComponentErrorBoundary>
```

### Form Protection with Recovery

```tsx
import { FormErrorBoundary } from '@/components/ErrorBoundary';

<FormErrorBoundary 
  formName="Product Form"
  showDataRecovery={true}
  onFormReset={resetFormData}
>
  <ProductForm />
</FormErrorBoundary>
```

### Using Error Handler Hook

```tsx
import { useErrorHandler } from '@/hooks/use-error-handler';

const MyComponent = () => {
  const { handleApiCall, handleError } = useErrorHandler({
    component: 'MyComponent',
    severity: 'high'
  });

  const fetchData = async () => {
    const data = await handleApiCall(
      () => window.ezsite.apis.tablePage(tableId, params),
      "Failed to fetch data",
      { action: 'fetchData', tableId }
    );
    
    if (data) {
      setData(data.List);
    }
  };
};
```

## Error Severity Levels

- **Low**: Minor issues that don't affect core functionality
- **Medium**: Moderate issues that may impact some features
- **High**: Serious issues that affect important functionality
- **Critical**: Severe issues that could break the application

## Error Boundary Placement Strategy

1. **Global Level**: `GlobalErrorBoundary` wraps the entire app
2. **Page Level**: `PageErrorBoundary` wraps each page's content
3. **Form Level**: `FormErrorBoundary` wraps critical forms
4. **Component Level**: `ComponentErrorBoundary` wraps risky components

## Best Practices

### Do's
- ✅ Place error boundaries at logical component boundaries
- ✅ Use appropriate severity levels for different error types
- ✅ Provide meaningful error messages to users
- ✅ Include recovery options when possible
- ✅ Log errors with sufficient context for debugging

### Don'ts
- ❌ Over-wrap components (avoid too many nested boundaries)
- ❌ Catch errors that should be handled by parent components
- ❌ Hide important error information from developers
- ❌ Use error boundaries for event handler errors
- ❌ Ignore async errors outside of error boundaries

## Testing Error Boundaries

### Interactive Demo
Visit `/admin/error-recovery` and use the "Show Demo" feature to:
- Trigger component errors
- Test form error recovery
- See fallback UI in action
- Practice error recovery workflows

### Manual Testing
1. Intentionally break a component
2. Verify error boundary catches the error
3. Check that fallback UI displays correctly
4. Test recovery functionality
5. Verify error logging

## Error Recovery Workflow

1. **Error Occurs**: Component throws an error
2. **Boundary Catches**: Nearest error boundary catches the error
3. **Logging**: Error is logged with context and severity
4. **Fallback UI**: User sees graceful fallback interface
5. **Recovery Options**: User can retry, reset, or navigate away
6. **Admin Review**: Administrators can review errors in recovery center

## Production Considerations

- Errors are logged locally and can be exported for analysis
- Error boundaries don't catch errors in:
  - Event handlers (use try-catch)
  - Asynchronous code (use error handler hook)
  - Server-side rendering
  - Errors in the error boundary itself

## Monitoring and Maintenance

- Regularly check the Error Recovery Center for patterns
- Export error logs for external analysis
- Update error messages based on user feedback
- Adjust error boundary placement as the application evolves

This error handling system ensures robust operation of the DFS Manager Portal while providing excellent user experience and debugging capabilities for administrators.