import { useState, useCallback } from 'react';

export interface NameValidationResponse {
  status: 'valid' | 'invalid' | 'error';
  confidence?: number;
  message?: string;
  details?: {
    first_name?: string;
    last_name?: string;
    is_real_name?: boolean;
    confidence_score?: number;
  };
}

export function useNameValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');

  const validateName = useCallback(async (fullName: string) => {
    if (!fullName.trim()) {
      setIsValid(null);
      setValidationMessage('');
      return;
    }

    setIsValidating(true);
    setValidationMessage('');
    
    try {
      const response = await fetch('/api/validate-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: fullName.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      const result: NameValidationResponse = await response.json();
      
      if (result.status === 'valid') {
        setIsValid(true);
        setValidationMessage(result.message || 'Name verified as genuine');
      } else if (result.status === 'invalid') {
        setIsValid(false);
        setValidationMessage(result.message || 'Name appears to be invalid or gibberish');
      } else {
        setIsValid(false);
        setValidationMessage(result.message || 'Unable to verify name');
      }
    } catch (error) {
      console.error('Name validation error:', error);
      setIsValid(false);
      setValidationMessage('Name validation service temporarily unavailable');
    } finally {
      setIsValidating(false);
    }
  }, []);

  const resetValidation = useCallback(() => {
    setIsValid(null);
    setValidationMessage('');
    setIsValidating(false);
  }, []);

  const getValidationMessage = useCallback(() => {
    return validationMessage;
  }, [validationMessage]);

  return {
    validateName,
    isValidating,
    isValid,
    validationMessage,
    getValidationMessage,
    resetValidation,
  };
}