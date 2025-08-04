import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, Search, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/hooks/use-currency';
import { supportedCurrencies, currencySymbols, CurrencyCode } from '@/lib/currencyConverter';

export function CurrencySelector() {
  const { currency, setCurrency, symbol } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Get full currency name from code
  const getCurrencyName = (code: CurrencyCode): string => {
    const names: Record<CurrencyCode, string> = {
      // Major Global Currencies
      GBP: 'British Pound',
      EUR: 'Euro',
      USD: 'US Dollar',
      CNY: 'Chinese Yuan',
      INR: 'Indian Rupee',
      BRL: 'Brazilian Real',
      JMD: 'Jamaican Dollar',
      AUD: 'Australian Dollar',
      
      // East Asia & Pacific
      JPY: 'Japanese Yen',
      KRW: 'South Korean Won',
      SGD: 'Singapore Dollar',
      HKD: 'Hong Kong Dollar',
      TWD: 'Taiwan Dollar',
      THB: 'Thai Baht',
      MYR: 'Malaysian Ringgit',
      IDR: 'Indonesian Rupiah',
      VND: 'Vietnamese Dong',
      PHP: 'Philippine Peso',
      NZD: 'New Zealand Dollar',
      FJD: 'Fijian Dollar',
      
      // Europe
      CHF: 'Swiss Franc',
      SEK: 'Swedish Krona',
      NOK: 'Norwegian Krone',
      DKK: 'Danish Krone',
      PLN: 'Polish Zloty',
      CZK: 'Czech Koruna',
      HUF: 'Hungarian Forint',
      RON: 'Romanian Leu',
      BGN: 'Bulgarian Lev',
      HRK: 'Croatian Kuna',
      RUB: 'Russian Ruble',
      TRY: 'Turkish Lira',
      ISK: 'Icelandic Krona',
      ALL: 'Albanian Lek',
      
      // Americas
      CAD: 'Canadian Dollar',
      MXN: 'Mexican Peso',
      PEN: 'Peruvian Sol',
      CLP: 'Chilean Peso',
      UYU: 'Uruguayan Peso',
      PYG: 'Paraguayan Guarani',
      VES: 'Venezuelan Bolívar',
      ARS: 'Argentine Peso',
      BOB: 'Bolivian Boliviano',
      CRC: 'Costa Rican Colón',
      COP: 'Colombian Peso',
      HTG: 'Haitian Gourde',
      DOP: 'Dominican Peso',
      SRD: 'Suriname Dollar',
      
      // Africa
      RWF: 'Rwandan Franc',
      XOF: 'West African CFA Franc',
      SLL: 'Sierra Leonean Leone',
      UGX: 'Ugandan Shilling',
      ZMW: 'Zambian Kwacha',
      GHS: 'Ghanaian Cedi',
      XAF: 'Central African CFA Franc',
      GNF: 'Guinean Franc',
      KES: 'Kenyan Shilling',
      TZS: 'Tanzanian Shilling',
      MWK: 'Malawian Kwacha',
      MGA: 'Malagasy Ariary',
      CDF: 'Congolese Franc',
      LRD: 'Liberian Dollar',
      NGN: 'Nigerian Naira',
      ZAR: 'South African Rand',
      EGP: 'Egyptian Pound',
      DZD: 'Algerian Dinar',
      MAD: 'Moroccan Dirham',
      AOA: 'Angolan Kwanza',
      
      // Middle East & South Asia
      AED: 'UAE Dirham',
      SAR: 'Saudi Riyal',
      ILS: 'Israeli Shekel',
      QAR: 'Qatari Riyal',
      KWD: 'Kuwaiti Dinar',
      BHD: 'Bahraini Dinar',
      OMR: 'Omani Rial',
      JOD: 'Jordanian Dinar',
      LBP: 'Lebanese Pound',
      IRR: 'Iranian Rial',
      AFN: 'Afghan Afghani',
      PKR: 'Pakistani Rupee',
      BDT: 'Bangladeshi Taka',
      MVR: 'Maldivian Rufiyaa',
      LKR: 'Sri Lankan Rupee',
      NPR: 'Nepalese Rupee',
    };
    return names[code];
  };

  // Get currency flag emoji
  const getCurrencyFlag = (code: CurrencyCode): string => {
    const flags: Record<CurrencyCode, string> = {
      // Major Global Currencies
      GBP: '🇬🇧', EUR: '🇪🇺', USD: '🇺🇸', CNY: '🇨🇳', INR: '🇮🇳', BRL: '🇧🇷', JMD: '🇯🇲', AUD: '🇦🇺',
      // East Asia & Pacific
      JPY: '🇯🇵', KRW: '🇰🇷', SGD: '🇸🇬', HKD: '🇭🇰', TWD: '🇹🇼', THB: '🇹🇭', MYR: '🇲🇾', IDR: '🇮🇩', 
      VND: '🇻🇳', PHP: '🇵🇭', NZD: '🇳🇿', FJD: '🇫🇯',
      // Europe
      CHF: '🇨🇭', SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺', RON: '🇷🇴', 
      BGN: '🇧🇬', HRK: '🇭🇷', RUB: '🇷🇺', TRY: '🇹🇷', ISK: '🇮🇸', ALL: '🇦🇱',
      // Americas
      CAD: '🇨🇦', MXN: '🇲🇽', PEN: '🇵🇪', CLP: '🇨🇱', UYU: '🇺🇾', PYG: '🇵🇾', VES: '🇻🇪', ARS: '🇦🇷', 
      BOB: '🇧🇴', CRC: '🇨🇷', COP: '🇨🇴', HTG: '🇭🇹', DOP: '🇩🇴', SRD: '🇸🇷',
      // Africa
      RWF: '🇷🇼', XOF: '🌍', SLL: '🇸🇱', UGX: '🇺🇬', ZMW: '🇿🇲', GHS: '🇬🇭', XAF: '🌍', GNF: '🇬🇳', 
      KES: '🇰🇪', TZS: '🇹🇿', MWK: '🇲🇼', MGA: '🇲🇬', CDF: '🇨🇩', LRD: '🇱🇷', NGN: '🇳🇬', ZAR: '🇿🇦', 
      EGP: '🇪🇬', DZD: '🇩🇿', MAD: '🇲🇦', AOA: '🇦🇴',
      // Middle East & South Asia
      AED: '🇦🇪', SAR: '🇸🇦', ILS: '🇮🇱', QAR: '🇶🇦', KWD: '🇰🇼', BHD: '🇧🇭', OMR: '🇴🇲', JOD: '🇯🇴', 
      LBP: '🇱🇧', IRR: '🇮🇷', AFN: '🇦🇫', PKR: '🇵🇰', BDT: '🇧🇩', MVR: '🇲🇻', LKR: '🇱🇰', NPR: '🇳🇵',
    };
    return flags[code] || '🌍';
  };

  // Define popular currencies for quick access
  const popularCurrencies: CurrencyCode[] = ['GBP', 'EUR', 'USD', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF'];

  // Regional grouping
  const regionGroups = {
    'Popular': popularCurrencies,
    'Europe': ['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'ISK', 'ALL'] as CurrencyCode[],
    'Asia Pacific': ['KRW', 'SGD', 'HKD', 'TWD', 'THB', 'MYR', 'IDR', 'VND', 'PHP', 'NZD', 'FJD'] as CurrencyCode[],
    'Americas': ['BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'PYG', 'VES', 'BOB', 'CRC', 'HTG', 'DOP', 'SRD'] as CurrencyCode[],
    'Africa': ['ZAR', 'NGN', 'EGP', 'MAD', 'DZD', 'AOA', 'GHS', 'KES', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK', 'XOF', 'XAF', 'GNF', 'MGA', 'CDF', 'SLL', 'LRD'] as CurrencyCode[],
    'Middle East & South Asia': ['AED', 'SAR', 'ILS', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'IRR', 'AFN', 'INR', 'PKR', 'BDT', 'MVR', 'LKR', 'NPR'] as CurrencyCode[],
  };

  // Filter currencies based on search term
  const filteredRegionGroups = useMemo(() => {
    if (!searchTerm) return regionGroups;
    
    const filtered: typeof regionGroups = {};
    
    Object.entries(regionGroups).forEach(([region, currencies]) => {
      const matchedCurrencies = currencies.filter(code => {
        const name = getCurrencyName(code).toLowerCase();
        const symbol = currencySymbols[code].toLowerCase();
        const search = searchTerm.toLowerCase();
        return code.toLowerCase().includes(search) || 
               name.includes(search) || 
               symbol.includes(search);
      });
      
      if (matchedCurrencies.length > 0) {
        filtered[region as keyof typeof regionGroups] = matchedCurrencies;
      }
    });
    
    return filtered;
  }, [searchTerm]);

  const handleCurrencySelect = (code: CurrencyCode) => {
    setCurrency(code);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <span className="text-xs font-medium cursor-pointer flex items-center gap-1" style={{ fontSize: '12px' }}>
          <span className="text-blue-600 flex items-center gap-1">
            <span className="text-sm">{getCurrencyFlag(currency)}</span>
            {currency}
          </span>
          <ChevronDown className="h-3 w-3 text-gray-600" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] max-h-[400px] overflow-y-auto">
        {/* Search Input */}
        <div className="p-2 sticky top-0 bg-white border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search currencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Currency Groups */}
        {Object.entries(filteredRegionGroups).map(([region, currencies]) => (
          <div key={region}>
            <DropdownMenuLabel className="text-xs font-semibold text-gray-500 px-2 py-1 sticky top-[57px] bg-white border-b">
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {region}
              </div>
            </DropdownMenuLabel>
            {currencies.map((code) => (
              <DropdownMenuItem
                key={code}
                onClick={() => handleCurrencySelect(code)}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base">{getCurrencyFlag(code)}</span>
                  <span className="font-medium text-gray-700 min-w-[40px]">{code}</span>
                  <span className="text-gray-500 mr-2">{currencySymbols[code]}</span>
                  <span className="text-gray-600 truncate">{getCurrencyName(code)}</span>
                </div>
                {currency === code && <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />}
              </DropdownMenuItem>
            ))}
            {Object.keys(filteredRegionGroups).indexOf(region) < Object.keys(filteredRegionGroups).length - 1 && (
              <DropdownMenuSeparator />
            )}
          </div>
        ))}

        {/* No results message */}
        {searchTerm && Object.keys(filteredRegionGroups).length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No currencies found for "{searchTerm}"
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CurrencySelector;