import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export function useCart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  // Add to cart mutation with proper authentication
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: number; quantity?: number }) => {
      const response = await apiRequest('POST', '/api/cart', {
        productId,
        quantity
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add to cart: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Calculate total number of items in cart
  const cartItemCount = cartItems.reduce((total: number, item: any) => {
    return total + (item.quantity || 0);
  }, 0);

  // Helper function for easy cart addition
  const addToCart = async (productId: number, quantity: number = 1) => {
    return addToCartMutation.mutateAsync({ productId, quantity });
  };

  return {
    cartItems,
    cartItemCount,
    isLoading,
    error,
    addToCart,
    addToCartMutation
  };
}