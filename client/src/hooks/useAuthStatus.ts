import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { apiRequest } from '@/lib/queryClient';

/**
 * A custom hook to handle authentication status across both auth systems
 * (Passport session-based and JWT token-based)
 */
export function useAuthStatus() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isAuthValid, setIsAuthValid] = useState(false);
  
  // Try to validate the session
  useEffect(() => {
    if (!user) return;
    
    // Attempt to verify authentication using a validation endpoint
    async function validateAuth() {
      try {
        // Try session-based auth validation
        const sessionResponse = await apiRequest('GET', '/api/auth/validate', null, {
          credentials: 'include' 
        });
        
        if (sessionResponse.ok) {
          console.log('[AUTH] Session authentication validated');
          setIsAuthValid(true);
          return;
        }
        
        // If session auth fails, try JWT-based auth
        const jwtResponse = await apiRequest('GET', '/api/auth/jwt/validate', null, {
          credentials: 'include'
        });
        
        if (jwtResponse.ok) {
          console.log('[AUTH] JWT authentication validated');
          setIsAuthValid(true);
          return;
        }
        
        console.warn('[AUTH] Authentication validation failed for both methods');
        setIsAuthValid(false);
      } catch (error) {
        console.error('[AUTH] Error validating authentication:', error);
        setIsAuthValid(false);
      }
    }
    
    validateAuth();
  }, [user]);
  
  // Expose whether auth is valid and loading status
  return {
    isAuthenticated: !!user && isAuthValid,
    isLoading: isAuthLoading,
    user
  };
}