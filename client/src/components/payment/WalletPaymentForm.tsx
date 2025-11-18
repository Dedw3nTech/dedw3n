import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Loader2, Wallet } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/currencyConverter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMasterTranslation } from '@/hooks/use-master-translation';

interface WalletPaymentFormProps {
  amount: number;
  walletBalance: number;
  walletCurrency: string;
  onPaymentComplete: () => void;
  metadata: {
    userId: number;
    items: string;
    shipping: string;
  };
}

export const WalletPaymentForm = ({ 
  amount, 
  walletBalance, 
  walletCurrency,
  metadata,
  onPaymentComplete 
}: WalletPaymentFormProps) => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const { translateText } = useMasterTranslation();

  const handlePayWithWallet = async () => {
    if (amount > walletBalance) {
      setErrorMessage('Insufficient funds in your wallet');
      toast({
        title: 'Payment Failed',
        description: 'Insufficient funds in your wallet',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setErrorMessage(undefined);

    try {
      // Create a payment transaction using the wallet
      const response = await apiRequest('POST', '/api/transactions', {
        type: 'payment',
        amount,
        description: `Order payment - ${new Date().toISOString()}`,
        metadata: JSON.stringify(metadata)
      });

      if (response.ok) {
        // Invalidate wallet and transaction queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/wallets/me'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        
        // Show success message
        toast({
          title: 'Payment Successful',
          description: 'Your order has been placed successfully!',
        });
        
        // Trigger the completion callback
        onPaymentComplete();
        
        // Redirect to success page
        setLocation('/payment-success');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: errorData.message || 'An error occurred while processing your payment',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast({
        title: translateText('Error'),
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const insufficientFunds = amount > walletBalance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          Pay with Wallet
        </CardTitle>
        <CardDescription>
          Use your e-wallet balance to complete this purchase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Your Balance:</span>
          <span className="font-bold">{formatCurrency(walletBalance, walletCurrency as any)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Order Total:</span>
          <span className="font-bold">{formatCurrency(amount, 'GBP')}</span>
        </div>
        {insufficientFunds && (
          <Alert variant="destructive">
            <AlertTitle>Insufficient Funds</AlertTitle>
            <AlertDescription>
              Your wallet balance is too low to complete this purchase. Please add funds to your wallet or choose another payment method.
            </AlertDescription>
          </Alert>
        )}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePayWithWallet} 
          disabled={insufficientFunds || isProcessing} 
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};