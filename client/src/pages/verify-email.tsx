import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTypedTranslation } from "@/hooks/use-master-translation";

export default function VerifyEmail() {
  const [location, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [isReporting, setIsReporting] = useState(false);
  const t = useTypedTranslation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('invalid');
      setMessage('');
      return;
    }

    // Verify the email with the token
    const verifyEmail = async () => {
      try {
        const response = await apiRequest('POST', '/api/auth/verify-email/confirm', {
          token: token
        });

        console.log('[VERIFY-EMAIL] Email verified successfully, refreshing user data');
        
        // Invalidate and refetch user data to get updated emailVerified status
        await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        await queryClient.refetchQueries({ queryKey: ["/api/user"] });
        
        setStatus('success');
        setMessage(t['Your email has been verified successfully! You can now access all features.']);

        // Redirect to home after 2 seconds
        setTimeout(() => {
          console.log('[VERIFY-EMAIL] Redirecting to home page with verified status');
          window.location.href = '/';
        }, 2000);

      } catch (error: any) {
        console.error('Email verification failed:', error);
        setStatus('error');
        
        // Capture error details for reporting
        const errorInfo = {
          errorMessage: error.message || 'Unknown error',
          errorStack: error.stack || 'No stack trace available',
          timestamp: new Date().toISOString(),
          page: 'Email Verification Page',
          url: window.location.href,
          token: token || 'No token provided',
          userAgent: navigator.userAgent
        };
        setErrorDetails(JSON.stringify(errorInfo, null, 2));
        
        if (error.message?.includes('Invalid verification token')) {
          setMessage(t['This verification link is invalid or has already been used.']);
        } else if (error.message?.includes('expired')) {
          setMessage(t['This verification link has expired. Please request a new one.']);
        } else {
          setMessage(t['Failed to verify your email. Please try again or contact support.']);
        }
      }
    };

    verifyEmail();
  }, [navigate, t]);

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return t['Verifying Your Email...'];
      case 'success':
        return t['Email Verified Successfully!'];
      case 'error':
        return t['Verification Failed'];
      case 'invalid':
        return t['Invalid Verification Link'];
      default:
        return t['Email Verification'];
    }
  };

  const getDescription = () => {
    switch (status) {
      case 'loading':
        return t['Please wait while we verify your email address.'];
      case 'success':
        return t['Welcome to Dedw3n! Your account is now fully activated.'];
      case 'error':
        return t['We encountered an issue while verifying your email.'];
      case 'invalid':
        return t['The verification link appears to be invalid or malformed.'];
      default:
        return t['Verifying your email address...'];
    }
  };

  const handleReport = async () => {
    if (!errorDetails) return;
    
    setIsReporting(true);
    
    try {
      await apiRequest('POST', '/api/error-reports', {
        errorDetails: errorDetails,
        page: 'Email Verification',
        reportedAt: new Date().toISOString()
      });
      
      alert('Error report submitted successfully. Our team will investigate this issue.');
    } catch (error) {
      console.error('Failed to submit error report:', error);
      alert('Failed to submit error report. Please contact support directly.');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Card className="w-full max-w-md shadow-none border-0">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold" data-testid="text-title">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-3 pt-0">
          {message && (
            <p className="text-sm text-gray-600" data-testid="text-message">
              {message}
            </p>
          )}
          
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-green-600 font-medium" data-testid="text-redirect">
                {t['You will be redirected automatically in a few seconds...']}
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
                data-testid="button-continue"
              >
                {t['Continue to Dedw3n']}
              </Button>
            </div>
          )}
          
          {(status === 'error' || status === 'invalid') && (
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
                data-testid="button-home"
              >
                {t['Return to Home']}
              </Button>
              
              {status === 'error' && (
                <>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="secondary"
                    className="w-full"
                    data-testid="button-retry"
                  >
                    {t['Try Again']}
                  </Button>
                  
                  <Button 
                    onClick={handleReport}
                    variant="ghost"
                    className="w-full"
                    disabled={isReporting || !errorDetails}
                    data-testid="button-report"
                  >
                    {isReporting ? t['Sending Report...'] : t['Report']}
                  </Button>
                </>
              )}
            </div>
          )}
          
          {status === 'loading' && (
            <div className="text-sm text-gray-500" data-testid="text-loading">
              {t['This should only take a moment...']}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}