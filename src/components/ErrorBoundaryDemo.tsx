import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bug, Zap } from 'lucide-react';
import { ComponentErrorBoundary, FormErrorBoundary } from './ErrorBoundary';

// Component that throws an error on demand
const ErrorProneComponent: React.FC<{shouldError: boolean;}> = ({ shouldError }) => {
  if (shouldError) {
    throw new Error('This is a demo error thrown by ErrorProneComponent');
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-800">Component is working normally</span>
      </div>
    </div>);

};

// Form component that can throw errors
const ErrorProneForm: React.FC<{shouldError: boolean;}> = ({ shouldError }) => {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shouldError) {
      throw new Error('Form submission error for demo purposes');
    }
  };

  if (shouldError && Math.random() > 0.5) {
    throw new Error('Form rendering error for demo purposes');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your name" />

      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your email" />

      </div>
      <Button type="submit" className="w-full">
        Submit Form
      </Button>
    </form>);

};

const ErrorBoundaryDemo: React.FC = () => {
  const [componentError, setComponentError] = useState(false);
  const [formError, setFormError] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Error Boundary Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Component Error Boundary Demo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Component Error Boundary</h3>
                <Badge variant={componentError ? 'destructive' : 'secondary'}>
                  {componentError ? 'Error Active' : 'Normal'}
                </Badge>
              </div>
              
              <ComponentErrorBoundary
                componentName="Demo Component"
                severity="medium"
                showErrorDetails={true}>

                <ErrorProneComponent shouldError={componentError} />
              </ComponentErrorBoundary>
              
              <Button
                onClick={() => setComponentError(!componentError)}
                variant={componentError ? 'default' : 'destructive'}
                size="sm">

                <Zap className="w-4 h-4 mr-2" />
                {componentError ? 'Fix Component' : 'Trigger Error'}
              </Button>
            </div>

            {/* Form Error Boundary Demo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Form Error Boundary</h3>
                <Badge variant={formError ? 'destructive' : 'secondary'}>
                  {formError ? 'Error Active' : 'Normal'}
                </Badge>
              </div>
              
              <FormErrorBoundary
                formName="Demo Form"
                showDataRecovery={true}
                onFormReset={() => {
                  setFormError(false);
                }}>

                <ErrorProneForm shouldError={formError} />
              </FormErrorBoundary>
              
              <Button
                onClick={() => setFormError(!formError)}
                variant={formError ? 'default' : 'destructive'}
                size="sm">

                <Zap className="w-4 h-4 mr-2" />
                {formError ? 'Fix Form' : 'Trigger Error'}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800">How to Test Error Boundaries</h4>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Click "Trigger Error" buttons to simulate component errors</li>
                  <li>• Notice how errors are gracefully handled with fallback UI</li>
                  <li>• Try the "Retry" buttons in the error fallback components</li>
                  <li>• Check the Error Recovery page in Admin section for logged errors</li>
                  <li>• Form errors include data recovery options</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default ErrorBoundaryDemo;