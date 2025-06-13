import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook to set canonical URL for current page to fix Google Search Console
 * "Duplicate without user-selected canonical" issues
 */
export function useCanonicalUrl() {
  const [location] = useLocation();

  useEffect(() => {
    // Remove any existing canonical links
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Create new canonical URL for current page
    const canonicalUrl = `https://dedw3n.com${location}`;
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = canonicalUrl;
    
    // Add to document head
    document.head.appendChild(canonicalLink);

    // Cleanup function
    return () => {
      const linkToRemove = document.querySelector(`link[rel="canonical"][href="${canonicalUrl}"]`);
      if (linkToRemove) {
        linkToRemove.remove();
      }
    };
  }, [location]);

  return location;
}