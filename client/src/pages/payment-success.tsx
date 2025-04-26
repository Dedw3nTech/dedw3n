import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/auth');
    }
  }, [user, setLocation]);

  const handleContinueShopping = () => {
    setLocation('/');
  };

  const handleViewOrders = () => {
    setLocation('/orders');
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">Payment Successful!</CardTitle>
          <CardDescription className="text-lg">
            Thank you for your purchase. Your order has been placed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-6">
            <p className="text-muted-foreground mb-4">
              We've sent a confirmation email with all the details of your order.
              Your items will be shipped soon.
            </p>
            <p className="text-sm text-muted-foreground">
              Order reference: #{Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={handleContinueShopping} variant="outline" className="w-full sm:w-auto">
            Continue Shopping
          </Button>
          <Button onClick={handleViewOrders} className="w-full sm:w-auto">
            View My Orders
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}