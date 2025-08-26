import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const [location, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('invalid');
      setMessage('Invalid or missing verification token.');
      return;
    }

    // Verify the email with the token
    const verifyEmail = async () => {
      try {
        const response = await apiRequest('POST', '/api/auth/verify-email/confirm', {
          token: token
        });

        setStatus('success');
        setMessage('Your email has been verified successfully! You can now access all features.');
        
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified.",
        });

        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);

      } catch (error: any) {
        console.error('Email verification failed:', error);
        setStatus('error');
        
        if (error.message?.includes('Invalid verification token')) {
          setMessage('This verification link is invalid or has already been used.');
        } else if (error.message?.includes('expired')) {
          setMessage('This verification link has expired. Please request a new one.');
        } else {
          setMessage('Failed to verify your email. Please try again or contact support.');
        }

        toast({
          title: "Verification Failed",
          description: "There was an issue verifying your email.",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [navigate, toast]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
      case 'invalid':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Mail className="h-16 w-16 text-gray-400" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Your Email...';
      case 'success':
        return 'Email Verified Successfully!';
      case 'error':
        return 'Verification Failed';
      case 'invalid':
        return 'Invalid Verification Link';
      default:
        return 'Email Verification';
    }
  };

  const getDescription = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we verify your email address.';
      case 'success':
        return 'Welcome to Dedw3n! Your account is now fully activated.';
      case 'error':
        return 'We encountered an issue while verifying your email.';
      case 'invalid':
        return 'The verification link appears to be invalid or malformed.';
      default:
        return 'Verifying your email address...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-base">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            {message}
          </p>
          
          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-sm text-green-600 font-medium">
                You will be redirected automatically in a few seconds...
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Continue to Dedw3n
              </Button>
            </div>
          )}
          
          {(status === 'error' || status === 'invalid') && (
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Return to Home
              </Button>
              
              {status === 'error' && (
                <Button 
                  onClick={() => window.location.reload()}
                  variant="secondary"
                  className="w-full"
                >
                  Try Again
                </Button>
              )}
            </div>
          )}
          
          {status === 'loading' && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                This should only take a moment...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}