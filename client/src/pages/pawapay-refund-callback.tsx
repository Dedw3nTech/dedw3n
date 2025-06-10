import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface RefundCallbackData {
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';
  refundId: string;
  originalTransactionId: string;
  amount: string;
  currency: string;
  recipientPhone: string;
  provider: string;
  timestamp: string;
  errorCode?: string;
  errorMessage?: string;
  refundReason?: string;
  processingFee?: string;
}

export default function PawapayRefundCallback() {
  const [, setLocation] = useLocation();
  const [callbackData, setCallbackData] = useState<RefundCallbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refundId = urlParams.get('refundId');
    const status = urlParams.get('status') as RefundCallbackData['status'];
    
    if (!refundId || !status) {
      setError('Invalid refund callback parameters');
      setLoading(false);
      return;
    }

    const processCallback = async () => {
      try {
        const response = await apiRequest('POST', '/api/pawapay/refund/callback', {
          refundId,
          status,
          originalTransactionId: urlParams.get('originalTransactionId'),
          amount: urlParams.get('amount'),
          currency: urlParams.get('currency'),
          recipientPhone: urlParams.get('recipientPhone'),
          provider: urlParams.get('provider'),
          timestamp: urlParams.get('timestamp'),
          errorCode: urlParams.get('errorCode'),
          errorMessage: urlParams.get('errorMessage'),
          refundReason: urlParams.get('refundReason'),
          processingFee: urlParams.get('processingFee')
        });

        if (response.ok) {
          const data = await response.json();
          setCallbackData(data);
        } else {
          throw new Error('Failed to process refund callback');
        }
      } catch (err) {
        setError('Failed to process refund callback');
        console.error('Refund callback processing error:', err);
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
        return <RefreshCw className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (callbackData?.status) {
      case 'SUCCESS':
        return {
          title: 'Refund Processed Successfully!',
          description: 'The refund has been processed and funds have been returned to the original payment method.'
        };
      case 'FAILED':
        return {
          title: 'Refund Failed',
          description: callbackData.errorMessage || 'The refund could not be processed. Please contact support for assistance.'
        };
      case 'PENDING':
        return {
          title: 'Refund Processing',
          description: 'Your refund is being processed. You will receive confirmation once completed.'
        };
      case 'CANCELLED':
        return {
          title: 'Refund Cancelled',
          description: 'The refund request was cancelled and no funds have been transferred.'
        };
      default:
        return {
          title: 'Unknown Status',
          description: 'Unable to determine the status of your refund request.'
        };
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Processing your refund callback...</p>
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
              <h3 className="font-semibold mb-4">Refund Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Refund ID:</span>
                  <p className="text-muted-foreground">{callbackData.refundId}</p>
                </div>
                <div>
                  <span className="font-medium">Original Transaction:</span>
                  <p className="text-muted-foreground">{callbackData.originalTransactionId}</p>
                </div>
                <div>
                  <span className="font-medium">Refund Amount:</span>
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
                {callbackData.refundReason && (
                  <div>
                    <span className="font-medium">Reason:</span>
                    <p className="text-muted-foreground">{callbackData.refundReason}</p>
                  </div>
                )}
                {callbackData.processingFee && (
                  <div>
                    <span className="font-medium">Processing Fee:</span>
                    <p className="text-muted-foreground">{callbackData.processingFee} {callbackData.currency}</p>
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
                  onClick={() => setLocation('/support')} 
                  className="w-full sm:w-auto"
                >
                  Contact Support
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}