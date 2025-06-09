import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Shield, Info } from 'lucide-react';
import { useGPC } from './GPCProvider';

interface GPCBannerProps {
  onDismiss?: () => void;
}

export function GPCBanner({ onDismiss }: GPCBannerProps) {
  const { gpcSignal, hasOptedOut, isGPCSupported } = useGPC();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('gpc-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('gpc-banner-dismissed', 'true');
    onDismiss?.();
  };

  // Don't show banner if dismissed or no GPC signal detected
  if (isDismissed || !isGPCSupported) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-4">
      <Shield className="h-4 w-4 text-blue-600" />
      <div className="flex-1">
        <AlertDescription className="text-blue-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <strong>Global Privacy Control Detected</strong>
              <p className="text-sm mt-1">
                {hasOptedOut 
                  ? "We've detected that you've opted out of data selling and sharing. Your privacy preferences are being respected."
                  : "We've detected your Global Privacy Control signal. Your privacy preferences are being applied to this website."
                }
              </p>
              
              {showDetails && (
                <div className="mt-3 p-3 bg-blue-100 rounded-lg text-xs">
                  <h4 className="font-medium mb-2">GPC Signal Details:</h4>
                  <ul className="space-y-1">
                    <li>Status: {gpcSignal?.detected ? 'Detected' : 'Not detected'}</li>
                    <li>Opt-out: {hasOptedOut ? 'Yes' : 'No'}</li>
                    <li>Source: {gpcSignal?.source || 'Unknown'}</li>
                    <li>Timestamp: {gpcSignal?.timestamp?.toLocaleString() || 'Unknown'}</li>
                  </ul>
                  <p className="mt-2 text-blue-700">
                    When GPC is enabled, we automatically:
                  </p>
                  <ul className="list-disc list-inside mt-1 text-blue-700">
                    <li>Disable analytics tracking</li>
                    <li>Limit data collection to essential functions only</li>
                    <li>Prevent data sharing with third parties</li>
                    <li>Respect your "Do Not Sell" preferences</li>
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:text-blue-800 h-auto p-1"
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-blue-600 hover:text-blue-800 h-auto p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
}