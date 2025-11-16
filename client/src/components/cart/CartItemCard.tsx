import { memo } from 'react';
import { MinusCircle, PlusCircle, Trash2, Package } from './icons';
import { useCartTranslations } from '@/locales/cartStrings';

interface CartItemCardProps {
  item: {
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: number;
      imageUrl?: string;
      variant?: string;
    };
  };
  formatPrice: (price: number) => string;
  onUpdateQuantity: (id: number, currentQuantity: number, change: number) => void;
  onRemove: (id: number) => void;
  isUpdating?: boolean;
}

export const CartItemCard = memo(function CartItemCard({
  item,
  formatPrice,
  onUpdateQuantity,
  onRemove,
  isUpdating
}: CartItemCardProps) {
  const ts = useCartTranslations();

  return (
    <div className="flex gap-4 pb-4 border-b last:border-b-0">
      <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
        {item.product?.imageUrl ? (
          <img 
            src={item.product.imageUrl} 
            alt={item.product.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 mb-1">{item.product?.name}</h3>
        <p className="text-xs text-gray-500 mb-1">{ts.style} #{item.product?.id}</p>
        <p className="text-xs text-gray-500 mb-2">
          {ts.variation}: {item.product?.variant || ts.standard}
        </p>
        
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity, -1)}
            disabled={isUpdating || item.quantity <= 1}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            data-testid={`button-decrease-${item.id}`}
          >
            <MinusCircle className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity, 1)}
            disabled={isUpdating}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            data-testid={`button-increase-${item.id}`}
          >
            <PlusCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            disabled={isUpdating}
            className="ml-auto text-red-500 hover:text-red-700 disabled:opacity-50"
            data-testid={`button-remove-${item.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-sm font-semibold">{formatPrice(item.product?.price || 0)}</p>
      </div>
    </div>
  );
});
