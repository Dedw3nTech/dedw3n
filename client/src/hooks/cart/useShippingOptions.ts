import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import type { CartItem } from '@/lib/types';

export function useShippingOptions(cartItems: CartItem[], selectedShippingType: string) {
  const { user } = useAuth();

  const cartTotalWeight = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((total: number, item: CartItem) => 
      total + ((item.product?.weight || 0) * item.quantity), 0
    );
  }, [cartItems]);

  const cartOfferingType = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return 'Product';
    
    const offeringTypes = cartItems.map((item: CartItem) => 
      item.product?.offeringType || 'product'
    );
    
    const typeCounts = offeringTypes.reduce((acc: Record<string, number>, type: string) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const predominantType = Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0]] > typeCounts[b[0]] ? a : b
    )[0];
    
    return predominantType.charAt(0).toUpperCase() + predominantType.slice(1);
  }, [cartItems]);

  const { data: availableShippingMethods } = useQuery({
    queryKey: ['/api/shipping/methods/available', {
      destinationCountry: user?.country || 'United Kingdom',
      offeringType: cartOfferingType
    }],
    enabled: cartItems && cartItems.length > 0
  });

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
    enabled: cartItems && cartItems.length > 0 && cartTotalWeight > 0
  });

  const finalShippingCost = useMemo(() => {
    return (autoShippingCalculation as any)?.totalCost || 0;
  }, [autoShippingCalculation]);

  return {
    cartTotalWeight,
    cartOfferingType,
    availableShippingMethods,
    autoShippingCalculation,
    finalShippingCost,
  };
}
