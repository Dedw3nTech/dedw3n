import { useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useMarketType, type MarketType } from '@/hooks/use-market-type';
import { useCurrency, currencies } from '@/contexts/CurrencyContext';
import { useCart } from '@/hooks/use-cart';
import { useQuery } from '@tanstack/react-query';
import { useSafeBatchTranslation } from '@/hooks/use-safe-translation';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, ShoppingBag, Store, Heart, PoundSterling, ChevronDown, Bell, Package, Users, Building2, Warehouse } from 'lucide-react';

interface MarketplaceNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function MarketplaceNav({ searchTerm = '', setSearchTerm }: MarketplaceNavProps = {}) {
  const [, setLocation] = useLocation();
  const { marketType, setMarketType } = useMarketType();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const { cartItemCount } = useCart();

  // Define translatable texts with stable references
  const navigationTexts = useMemo(() => [
    "Friends (C2C)",
    "Buy & Sell Online Store (B2C)", 
    "Buy & Sell Wholesale (B2B)",
    "Search products...",
    "Liked",
    "Shopping Cart",
    "Orders & Returns",
    "Vendor Dashboard"
  ], []);

  // Use safe batch translation for optimal performance
  const translatedTexts = useSafeBatchTranslation(navigationTexts);

  // Memoize translated values to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    c2cText: translatedTexts["Buy & Sell from Friends (C2C)"] || "Buy & Sell from Friends (C2C)",
    b2cText: translatedTexts["Buy & Sell from Online Store (B2C)"] || "Buy & Sell from Online Store (B2C)", 
    b2bText: translatedTexts["Buy & Sell Wholesale (B2B)"] || "Buy & Sell Wholesale (B2B)",
    searchPlaceholder: translatedTexts["Search products..."] || "Search products...",
    likedText: translatedTexts["Liked"] || "Liked",
    cartText: translatedTexts["Shopping Cart"] || "Shopping Cart",
    ordersText: translatedTexts["Orders & Returns"] || "Orders & Returns",
    vendorText: translatedTexts["Vendor Dashboard"] || "Vendor Dashboard"
  }), [translatedTexts]);

  // Memoize navigation handlers to prevent infinite re-renders
  const handleMarketNavigation = useCallback((type: string) => {
    setMarketType(type as MarketType);
    setLocation("/marketplace");
  }, [setMarketType, setLocation]);

  const handlePageNavigation = useCallback((path: string) => {
    setLocation(path);
  }, [setLocation]);

  // Static counts for testing
  const likedProductsCount = 0;
  const ordersNotificationsCount = 0;

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => handleMarketNavigation("c2c")}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  marketType === 'c2c' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`} style={{ fontSize: '12px' }}>
                  {translatedLabels.c2cText}
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
              onClick={() => handleMarketNavigation("b2c")}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  marketType === 'b2c' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`} style={{ fontSize: '12px' }}>
                  {translatedLabels.b2cText}
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
              onClick={() => handleMarketNavigation("b2b")}
            >
              <div className="mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  marketType === 'b2b' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`} style={{ fontSize: '12px' }}>
                  {translatedLabels.b2bText}
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
                  placeholder={translatedLabels.searchPlaceholder}
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
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 relative"
              onClick={() => handlePageNavigation("/liked")}
            >
              <div className="relative">
                <Heart className="h-4 w-4" />
                {likedProductsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                    {likedProductsCount > 99 ? '99+' : likedProductsCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium" style={{ fontSize: '12px' }}>{translatedLabels.likedText}</span>
            </Button>


            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 relative"
              onClick={() => handlePageNavigation("/cart")}
            >
              <div className="relative">
                <ShoppingBag className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium" style={{ fontSize: '12px' }}>{translatedLabels.cartText}</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 relative"
              onClick={() => handlePageNavigation("/orders-returns")}
            >
              <div className="relative">
                <Package className="h-4 w-4" />
                {ordersNotificationsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                    {ordersNotificationsCount > 99 ? '99+' : ordersNotificationsCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium" style={{ fontSize: '12px' }}>{translatedLabels.ordersText}</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => handlePageNavigation("/vendor-dashboard")}
            >
              <Store className="h-4 w-4" />
              <span className="text-xs font-medium" style={{ fontSize: '12px' }}>{translatedLabels.vendorText}</span>
            </Button>
            

          </div>
        </div>
      </div>



    </div>
  );
}