import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CallbackData {
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';
  transactionId: string;
  amount: string;
  currency: string;
  phoneNumber: string;
  provider: string;
  timestamp: string;
  errorCode?: string;
  errorMessage?: string;
}

export default function PawapayDepositCallback() {
  const [, setLocation] = useLocation();
  const [callbackData, setCallbackData] = useState<CallbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transactionId');
    const status = urlParams.get('status') as CallbackData['status'];
    
    if (!transactionId || !status) {
      setError('Invalid callback parameters');
      setLoading(false);
      return;
    }

    // Process the callback data
    const processCallback = async () => {
      try {
        const response = await apiRequest('POST', '/api/pawapay/deposit/callback', {
          transactionId,
          status,
          amount: urlParams.get('amount'),
          currency: urlParams.get('currency'),
          phoneNumber: urlParams.get('phoneNumber'),
          provider: urlParams.get('provider'),
          timestamp: urlParams.get('timestamp'),
          errorCode: urlParams.get('errorCode'),
          errorMessage: urlParams.get('errorMessage')
        });

        if (response.ok) {
          const data = await response.json();
          setCallbackData(data);
        } else {
          throw new Error('Failed to process callback');
        }
      } catch (err) {
        setError('Failed to process payment callback');
        console.error('Callback processing error:', err);
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
        return <AlertTriangle className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (callbackData?.status) {
      case 'SUCCESS':
        return {
          title: 'Deposit Successful!',
          description: 'Your mobile money deposit has been processed successfully.'
        };
      case 'FAILED':
        return {
          title: 'Deposit Failed',
          description: callbackData.errorMessage || 'Your deposit could not be processed. Please try again.'
        };
      case 'PENDING':
        return {
          title: 'Deposit Pending',
          description: 'Your deposit is being processed. You will receive a confirmation shortly.'
        };
      case 'CANCELLED':
        return {
          title: 'Deposit Cancelled',
          description: 'The deposit was cancelled. No charges have been made.'
        };
      default:
        return {
          title: 'Unknown Status',
          description: 'Unable to determine the status of your deposit.'
        };
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Processing your deposit callback...</p>
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
              <h3 className="font-semibold mb-4">Transaction Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Transaction ID:</span>
                  <p className="text-muted-foreground">{callbackData.transactionId}</p>
                </div>
                <div>
                  <span className="font-medium">Amount:</span>
                  <p className="text-muted-foreground">{callbackData.amount} {callbackData.currency}</p>
                </div>
                <div>
                  <span className="font-medium">Phone Number:</span>
                  <p className="text-muted-foreground">{callbackData.phoneNumber}</p>
                </div>
                <div>
                  <span className="font-medium">Provider:</span>
                  <p className="text-muted-foreground">{callbackData.provider}</p>
                </div>
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
                  onClick={() => setLocation('/wallet')} 
                  className="w-full sm:w-auto"
                >
                  View Wallet
                </Button>
              )}
              {callbackData.status === 'FAILED' && (
                <Button 
                  onClick={() => setLocation('/deposit')} 
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