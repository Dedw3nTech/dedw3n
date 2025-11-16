import { useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { calculatePricing } from '@/lib/pricing';
import { useToast } from '@/hooks/use-toast';
import { useCartTranslations } from '@/locales/cartStrings';
import type { CartItem } from '@/lib/types';

export function useCartData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatPriceFromGBP } = useCurrency();
  const ts = useCartTranslations();
  
  const { 
    data: cartItems = [], 
    isLoading, 
    error 
  } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User authentication required');
      }

      const authToken = localStorage.getItem('dedwen_auth_token');
      
      const response = await fetch('/api/cart', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'X-Use-Session': 'true',
          'X-Client-Auth': 'true',
          'X-Client-User-ID': user.id.toString(),
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch cart: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!user,
  });

  const { data: vendorDetails = {} } = useQuery({
    queryKey: ['/api/vendors/details'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vendors/details');
      return response.json();
    },
    enabled: !!cartItems.length,
  });

  const pricingConfig = {};
  const pricing = useMemo(() => {
    const transformedItems = cartItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product?.id || 0,
        name: item.product?.name || '',
        price: item.product?.price || 0,
        images: [],
        description: item.product?.description || '',
      }
    }));
    return calculatePricing(transformedItems, pricingConfig);
  }, [cartItems]);
  const { subtotal, tax, shippingCost: basePricing } = pricing;

  const transactionCommission = useMemo(() => {
    const calculatedCommission = subtotal * 0.015;
    return subtotal > 0 ? Math.max(calculatedCommission, 2) : 0;
  }, [subtotal]);

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return apiRequest('PUT', `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: ts.error,
        description: `${ts.failedUpdateQty}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: ts.itemRemoved,
        description: ts.itemRemovedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: ts.error,
        description: `${ts.failedRemove}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleUpdateQuantity = useCallback((id: number, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  }, [updateQuantityMutation]);

  const handleRemoveFromCart = useCallback((id: number) => {
    removeFromCartMutation.mutate(id);
  }, [removeFromCartMutation]);

  return {
    cartItems,
    isLoading,
    error,
    vendorDetails,
    subtotal,
    tax,
    basePricing,
    transactionCommission,
    formatPriceFromGBP,
    handleUpdateQuantity,
    handleRemoveFromCart,
    updateQuantityMutation,
    removeFromCartMutation,
  };
}
