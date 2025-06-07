import { useLocation } from 'wouter';
import { useMarketType } from '@/hooks/use-market-type';
import { useCurrency, currencies } from '@/contexts/CurrencyContext';
import { useCart } from '@/hooks/use-cart';
import { useQuery } from '@tanstack/react-query';
import { useUnifiedBatchTranslation } from '@/hooks/use-unified-translation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, ShoppingBag, Store, Heart, PoundSterling, ChevronDown, Bell, Package } from 'lucide-react';

interface MarketplaceNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function MarketplaceNav({ searchTerm = '', setSearchTerm }: MarketplaceNavProps = {}) {
  const [, setLocation] = useLocation();
  const { marketType, setMarketType } = useMarketType();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const { cartItemCount } = useCart();

  // Batch translate all navigation texts for optimal performance
  const navTexts = [
    "Buy from a friend (C2C)",
    "Buy from a store (B2C)", 
    "Business (B2B)",
    "Search products...",
    "Liked",
    "Shopping Cart",
    "Orders & Returns",
    "Vendor Dashboard"
  ];
  
  const { translations: translatedTexts, isLoading: isTranslating } = useUnifiedBatchTranslation(navTexts, 'instant');
  const c2cText = translatedTexts["C2C"] || "C2C";
  const b2cText = translatedTexts["B2C"] || "B2C";
  const b2bText = translatedTexts["B2B"] || "B2B";
  const searchPlaceholder = translatedTexts["Search products..."] || "Search products...";
  const likedText = translatedTexts["Liked"] || "Liked";
  const cartText = translatedTexts["Shopping Cart"] || "Shopping Cart";
  const ordersText = translatedTexts["Orders & Returns"] || "Orders & Returns";
  const vendorText = translatedTexts["Vendor Dashboard"] || "Vendor Dashboard";

  // Fetch liked products count
  const { data: likedProductsData } = useQuery<{ count: number }>({
    queryKey: ['/api/liked-products/count'],
  });
  
  // Fetch notifications count
  const { data: notificationsData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread/count'],
  });
  
  // Fetch orders notification count
  const { data: ordersNotificationsData } = useQuery<{ count: number }>({
    queryKey: ['/api/orders/notifications/count'],
  });
  
  const likedProductsCount = likedProductsData?.count || 0;
  const notificationsCount = notificationsData?.count || 0;
  const ordersNotificationsCount = ordersNotificationsData?.count || 0;

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
                  {c2cText}
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
                  {b2cText}
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
                  {b2bText}
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
                  placeholder={searchPlaceholder}
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
              onClick={() => setLocation("/liked")}
            >
              <div className="relative">
                <Heart className="h-4 w-4" />
                {likedProductsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                    {likedProductsCount > 99 ? '99+' : likedProductsCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium">{likedText}</span>
            </Button>


            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 relative"
              onClick={() => setLocation("/cart")}
            >
              <div className="relative">
                <ShoppingBag className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium">{cartText}</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 relative"
              onClick={() => setLocation("/orders-returns")}
            >
              <div className="relative">
                <Package className="h-4 w-4" />
                {ordersNotificationsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                    {ordersNotificationsCount > 99 ? '99+' : ordersNotificationsCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium">{ordersText}</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/vendor-dashboard")}
            >
              <Store className="h-4 w-4" />
              <span className="text-sm font-medium">{vendorText}</span>
            </Button>
            

          </div>
        </div>
      </div>



    </div>
  );
}