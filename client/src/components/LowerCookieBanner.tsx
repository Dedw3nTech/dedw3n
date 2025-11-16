import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Cookie, X, Settings, Check, Info } from 'lucide-react';
import { useCookieConsent } from './CookieConsentProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

export function LowerCookieBanner() {
  const { showBanner, acceptAll, acceptNecessary, hideBanner, consent, saveCustomPreferences } = useCookieConsent();
  const [showManageModal, setShowManageModal] = useState(false);
  const [tempPreferences, setTempPreferences] = useState({
    necessary: true,
    analytics: consent?.analytics ?? true,
    marketing: consent?.marketing ?? true,
    preferences: consent?.preferences ?? true,
  });

  // Define all text strings for translation
  const textStrings = [
    'Cookie Preferences', // 0
    'We use cookies to enhance your browsing experience and analyze our traffic. Choose your preferences or accept all to continue.', // 1
    'Accept All', // 2
    'Manage', // 3
    'Essential Only', // 4
    'By continuing, you consent to our use of cookies as described in our', // 5
    'Privacy Policy', // 6
    'Cookie Policy', // 7
    'Manage Cookie Preferences', // 8
    'Choose which cookies you want to accept. Some cookies are essential for the website to function properly.', // 9
    'Necessary Cookies', // 10
    'Always Active', // 11
    'Essential for website functionality, security, and user authentication. Cannot be disabled.', // 12
    'Analytics Cookies', // 13
    'Help us understand how visitors use our website by collecting anonymous usage statistics.', // 14
    'Marketing Cookies', // 15
    'Used to deliver personalized ads and track advertising campaign effectiveness.', // 16
    'Preference Cookies', // 17
    'Remember your settings and preferences to enhance your browsing experience.', // 18
    'Cancel', // 19
    'Reject All', // 20
    'Save Preferences', // 21
    'Close cookie banner', // 22
    'and' // 23
  ];

  // Use batch translation hook with high priority for UI elements
  const { translations, isLoading } = useMasterBatchTranslation(textStrings, 'high');

  // Don't show banner if user already consented or it's hidden
  if (!showBanner) {
    console.log('[Cookie Banner] Not showing banner - showBanner:', showBanner);
    return null;
  }
  
  console.log('[Cookie Banner] Displaying banner');

  const handleManageCookies = () => {
    setShowManageModal(true);
  };

  const handleSavePreferences = () => {
    saveCustomPreferences(tempPreferences);
    setShowManageModal(false);
  };

  const handleTogglePreference = (type: string, value: boolean) => {
    setTempPreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2 lg:mb-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">{translations[0] || 'Cookie Preferences'}</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={hideBanner}
                className="text-gray-500 p-1 lg:hidden focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
                aria-label={translations[22] || 'Close cookie banner'}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed lg:pr-4">
              {translations[1] || 'We use cookies to enhance your browsing experience and analyze our traffic. Choose your preferences or accept all to continue.'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:flex-shrink-0">
            <Button 
              size="sm"
              variant="ghost"
              onClick={acceptAll}
              className="bg-black text-white text-xs sm:text-sm py-2 px-3 hover:bg-black focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
            >
              {translations[2] || 'Accept All'}
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              onClick={handleManageCookies}
              className="bg-black text-white text-xs sm:text-sm py-2 px-3 hover:bg-black focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
            >
              {translations[3] || 'Manage'}
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              onClick={acceptNecessary}
              className="bg-black text-white text-xs sm:text-sm py-2 px-3 hover:bg-black focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
            >
              {translations[4] || 'Essential Only'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={hideBanner}
              className="text-gray-500 hidden lg:flex focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2 lg:mt-3">
          <p>
            {translations[5] || 'By continuing, you consent to our use of cookies as described in our'}{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">{translations[6] || 'Privacy Policy'}</a> {translations[23] || 'and'}{' '}
            <a href="/cookies" className="text-blue-600 hover:underline">{translations[7] || 'Cookie Policy'}</a>.
          </p>
        </div>
      </div>

      {/* Cookie Management Modal */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {translations[8] || 'Manage Cookie Preferences'}
            </DialogTitle>
            <DialogDescription>
              {translations[9] || 'Choose which cookies you want to accept. Some cookies are essential for the website to function properly.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Necessary Cookies */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{translations[10] || 'Necessary Cookies'}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-medium">{translations[11] || 'Always Active'}</span>
                    <Check className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <CardDescription className="text-xs">
                  {translations[12] || 'Essential for website functionality, security, and user authentication. Cannot be disabled.'}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Analytics Cookies */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{translations[13] || 'Analytics Cookies'}</CardTitle>
                  </div>
                  <Switch
                    checked={tempPreferences.analytics}
                    onCheckedChange={(checked) => handleTogglePreference('analytics', checked)}
                  />
                </div>
                <CardDescription className="text-xs">
                  {translations[14] || 'Help us understand how visitors use our website by collecting anonymous usage statistics.'}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Marketing Cookies */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{translations[15] || 'Marketing Cookies'}</CardTitle>
                  </div>
                  <Switch
                    checked={tempPreferences.marketing}
                    onCheckedChange={(checked) => handleTogglePreference('marketing', checked)}
                  />
                </div>
                <CardDescription className="text-xs">
                  {translations[16] || 'Used to deliver personalized ads and track advertising campaign effectiveness.'}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Preference Cookies */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{translations[17] || 'Preference Cookies'}</CardTitle>
                  </div>
                  <Switch
                    checked={tempPreferences.preferences}
                    onCheckedChange={(checked) => handleTogglePreference('preferences', checked)}
                  />
                </div>
                <CardDescription className="text-xs">
                  {translations[18] || 'Remember your settings and preferences to enhance your browsing experience.'}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setShowManageModal(false)}
              className="bg-black text-white hover:bg-black focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
            >
              {translations[19] || 'Cancel'}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setTempPreferences({
                    necessary: true,
                    analytics: false,
                    marketing: false,
                    preferences: false,
                  });
                }}
                className="bg-black text-white hover:bg-black focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
              >
                {translations[20] || 'Reject All'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setTempPreferences({
                    necessary: true,
                    analytics: true,
                    marketing: true,
                    preferences: true,
                  });
                }}
                className="bg-black text-white hover:bg-black focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
              >
                {translations[2] || 'Accept All'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleSavePreferences}
                className="bg-black text-white hover:bg-black focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0"
              >
                {translations[21] || 'Save Preferences'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}