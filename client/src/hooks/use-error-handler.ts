import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorState {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, string>;
}

/**
 * Custom hook for handling errors in a consistent way across the application
 */
export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null);
  const { toast } = useToast();

  /**
   * Handle an error by setting the error state and showing a toast notification
   */
  const handleError = useCallback((err: Error | string, options?: { silent?: boolean; field?: string }) => {
    const errorMessage = typeof err === 'string' ? err : err.message;
    
    // Parse error details if available (like from API responses)
    const errorObj: ErrorState = {
      message: errorMessage,
      field: options?.field,
    };

    // Extract error code if available
    if (typeof err !== 'string' && 'code' in err) {
      errorObj.code = (err as any).code;
    }

    // Parse JSON error responses if applicable
    if (typeof err !== 'string' && 'details' in err) {
      errorObj.details = (err as any).details;
    }

    setError(errorObj);

    // Show a toast notification unless silent is true
    if (!options?.silent) {
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }

    return errorObj;
  }, [toast]);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Attempt to recover from an error
   */
  const recover = useCallback((retryFn?: () => void) => {
    clearError();
    if (retryFn) {
      try {
        retryFn();
      } catch (recoverErr) {
        handleError(recoverErr as Error);
      }
    }
  }, [clearError, handleError]);

  return {
    error,
    setError: handleError,
    clearError,
    recover,
    isError: !!error,
  };
}