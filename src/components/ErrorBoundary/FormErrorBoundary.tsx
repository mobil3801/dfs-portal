import React, { Component, ReactNode } from 'react';
import { ErrorLogger } from '@/services/errorLogger';
import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  formName?: string;
  onFormReset?: () => void;
  onDataSave?: () => void;
  fallback?: React.ComponentType<any>;
  showDataRecovery?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class FormErrorBoundary extends Component<Props, State> {
  private errorLogger: ErrorLogger;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
    this.errorLogger = ErrorLogger.getInstance();
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const formName = this.props.formName || 'Unknown Form';

    this.errorLogger.log(
      error,
      'high', // Forms are critical for data entry
      `FormErrorBoundary - ${formName}`,
      errorInfo,
      {
        form: formName,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        formData: this.attemptFormDataRecovery()
      }
    );

    this.setState({
      error,
      errorInfo
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Form Error Boundary - ${formName}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }

  private attemptFormDataRecovery = (): Record<string, any> => {
    try {
      // Try to extract form data from the DOM
      const formElements = document.querySelectorAll('input, select, textarea');
      const formData: Record<string, any> = {};

      formElements.forEach((element: any) => {
        if (element.name || element.id) {
          const key = element.name || element.id;
          if (element.type === 'checkbox' || element.type === 'radio') {
            formData[key] = element.checked;
          } else {
            formData[key] = element.value;
          }
        }
      });

      return formData;
    } catch (e) {
      console.warn('Failed to recover form data:', e);
      return {};
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleFormReset = () => {
    if (this.props.onFormReset) {
      this.props.onFormReset();
    }
    this.handleReset();
  };

  handleDataSave = () => {
    if (this.props.onDataSave) {
      this.props.onDataSave();
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.handleReset}
            errorInfo={this.state.errorInfo}
            formName={this.props.formName}
            onFormReset={this.handleFormReset}
            onDataSave={this.handleDataSave} />);


      }

      // Default form error fallback UI
      return (
        <Card className="bg-red-50 border-red-200 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800 text-lg">
              <AlertTriangle size={20} />
              Form Error Detected
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-red-300 bg-red-100">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                An error occurred while processing the{' '}
                {this.props.formName ? `${this.props.formName} form` : 'form'}.
                {this.props.showDataRecovery &&
                <span className="block mt-1 text-sm">
                    Your form data may have been preserved and can be recovered.
                  </span>
                }
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {this.state.error.message}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                size="sm"
                className="flex items-center gap-2">

                <RefreshCw size={16} />
                Retry Form
              </Button>

              {this.props.onFormReset &&
              <Button
                onClick={this.handleFormReset}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-100">

                  <RefreshCw size={16} />
                  Reset Form
                </Button>
              }

              {this.props.showDataRecovery && this.props.onDataSave &&
              <Button
                onClick={this.handleDataSave}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2">

                  <Save size={16} />
                  Save Draft
                </Button>
              }
            </div>

            {/* Recovery Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <h4 className="font-semibold text-yellow-800 text-sm mb-2">
                Recovery Tips:
              </h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Try refreshing the page and filling out the form again</li>
                <li>• Check that all required fields are properly filled</li>
                <li>• Ensure your internet connection is stable</li>
                {this.props.showDataRecovery &&
                <li>• Use "Save Draft" to preserve your current data</li>
                }
              </ul>
            </div>

            {/* Technical Details */}
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                Technical Details
              </summary>
              <div className="mt-2 bg-red-100 p-2 rounded text-xs font-mono text-red-800">
                <div><strong>Component:</strong> {this.props.formName || 'Form'}</div>
                <div><strong>Error Type:</strong> {this.state.error.name}</div>
                <div><strong>Time:</strong> {new Date().toLocaleString()}</div>
              </div>
            </details>
          </CardContent>
        </Card>);

    }

    return this.props.children;
  }
}

export default FormErrorBoundary;