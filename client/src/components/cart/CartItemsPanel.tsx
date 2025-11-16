import { memo } from 'react';
import { CartItemCard } from './CartItemCard';
import { CreditCard, Package } from './icons';
import { useCartTranslations } from '@/locales/cartStrings';

interface CartItemsPanelProps {
  items: any[];
  formatPrice: (price: number) => string;
  onUpdateQuantity: (id: number, currentQuantity: number, change: number) => void;
  onRemove: (id: number) => void;
  isUpdating?: boolean;
}

export const CartItemsPanel = memo(function CartItemsPanel({
  items,
  formatPrice,
  onUpdateQuantity,
  onRemove,
  isUpdating
}: CartItemsPanelProps) {
  const ts = useCartTranslations();

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-2">{ts.cartEmpty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item: any) => (
        <CartItemCard
          key={item.id}
          item={item}
          formatPrice={formatPrice}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
          isUpdating={isUpdating}
        />
      ))}
    </div>
  );
});
