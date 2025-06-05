import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, AlertTriangle, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PayoutCallbackData {
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';
  payoutId: string;
  amount: string;
  currency: string;
  recipientPhone: string;
  provider: string;
  timestamp: string;
  errorCode?: string;
  errorMessage?: string;
  fee?: string;
  exchangeRate?: string;
}

export default function PawapayPayoutCallback() {
  const [, setLocation] = useLocation();
  const [callbackData, setCallbackData] = useState<PayoutCallbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payoutId = urlParams.get('payoutId');
    const status = urlParams.get('status') as PayoutCallbackData['status'];
    
    if (!payoutId || !status) {
      setError('Invalid payout callback parameters');
      setLoading(false);
      return;
    }

    const processCallback = async () => {
      try {
        const response = await apiRequest('POST', '/api/pawapay/payout/callback', {
          payoutId,
          status,
          amount: urlParams.get('amount'),
          currency: urlParams.get('currency'),
          recipientPhone: urlParams.get('recipientPhone'),
          provider: urlParams.get('provider'),
          timestamp: urlParams.get('timestamp'),
          errorCode: urlParams.get('errorCode'),
          errorMessage: urlParams.get('errorMessage'),
          fee: urlParams.get('fee'),
          exchangeRate: urlParams.get('exchangeRate')
        });

        if (response.ok) {
          const data = await response.json();
          setCallbackData(data);
        } else {
          throw new Error('Failed to process payout callback');
        }
      } catch (err) {
        setError('Failed to process payout callback');
        console.error('Payout callback processing error:', err);
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, []);

  const getStatusIcon = () => {
    switch (callbackData?.status) {
      case 'SUCCESS':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'CANCELLED':
        return <AlertTriangle className="h-16 w-16 text-orange-500" />;
      default:
        return <CreditCard className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (callbackData?.status) {
      case 'SUCCESS':
        return {
          title: 'Payout Successful!',
          description: 'Your mobile money payout has been sent successfully.'
        };
      case 'FAILED':
        return {
          title: 'Payout Failed',
          description: callbackData.errorMessage || 'Your payout could not be processed. Please contact support.'
        };
      case 'PENDING':
        return {
          title: 'Payout Pending',
          description: 'Your payout is being processed. The recipient will receive the funds shortly.'
        };
      case 'CANCELLED':
        return {
          title: 'Payout Cancelled',
          description: 'The payout was cancelled. Funds have been returned to your account.'
        };
      default:
        return {
          title: 'Unknown Status',
          description: 'Unable to determine the status of your payout.'
        };
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Processing your payout callback...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => setLocation('/dashboard')} className="w-full sm:w-auto">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMessage = getStatusMessage();

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl md:text-3xl">{statusMessage.title}</CardTitle>
          <p className="text-lg text-muted-foreground">{statusMessage.description}</p>
        </CardHeader>
        
        {callbackData && (
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">Payout Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Payout ID:</span>
                  <p className="text-muted-foreground">{callbackData.payoutId}</p>
                </div>
                <div>
                  <span className="font-medium">Amount:</span>
                  <p className="text-muted-foreground">{callbackData.amount} {callbackData.currency}</p>
                </div>
                <div>
                  <span className="font-medium">Recipient Phone:</span>
                  <p className="text-muted-foreground">{callbackData.recipientPhone}</p>
                </div>
                <div>
                  <span className="font-medium">Provider:</span>
                  <p className="text-muted-foreground">{callbackData.provider}</p>
                </div>
                {callbackData.fee && (
                  <div>
                    <span className="font-medium">Transaction Fee:</span>
                    <p className="text-muted-foreground">{callbackData.fee} {callbackData.currency}</p>
                  </div>
                )}
                {callbackData.exchangeRate && (
                  <div>
                    <span className="font-medium">Exchange Rate:</span>
                    <p className="text-muted-foreground">{callbackData.exchangeRate}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <span className="font-medium">Timestamp:</span>
                  <p className="text-muted-foreground">{new Date(callbackData.timestamp).toLocaleString()}</p>
                </div>
                {callbackData.errorCode && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-red-600">Error Code:</span>
                    <p className="text-red-600">{callbackData.errorCode}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setLocation('/dashboard')} 
                variant="outline" 
                className="w-full sm:w-auto"
              >
                Return to Dashboard
              </Button>
              {callbackData.status === 'SUCCESS' && (
                <Button 
                  onClick={() => setLocation('/transactions')} 
                  className="w-full sm:w-auto"
                >
                  View Transactions
                </Button>
              )}
              {callbackData.status === 'FAILED' && (
                <Button 
                  onClick={() => setLocation('/payout')} 
                  className="w-full sm:w-auto"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}