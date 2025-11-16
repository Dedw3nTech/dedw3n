import { memo } from 'react';
import { useCartTranslations } from '@/locales/cartStrings';

interface PricingSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  formatPrice: (price: number) => string;
}

export const PricingSummary = memo(function PricingSummary({
  subtotal,
  shipping,
  tax,
  total,
  formatPrice
}: PricingSummaryProps) {
  const ts = useCartTranslations();

  return (
    <div className="px-6 py-4 border-t space-y-2">
      <div className="flex justify-between text-sm">
        <span>{ts.subtotal}</span>
        <span className="font-medium">{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>{ts.shipping}</span>
        <span className="font-medium">
          {shipping === 0 ? ts.freeShipping : formatPrice(shipping)}
        </span>
      </div>
      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
        <span>{ts.total}</span>
        <span>{formatPrice(total)}</span>
      </div>
      <div className="text-xs text-gray-600">
        {ts.vatIncluded}: {formatPrice(tax)}
      </div>
    </div>
  );
});
