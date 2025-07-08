import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * DEPRECATED: Use SEOHead component instead
 * @deprecated Use SEOHead component for canonical URL management
 */
export function useCanonical(customUrl?: string) {
  const [location] = useLocation();
  
  // This hook is now a no-op to prevent conflicts with SEOHead
  console.warn('[DEPRECATED] useCanonical is deprecated. Use SEOHead component instead.');
}

/**
 * DEPRECATED: Use SEOHead component instead
 * @deprecated Use SEOHead component for comprehensive SEO management
 */
export function usePageMeta(title: string, description?: string, canonicalUrl?: string) {
  const [location] = useLocation();
  
  // This hook is now a no-op to prevent conflicts with SEOHead
  console.warn('[DEPRECATED] usePageMeta is deprecated. Use SEOHead component instead.');
}