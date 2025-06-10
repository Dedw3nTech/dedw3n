import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

export function useCart() {
  const { user } = useAuth();
  
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

  // Calculate total number of items in cart
  const cartItemCount = cartItems.reduce((total: number, item: any) => {
    return total + (item.quantity || 0);
  }, 0);

  return {
    cartItems,
    cartItemCount,
    isLoading,
    error
  };
}