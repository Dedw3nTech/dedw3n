import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestCookiesPage() {
  const clearCookieConsent = () => {
    localStorage.removeItem('dedwen_cookie_consent');
    localStorage.removeItem('dedwen_first_visit');
    // Reload to trigger first-time visitor flow
    window.location.reload();
  };

  const showCurrentState = () => {
    const consent = localStorage.getItem('dedwen_cookie_consent');
    const firstVisit = localStorage.getItem('dedwen_first_visit');
    
    console.log('Cookie Consent State:', {
      consent: consent ? JSON.parse(consent) : null,
      firstVisit: firstVisit,
      isFirstVisit: firstVisit === null
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Cookie Banner Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={clearCookieConsent}
            className="w-full"
          >
            Clear Cookie Consent & Show Banner
          </Button>
          
          <Button 
            onClick={showCurrentState}
            variant="outline"
            className="w-full"
          >
            Log Current State to Console
          </Button>
          
          <div className="text-xs text-gray-500 text-center">
            <p>Use the first button to clear cookie consent data and trigger the banner display.</p>
            <p>Check browser console for current state details.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}