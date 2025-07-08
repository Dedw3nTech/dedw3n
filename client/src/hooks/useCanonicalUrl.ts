import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * DEPRECATED: Hook to set canonical URL for current page
 * 
 * This hook is now deprecated to prevent conflicts with SEOHead component.
 * Use SEOHead component instead for canonical URL management.
 * 
 * @deprecated Use SEOHead component instead
 */
export function useCanonicalUrl() {
  const [location] = useLocation();

  // This hook is now a no-op to prevent conflicts
  // SEOHead component handles canonical URLs
  console.warn('[DEPRECATED] useCanonicalUrl is deprecated. Use SEOHead component instead.');

  return location;
}