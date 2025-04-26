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
import ShippingOptions from '@/components/shipping/ShippingOptions';
import { AddressForm } from '@/components/shipping/AddressForm';
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
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<any>(null);
  const [addressValid, setAddressValid] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'payment'>('shipping');
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
        
        console.log('Cart items:', items);
        console.log('Calculated total:', total);
        
        setOrderTotal(total);
        
        if (items.length === 0) {
          setError('Your cart is empty');
          setLoading(false);
          return;
        }
        
        // Validate total
        if (total <= 0) {
          setError('Total amount must be greater than 0');
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (err: any) {
        setError(`Error loading cart: ${err.message}`);
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [user, setLocation]);

  // Handle shipping method selection
  const handleShippingMethodChange = (method: any, cost: number) => {
    setSelectedShippingMethod(method);
    setShippingCost(cost);
  };

  // Handle address validation
  const handleSubmit = (address: any) => {
    setShippingAddress(address);
    setAddressValid(true);
  };

  // Continue to payment step
  const handleContinueToPayment = async () => {
    if (!addressValid || !selectedShippingMethod) {
      toast({
        title: "Cannot proceed",
        description: !addressValid 
          ? "Please validate your shipping address first" 
          : "Please select a shipping method",
        variant: "destructive"
      });
      return;
    }

    // Create a payment intent with shipping cost included
    if (stripePromise && user) {
      try {
        setLoading(true);

        // Include shipping cost in the total
        const totalWithShipping = orderTotal + shippingCost;
        
        // Ensure total is at least £0.30 (30 pence) as Stripe has a minimum charge amount
        const minAmount = Math.max(totalWithShipping, 0.3);
        console.log('Amount being sent to Stripe (with shipping):', minAmount);
        
        const response = await apiRequest('POST', '/api/payments/create-intent', {
          amount: minAmount,
          currency: 'gbp',
          metadata: {
            userId: user.id,
            items: JSON.stringify(cartItems.map((item: any) => ({
              id: item.productId,
              quantity: item.quantity
            }))),
            shipping: JSON.stringify({
              method: selectedShippingMethod.id,
              cost: shippingCost,
              address: shippingAddress
            })
          }
        });
        
        const data = await response.json();
        console.log('Payment intent created:', data);
        setClientSecret(data.clientSecret);
        setCheckoutStep('payment');
        setLoading(false);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(`Could not initialize payment: ${err.status || ''} ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    } else {
      setError('Stripe is not configured. Please set up your VITE_STRIPE_PUBLIC_KEY.');
    }
  };

  // Go back to shipping step
  const handleBackToShipping = () => {
    setCheckoutStep('shipping');
  };

  // Go back to cart
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
                      Subtotal
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatPrice(orderTotal)}
                    </th>
                  </tr>
                  {selectedShippingMethod && (
                    <tr>
                      <th colSpan={3} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                        Shipping ({selectedShippingMethod.name})
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                        {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                      </th>
                    </tr>
                  )}
                  <tr>
                    <th colSpan={3} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatPrice(orderTotal + shippingCost)}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {checkoutStep === 'shipping' && (
            <>
              <div className="space-y-8 mt-8">
                <div>
                  <AddressForm onSubmit={handleSubmit} />
                </div>
                
                <div>
                  <ShippingOptions 
                    orderTotal={orderTotal} 
                    onShippingMethodChange={handleShippingMethodChange} 
                  />
                </div>
              </div>
            </>
          )}

          {checkoutStep === 'payment' && clientSecret && stripePromise && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Payment Details</h3>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm />
              </Elements>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {checkoutStep === 'shipping' ? (
            <>
              <Button variant="outline" onClick={handleBackToCart}>
                Back to Cart
              </Button>
              <Button 
                onClick={handleContinueToPayment}
                disabled={!addressValid || !selectedShippingMethod}
              >
                Continue to Payment
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBackToShipping}>
                Back to Shipping
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}