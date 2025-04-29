import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((props: { resetErrorBoundary: () => void }) => ReactNode);
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;
    
    if (hasError) {
      // If fallback is a function, call it with reset function
      if (typeof fallback === 'function') {
        return fallback({ resetErrorBoundary: this.resetErrorBoundary });
      }
      
      // If fallback is a ReactNode, render it directly
      if (fallback) {
        return fallback;
      }
      
      // Default error UI if no fallback is provided
      return (
        <div className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              {error?.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button 
              onClick={this.resetErrorBoundary}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return children;
  }
}