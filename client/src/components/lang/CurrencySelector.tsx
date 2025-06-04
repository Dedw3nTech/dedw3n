import React from 'react';
import { Check, ChevronDown, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrency } from '@/hooks/use-currency';
import { supportedCurrencies, currencySymbols, CurrencyCode } from '@/lib/currencyConverter';

export function CurrencySelector() {
  const { currency, setCurrency, symbol } = useCurrency();

  // Get full currency name from code
  const getCurrencyName = (code: CurrencyCode): string => {
    const names: Record<CurrencyCode, string> = {
      GBP: 'British Pound',
      EUR: 'Euro',
      USD: 'US Dollar',
      CNY: 'Chinese Yuan',
      INR: 'Indian Rupee',
      BRL: 'Brazilian Real',
    };
    return names[code];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="text-xs font-medium cursor-pointer" style={{ fontSize: '12px' }}>
          {symbol} {currency}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {supportedCurrencies.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setCurrency(code)}
            className="flex items-center justify-between"
          >
            <span>
              <span className="mr-2">{currencySymbols[code]}</span>
              {getCurrencyName(code)}
            </span>
            {currency === code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CurrencySelector;