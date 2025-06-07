import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth-nonblocking';

export function GlobalLoginHandler() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Handle URL parameters for login/registration
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab && (tab === 'login' || tab === 'register')) {
      // Clear URL parameters after processing
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Redirect logic can be added here if needed
  useEffect(() => {
    if (!isLoading && user && location === '/auth') {
      // Redirect authenticated users away from auth page
      setLocation('/');
    }
  }, [user, isLoading, location, setLocation]);

  return null; // This component doesn't render anything
}