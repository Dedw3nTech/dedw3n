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
import { Loader2, Trash2, MinusCircle, PlusCircle, ShoppingCart, ShoppingBag, AlertTriangle, Shield, Check, MapPin, Weight, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { calculatePricing, amountNeededForFreeShipping } from '@/lib/pricing';
import { useMasterTranslation } from '@/hooks/use-master-translation';


export default function Cart() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatPriceFromGBP } = useCurrency();
  const { translateText } = useMasterTranslation();
  
  // Escrow state management
  const [useEscrow, setUseEscrow] = useState(false);
  const [escrowTransaction, setEscrowTransaction] = useState<any>(null);
  const [escrowLoading, setEscrowLoading] = useState(false);
  
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

  // Fetch vendor details for shipping info
  const { data: vendorDetails = {} } = useQuery({
    queryKey: ['/api/vendors/details'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vendors/details');
      return response.json();
    },
    enabled: !!cartItems.length,
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
  


  // Escrow transaction handler
  const handleEscrowTransaction = async () => {
    if (escrowLoading) return;
    
    setEscrowLoading(true);
    try {
      const escrowData = {
        amount: total,
        currency: 'GBP',
        description: `Marketplace purchase - ${cartItems.length} item(s)`,
        buyerEmail: user?.email,
        items: cartItems.map((item: any) => ({
          name: item.product?.name || 'Product',
          price: item.product?.price || 0,
          quantity: item.quantity
        }))
      };

      const response = await apiRequest('/api/escrow/create-transaction', 'POST', escrowData);

      setEscrowTransaction(response);
      toast({
        title: translateText('Escrow Transaction Created'),
        description: translateText('Your secure payment has been initialized'),
      });
    } catch (error: any) {
      toast({
        title: translateText('Error'),
        description: error.message || translateText('Failed to create escrow transaction'),
        variant: 'destructive',
      });
    } finally {
      setEscrowLoading(false);
    }
  };

  // Proceed to checkout handler
  const handleCheckout = () => {
    // If escrow is selected but no transaction created yet, create it first
    if (useEscrow && !escrowTransaction) {
      handleEscrowTransaction();
    }
    // Always proceed to checkout regardless of escrow status
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
  

  
  // Calculate pricing using centralized system
  const pricing = calculatePricing(cartItems, pricingConfig);
  const { subtotal, shippingCost, tax } = pricing;
  
  // Calculate 1.5% transaction commission on subtotal with £2 minimum
  const calculatedCommission = subtotal * 0.015;
  const transactionCommission = subtotal > 0 ? Math.max(calculatedCommission, 2) : 0;
  
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
    <div className="container max-w-4xl mx-auto py-6 px-3 sm:py-12 sm:px-4">
      <Card className="border-none">
        <CardHeader>
          <CardTitle className="text-xl">{translateText('Shopping Cart')}</CardTitle>
          <CardDescription>{cartItems.length} {cartItems.length === 1 ? translateText('item') : translateText('items')} {translateText('in your cart')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {cartItems.map((item: any) => (
              <Card key={item.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          <ShoppingCart className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 pr-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {translateText(item.product?.name || 'Product')}
                          </h3>
                          {item.product?.vendorId && (
                            <p className="text-xs text-gray-500 mt-1">
                              {translateText('Sold by')}: {translateText('Vendor')} #{item.product.vendorId}
                            </p>
                          )}
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          disabled={removeFromCartMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Price and Quantity Row */}
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-gray-600">{translateText('Price')}: </span>
                          <span className="font-medium text-gray-900">
                            {formatPriceFromGBP(item.product?.price || 0)}
                          </span>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            disabled={updateQuantityMutation.isPending}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            disabled={updateQuantityMutation.isPending}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Subtotal */}
                      <div className="mt-2 text-right">
                        <span className="text-xs text-gray-600">{translateText('Subtotal')}: </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatPriceFromGBP((item.product?.price || 0) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Mobile Order Summary */}
            <Card className="border border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{translateText('Order Summary')}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{translateText('Subtotal')}</span>
                    <span className="font-medium">{formatPriceFromGBP(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{translateText('Shipping')}</span>
                    <span className="font-medium">
                      {shippingCost === 0 ? (
                        <span className="text-green-600">{translateText('Free')}</span>
                      ) : (
                        formatPriceFromGBP(shippingCost)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{translateText('Tax (VAT)')}</span>
                    <span className="font-medium">{formatPriceFromGBP(tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{translateText('Dedw3n 1.5%')} (min £2)</span>
                    <span className="font-medium">{formatPriceFromGBP(transactionCommission)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-base font-semibold">
                      <span>{translateText('Total')}</span>
                      <span>{formatPriceFromGBP(total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block border rounded-md overflow-hidden">
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
                    {translateText('Dedw3n 1.5% Transaction Commission')} (min £2)
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
          
          {/* Shipping Information Card */}
          {cartItems.length > 0 && (
            <Card className="mt-6 border border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  {translateText('Shipping Information')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  {cartItems.map((item: any) => {
                    const vendor = vendorDetails[item.product?.vendorId];
                    const totalWeight = (item.product?.weight || 0) * item.quantity;
                    const totalPrice = (item.product?.price || 0) * item.quantity;
                    
                    return (
                      <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.product?.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {translateText(item.product?.name || 'Product')}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {translateText('Quantity')}: {item.quantity}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {/* Location Seller */}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-gray-600">{translateText('Seller Location')}:</span>
                            <span className="font-medium text-gray-900">
                              {vendor?.city && vendor?.country 
                                ? `${vendor.city}, ${vendor.country}`
                                : vendor?.location || translateText('Location not specified')
                              }
                            </span>
                          </div>
                          
                          {/* Location Buyer */}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-gray-600">{translateText('Buyer Location')}:</span>
                            <span className="font-medium text-gray-900">
                              {user?.location || user?.city 
                                ? `${user.city || ''}, ${user.country || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') || translateText('Set in profile')
                                : translateText('Set in profile')
                              }
                            </span>
                          </div>
                          
                          {/* Weight Product */}
                          <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            <span className="text-gray-600">{translateText('Total Weight')}:</span>
                            <span className="font-medium text-gray-900">
                              {totalWeight > 0 
                                ? `${totalWeight} ${item.product?.weightUnit || 'kg'}`
                                : translateText('Weight not specified')
                              }
                            </span>
                          </div>
                          
                          {/* Price */}
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <span className="text-gray-600">{translateText('Item Total')}:</span>
                            <span className="font-semibold text-gray-900">
                              {formatPriceFromGBP(totalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Shipping Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{translateText('Estimated Shipping')}:</span>
                    <span className="font-medium">
                      {shippingCost === 0 ? (
                        <span className="text-green-600">{translateText('Free')}</span>
                      ) : (
                        formatPriceFromGBP(shippingCost)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">{translateText('Total Weight')}:</span>
                    <span className="font-medium">
                      {cartItems.reduce((total: number, item: any) => 
                        total + ((item.product?.weight || 0) * item.quantity), 0
                      ).toFixed(2)} kg
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Free shipping notification */}
          {amountNeededForFreeShipping(subtotal, pricingConfig) > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {translateText('Add')} {formatPriceFromGBP(amountNeededForFreeShipping(subtotal, pricingConfig))} {translateText('more to qualify for free shipping!')}
              </p>
            </div>
          )}
        </CardContent>

        {/* Disclaimer text above checkout button */}
        <div className="px-6 pb-2">
          <p className="text-gray-600" style={{ fontSize: '10px' }}>
            {translateText('We would like to inform you that, although we are unable to provide direct advice, we will ensure you have all the necessary information to make informed decisions on your own.')}
          </p>
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
            <Button
              onClick={handleCheckout}
              className="w-full sm:w-auto"
              disabled={
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