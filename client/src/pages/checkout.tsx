import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { CheckoutForm } from '@/components/payment/CheckoutForm';
import { Loader2 } from 'lucide-react';

// Initialize Stripe with publishable key (will be available only when keys are set up)
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      setLocation('/auth');
      return;
    }

    // Fetch cart items
    const fetchCartItems = async () => {
      try {
        const response = await apiRequest('GET', '/api/cart');
        const items = await response.json();
        setCartItems(items);
        
        // Calculate total
        const total = items.reduce((sum: number, item: any) => {
          return sum + (item.product?.price || 0) * item.quantity;
        }, 0);
        
        setOrderTotal(total);
        
        if (items.length === 0) {
          setError('Your cart is empty');
          setLoading(false);
          return;
        }
        
        // Create a payment intent
        if (stripePromise) {
          try {
            const response = await apiRequest('POST', '/api/payments/create-intent', {
              amount: total,
              currency: 'usd',
              metadata: {
                userId: user.id,
                items: JSON.stringify(items.map((item: any) => ({
                  id: item.productId,
                  quantity: item.quantity
                })))
              }
            });
            
            const data = await response.json();
            setClientSecret(data.clientSecret);
          } catch (err: any) {
            setError(`Could not initialize payment: ${err.message}`);
          }
        } else {
          setError('Stripe is not configured. Please set up your VITE_STRIPE_PUBLIC_KEY.');
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(`Error loading cart: ${err.message}`);
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [user, setLocation]);

  const handleBackToCart = () => {
    setLocation('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
            <CardDescription>There was a problem with your checkout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4">
              {error}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleBackToCart}>Back to Cart</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>Complete your purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Order Summary</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.product?.name || 'Product'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatPrice(item.product?.price || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatPrice((item.product?.price || 0) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <th colSpan={3} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatPrice(orderTotal)}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {clientSecret && stripePromise ? (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Payment Details</h3>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm />
              </Elements>
            </div>
          ) : (
            <div className="text-center p-4 border rounded-md bg-yellow-50 text-yellow-800">
              {stripePromise ? 'Preparing payment gateway...' : 'Payment gateway not configured yet. Please check back later.'}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBackToCart}>
            Back to Cart
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}