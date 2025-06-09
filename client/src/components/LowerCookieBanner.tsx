import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Cookie, X } from 'lucide-react';
import { useCookieConsent } from './CookieConsentProvider';

export function LowerCookieBanner() {
  const { showBanner, acceptAll, acceptNecessary, hideBanner } = useCookieConsent();

  // Don't show banner if user already consented or it's hidden
  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-200 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Cookie className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-semibold text-gray-900">Cookie & Privacy Preferences</h3>
            </div>
            <p className="text-xs text-gray-600">
              We use cookies to enhance your browsing experience and analyze our traffic. 
              Choose your preferences below or accept all to continue.
            </p>
          </div>
          
          <div className="flex items-center gap-3 min-w-fit">
            <Button 
              size="sm" 
              onClick={acceptAll}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Accept All Cookies
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={acceptNecessary}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Necessary Only
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={hideBanner}
              className="text-gray-500 hover:text-gray-700 p-2"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          <p>
            By continuing to use our website, you consent to our use of cookies as described in our{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
            <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}