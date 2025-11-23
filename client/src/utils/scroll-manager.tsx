import { useEffect } from "react";
import { useLocation } from "wouter";

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

interface ScrollManagerConfig {
  exemptRoutes?: string[];
  exemptPatterns?: RegExp[];
  scrollBehavior?: 'auto' | 'smooth';
}

const DEFAULT_CONFIG: Required<ScrollManagerConfig> = {
  exemptRoutes: [
    '/community',
    '/admin',
    '/admin-control-center',
    '/unified-admin-dashboard'
  ],
  exemptPatterns: [
    /\?modal=/,
    /\?tab=/,
    /#\//
  ],
  scrollBehavior: 'auto'
};

function shouldSkipScroll(pathname: string, config: Required<ScrollManagerConfig>): boolean {
  if (config.exemptRoutes.some(route => pathname.startsWith(route))) {
    return true;
  }
  
  if (config.exemptPatterns.some(pattern => pattern.test(pathname))) {
    return true;
  }
  
  return false;
}

function scrollToTop(behavior: 'auto' | 'smooth' = 'auto') {
  try {
    window.scrollTo({ top: 0, left: 0, behavior });
  } catch (e) {
    window.scrollTo(0, 0);
  }
  
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }
  
  if (document.body) {
    document.body.scrollTop = 0;
  }
}

export function ScrollManager({ config }: { config?: Partial<ScrollManagerConfig> } = {}) {
  const [location] = useLocation();
  
  useEffect(() => {
    const mergedConfig: Required<ScrollManagerConfig> = {
      exemptRoutes: config?.exemptRoutes !== undefined ? config.exemptRoutes : DEFAULT_CONFIG.exemptRoutes,
      exemptPatterns: config?.exemptPatterns !== undefined ? config.exemptPatterns : DEFAULT_CONFIG.exemptPatterns,
      scrollBehavior: config?.scrollBehavior !== undefined ? config.scrollBehavior : DEFAULT_CONFIG.scrollBehavior
    };
    
    const fullPath = window.location.pathname + window.location.search + window.location.hash;
    
    if (shouldSkipScroll(fullPath, mergedConfig)) {
      return;
    }
    
    scrollToTop(mergedConfig.scrollBehavior);
    
    setTimeout(() => {
      scrollToTop(mergedConfig.scrollBehavior);
    }, 0);
    
    setTimeout(() => {
      scrollToTop(mergedConfig.scrollBehavior);
    }, 100);
  }, [location, config]);
  
  return null;
}
