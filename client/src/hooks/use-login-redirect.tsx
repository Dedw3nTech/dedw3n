import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface LoginRedirectOptions {
  requiresAuth?: boolean;
  redirectTo?: string;
}

export function useLoginRedirect() {
  const [, setLocation] = useLocation();
  
  // Check if user is authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  const checkAuthAndRedirect = useCallback((options: LoginRedirectOptions = {}) => {
    const { requiresAuth = true, redirectTo = '/wall' } = options;
    
    // If we're still loading, don't redirect yet
    if (isLoading) return false;
    
    // If auth is required and user is not logged in
    if (requiresAuth && !user) {
      setLocation(redirectTo);
      return false;
    }
    
    return true;
  }, [user, isLoading, setLocation]);

  const createProtectedClickHandler = useCallback((
    originalHandler?: () => void,
    options: LoginRedirectOptions = {}
  ) => {
    return () => {
      if (checkAuthAndRedirect(options)) {
        originalHandler?.();
      }
    };
  }, [checkAuthAndRedirect]);

  return {
    isAuthenticated: !!user,
    isLoading,
    checkAuthAndRedirect,
    createProtectedClickHandler,
  };
}