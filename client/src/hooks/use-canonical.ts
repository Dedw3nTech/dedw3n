import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useCanonical(customUrl?: string) {
  const [location] = useLocation();
  
  useEffect(() => {
    const baseUrl = window.location.origin;
    const canonicalUrl = customUrl || `${baseUrl}${location}`;
    
    // Remove existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }
    
    // Add new canonical link
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = canonicalUrl;
    document.head.appendChild(canonicalLink);
    
    return () => {
      const linkToRemove = document.querySelector('link[rel="canonical"]');
      if (linkToRemove) {
        linkToRemove.remove();
      }
    };
  }, [location, customUrl]);
}

export function usePageMeta(title: string, description?: string, canonicalUrl?: string) {
  const [location] = useLocation();
  
  useEffect(() => {
    // Set page title
    document.title = title;
    
    // Set meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }
    
    // Set canonical URL
    const baseUrl = window.location.origin;
    const finalCanonicalUrl = canonicalUrl || `${baseUrl}${location}`;
    
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }
    
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = finalCanonicalUrl;
    document.head.appendChild(canonicalLink);
    
    // Add Open Graph tags
    const setOgTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', content);
    };
    
    setOgTag('og:title', title);
    setOgTag('og:url', finalCanonicalUrl);
    if (description) {
      setOgTag('og:description', description);
    }
    setOgTag('og:type', 'website');
    
  }, [title, description, canonicalUrl, location]);
}