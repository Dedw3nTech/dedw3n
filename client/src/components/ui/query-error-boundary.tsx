import React from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from './error-boundary';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  queryKey?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * An error boundary specifically for handling React Query errors.
 * Uses the QueryErrorResetBoundary to provide a clean reset mechanism.
 */
export function QueryErrorBoundary({
  children,
  queryKey,
  className,
  fallback,
}: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  // Custom fallback UI specifically for query errors
  const defaultFallback = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => (
    <div className={`p-6 space-y-4 ${className || ''}`}>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Data Fetch Error</AlertTitle>
        <AlertDescription className="mt-2">
          We encountered an error while fetching data{queryKey ? ` for ${queryKey}` : ''}.
          Please try again or reload the page.
        </AlertDescription>
      </Alert>
      <div className="flex justify-center">
        <Button 
          onClick={() => resetErrorBoundary()}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={fallback || defaultFallback({ resetErrorBoundary: reset })}
      key={`query-error-boundary-${queryKey || 'default'}`}
    >
      {children}
    </ErrorBoundary>
  );
}