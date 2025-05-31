import { useLocation } from 'wouter';
import { useMarketType } from '@/hooks/use-market-type';
import { useCurrency, currencies } from '@/contexts/CurrencyContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, ShoppingBag, Store, Heart, PoundSterling, ChevronDown } from 'lucide-react';

interface MarketplaceNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function MarketplaceNav({ searchTerm = '', setSearchTerm }: MarketplaceNavProps = {}) {
  const [, setLocation] = useLocation();
  const { marketType, setMarketType } = useMarketType();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => {
                setMarketType("c2c");
                setLocation("/marketplace");
              }}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  marketType === 'c2c' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  Buy from a friend (C2C)
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                marketType === 'c2c' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
            
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => {
                setMarketType("b2c");
                setLocation("/marketplace");
              }}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  marketType === 'b2c' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  Buy from a store (B2C)
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                marketType === 'b2c' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
            
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => {
                setMarketType("b2b");
                setLocation("/marketplace");
              }}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  marketType === 'b2b' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  Business (B2B)
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                marketType === 'b2b' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
            
            {/* Search bar */}
            {setSearchTerm && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            )}
          </div>
          
          {/* Right corner buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/liked")}
            >
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">Liked</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/cart")}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm font-medium">Shopping Bag</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/vendor-dashboard")}
            >
              <Store className="h-4 w-4" />
              <span className="text-sm font-medium">Vendor Dashboard</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
                >
                  <div className="w-6 h-4 rounded border border-gray-200 overflow-hidden">
                    {selectedCurrency.code === 'GBP' && (
                      <div className="w-full h-full bg-blue-900 relative">
                        {/* White diagonal crosses (St. Andrew's Cross) */}
                        <div className="absolute inset-0" style={{background: 'linear-gradient(45deg, transparent 45%, white 45%, white 55%, transparent 55%)'}}>
                        </div>
                        <div className="absolute inset-0" style={{background: 'linear-gradient(-45deg, transparent 45%, white 45%, white 55%, transparent 55%)'}}>
                        </div>
                        {/* Red diagonal crosses */}
                        <div className="absolute inset-0" style={{background: 'linear-gradient(45deg, transparent 47%, #dc2626 47%, #dc2626 53%, transparent 53%)'}}>
                        </div>
                        <div className="absolute inset-0" style={{background: 'linear-gradient(-45deg, transparent 47%, #dc2626 47%, #dc2626 53%, transparent 53%)'}}>
                        </div>
                        {/* White cross (St. George's Cross base) */}
                        <div className="absolute top-0 left-1/2 w-2 h-full bg-white transform -translate-x-1/2"></div>
                        <div className="absolute top-1/2 left-0 w-full h-2 bg-white transform -translate-y-1/2"></div>
                        {/* Red cross (St. George's Cross) */}
                        <div className="absolute top-0 left-1/2 w-1 h-full bg-red-600 transform -translate-x-1/2"></div>
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-red-600 transform -translate-y-1/2"></div>
                      </div>
                    )}
                    {selectedCurrency.code === 'USD' && (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-red-500 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">🌍</div>
                      </div>
                    )}
                    {selectedCurrency.code === 'EUR' && (
                      <div className="w-full h-full bg-gradient-to-r from-blue-500 via-white to-blue-500 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-yellow-400 text-xs">★</div>
                      </div>
                    )}
                    {selectedCurrency.code === 'INR' && (
                      <div className="w-full h-full bg-gradient-to-b from-orange-500 via-white to-green-600"></div>
                    )}
                    {selectedCurrency.code === 'NGN' && (
                      <div className="w-full h-full bg-gradient-to-b from-green-600 via-white to-green-600"></div>
                    )}
                    {selectedCurrency.code === 'ZAR' && (
                      <div className="w-full h-full bg-gradient-to-br from-green-600 via-yellow-400 to-red-600"></div>
                    )}
                    {selectedCurrency.code === 'KES' && (
                      <div className="w-full h-full bg-gradient-to-b from-black via-red-600 to-green-600"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium">Currency</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {currencies.map((currency) => (
                  <DropdownMenuItem
                    key={currency.code}
                    onClick={() => setSelectedCurrency(currency)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-6 h-4 rounded border border-gray-200 overflow-hidden">
                      {currency.code === 'GBP' && (
                        <div className="w-full h-full bg-blue-900 relative">
                          {/* White diagonal crosses (St. Andrew's Cross) */}
                          <div className="absolute inset-0" style={{background: 'linear-gradient(45deg, transparent 45%, white 45%, white 55%, transparent 55%)'}}>
                          </div>
                          <div className="absolute inset-0" style={{background: 'linear-gradient(-45deg, transparent 45%, white 45%, white 55%, transparent 55%)'}}>
                          </div>
                          {/* Red diagonal crosses */}
                          <div className="absolute inset-0" style={{background: 'linear-gradient(45deg, transparent 47%, #dc2626 47%, #dc2626 53%, transparent 53%)'}}>
                          </div>
                          <div className="absolute inset-0" style={{background: 'linear-gradient(-45deg, transparent 47%, #dc2626 47%, #dc2626 53%, transparent 53%)'}}>
                          </div>
                          {/* White cross (St. George's Cross base) */}
                          <div className="absolute top-0 left-1/2 w-2 h-full bg-white transform -translate-x-1/2"></div>
                          <div className="absolute top-1/2 left-0 w-full h-2 bg-white transform -translate-y-1/2"></div>
                          {/* Red cross (St. George's Cross) */}
                          <div className="absolute top-0 left-1/2 w-1 h-full bg-red-600 transform -translate-x-1/2"></div>
                          <div className="absolute top-1/2 left-0 w-full h-1 bg-red-600 transform -translate-y-1/2"></div>
                        </div>
                      )}
                      {currency.code === 'USD' && (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-red-500 relative">
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">🌍</div>
                        </div>
                      )}
                      {currency.code === 'EUR' && (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 via-white to-blue-500 relative">
                          <div className="absolute inset-0 flex items-center justify-center text-yellow-400 text-xs">★</div>
                        </div>
                      )}
                      {currency.code === 'INR' && (
                        <div className="w-full h-full bg-gradient-to-b from-orange-500 via-white to-green-600"></div>
                      )}
                      {currency.code === 'NGN' && (
                        <div className="w-full h-full bg-gradient-to-b from-green-600 via-white to-green-600"></div>
                      )}
                      {currency.code === 'ZAR' && (
                        <div className="w-full h-full bg-gradient-to-br from-green-600 via-yellow-400 to-red-600"></div>
                      )}
                      {currency.code === 'KES' && (
                        <div className="w-full h-full bg-gradient-to-b from-black via-red-600 to-green-600"></div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{currency.symbol} {currency.code}</span>
                      <span className="text-xs text-gray-500">{currency.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>



    </div>
  );
}