import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from '@/components/ui/error-display';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

const shouldLogError = (error: Error): boolean => {
  if (error.message.includes('Cannot read properties') && 
      error.message.includes('translation')) {
    return false;
  }
  return true;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (shouldLogError(error)) {
      console.error('Component error boundary caught:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="p-6 max-w-2xl mx-auto"
          data-testid="error-boundary-container"
        >
          <ErrorDisplay
            error={this.state.error || 'Unknown component error'}
            title="Component Error"
            showRefresh={true}
            onRefresh={this.handleReload}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

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
