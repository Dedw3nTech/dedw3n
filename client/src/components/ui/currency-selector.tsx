import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
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
      <DropdownMenuContent align="end" className="w-48">
        {currencies.map((currency: Currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="flex-1">
              <div className="font-medium">{currency.symbol} {currency.code}</div>
              <div className="text-xs text-muted-foreground">{currency.name}</div>
            </div>
            {selectedCurrency.code === currency.code && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}