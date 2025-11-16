import { useEffect, useRef, useState } from 'react';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  action?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
    onTurnstileLoad?: () => void;
  }
}

export function TurnstileWidget({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  action
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    
    const handleScriptLoad = () => {
      setIsLoaded(true);
    };

    script.addEventListener('load', handleScriptLoad);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleScriptLoad);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) {
      return;
    }

    // Render Turnstile widget
    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        action,
        callback: (token: string) => {
          console.log('[TURNSTILE] Verification successful');
          onVerify(token);
        },
        'error-callback': () => {
          console.error('[TURNSTILE] Verification error');
          onError?.();
        },
        'expired-callback': () => {
          console.log('[TURNSTILE] Token expired');
          onExpire?.();
        },
      });
    } catch (error) {
      console.error('[TURNSTILE] Failed to render widget:', error);
      onError?.();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [isLoaded, siteKey, theme, size, action, onVerify, onError, onExpire]);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center my-4"
      data-testid="turnstile-widget"
    />
  );
}

export function useTurnstile() {
  const resetWidget = (widgetId: string) => {
    if (window.turnstile) {
      window.turnstile.reset(widgetId);
    }
  };

  const getToken = (widgetId: string): string => {
    if (window.turnstile) {
      return window.turnstile.getResponse(widgetId);
    }
    return '';
  };

  return { resetWidget, getToken };
}
