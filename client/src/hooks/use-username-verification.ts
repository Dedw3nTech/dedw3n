import { useState, useCallback } from 'react';
import { useTypedTranslation } from './use-master-translation';

interface UsernameVerificationState {
  isVerifying: boolean;
  isAvailable: boolean | null;
  error: string | null;
  message: string | null;
}

export function useUsernameVerification() {
  const [state, setState] = useState<UsernameVerificationState>({
    isVerifying: false,
    isAvailable: null,
    error: null,
    message: null,
  });

  const verifyUsername = useCallback(async (username: string): Promise<boolean> => {
    if (!username.trim()) {
      setState({
        isVerifying: false,
        isAvailable: null,
        error: null,
        message: null,
      });
      return false;
    }

    // Basic username validation
    if (username.length < 3) {
      setState({
        isVerifying: false,
        isAvailable: false,
        error: "Username must be at least 3 characters long",
        message: null,
      });
      return false;
    }

    if (username.length > 20) {
      setState({
        isVerifying: false,
        isAvailable: false,
        error: "Username must be no more than 20 characters",
        message: null,
      });
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setState({
        isVerifying: false,
        isAvailable: false,
        error: "Username can only contain letters, numbers, underscores and hyphens",
        message: null,
      });
      return false;
    }

    setState(prev => ({
      ...prev,
      isVerifying: true,
      error: null,
      message: null,
    }));

    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.available) {
        setState({
          isVerifying: false,
          isAvailable: true,
          error: null,
          message: "Username is available",
        });
        return true;
      } else {
        setState({
          isVerifying: false,
          isAvailable: false,
          error: null,
          message: data.message || "Username is already taken",
        });
        return false;
      }
    } catch (error) {
      setState({
        isVerifying: false,
        isAvailable: false,
        error: "Failed to check username availability",
        message: null,
      });
      return false;
    }
  }, []);

  const resetVerification = useCallback(() => {
    setState({
      isVerifying: false,
      isAvailable: null,
      error: null,
      message: null,
    });
  }, []);

  return {
    verifyUsername,
    resetVerification,
    isVerifying: state.isVerifying,
    isAvailable: state.isAvailable,
    error: state.error,
    message: state.message,
  };
}