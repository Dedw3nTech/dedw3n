import { useEffect } from 'react';
import { useSiteTranslator } from '@/hooks/use-site-translator';
import { useLocation } from 'wouter';

export function GlobalTranslator() {
  const [location] = useLocation();
  const { translateNow } = useSiteTranslator(`page-${location}`);

  useEffect(() => {
    // Translate when location changes
    const timer = setTimeout(() => {
      translateNow();
    }, 200);

    return () => clearTimeout(timer);
  }, [location, translateNow]);

  useEffect(() => {
    // Initial translation after DOM content loads
    const handleDOMContentLoaded = () => {
      setTimeout(() => {
        translateNow();
      }, 100);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
    } else {
      handleDOMContentLoaded();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
    };
  }, [translateNow]);

  return null; // This component doesn't render anything
}