import { useLayoutEffect, useRef, useEffect } from "react";
import { useLocation } from "wouter";

const scrollHistory = new Map<string, number>();

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

interface ScrollManagerConfig {
  exemptRoutes?: string[];
  exemptPatterns?: RegExp[];
  enableScrollRestoration?: boolean;
  scrollBehavior?: 'instant' | 'smooth';
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
  enableScrollRestoration: true,
  scrollBehavior: 'instant'
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

export function ScrollManager({ config }: { config?: Partial<ScrollManagerConfig> } = {}) {
  const [location] = useLocation();
  const previousPath = useRef<string>('');
  const isInitialMount = useRef(true);
  
  useLayoutEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousPath.current = location;
      return;
    }
    
    const mergedConfig: Required<ScrollManagerConfig> = {
      exemptRoutes: config?.exemptRoutes !== undefined ? config.exemptRoutes : DEFAULT_CONFIG.exemptRoutes,
      exemptPatterns: config?.exemptPatterns !== undefined ? config.exemptPatterns : DEFAULT_CONFIG.exemptPatterns,
      enableScrollRestoration: config?.enableScrollRestoration !== undefined ? config.enableScrollRestoration : DEFAULT_CONFIG.enableScrollRestoration,
      scrollBehavior: config?.scrollBehavior !== undefined ? config.scrollBehavior : DEFAULT_CONFIG.scrollBehavior
    };
    
    if (mergedConfig.enableScrollRestoration) {
      scrollHistory.set(previousPath.current, window.scrollY);
    }
    
    const fullPath = window.location.pathname + window.location.search + window.location.hash;
    
    if (shouldSkipScroll(fullPath, mergedConfig)) {
      previousPath.current = location;
      return;
    }
    
    requestAnimationFrame(() => {
      if (mergedConfig.enableScrollRestoration) {
        const savedPosition = scrollHistory.get(location);
        
        if (savedPosition !== undefined) {
          document.documentElement.scrollTo({
            top: savedPosition,
            left: 0,
            behavior: mergedConfig.scrollBehavior
          });
        } else {
          document.documentElement.scrollTo({
            top: 0,
            left: 0,
            behavior: mergedConfig.scrollBehavior
          });
        }
      } else {
        document.documentElement.scrollTo({
          top: 0,
          left: 0,
          behavior: mergedConfig.scrollBehavior
        });
      }
    });
    
    previousPath.current = location;
  }, [location, config]);
  
  return null;
}

export function clearScrollHistory() {
  scrollHistory.clear();
}
