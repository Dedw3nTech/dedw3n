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

export function LowerCookieBanner() {
  const { showBanner, acceptAll, acceptNecessary, hideBanner, consent, saveCustomPreferences } = useCookieConsent();
  const [showManageModal, setShowManageModal] = useState(false);
  const [tempPreferences, setTempPreferences] = useState({
    necessary: true,
    analytics: consent?.analytics ?? true,
    marketing: consent?.marketing ?? true,
    preferences: consent?.preferences ?? true,
  });

  // Don't show banner if user already consented or it's hidden
  if (!showBanner) {
    return null;
  }

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
              onClick={handleManageCookies}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Settings className="h-4 w-4 mr-1" />
              Manage Cookies
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

      {/* Cookie Management Modal */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Choose which cookies you want to accept. Some cookies are essential for the website to function properly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Necessary Cookies */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <CardTitle className="text-sm">Necessary Cookies</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-medium">Always Active</span>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Essential for website functionality, security, and user authentication. Cannot be disabled.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Analytics Cookies */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm">Analytics Cookies</CardTitle>
                  </div>
                  <Switch
                    checked={tempPreferences.analytics}
                    onCheckedChange={(checked) => handleTogglePreference('analytics', checked)}
                  />
                </div>
                <CardDescription className="text-xs">
                  Help us understand how visitors use our website by collecting anonymous usage statistics.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Marketing Cookies */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cookie className="h-4 w-4 text-purple-600" />
                    <CardTitle className="text-sm">Marketing Cookies</CardTitle>
                  </div>
                  <Switch
                    checked={tempPreferences.marketing}
                    onCheckedChange={(checked) => handleTogglePreference('marketing', checked)}
                  />
                </div>
                <CardDescription className="text-xs">
                  Used to deliver personalized ads and track advertising campaign effectiveness.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Preference Cookies */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-orange-600" />
                    <CardTitle className="text-sm">Preference Cookies</CardTitle>
                  </div>
                  <Switch
                    checked={tempPreferences.preferences}
                    onCheckedChange={(checked) => handleTogglePreference('preferences', checked)}
                  />
                </div>
                <CardDescription className="text-xs">
                  Remember your settings and preferences to enhance your browsing experience.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowManageModal(false)}
              className="text-gray-600"
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTempPreferences({
                    necessary: true,
                    analytics: false,
                    marketing: false,
                    preferences: false,
                  });
                }}
              >
                Reject All
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTempPreferences({
                    necessary: true,
                    analytics: true,
                    marketing: true,
                    preferences: true,
                  });
                }}
              >
                Accept All
              </Button>
              <Button
                onClick={handleSavePreferences}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}