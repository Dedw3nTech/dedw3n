import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, MinusCircle, PlusCircle, ShoppingCart, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { calculatePricing, amountNeededForFreeShipping } from '@/lib/pricing';
import { useMasterTranslation } from '@/hooks/use-master-translation';
import { useWeightUnit } from '@/contexts/WeightUnitContext';

export default function ShoppingCartContent() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatPriceFromGBP } = useCurrency();
  const { translateText } = useMasterTranslation();
  const { formatWeight } = useWeightUnit();
  
  // Escrow state management
  const [useEscrow, setUseEscrow] = useState(false);
  const [escrowTransaction, setEscrowTransaction] = useState<any>(null);
  const [escrowLoading, setEscrowLoading] = useState(false);
  
  // Shipping type selection
  const [selectedShippingType, setSelectedShippingType] = useState<string>('normal-freight');
  
  // Location editing state
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('');
  
  // Navigation helper
  const handleProductClick = (productId: number) => {
    setLocation(`/product/${productId}`);
  };
  
  // Show authentication message if not logged in
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>{translateText('Shopping Cart')}</CardTitle>
          <CardDescription>
            {translateText('Please log in to view your shopping cart')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            {translateText('You need to be signed in to manage your cart and make purchases.')}
          </p>
          <Button onClick={() => setLocation('/')}>
            {translateText('Go to Home')}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Fetch cart items
  const { 
    data: cartItems = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/cart');
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch vendor details for shipping info
  const { data: vendorDetails = {} } = useQuery({
    queryKey: ['/api/vendors/details'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vendors/details');
      return response.json();
    },
    enabled: !!cartItems.length,
  });

  // Auto-calculate shipping costs - ensure cartItems is available
  const cartTotalWeight = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((total: number, item: any) => {
      const weight = item.product?.weight || 0;
      return total + (weight * item.quantity);
    }, 0);
  }, [cartItems]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <Card className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="h-12 w-12 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{translateText('Your cart is empty')}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {translateText('Add some products to your cart to get started')}
        </p>
        <Button onClick={() => setLocation('/products')} className="bg-black hover:bg-gray-800">
          <ShoppingBag className="mr-2 h-4 w-4" />
          {translateText('Shop Now')}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {cartItems.map((item: any) => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div 
                  className="w-20 h-20 bg-gray-100 rounded cursor-pointer overflow-hidden"
                  onClick={() => handleProductClick(item.product.id)}
                >
                  {item.product.imageUrl ? (
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 
                    className="font-semibold cursor-pointer hover:text-blue-600"
                    onClick={() => handleProductClick(item.product.id)}
                  >
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-600">{item.product.category}</p>
                  <p className="text-sm text-gray-500">by {item.vendor?.storeName}</p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        // onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="mx-2 min-w-[2rem] text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        // onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        {formatPriceFromGBP(item.totalPrice)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        // onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatPriceFromGBP(cartItems.reduce((total: number, item: any) => total + item.totalPrice, 0))}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="border-t pt-4 flex justify-between font-semibold">
            <span>Total:</span>
            <span>{formatPriceFromGBP(cartItems.reduce((total: number, item: any) => total + item.totalPrice, 0))}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full bg-black hover:bg-gray-800"
            onClick={() => setLocation('/checkout')}
          >
            Proceed to Checkout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}