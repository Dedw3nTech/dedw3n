import { useMemo, useCallback } from 'react';
import { useLocation, useSearch } from 'wouter';

export function useAdminTab() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  
  const currentTab = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get('tab');
  }, [searchString]);
  
  const isActive = useCallback((href: string) => {
    if (href.includes('?')) {
      const [targetPath, targetSearch] = href.split('?');
      const targetParams = new URLSearchParams(targetSearch);
      const targetTab = targetParams.get('tab');
      
      if (!targetTab) {
        return location === targetPath && !currentTab;
      }
      
      return location === targetPath && currentTab === targetTab;
    }
    
    return location === href;
  }, [location, currentTab]);
  
  const navigateToTab = useCallback((tab: string | null) => {
    if (tab) {
      setLocation(`/admin-control-center?tab=${tab}`);
    } else {
      setLocation('/admin-control-center');
    }
  }, [setLocation]);
  
  return {
    currentTab,
    isActive,
    location,
    navigateToTab
  };
}
