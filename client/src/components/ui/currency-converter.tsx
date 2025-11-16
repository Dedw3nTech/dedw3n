import { useState, useEffect } from "react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, CircleDollarSign } from "lucide-react";
import { 
  supportedCurrencies, 
  convertCurrency, 
  formatCurrency, 
  fetchExchangeRates, 
  currencySymbols,
  getFormattedExchangeRate,
  CurrencyCode 
} from "@/lib/currencyConverter";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { useCurrency } from "@/hooks/use-currency";

export default function CurrencyConverter() {
  const { translateText } = useMasterTranslation();
  const { currency: defaultCurrency } = useCurrency();
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>("USD");
  const [result, setResult] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [exchangeRates, setExchangeRates] = useState<Record<CurrencyCode, number> | null>(null);

  // Initialize exchange rates when component mounts
  useEffect(() => {
    const initRates = async () => {
      try {
        const rates = await fetchExchangeRates(fromCurrency);
        setExchangeRates(rates);
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
      }
    };
    
    initRates();
  }, [fromCurrency]);

  // Update from currency when default currency changes
  useEffect(() => {
    setFromCurrency(defaultCurrency);
  }, [defaultCurrency]);

  // Convert currencies
  const handleConvert = () => {
    if (!amount || amount <= 0) return;
    
    setIsConverting(true);
    try {
      const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
      setResult(convertedAmount);
    } catch (error) {
      console.error("Error converting currency:", error);
    } finally {
      setIsConverting(false);
    }
  };

  // Swap currencies
  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setResult(null); // Reset result when swapping
  };

  // Format input to prevent non-numeric values
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setAmount(val === "" ? 0 : parseFloat(val));
      setResult(null); // Reset result when amount changes
    }
  };

  // Auto-convert when currencies change
  useEffect(() => {
    if (amount > 0) {
      handleConvert();
    }
  }, [fromCurrency, toCurrency, amount]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600 hover:text-primary flex items-center">
          <span className="text-lg mr-1">💱</span>
          <span className="text-xs font-medium">
            {fromCurrency} → {toCurrency}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <h3 className="font-medium text-sm">{translateText('Converter')}</h3>
          
          <div className="grid grid-cols-6 gap-2 items-center">
            <div className="col-span-2">
              <Input
                type="text"
                value={amount === 0 ? "" : amount.toString()}
                onChange={handleAmountChange}
                className="w-full"
                placeholder="Amount"
              />
            </div>
            
            <div className="col-span-2">
              <Select
                value={fromCurrency}
                onValueChange={(value: CurrencyCode) => {
                  setFromCurrency(value);
                  setResult(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currencySymbols[currency]} {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-1 flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwap}
                className="h-8 w-8"
              >
                <span className="text-md">⇅</span>
              </Button>
            </div>
            
            <div className="col-span-1">
              <Select
                value={toCurrency}
                onValueChange={(value: CurrencyCode) => {
                  setToCurrency(value);
                  setResult(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currencySymbols[currency]} {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isConverting ? (
            <div className="text-center py-2">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : result !== null ? (
            <div className="text-center py-2 space-y-1">
              <div className="text-sm font-medium">
                {`${currencySymbols[fromCurrency]}${amount.toFixed(2)} ${fromCurrency}`} =
              </div>
              <div className="text-lg font-bold text-primary">
                {`${currencySymbols[toCurrency]}${result.toFixed(2)} ${toCurrency}`}
              </div>
              <div className="text-xs text-gray-500">
                {getFormattedExchangeRate(fromCurrency, toCurrency)}
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}