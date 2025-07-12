import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { ReportButton } from '@/components/ui/report-button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silent error handling to prevent console spam
    // Only log critical errors that need investigation
    if (error.message.includes('Cannot read properties') && error.message.includes('translation')) {
      // Translation-related errors are handled gracefully
      return;
    }
    
    console.error('Component error boundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise, render a proper error UI with Report button
      return (
        <div className="p-6 space-y-4 max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Application Error</AlertTitle>
            <AlertDescription className="mt-2">
              {this.state.error?.message || 'An unexpected error occurred while rendering this component'}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Reload Page
            </Button>
            
            <ReportButton 
              errorType="Component Error"
              errorMessage={this.state.error?.message || 'An unexpected error occurred while rendering this component'}
              variant="outline"
              size="default"
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;