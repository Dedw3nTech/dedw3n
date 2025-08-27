import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Cookie, Shield, Settings, CheckCircle, XCircle, Info } from 'lucide-react';
import { useCookieConsent } from './CookieConsentProvider';
import { useGPC } from './GPCProvider';
import { CookieConsent } from '@/lib/cookie-consent';

export function CookieConsentBanner() {
  const { showBanner, acceptAll, acceptNecessary, saveCustomPreferences, hideBanner } = useCookieConsent();
  const { hasOptedOut: gpcOptedOut } = useGPC();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPreferences, setCustomPreferences] = useState<Omit<CookieConsent, 'timestamp' | 'version'>>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  // Don't show banner if user already consented or it's hidden
  if (!showBanner) {
    return null;
  }

  const handleAcceptAll = () => {
    acceptAll();
  };

  const handleAcceptNecessary = () => {
    acceptNecessary();
  };

  const handleSaveCustom = () => {
    saveCustomPreferences(customPreferences);
  };

  const handleTogglePreference = (key: keyof typeof customPreferences, value: boolean) => {
    setCustomPreferences(prev => ({
      ...prev,
      [key]: key === 'necessary' ? true : value // Necessary cookies always enabled
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Cookie className="h-6 w-6 text-black" />
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Cookie & Privacy Preferences
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                We use cookies to enhance your browsing experience and analyze our traffic. 
                Choose your preferences below or accept all to continue.
              </CardDescription>
            </div>
            {gpcOptedOut && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                <Shield className="h-4 w-4 text-black" />
                <span className="text-xs font-medium text-green-700">GPC Protected</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {gpcOptedOut && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-black mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Global Privacy Control Detected
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    We've detected your privacy preference signal. Only necessary cookies will be used.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showAdvanced ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Necessary Cookies</p>
                    <p className="text-xs text-gray-500">Essential for website functionality</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Analytics Cookies</p>
                    <p className="text-xs text-gray-500">Help us improve our service</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Marketing Cookies</p>
                    <p className="text-xs text-gray-500">Personalized ads and content</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={handleAcceptAll} 
                  className="flex-1 bg-black hover:bg-gray-800"
                  disabled={gpcOptedOut}
                >
                  Accept All Cookies
                </Button>
                <Button 
                  onClick={handleAcceptNecessary} 
                  variant="outline" 
                  className="flex-1"
                >
                  {gpcOptedOut ? 'Continue with GPC Settings' : 'Accept Necessary Only'}
                </Button>
                <Button 
                  onClick={() => setShowAdvanced(true)} 
                  variant="ghost" 
                  className="flex items-center gap-2"
                  disabled={gpcOptedOut}
                >
                  <Settings className="h-4 w-4 text-black" />
                  Customize
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div>
                      <Label className="font-medium">Necessary Cookies</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Essential cookies required for basic website functionality. Cannot be disabled.
                      </p>
                    </div>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <Label className="font-medium">Analytics Cookies</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Help us understand how visitors interact with our website through Google Analytics.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={customPreferences.analytics}
                    onCheckedChange={(checked) => handleTogglePreference('analytics', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <Label className="font-medium">Marketing Cookies</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Used to deliver personalized advertisements and track marketing campaign performance.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={customPreferences.marketing}
                    onCheckedChange={(checked) => handleTogglePreference('marketing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <Label className="font-medium">Preference Cookies</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Remember your preferences like language, currency, and theme settings.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={customPreferences.preferences}
                    onCheckedChange={(checked) => handleTogglePreference('preferences', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleSaveCustom}
                  className="flex-1 bg-black hover:bg-gray-800"
                >
                  Save Preferences
                </Button>
                <Button 
                  onClick={handleAcceptAll} 
                  variant="outline" 
                  className="flex-1"
                >
                  Accept All
                </Button>
                <Button 
                  onClick={() => setShowAdvanced(false)} 
                  variant="ghost"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>
              By continuing to use our website, you consent to our use of cookies as described in our{' '}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
              <a href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</a>.
              You can change these settings at any time in your privacy preferences.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}