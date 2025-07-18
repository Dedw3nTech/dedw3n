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
import { Loader2, Trash2, MinusCircle, PlusCircle, ShoppingCart, ShoppingBag, AlertTriangle, Shield, Check, MapPin, Weight, Package, Truck, Plane, Ship, FileText, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { calculatePricing, amountNeededForFreeShipping } from '@/lib/pricing';
import { useMasterTranslation } from '@/hooks/use-master-translation';
import { useWeightUnit } from '@/contexts/WeightUnitContext';


export default function Cart() {
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

  // Auto-calculate shipping costs - ensure cartItems is available
  const cartTotalWeight = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((total: number, item: any) => 
      total + ((item.product?.weight || 0) * item.quantity), 0
    );
  }, [cartItems]);
  
  // Determine predominant offering type from cart items
  const cartOfferingType = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return 'Product';
    
    // Get all offering types from cart items
    const offeringTypes = cartItems.map((item: any) => item.product?.offeringType || 'product');
    
    // Find the most common offering type
    const typeCounts = offeringTypes.reduce((acc: Record<string, number>, type: string) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Return the most common type, capitalized
    const predominantType = Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0]] > typeCounts[b[0]] ? a : b
    )[0];
    
    return predominantType.charAt(0).toUpperCase() + predominantType.slice(1);
  }, [cartItems]);

  // Get available shipping methods for destination and offering type
  const { data: availableShippingMethods } = useQuery({
    queryKey: ['/api/shipping/methods/available', {
      destinationCountry: user?.country || 'United Kingdom',
      offeringType: cartOfferingType
    }],
    enabled: !isLoading && cartItems && cartItems.length > 0
  });

  // Get shipping calculation automatically
  const { data: autoShippingCalculation } = useQuery({
    queryKey: ['/api/shipping/calculate', {
      shippingType: selectedShippingType,
      weight: cartTotalWeight,
      originCountry: 'DR Congo',
      destinationCountry: user?.country || 'United Kingdom',
      originCity: 'Kinshasa',
      destinationCity: user?.city || 'London',
      offeringType: cartOfferingType
    }],
    enabled: !isLoading && cartItems && cartItems.length > 0 && cartTotalWeight > 0
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
  

  
  // Calculate pricing using centralized system with auto-calculated shipping
  const pricing = calculatePricing(cartItems, pricingConfig);
  const { subtotal, tax } = pricing;
  
  // Use auto-calculated shipping cost if available, otherwise fallback to basic calculation
  const finalShippingCost = useMemo(() => {
    return autoShippingCalculation?.totalCost || pricing.shippingCost;
  }, [autoShippingCalculation, pricing.shippingCost]);
  
  // Calculate 1.5% transaction commission on subtotal with £2 minimum
  const calculatedCommission = subtotal * 0.015;
  const transactionCommission = subtotal > 0 ? Math.max(calculatedCommission, 2) : 0;
  
  // Recalculate total with commission using final shipping cost
  const total = subtotal + finalShippingCost + tax + transactionCommission;
  
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
                    <div 
                      className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleProductClick(item.product?.id)}
                    >
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
                          <h3 
                            className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleProductClick(item.product?.id)}
                          >
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
                      {finalShippingCost === 0 ? (
                        <span className="text-green-600">{translateText('Free')}</span>
                      ) : (
                        formatPriceFromGBP(finalShippingCost)
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
                        <div 
                          className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden mr-4 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleProductClick(item.product?.id)}
                        >
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
                          <div 
                            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleProductClick(item.product?.id)}
                          >
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
                    {finalShippingCost === 0 ? (
                      <span className="text-green-600">{translateText('Free')}</span>
                    ) : (
                      formatPriceFromGBP(finalShippingCost)
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
                          <div 
                            className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleProductClick(item.product?.id)}
                          >
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
                            <h4 
                              className="font-medium text-gray-900 text-sm truncate cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleProductClick(item.product?.id)}
                            >
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
                              {item.product?.vendorId === 1 
                                ? 'Kinshasa, DR Congo'
                                : vendor?.city && vendor?.country 
                                  ? `${vendor.city}, ${vendor.country}`
                                  : vendor?.location || translateText('Location not specified')
                              }
                            </span>
                          </div>
                          
                          {/* Location Buyer */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="text-gray-600">{translateText('Buyer Location')}:</span>
                                {!isEditingLocation && (
                                  <span className="font-medium text-gray-900">
                                    {user?.location || user?.city 
                                      ? `${user.city || ''}, ${user.country || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') || translateText('Set in profile')
                                      : translateText('Set in profile')
                                    }
                                  </span>
                                )}
                              </div>
                              {!isEditingLocation ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsEditingLocation(true);
                                    setEditCity(user?.city || '');
                                    setEditCountry(user?.country || '');
                                  }}
                                  className="text-xs h-6 px-2"
                                >
                                  {translateText('Change')}
                                </Button>
                              ) : (
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        // Update user location via API
                                        await apiRequest('PATCH', '/api/user/location', {
                                          city: editCity,
                                          country: editCountry
                                        });
                                        
                                        // Invalidate user query to refresh data
                                        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                                        
                                        // Invalidate shipping calculation query to auto-recalculate with new location
                                        queryClient.invalidateQueries({ queryKey: ['/api/shipping/calculate'] });
                                        
                                        toast({
                                          title: translateText('Success'),
                                          description: translateText('Location updated and shipping recalculated'),
                                        });
                                        
                                        setIsEditingLocation(false);
                                      } catch (error: any) {
                                        toast({
                                          title: translateText('Error'),
                                          description: translateText('Failed to update location'),
                                          variant: 'destructive',
                                        });
                                      }
                                    }}
                                    className="text-xs h-6 px-2"
                                  >
                                    {translateText('Save')}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditingLocation(false)}
                                    className="text-xs h-6 px-2"
                                  >
                                    {translateText('Cancel')}
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {isEditingLocation && (
                              <div className="flex gap-2 ml-6">
                                <Input
                                  placeholder={translateText('City')}
                                  value={editCity}
                                  onChange={(e) => setEditCity(e.target.value)}
                                  className="text-xs h-7"
                                />
                                <Input
                                  placeholder={translateText('Country')}
                                  value={editCountry}
                                  onChange={(e) => setEditCountry(e.target.value)}
                                  className="text-xs h-7"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Weight Product */}
                          <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            <span className="text-gray-600">{translateText('Total Weight')}:</span>
                            <span className="font-medium text-gray-900">
                              {totalWeight > 0 
                                ? formatWeight(totalWeight)
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
                
                {/* Shipping Method Selection */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translateText('Select Shipping Method')}
                  </label>
                  <Select value={selectedShippingType} onValueChange={setSelectedShippingType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={translateText('Choose shipping method')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableShippingMethods?.shippingMethods.map((method: any) => (
                        <SelectItem 
                          key={method.value} 
                          value={method.value}
                          disabled={!method.available}
                          className={!method.available ? 'opacity-50 cursor-not-allowed text-gray-400' : ''}
                        >
                          <div className={`flex items-center gap-2 ${!method.available ? 'opacity-50' : ''}`}>
                            {method.icon === 'Truck' && <Truck className="h-4 w-4" />}
                            {method.icon === 'Plane' && <Plane className="h-4 w-4" />}
                            {method.icon === 'Ship' && <Ship className="h-4 w-4" />}
                            {method.icon === 'FileText' && <FileText className="h-4 w-4" />}
                            <span>
                              {translateText(method.label)} 
                              {!method.available && (
                                <span className="text-red-500 ml-1">- {translateText('Not Available')}</span>
                              )}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Shipping Method Info */}
                  {availableShippingMethods && (
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>{translateText('Destination')}:</span>
                        <span className="font-medium">{availableShippingMethods.destinationCountry}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{translateText('Offering Type')}:</span>
                        <span className="font-medium capitalize">{availableShippingMethods.offeringType}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{translateText('Calculated Shipping')}:</span>
                    <span className="font-medium">
                      {finalShippingCost === 0 ? (
                        <span className="text-green-600">{translateText('Free')}</span>
                      ) : (
                        <span className="text-blue-600">{formatPriceFromGBP(finalShippingCost)}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">{translateText('Total Weight')}:</span>
                    <span className="font-medium">
                      {formatWeight(cartItems.reduce((total: number, item: any) => 
                        total + ((item.product?.weight || 0) * item.quantity), 0
                      ))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">{translateText('Shipping Method')}:</span>
                    <span className="font-medium text-blue-600">
                      {selectedShippingType === 'normal-freight' && translateText('Normal Freight')}
                      {selectedShippingType === 'air-freight' && translateText('Air Freight')}
                      {selectedShippingType === 'sea-freight' && translateText('Sea Freight')}
                      {selectedShippingType === 'express-freight' && translateText('Express Freight')}
                    </span>
                  </div>
                  
                  {/* Auto-calculated shipping details */}
                  {autoShippingCalculation && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>{translateText('Carrier')}:</span>
                          <span className="font-medium">{autoShippingCalculation.carrier}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{translateText('Estimated Delivery')}:</span>
                          <span className="font-medium">{autoShippingCalculation.estimatedDays}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{translateText('Route')}:</span>
                          <span className="font-medium text-xs">{autoShippingCalculation.origin} → {autoShippingCalculation.destination}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Auto-calculated shipping notification */}
          {autoShippingCalculation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Calculator className="h-4 w-4" />
                <span className="font-medium">{translateText('Shipping automatically calculated based on cart contents and destination')}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {translateText('Carrier')}: {autoShippingCalculation.carrier} • {translateText('Estimated')}: {autoShippingCalculation.estimatedDays}
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