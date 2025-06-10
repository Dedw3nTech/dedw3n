import React from 'react';
import { ErrorBoundary } from './error-boundary';
import { ApiErrorBoundary } from './api-error-boundary';

/**
 * Higher Order Component that wraps a component with error boundary
 * @param Component The component to wrap
 * @param options Configuration options for the error boundary
 * @returns A wrapped component with error handling
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    type?: 'general' | 'api';
    fallback?: React.ReactNode;
    queryKey?: unknown[];
    className?: string;
    showHomeButton?: boolean;
  } = {}
) {
  const {
    type = 'general',
    fallback,
    queryKey,
    className,
    showHomeButton = true,
  } = options;

  // Create a display name for the HOC
  const displayName = Component.displayName || Component.name || 'Component';
  
  // Return a function component that wraps the input component with the appropriate error boundary
  const WithErrorBoundary: React.FC<P> = (props) => {
    if (type === 'api') {
      return (
        <ApiErrorBoundary
          queryKey={queryKey}
          className={className}
          showHomeButton={showHomeButton}
          fallback={fallback}
        >
          <Component {...props} />
        </ApiErrorBoundary>
      );
    }
    
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  // Set the display name for the HOC
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}