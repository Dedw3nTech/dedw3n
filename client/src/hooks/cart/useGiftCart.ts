import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useCartTranslations } from '@/locales/cartStrings';
import type { CartItem } from '@/lib/types';

export function useGiftCart() {
  const { toast } = useToast();
  const ts = useCartTranslations();
  
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');

  const { data: platformUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/platform-users'],
    enabled: giftDialogOpen,
  });

  const filteredUsers = useMemo(() => {
    if (!platformUsers) return [] as any[];
    
    const usersArray = Array.isArray(platformUsers) 
      ? platformUsers 
      : (platformUsers as any).users || [];
    
    if (!recipientSearch) return usersArray as any[];
    
    return usersArray.filter((user: any) => 
      user.name?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      user.username?.toLowerCase().includes(recipientSearch.toLowerCase())
    );
  }, [platformUsers, recipientSearch]);

  const sendGiftMutation = useMutation({
    mutationFn: async (giftData: any) => {
      return apiRequest('POST', '/api/gifts/send', giftData);
    },
    onSuccess: () => {
      toast({
        title: ts.giftSentSuccess,
        description: ts.giftSentDesc,
      });
      setGiftDialogOpen(false);
      setSelectedRecipient(null);
      setGiftMessage('');
      setRecipientSearch('');
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: ts.giftSendFailed,
        description: error.message || ts.failedSendGift,
        variant: 'destructive',
      });
    },
  });

  const handleSendGift = useCallback((
    cartItems: CartItem[],
    total: number,
    finalShippingCost: number,
    selectedShippingType: string
  ) => {
    if (!selectedRecipient) {
      toast({
        title: ts.noRecipient,
        description: ts.selectRecipientMsg,
        variant: 'destructive',
      });
      return;
    }
    
    const giftData = {
      recipientId: selectedRecipient.id,
      cartItems,
      message: giftMessage,
      total,
      shippingCost: finalShippingCost,
      shippingType: selectedShippingType
    };
    
    sendGiftMutation.mutate(giftData);
  }, [selectedRecipient, giftMessage, sendGiftMutation, toast, ts]);

  return {
    giftDialogOpen,
    setGiftDialogOpen,
    selectedRecipient,
    setSelectedRecipient,
    giftMessage,
    setGiftMessage,
    recipientSearch,
    setRecipientSearch,
    filteredUsers,
    usersLoading,
    sendGiftMutation,
    handleSendGift,
  };
}
