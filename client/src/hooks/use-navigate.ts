import { useCallback } from 'react';
import { useLocation } from 'wouter';

/**
 * Custom hook to provide navigation functionality similar to React Router's useNavigate
 * but works with wouter which only has useLocation by default
 */
export function useNavigate() {
  const [, setLocation] = useLocation();

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    // wouter doesn't have a direct equivalent for replace option,
    // but for our purposes, we just need to navigate
    setLocation(to);
  }, [setLocation]);

  return navigate;
}