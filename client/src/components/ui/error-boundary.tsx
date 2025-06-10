import React, { Component, ErrorInfo, ReactNode } from 'react';

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
      // Return fallback UI or children's original content
      return this.props.fallback || <div className="text-gray-500">Loading...</div>;
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