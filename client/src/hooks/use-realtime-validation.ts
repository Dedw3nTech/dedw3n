import { useState, useCallback, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface ValidationResult {
  isValid: boolean;
  message: string;
  confidence: number;
  details?: any;
  suggestions?: string[];
}

export interface ValidationConfig {
  email?: {
    block_disposable?: boolean;
    block_role?: boolean;
    block_free?: boolean;
    require_mx?: boolean;
  };
  phone?: {
    accept_mobile_only?: boolean;
    accept_landline_only?: boolean;
    block_voip?: boolean;
    block_tollfree?: boolean;
  };
  name?: {
    block_gibberish?: boolean;
    min_length?: number;
    max_length?: number;
  };
}

export type ValidationType = 'email' | 'phone' | 'name';

export interface UseRealtimeValidationOptions {
  debounceMs?: number;
  config?: ValidationConfig;
  onValidationComplete?: (result: ValidationResult) => void;
  onValidationError?: (error: Error) => void;
}

export interface RealtimeValidationState {
  isValidating: boolean;
  result: ValidationResult | null;
  error: string | null;
  lastValidatedValue: string | null;
}

/**
 * Custom hook for real-time field validation using Clearout API
 */
export function useRealtimeValidation(
  validationType: ValidationType,
  options: UseRealtimeValidationOptions = {}
) {
  const {
    debounceMs = 2000,
    config,
    onValidationComplete,
    onValidationError
  } = options;

  const [state, setState] = useState<RealtimeValidationState>({
    isValidating: false,
    result: null,
    error: null,
    lastValidatedValue: null
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Clear any pending validation
   */
  const clearPendingValidation = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Validate a field value
   */
  const validateField = useCallback(async (value: string) => {
    // Clear any existing validation
    clearPendingValidation();

    // Reset error state
    setState(prev => ({ ...prev, error: null }));

    // Skip validation for empty values
    if (!value || value.trim() === '') {
      setState(prev => ({
        ...prev,
        isValidating: false,
        result: null,
        lastValidatedValue: null
      }));
      return;
    }

    // Skip validation if value hasn't changed
    if (value === state.lastValidatedValue && state.result) {
      return;
    }

    // Start debounce timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setState(prev => ({ 
          ...prev, 
          isValidating: true, 
          error: null 
        }));

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        console.log(`[VALIDATION] Starting ${validationType} validation for: ${value}`);

        // Make API request based on validation type
        let endpoint: string;
        let requestBody: any;

        switch (validationType) {
          case 'email':
            endpoint = '/api/validation/email';
            requestBody = { 
              email: value, 
              config: config?.email 
            };
            break;
          
          case 'phone':
            endpoint = '/api/validation/phone';
            requestBody = { 
              phone: value, 
              config: config?.phone 
            };
            break;
          
          case 'name':
            endpoint = '/api/validation/name';
            requestBody = { 
              name: value, 
              config: config?.name 
            };
            break;
          
          default:
            throw new Error(`Unsupported validation type: ${validationType}`);
        }

        const response = await apiRequest('POST', endpoint, requestBody, {
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `${validationType} validation failed`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || `${validationType} validation failed`);
        }

        const result = data.result as ValidationResult;
        
        setState(prev => ({
          ...prev,
          isValidating: false,
          result,
          lastValidatedValue: value,
          error: null
        }));

        console.log(`[VALIDATION] ${validationType} validation completed - Valid: ${result.isValid}, Confidence: ${result.confidence}%`);
        
        // Call completion callback
        if (onValidationComplete) {
          onValidationComplete(result);
        }

      } catch (error) {
        // Don't handle aborted requests as errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.error(`[VALIDATION] ${validationType} validation error:`, error);

        const errorMessage = error instanceof Error ? error.message : 'Validation failed';

        setState(prev => ({
          ...prev,
          isValidating: false,
          result: null,
          error: errorMessage
        }));

        // Call error callback
        if (onValidationError && error instanceof Error) {
          onValidationError(error);
        }
      }
    }, debounceMs);
  }, [validationType, config, debounceMs, onValidationComplete, onValidationError, state.lastValidatedValue, state.result, clearPendingValidation]);

  /**
   * Reset validation state
   */
  const resetValidation = useCallback(() => {
    clearPendingValidation();
    setState({
      isValidating: false,
      result: null,
      error: null,
      lastValidatedValue: null
    });
  }, [clearPendingValidation]);

  /**
   * Get validation status for UI display
   */
  const getValidationStatus = useCallback(() => {
    if (state.isValidating) return 'validating';
    if (state.error) return 'error';
    if (!state.result) return 'idle';
    return state.result.isValid ? 'valid' : 'invalid';
  }, [state]);

  /**
   * Get display message for UI
   */
  const getDisplayMessage = useCallback(() => {
    if (state.error) return state.error;
    if (state.result) return state.result.message;
    return '';
  }, [state]);

  /**
   * Get suggestions for field correction
   */
  const getSuggestions = useCallback(() => {
    return state.result?.suggestions || [];
  }, [state.result]);

  return {
    // State
    isValidating: state.isValidating,
    result: state.result,
    error: state.error,
    isValid: state.result?.isValid || false,
    confidence: state.result?.confidence || 0,
    
    // Actions
    validateField,
    resetValidation,
    
    // Helpers
    getValidationStatus,
    getDisplayMessage,
    getSuggestions
  };
}

/**
 * Hook for multi-field validation
 */
export function useMultiFieldValidation(config?: ValidationConfig) {
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<{
    email?: ValidationResult;
    phone?: ValidationResult;
    name?: ValidationResult;
    overall_score?: number;
  }>({});
  const [error, setError] = useState<string | null>(null);

  const validateMultipleFields = useCallback(async (fields: {
    email?: string;
    phone?: string;
    name?: string;
  }) => {
    try {
      setIsValidating(true);
      setError(null);

      console.log('[VALIDATION] Starting multi-field validation');

      const response = await apiRequest('POST', '/api/validation/multi-field', {
        ...fields,
        config
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Multi-field validation failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Multi-field validation failed');
      }

      setResults(data.result);
      console.log('[VALIDATION] Multi-field validation completed - Overall score:', data.result.overall_score);

      return data.result;

    } catch (error) {
      console.error('[VALIDATION] Multi-field validation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Multi-field validation failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [config]);

  const resetValidation = useCallback(() => {
    setResults({});
    setError(null);
    setIsValidating(false);
  }, []);

  return {
    isValidating,
    results,
    error,
    validateMultipleFields,
    resetValidation
  };
}