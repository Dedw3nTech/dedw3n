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
import { Loader2, Trash2, MinusCircle, PlusCircle, ShoppingCart, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { calculatePricing, amountNeededForFreeShipping } from '@/lib/pricing';
import { useMasterTranslation } from '@/hooks/use-master-translation';
import ShippingCostCalculator, { type ShippingCalculation } from '@/components/cart/ShippingCostCalculator';

export default function Cart() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatPriceFromGBP } = useCurrency();
  const { translateText } = useMasterTranslation();
  
  // Shipping state management
  const [selectedShippingCalculation, setSelectedShippingCalculation] = useState<ShippingCalculation | null>(null);
  const [dynamicShippingCost, setDynamicShippingCost] = useState<number>(0);
  
  // Show authentication message if not logged in
  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
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
      </div>
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
  
  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return apiRequest('PUT', `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: translateText('Error'),
        description: `${translateText('Failed to update quantity')}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: translateText('Item Removed'),
        description: translateText('The item was removed from your cart.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: translateText('Error'),
        description: `${translateText('Failed to remove item')}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update quantity handler
  const handleUpdateQuantity = (id: number, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  };
  
  // Remove from cart handler
  const handleRemoveFromCart = (id: number) => {
    removeFromCartMutation.mutate(id);
  };
  
  // Shipping method change handler
  const handleShippingMethodChange = (method: ShippingRate | null, cost: number) => {
    setSelectedShippingMethod(method);
    setDynamicShippingCost(cost);
  };

  // Proceed to checkout handler
  const handleCheckout = () => {
    if (!selectedShippingMethod) {
      toast({
        title: translateText('Shipping Required'),
        description: translateText('Please select a shipping method before proceeding to checkout.'),
        variant: 'destructive',
      });
      return;
    }
    setLocation('/checkout-new');
  };
  
  // Continue shopping handler
  const handleContinueShopping = () => {
    setLocation('/');
  };
  
  // TODO: Get vendor-specific pricing config from product data
  // For now using default configuration, but this should be dynamic based on vendor/product
  const pricingConfig = {
    // Example: Different vendors could have different thresholds/rates
    // freeShippingThreshold: vendor?.freeShippingThreshold || 50,
    // shippingCost: vendor?.shippingCost || 5.99,
    // taxRate: vendor?.taxRate || 0.2
  };
  
  // Calculate pricing using centralized system with dynamic shipping cost
  const pricingConfigWithDynamicShipping = {
    ...pricingConfig,
    shippingCost: dynamicShippingCost
  };
  const pricing = calculatePricing(cartItems, pricingConfigWithDynamicShipping);
  const { subtotal, tax } = pricing;
  
  // Use dynamic shipping cost instead of calculated one
  const shippingCost = dynamicShippingCost;
  
  // Calculate 1.5% transaction commission on subtotal
  const transactionCommission = subtotal * 0.015;
  
  // Recalculate total with commission
  const total = subtotal + shippingCost + tax + transactionCommission;
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>{translateText('Shopping Cart')}</CardTitle>
            <CardDescription>{translateText('There was an error loading your cart')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 text-red-800 p-4 rounded-md">
              {(error as Error).message}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleContinueShopping}>{translateText('Continue Shopping')}</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="text-center border-none">

          <CardHeader>
            <div className="flex justify-center mb-4">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">{translateText('Your Cart is Empty')}</CardTitle>
            <CardDescription>{translateText("Looks like you haven't added any items to your cart yet.")}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={handleContinueShopping} className="bg-black hover:bg-gray-800">{translateText('Browse Products')}</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card className="border-none">
        <CardHeader>
          <CardTitle className="text-xl">{translateText('Shopping Cart')}</CardTitle>
          <CardDescription>{cartItems.length} {cartItems.length === 1 ? translateText('item') : translateText('items')} {translateText('in your cart')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translateText('Product')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translateText('Quantity')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translateText('Price')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translateText('Subtotal')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translateText('Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cartItems.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden mr-4">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <ShoppingCart className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {translateText(item.product?.name || 'Product')}
                          </div>
                          {item.product?.vendorId && (
                            <div className="text-xs text-gray-500">
                              {translateText('Sold by')}: {translateText('Vendor')} #{item.product.vendorId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          className="text-gray-500 hover:text-gray-700 focus:outline-none"
                          disabled={updateQuantityMutation.isPending}
                        >
                          <MinusCircle className="h-5 w-5" />
                        </button>
                        <span className="mx-2 w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          className="text-gray-500 hover:text-gray-700 focus:outline-none"
                          disabled={updateQuantityMutation.isPending}
                        >
                          <PlusCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatPriceFromGBP(item.product?.price || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatPriceFromGBP((item.product?.price || 0) * item.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none"
                        disabled={removeFromCartMutation.isPending}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="border-t">
                  <th colSpan={3} scope="row" className="px-6 py-3 text-right text-sm text-gray-700">
                    {translateText('Subtotal')}
                  </th>
                  <td className="px-6 py-3 text-right text-sm text-gray-900">
                    {formatPriceFromGBP(subtotal)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <th colSpan={3} scope="row" className="px-6 py-3 text-right text-sm text-gray-700">
                    {translateText('Shipping')}
                  </th>
                  <td className="px-6 py-3 text-right text-sm text-gray-900">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">{translateText('Free')}</span>
                    ) : (
                      formatPriceFromGBP(shippingCost)
                    )}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <th colSpan={3} scope="row" className="px-6 py-3 text-right text-sm text-gray-700">
                    {translateText('Tax (VAT)')}
                  </th>
                  <td className="px-6 py-3 text-right text-sm text-gray-900">
                    {formatPriceFromGBP(tax)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <th colSpan={3} scope="row" className="px-6 py-3 text-right text-sm text-gray-700">
                    {translateText('Dedw3n 1.5% Transaction Commission')}
                  </th>
                  <td className="px-6 py-3 text-right text-sm text-gray-900">
                    {formatPriceFromGBP(transactionCommission)}
                  </td>
                  <td></td>
                </tr>
                <tr className="border-t">
                  <th colSpan={3} scope="row" className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {translateText('Total')}
                  </th>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatPriceFromGBP(total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Free shipping notification */}
          {amountNeededForFreeShipping(subtotal, pricingConfig) > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {translateText('Add')} {formatPriceFromGBP(amountNeededForFreeShipping(subtotal, pricingConfig))} {translateText('more to qualify for free shipping!')}
              </p>
            </div>
          )}
        </CardContent>
        
        {/* Shipping Service Selection */}
        <div className="mt-6">
          <CartShippingSelector
            orderTotal={subtotal}
            onShippingMethodChange={handleShippingMethodChange}
            selectedMethod={selectedShippingMethod}
          />
        </div>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleContinueShopping}
            className="w-full sm:w-auto"
          >
            {translateText('Continue Shopping')}
          </Button>
          <div className="w-full sm:w-auto">
            {!selectedShippingMethod && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    {translateText('Please select a shipping method to continue')}
                  </p>
                </div>
              </div>
            )}
            <Button
              onClick={handleCheckout}
              className="w-full sm:w-auto"
              disabled={
                !selectedShippingMethod || 
                updateQuantityMutation.isPending || 
                removeFromCartMutation.isPending
              }
            >
              {updateQuantityMutation.isPending || removeFromCartMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translateText('Processing...')}
                </>
              ) : (
                translateText('Proceed to Checkout')
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}