import React from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './error-boundary';
import { ErrorDisplay } from './error-display';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  queryKey?: string;
  className?: string;
  fallback?: React.ReactNode;
}

interface QueryErrorFallbackProps {
  resetErrorBoundary: () => void;
  error?: Error;
  queryKey?: string;
  className?: string;
}

const QueryErrorFallback = ({
  resetErrorBoundary,
  error,
  queryKey,
  className = ''
}: QueryErrorFallbackProps) => {
  return (
    <div className={`p-6 ${className}`} data-testid="query-error-container">
      <ErrorDisplay
        error={error || 'Query error occurred'}
        title="Data Loading Error"
        showRefresh={true}
        onRefresh={resetErrorBoundary}
      />
      {queryKey && (
        <p className="text-xs text-center text-gray-500 mt-2">
          Query: {queryKey}
        </p>
      )}
    </div>
  );
};

export function QueryErrorBoundary({
  children,
  queryKey,
  className,
  fallback,
}: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  if (fallback) {
    return (
      <ErrorBoundary fallback={fallback}>
        {children}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      fallback={(
        <QueryErrorFallback
          resetErrorBoundary={reset}
          queryKey={queryKey}
          className={className}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
