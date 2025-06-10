import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from '@/hooks/use-navigate';
import { queryClient } from '@/lib/queryClient';

/**
 * Hook for handling errors in a consistent way across the application
 * 
 * Features:
 * - Toast error messages
 * - Automatic navigation on certain error types
 * - Query cache invalidation
 * - Custom error recovery strategies
 */
export function useErrorHandler() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRecovering, setIsRecovering] = useState(false);

  /**
   * Handle an error with smart fallbacks and user feedback
   */
  const handleError = useCallback((error: Error, options?: {
    fallbackMessage?: string;
    shouldNavigateHome?: boolean;
    queryKeyToInvalidate?: unknown[];
    silent?: boolean;
    retry?: () => Promise<any>;
  }) => {
    const { 
      fallbackMessage = 'An unexpected error occurred', 
      shouldNavigateHome = false, 
      queryKeyToInvalidate,
      silent = false,
      retry
    } = options || {};
    
    // Log error unless silent mode is requested
    if (!silent) {
      console.error('Error handled by useErrorHandler:', error);
    }
    
    // Display toast notification unless silent mode is requested
    if (!silent) {
      toast({
        title: 'Error',
        description: error.message || fallbackMessage,
        variant: 'destructive',
      });
    }

    // Invalidate query cache if a query key is provided
    if (queryKeyToInvalidate) {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
    }

    // Navigate home if requested
    if (shouldNavigateHome) {
      navigate.navigate('/');
    }
    
    // Return the error for additional handling if needed
    return error;
  }, [toast, navigate]);

  /**
   * Attempt a recovery operation and handle any errors
   */
  const attemptRecovery = useCallback(async (
    operation: () => Promise<any>,
    options?: {
      fallbackMessage?: string;
      onSuccess?: (result: any) => void;
      maxRetries?: number;
    }
  ) => {
    const { fallbackMessage, onSuccess, maxRetries = 1 } = options || {};
    let retries = 0;
    
    setIsRecovering(true);
    
    const tryOperation = async (): Promise<any> => {
      try {
        const result = await operation();
        if (onSuccess) {
          onSuccess(result);
        }
        setIsRecovering(false);
        return result;
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          return tryOperation();
        }
        
        handleError(error as Error, { fallbackMessage });
        setIsRecovering(false);
        throw error;
      }
    };
    
    return tryOperation();
  }, [handleError]);

  /**
   * Create a wrapped version of a function that catches errors and handles them
   */
  const withErrorHandling = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options?: {
      fallbackMessage?: string;
      shouldNavigateHome?: boolean;
      queryKeyToInvalidate?: unknown[];
      silent?: boolean;
    }
  ) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error as Error, options);
        throw error; // Rethrow to allow for further handling
      }
    };
  }, [handleError]);

  return {
    handleError,
    attemptRecovery,
    withErrorHandling,
    isRecovering
  };
}