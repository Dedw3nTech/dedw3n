import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { useCurrency, currencies, Currency } from "@/contexts/CurrencyContext";

export function CurrencySelector() {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <span className="text-xs font-medium cursor-pointer flex items-center gap-1" style={{ fontSize: '12px' }}>
          <span className="font-medium">{selectedCurrency.symbol} {selectedCurrency.code}</span>
          <ChevronDown className="h-3 w-3" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-64 overflow-y-auto">
        {currencies.map((currency: Currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{currency.flag}</span>
              <div>
                <div className="font-medium">{currency.symbol} {currency.code}</div>
                <div className="text-xs text-muted-foreground">{currency.name}</div>
              </div>
            </div>
            {selectedCurrency.code === currency.code && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}