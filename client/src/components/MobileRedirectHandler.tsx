import { useEffect, useState } from 'react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Monitor } from 'lucide-react';

export function MobileRedirectHandler() {
  const { shouldRedirect, performRedirect, forceDesktop, isMobile, isRedirecting } = useMobileDetection();
  const [showPrompt, setShowPrompt] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (shouldRedirect && isMobile) {
      // Show prompt for 5 seconds, then auto-redirect
      setShowPrompt(true);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            performRedirect();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [shouldRedirect, isMobile, performRedirect]);

  const handleStayDesktop = () => {
    forceDesktop();
    setShowPrompt(false);
  };

  const handleGoMobile = () => {
    setShowPrompt(false);
    performRedirect();
  };

  if (!showPrompt || isRedirecting) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Smartphone className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle>Mobile Device Detected</CardTitle>
          <CardDescription>
            We've optimized a mobile version of Dedw3n for your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Redirecting to mobile version in <span className="font-bold text-blue-600">{countdown}</span> seconds...
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleGoMobile}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Go to Mobile Version
            </Button>
            
            <Button 
              onClick={handleStayDesktop}
              variant="outline"
              className="w-full"
            >
              <Monitor className="mr-2 h-4 w-4" />
              Stay on Desktop Version
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            <p>You can change this preference anytime in settings</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}