import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { useCurrency, currencies, Currency } from "@/contexts/CurrencyContext";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

interface CurrencySelectorProps {
  className?: string;
}

export function CurrencySelector({ className = '' }: CurrencySelectorProps = {}) {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const translationTexts = [
    "Currency",
    "Traditional Currencies",
    "Cryptocurrencies",
    "Stablecoins"
  ];

  const { translations } = useMasterBatchTranslation(translationTexts, 'instant');
  
  const [
    currencyTitle,
    traditionalLabel,
    cryptoLabel,
    stablecoinLabel
  ] = translations;

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsOpen(false);
  };

  const traditionalCurrencies = currencies.filter(c => !['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'AVAX', 'LINK', 'MATIC', 'LTC', 'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'].includes(c.code));
  const cryptocurrencies = currencies.filter(c => ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'AVAX', 'LINK', 'MATIC', 'LTC'].includes(c.code));
  const stablecoins = currencies.filter(c => ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'].includes(c.code));

  const renderCurrencyGroup = (groupCurrencies: Currency[], groupName: string) => (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-gray-500 px-3 py-2">
        {groupName}
      </div>
      {groupCurrencies.map((currency: Currency) => (
        <SheetClose key={currency.code} asChild>
          <button
            onClick={() => handleCurrencyChange(currency)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {currency.symbol} {currency.code} <span className="text-gray-500 font-normal">{currency.name}</span>
              </span>
            </div>
            {selectedCurrency.code === currency.code && (
              <Check className="h-4 w-4 text-black" />
            )}
          </button>
        </SheetClose>
      ))}
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <span className={`text-xs font-medium cursor-pointer flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors ${className}`} style={{ fontSize: '12px' }} data-testid="button-currency-selector">
          <span className="font-medium"><span className={className ? '' : 'text-black'}>{selectedCurrency.symbol}</span> <span className={className ? '' : 'text-black'}>{selectedCurrency.code}</span></span>
        </span>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{currencyTitle}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col space-y-4">
          {renderCurrencyGroup(traditionalCurrencies, traditionalLabel)}
          <Separator />
          {renderCurrencyGroup(cryptocurrencies, cryptoLabel)}
          <Separator />
          {renderCurrencyGroup(stablecoins, stablecoinLabel)}
        </div>
      </SheetContent>
    </Sheet>
  );
}