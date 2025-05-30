import { useState, useEffect } from 'react';
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
import { Loader2, Trash2, MinusCircle, PlusCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { formatPrice } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function Cart() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Show authentication message if not logged in
  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <Card>
          <CardHeader>
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Shopping Cart</CardTitle>
            <CardDescription>
              Please log in to view your shopping cart
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              You need to be signed in to manage your cart and make purchases.
            </p>
            <Button onClick={() => setLocation('/')}>
              Go to Home
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
        title: 'Error',
        description: `Failed to update quantity: ${error.message}`,
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
        title: 'Item Removed',
        description: 'The item was removed from your cart.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to remove item: ${error.message}`,
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
  
  // Proceed to checkout handler
  const handleCheckout = () => {
    setLocation('/checkout');
  };
  
  // Continue shopping handler
  const handleContinueShopping = () => {
    setLocation('/');
  };
  
  // Calculate total price
  const totalPrice = cartItems.reduce((total: number, item: any) => {
    return total + (item.product?.price || 0) * item.quantity;
  }, 0);
  
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
        <Card>
          <CardHeader>
            <CardTitle>Shopping Cart</CardTitle>
            <CardDescription>There was an error loading your cart</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 text-red-800 p-4 rounded-md">
              {(error as Error).message}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleContinueShopping}>Continue Shopping</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Your Cart is Empty</CardTitle>
            <CardDescription>Looks like you haven't added any items to your cart yet.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-8">
            <div className="flex justify-center mb-6">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Browse our products and add items to your cart to see them here.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleContinueShopping}>Browse Products</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Shopping Cart</CardTitle>
          <CardDescription>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                            {item.product?.name || 'Product'}
                          </div>
                          {item.product?.vendorId && (
                            <div className="text-xs text-gray-500">
                              Sold by: Vendor #{item.product.vendorId}
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
                      {formatPrice(item.product?.price || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatPrice((item.product?.price || 0) * item.quantity)}
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
                <tr>
                  <th colSpan={3} scope="row" className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Total
                  </th>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatPrice(totalPrice)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleContinueShopping}
            className="w-full sm:w-auto"
          >
            Continue Shopping
          </Button>
          <Button
            onClick={handleCheckout}
            className="w-full sm:w-auto"
            disabled={updateQuantityMutation.isPending || removeFromCartMutation.isPending}
          >
            {updateQuantityMutation.isPending || removeFromCartMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed to Checkout'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}