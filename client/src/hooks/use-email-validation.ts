import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface EmailValidationResult {
  valid: boolean;
  reason?: string;
  disposable: boolean;
  free_provider: boolean;
  mx_valid: boolean;
  smtp_valid: boolean;
  syntax_valid: boolean;
  role_based: boolean;
  deliverable: boolean;
  confidence_score?: number;
}

interface EmailValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  validationResult: EmailValidationResult | null;
  error: string | null;
}

export function useEmailValidation() {
  const [validationState, setValidationState] = useState<EmailValidationState>({
    isValidating: false,
    isValid: null,
    validationResult: null,
    error: null
  });
  
  const { toast } = useToast();

  const validateEmail = useCallback(async (email: string): Promise<EmailValidationResult | null> => {
    if (!email || !email.includes('@')) {
      setValidationState({
        isValidating: false,
        isValid: false,
        validationResult: null,
        error: 'Please enter a valid email address'
      });
      return null;
    }

    setValidationState(prev => ({
      ...prev,
      isValidating: true,
      error: null
    }));

    try {
      const response = await fetch('/api/validate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`Validation service error: ${response.status}`);
      }

      const result: EmailValidationResult = await response.json();

      // Determine if email is valid based on multiple criteria
      const isValid = result.syntax_valid && 
                     result.mx_valid && 
                     !result.disposable && 
                     result.deliverable &&
                     (result.confidence_score ? result.confidence_score > 70 : true);

      setValidationState({
        isValidating: false,
        isValid,
        validationResult: result,
        error: null
      });

      return result;
    } catch (error) {
      console.error('Email validation error:', error);
      
      setValidationState({
        isValidating: false,
        isValid: null,
        validationResult: null,
        error: 'Unable to validate email. Please check your connection and try again.'
      });

      return null;
    }
  }, []);

  const getValidationMessage = useCallback(() => {
    const { isValid, validationResult, error } = validationState;

    if (error) return error;
    if (!validationResult) return null;

    if (isValid) {
      return 'Email verified successfully';
    }

    // Provide specific feedback based on validation results
    if (!validationResult.syntax_valid) {
      return 'Invalid email format';
    }
    if (!validationResult.mx_valid) {
      return 'Email domain does not accept emails';
    }
    if (validationResult.disposable) {
      return 'Disposable email addresses are not allowed';
    }
    if (!validationResult.deliverable) {
      return 'Email address cannot receive emails';
    }
    if (validationResult.role_based) {
      return 'Role-based emails (like admin@, support@) are not recommended';
    }

    return 'Email validation failed';
  }, [validationState]);

  const resetValidation = useCallback(() => {
    setValidationState({
      isValidating: false,
      isValid: null,
      validationResult: null,
      error: null
    });
  }, []);

  return {
    validateEmail,
    isValidating: validationState.isValidating,
    isValid: validationState.isValid,
    validationResult: validationState.validationResult,
    error: validationState.error,
    getValidationMessage,
    resetValidation
  };
}