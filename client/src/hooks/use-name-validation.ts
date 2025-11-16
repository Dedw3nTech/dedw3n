import { useState, useCallback } from 'react';
import { useTypedTranslation } from './use-master-translation';

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
  const t = useTypedTranslation();
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
        // Store the raw message from server
        setValidationMessage(result.message || t["Name is valid"]);
      } else if (result.status === 'invalid') {
        setIsValid(false);
        setValidationMessage(result.message || t["Name appears to be invalid or gibberish"]);
      } else {
        setIsValid(false);
        setValidationMessage(result.message || t["Unable to verify name"]);
      }
    } catch (error) {
      console.error('Name validation error:', error);
      setIsValid(false);
      setValidationMessage(t["Name validation service temporarily unavailable"]);
    } finally {
      setIsValidating(false);
    }
  }, [t]);

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