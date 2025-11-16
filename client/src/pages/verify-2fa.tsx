import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Shield, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Verify2FA() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<'email' | 'whatsapp' | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get email from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    
    if (!emailParam) {
      toast({
        title: "Error",
        description: "No email provided. Redirecting to login.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    setEmail(emailParam);
  }, [navigate, toast]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/verify-2fa-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Store the token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      toast({
        title: "Success!",
        description: "Login successful",
      });

      // Invalidate queries to refresh user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Redirect to home
      navigate('/');
    } catch (error: any) {
      console.error('2FA verification failed:', error);
      toast({
        title: "Verification Failed",
        description: error.message || 'Invalid verification code. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendCode = async (selectedMethod: 'email' | 'whatsapp') => {
    setIsSending(true);
    setMethod(selectedMethod);

    try {
      const response = await fetch('/api/auth/send-2fa-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, method: selectedMethod }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send code');
      }

      setCodeSent(true);
      toast({
        title: "Code Sent",
        description: `A verification code has been sent to your ${selectedMethod === 'whatsapp' ? 'WhatsApp' : 'email'}`,
      });
    } catch (error: any) {
      console.error('Failed to send code:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to send code. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
          <CardDescription>
            {!codeSent 
              ? "Choose how to receive your verification code"
              : method === 'whatsapp'
                ? "A 6-digit code has been sent via WhatsApp"
                : "A 6-digit code has been sent to your email"
            }
          </CardDescription>
        </CardHeader>
        
        {!codeSent ? (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Select Verification Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-gray-100"
                  onClick={() => handleSendCode('email')}
                  disabled={isSending}
                  data-testid="button-method-email"
                >
                  <Mail className="w-6 h-6" />
                  <span>Email</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-gray-100"
                  onClick={() => handleSendCode('whatsapp')}
                  disabled={isSending}
                  data-testid="button-method-whatsapp"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span>WhatsApp</span>
                </Button>
              </div>
              {isSending && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending code...
                </div>
              )}
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleVerify}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoFocus
                  required
                  data-testid="input-2fa-code"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code from your {method === 'whatsapp' ? 'WhatsApp' : 'email'}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={isVerifying || code.length !== 6}
                data-testid="button-verify-2fa"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Login'
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setCodeSent(false);
                  setCode('');
                  setMethod(null);
                }}
                data-testid="button-change-method"
              >
                Change Method
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-muted-foreground"
                onClick={() => navigate('/auth')}
              >
                Back to Login
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
