import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useMasterTranslation } from '@/hooks/use-master-translation';

export default function VerifyEmailPending() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const { translateText } = useMasterTranslation();

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage('');
    
    try {
      await apiRequest('POST', '/api/auth/verify-email/resend', {});
      setResendMessage(translateText('Verification email has been resent. Please check your inbox.'));
      setMessageType('success');
    } catch (error: any) {
      setMessageType('error');
      if (error.message?.includes('expired')) {
        setResendMessage(translateText('Your account has expired. Please create a new account.'));
      } else if (error.message?.includes('already verified')) {
        setResendMessage(translateText('Email already verified. Redirecting...'));
        setTimeout(() => setLocation('/'), 2000);
      } else {
        setResendMessage(translateText('Failed to resend email. Please try again.'));
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 pt-24">
      <div className="text-center max-w-md mx-auto">
        <p className="text-black text-lg mb-6">
          {translateText('Please confirm your email address to unlock all features and ensure the security of your account.')}
        </p>
        
        {user?.email && (
          <p className="text-gray-600 text-sm mb-4">
            {translateText('We sent a verification email to')} <strong>{user.email}</strong>
          </p>
        )}
        
        <div className="space-y-3">
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full"
            data-testid="button-resend-email"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {translateText('Sending...')}
              </>
            ) : (
              translateText('Resend Verification Email')
            )}
          </Button>
          
          {resendMessage && (
            <p 
              className={`text-sm ${messageType === 'error' ? 'text-red-600' : 'text-green-600'}`}
              data-testid="text-resend-message"
            >
              {resendMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
