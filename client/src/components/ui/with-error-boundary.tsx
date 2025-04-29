import React from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

/**
 * Higher-order component that wraps a component with an error boundary
 * @param Component The component to wrap
 * @param fallback Optional custom fallback UI to show when an error occurs
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const displayName = Component.displayName || Component.name || 'Component';

  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  return WrappedComponent;
}