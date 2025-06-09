import { useState, useCallback, useRef } from 'react';

interface EmailValidationResult {
  valid: boolean;
  reason?: string;
  disposable: boolean;
  free_provider: boolean;
  mx_valid: boolean;
  smtp_valid?: boolean;
  syntax_valid: boolean;
  role_based: boolean;
  deliverable: boolean;
  confidence_score?: number;
  service_error?: boolean;
}

interface EmailValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  validationResult: EmailValidationResult | null;
  error: string | null;
}

export function useEmailValidation() {
  const [state, setState] = useState<EmailValidationState>({
    isValidating: false,
    isValid: null,
    validationResult: null,
    error: null
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validateEmail = useCallback(async (email: string) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Basic email format validation first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setState({
        isValidating: false,
        isValid: false,
        validationResult: {
          valid: false,
          reason: 'Invalid email format',
          syntax_valid: false,
          mx_valid: false,
          disposable: false,
          free_provider: false,
          deliverable: false,
          role_based: false
        },
        error: null
      });
      return;
    }

    // Debounce the API call
    debounceTimerRef.current = setTimeout(async () => {
      setState(prev => ({ ...prev, isValidating: true, error: null }));

      try {
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/validate-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clearout-App-Token': 'b20cc2411ac31a7f06a5baaca774f378:93705c739c1e05a3014298e56d10b808959fe8becc75c12f80bfc8d30e0c86f8'
          },
          body: JSON.stringify({ email }),
          signal: abortControllerRef.current.signal
        });

        const result: EmailValidationResult = await response.json();

        // Handle service errors (503 status)
        if (!response.ok || result.service_error) {
          setState({
            isValidating: false,
            isValid: false,
            validationResult: result,
            error: result.reason || 'Email validation service temporarily unavailable'
          });
          return;
        }

        setState({
          isValidating: false,
          isValid: result.valid,
          validationResult: result,
          error: null
        });

      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Request was cancelled, don't update state
          return;
        }

        console.error('[EMAIL_VALIDATION] Validation error:', error);
        
        setState({
          isValidating: false,
          isValid: null,
          validationResult: null,
          error: 'Validation service temporarily unavailable'
        });
      }
    }, 500); // 500ms debounce
  }, []);

  const resetValidation = useCallback(() => {
    // Clear timers and abort requests
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      isValidating: false,
      isValid: null,
      validationResult: null,
      error: null
    });
  }, []);

  const getValidationMessage = useCallback(() => {
    if (state.error) {
      return state.error;
    }

    if (!state.validationResult) {
      return null;
    }

    const result = state.validationResult;

    if (!result.valid) {
      // Handle service errors first
      if (result.service_error) {
        return result.reason || 'Email validation service temporarily unavailable. Please try again later or contact customer service for assistance.';
      }
      
      if (!result.syntax_valid) {
        return 'Invalid email format';
      }
      if (!result.mx_valid) {
        return 'Domain does not accept emails';
      }
      if (result.disposable) {
        return 'Disposable email addresses are not allowed';
      }
      if (result.role_based) {
        return 'Role-based email addresses are not recommended';
      }
      if (!result.deliverable) {
        return 'Email address is not deliverable';
      }
      return result.reason || 'Invalid email address';
    }

    return null;
  }, [state.error, state.validationResult]);

  return {
    validateEmail,
    resetValidation,
    isValidating: state.isValidating,
    isValid: state.isValid,
    validationResult: state.validationResult,
    error: state.error,
    getValidationMessage
  };
}