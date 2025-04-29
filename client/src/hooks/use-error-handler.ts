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
  const { toast } = useToast();
  const [error, setError] = useState<ErrorState | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  /**
   * Handle an error by setting the error state and showing a toast notification
   */
  const handleError = useCallback((err: unknown, showToast = true) => {
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    let errorField = undefined;
    let errorDetails = undefined;

    // Extract error information based on error type
    if (err instanceof Error) {
      errorMessage = err.message;
      // For axios errors with response data
      if ('response' in err && err.response && typeof err.response === 'object') {
        const response = err.response as any;
        if (response.data) {
          errorMessage = response.data.message || errorMessage;
          errorCode = response.data.code || `HTTP_${response.status}`;
          errorField = response.data.field;
          errorDetails = response.data.details;
        }
      }
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err && typeof err === 'object') {
      const errorObj = err as any;
      errorMessage = errorObj.message || errorMessage;
      errorCode = errorObj.code || errorCode;
      errorField = errorObj.field;
      errorDetails = errorObj.details;
    }

    // Set error state
    setError({
      message: errorMessage,
      code: errorCode,
      field: errorField,
      details: errorDetails
    });

    // Show toast notification if requested
    if (showToast) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    // Return formatted error for potential additional handling
    return {
      message: errorMessage,
      code: errorCode,
      field: errorField,
      details: errorDetails
    };
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
  const recoverFromError = useCallback(async (recoveryFn?: () => Promise<void>) => {
    if (!error) return;

    setIsRecovering(true);
    try {
      if (recoveryFn) {
        await recoveryFn();
      }
      clearError();
    } catch (err) {
      handleError(err);
    } finally {
      setIsRecovering(false);
    }
  }, [error, clearError, handleError]);

  return {
    error,
    isRecovering,
    handleError,
    clearError,
    recoverFromError
  };
}