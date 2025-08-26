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

  const performFallbackValidation = useCallback((email: string): EmailValidationResult => {
    // Enhanced local validation as fallback
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const isValidFormat = emailRegex.test(email);
    
    if (!isValidFormat) {
      return {
        valid: false,
        reason: 'Invalid email format',
        syntax_valid: false,
        mx_valid: false,
        disposable: false,
        free_provider: false,
        deliverable: false,
        role_based: false
      };
    }

    const [localPart, domain] = email.toLowerCase().split('@');
    
    // Check for common disposable email providers
    const disposableProviders = [
      '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 
      'throwaway.email', '0-mail.com', '1-mail.com'
    ];
    const isDisposable = disposableProviders.includes(domain);
    
    // Check for role-based emails
    const rolePrefixes = ['admin', 'support', 'noreply', 'no-reply', 'info', 'contact', 'sales', 'marketing'];
    const isRoleBased = rolePrefixes.some(prefix => localPart.startsWith(prefix));
    
    // Check for free providers
    const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const isFreeProvider = freeProviders.includes(domain);
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const hasMxValid = domainRegex.test(domain);
    
    return {
      valid: isValidFormat && hasMxValid && !isDisposable,
      reason: isDisposable ? 'Disposable email not allowed' : 
              isRoleBased ? 'Role-based email not recommended' :
              !hasMxValid ? 'Invalid domain format' : 
              'Email format validated (offline mode)',
      syntax_valid: isValidFormat,
      mx_valid: hasMxValid,
      disposable: isDisposable,
      free_provider: isFreeProvider,
      deliverable: isValidFormat && hasMxValid && !isDisposable,
      role_based: isRoleBased,
      confidence_score: 0.7 // Lower confidence for fallback validation
    };
  }, []);

  const validateEmail = useCallback(async (email: string) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Immediate basic format check
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailRegex.test(email)) {
      const fallbackResult = performFallbackValidation(email);
      setState({
        isValidating: false,
        isValid: fallbackResult.valid,
        validationResult: fallbackResult,
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

        // Handle service errors - use fallback validation
        if (!response.ok || result.service_error) {
          const fallbackResult = performFallbackValidation(email);
          setState({
            isValidating: false,
            isValid: fallbackResult.valid,
            validationResult: fallbackResult,
            error: fallbackResult.valid ? 
              'Email validated using basic checks (service temporarily unavailable)' :
              fallbackResult.reason || 'Email validation failed'
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

        console.error('[EMAIL_VALIDATION] Service error, using fallback validation:', error);
        
        // Use fallback validation instead of failing completely
        const fallbackResult = performFallbackValidation(email);
        setState({
          isValidating: false,
          isValid: fallbackResult.valid,
          validationResult: fallbackResult,
          error: fallbackResult.valid ? 
            'Email validated using basic checks (service temporarily unavailable)' :
            fallbackResult.reason || 'Email validation failed'
        });
      }
    }, 500); // 500ms debounce
  }, [performFallbackValidation]);

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
      // Special handling for fallback success messages
      if (state.error.includes('basic checks') && state.isValid) {
        return state.error; // This is actually a success message
      }
      return state.error;
    }

    if (!state.validationResult) {
      return null;
    }

    const result = state.validationResult;

    if (!result.valid) {
      // Handle service errors first
      if (result.service_error) {
        return result.reason || 'Email validation service temporarily unavailable. Basic format validation passed.';
      }
      
      if (!result.syntax_valid) {
        return 'Invalid email format';
      }
      if (!result.mx_valid) {
        return 'Domain format appears invalid';
      }
      if (result.disposable) {
        return 'Disposable email addresses are not allowed';
      }
      if (result.role_based) {
        return 'Role-based email addresses are not recommended';
      }
      if (!result.deliverable) {
        return 'Email address may not be deliverable';
      }
      return result.reason || 'Invalid email address';
    }

    // Success message for fallback validation
    if (result.confidence_score && result.confidence_score < 1.0) {
      return 'Email format validated (limited verification available)';
    }

    return null; // Valid email with full validation
  }, [state.error, state.validationResult, state.isValid]);

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