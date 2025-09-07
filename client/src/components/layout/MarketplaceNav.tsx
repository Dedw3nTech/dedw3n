import { useMemo, useCallback, useState } from 'react';
import { useLocation } from 'wouter';
import { useMarketType } from '@/hooks/use-market-type';
import type { MarketType } from '@/lib/types';
import { useCurrency, currencies } from '@/contexts/CurrencyContext';
import { useCart } from '@/hooks/use-cart';
import { useQuery } from '@tanstack/react-query';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useAuth } from '@/hooks/use-auth';
import { createStoreSlug } from '@shared/utils';
import { Vendor } from '@shared/schema';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Search, ShoppingBag, Store, Heart, PoundSterling, ChevronDown, Bell, Package, Users, Building2, Warehouse, Menu, X, User } from 'lucide-react';

interface MarketplaceNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function MarketplaceNav({ searchTerm = '', setSearchTerm }: MarketplaceNavProps = {}) {
  const [, setLocation] = useLocation();
  const { marketType, setMarketType } = useMarketType();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const { cartItemCount } = useCart();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define translatable texts with stable references
  const navigationTexts = useMemo(() => [
    "Friend2Friend",
    "Online Store", 
    "Wholesale",
    "Requests (RQST)",
    "Search products...",
    "Liked",
    "Shopping Cart",
    "Orders & Returns",
    "Vendor Dashboard",
    "Vendor Page"
  ], []);

  // Use optimized batch translation for optimal performance
  const { translations: translatedTexts } = useMasterBatchTranslation(navigationTexts);

  // Memoize translated values to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    c2cText: translatedTexts[0] || navigationTexts[0],
    b2cText: translatedTexts[1] || navigationTexts[1], 
    b2bText: translatedTexts[2] || navigationTexts[2],
    rqstText: translatedTexts[3] || navigationTexts[3],
    searchPlaceholder: translatedTexts[4] || navigationTexts[4],
    likedText: translatedTexts[5] || navigationTexts[5],
    cartText: translatedTexts[6] || navigationTexts[6],
    ordersText: translatedTexts[7] || navigationTexts[7],
    vendorText: translatedTexts[8] || navigationTexts[8],
    vendorPageText: translatedTexts[9] || navigationTexts[9]
  }), [translatedTexts, navigationTexts]);

  // Memoize navigation handlers to prevent infinite re-renders
  const handleMarketNavigation = useCallback((type: string) => {
    setMarketType(type as MarketType);
    setLocation("/marketplace");
  }, [setMarketType, setLocation]);

  const handlePageNavigation = useCallback((path: string) => {
    setLocation(path);
  }, [setLocation]);

  // Fetch real notification counts only when authenticated
  const { data: likedProducts = [] } = useQuery<any[]>({
    queryKey: ['/api/liked-products'],
    staleTime: 30000,
    enabled: isAuthenticated,
  });
  
  const { data: ordersNotificationsData } = useQuery<{ count: number }>({
    queryKey: ['/api/orders/notifications/count'],
    staleTime: 10000,
    enabled: isAuthenticated,
  });

  // Fetch current user's vendor information to generate correct slug
  const { data: userVendor } = useQuery<Vendor>({
    queryKey: ['/api/vendors/me'],
    enabled: isAuthenticated && !!user?.id,
    staleTime: 60000,
  });

  // Fetch notification counts for profile badge
  const { data: messagesNotifications } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread/count'],
    staleTime: 10000,
    enabled: isAuthenticated,
  });

  const { data: generalNotifications } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread/count'],
    staleTime: 10000,
    enabled: isAuthenticated,
  });

  const likedProductsCount = isAuthenticated && Array.isArray(likedProducts) ? likedProducts.length : 0;
  const ordersNotificationsCount = isAuthenticated ? (ordersNotificationsData?.count || 0) : 0;
  const totalNotifications = (messagesNotifications?.count || 0) + (generalNotifications?.count || 0);

  const handleProfileClick = useCallback(() => {
    setLocation("/profile");
  }, [setLocation]);

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        {/* Desktop layout - horizontal navigation */}
        <div className="hidden md:flex flex-wrap justify-center items-center gap-4 md:gap-6 lg:gap-8">
          {/* Market type navigation buttons - aligned consistently */}
          <div 
            className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center"
            onClick={() => handleMarketNavigation("c2c")}
          >
            <div className="relative">
              <span className={`text-xs font-medium transition-colors duration-300 ${
                marketType === 'c2c' 
                  ? 'text-black' 
                  : 'text-black group-hover:text-black'
              }`} style={{ fontSize: '12px' }}>
                {translatedLabels.c2cText}
              </span>
              <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                marketType === 'c2c' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
          </div>
          
          <div 
            className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center"
            onClick={() => handleMarketNavigation("b2c")}
          >
            <div className="relative">
              <span className={`text-xs font-medium transition-colors duration-300 ${
                marketType === 'b2c' 
                  ? 'text-black' 
                  : 'text-black group-hover:text-black'
              }`} style={{ fontSize: '12px' }}>
                {translatedLabels.b2cText}
              </span>
              <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                marketType === 'b2c' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
          </div>
          
          <div 
            className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center"
            onClick={() => handleMarketNavigation("b2b")}
          >
            <div className="relative">
              <span className={`text-xs font-medium transition-colors duration-300 ${
                marketType === 'b2b' 
                  ? 'text-black' 
                  : 'text-black group-hover:text-black'
              }`} style={{ fontSize: '12px' }}>
                {translatedLabels.b2bText}
              </span>
              <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                marketType === 'b2b' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
          </div>
          
          <div 
            className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center"
            onClick={() => handleMarketNavigation("rqst")}
          >
            <div className="relative">
              <span className={`text-xs font-medium transition-colors duration-300 ${
                marketType === 'rqst' 
                  ? 'text-black' 
                  : 'text-black group-hover:text-black'
              }`} style={{ fontSize: '12px' }}>
                {translatedLabels.rqstText}
              </span>
              <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                marketType === 'rqst' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
          </div>

          {/* Action buttons - styled consistently with same height */}
          <Button
            variant="ghost"
            className="px-4 py-2 hover:bg-gray-50 relative h-[40px]"
            onClick={() => handlePageNavigation("/liked")}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ fontSize: '12px' }}>{translatedLabels.likedText}</span>
              {likedProductsCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                  {likedProductsCount > 99 ? '99+' : likedProductsCount}
                </span>
              )}
            </div>
          </Button>

          <Button
            variant="ghost"
            className="px-4 py-2 hover:bg-gray-50 relative h-[40px]"
            onClick={() => handlePageNavigation("/cart")}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ fontSize: '12px' }}>{translatedLabels.cartText}</span>
              {cartItemCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className="px-4 py-2 hover:bg-gray-50 relative h-[40px]"
            onClick={() => handlePageNavigation("/orders-returns")}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ fontSize: '12px' }}>{translatedLabels.ordersText}</span>
              {ordersNotificationsCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                  {ordersNotificationsCount > 99 ? '99+' : ordersNotificationsCount}
                </span>
              )}
            </div>
          </Button>

          {/* Search bar - moved to end for better mobile layout */}
          {setSearchTerm && (
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={translatedLabels.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          )}

          {/* Profile Picture with Notification Badge - Desktop */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={handleProfileClick}
                className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name || user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                {totalNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold">
                    {totalNotifications > 99 ? '99+' : totalNotifications}
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Mobile layout - hamburger menu */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            {/* Active market type indicator */}
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">
                {marketType === 'c2c' && translatedLabels.c2cText}
                {marketType === 'b2c' && translatedLabels.b2cText}
                {marketType === 'b2b' && translatedLabels.b2bText}
                {marketType === 'rqst' && translatedLabels.rqstText}
              </span>
            </div>

            {/* Search bar for mobile */}
            {setSearchTerm && (
              <div className="relative flex-1 max-w-xs mx-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={translatedLabels.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 text-sm"
                />
              </div>
            )}

            {/* Profile Picture for Mobile */}
            {isAuthenticated && (
              <div className="relative mr-2">
                <button
                  onClick={handleProfileClick}
                  className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name || user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                  {totalNotifications > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] text-[9px] font-bold">
                      {totalNotifications > 99 ? '99+' : totalNotifications}
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Hamburger menu button */}
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 w-9 p-0"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Market Type Selection */}
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Market Types
                </div>
                <DropdownMenuItem
                  onClick={() => {
                    handleMarketNavigation("c2c");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${marketType === 'c2c' ? 'bg-gray-100' : ''}`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {translatedLabels.c2cText}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleMarketNavigation("b2c");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${marketType === 'b2c' ? 'bg-gray-100' : ''}`}
                >
                  <Store className="mr-2 h-4 w-4" />
                  {translatedLabels.b2cText}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleMarketNavigation("b2b");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${marketType === 'b2b' ? 'bg-gray-100' : ''}`}
                >
                  <Warehouse className="mr-2 h-4 w-4" />
                  {translatedLabels.b2bText}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleMarketNavigation("rqst");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${marketType === 'rqst' ? 'bg-gray-100' : ''}`}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {translatedLabels.rqstText}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Action Buttons */}
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </div>
                <DropdownMenuItem
                  onClick={() => {
                    handlePageNavigation("/liked");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {translatedLabels.likedText}
                  {likedProductsCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 w-5 rounded-full p-0 text-xs">
                      {likedProductsCount > 99 ? '99+' : likedProductsCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handlePageNavigation("/cart");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {translatedLabels.cartText}
                  {cartItemCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 w-5 rounded-full p-0 text-xs">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handlePageNavigation("/orders-returns");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Package className="mr-2 h-4 w-4" />
                  {translatedLabels.ordersText}
                  {ordersNotificationsCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 w-5 rounded-full p-0 text-xs">
                      {ordersNotificationsCount > 99 ? '99+' : ordersNotificationsCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>



    </div>
  );
}