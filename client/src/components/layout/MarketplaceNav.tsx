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
import { Search, Store, ChevronDown, Bell, Users, Building2, Warehouse, Menu, X, User } from 'lucide-react';

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
    "Friend to Friend",
    "Online Store", 
    "Wholesale",
    "Raw Material",
    "Request",
    "Search products...",
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
    rawText: translatedTexts[3] || navigationTexts[3],
    rqstText: translatedTexts[4] || navigationTexts[4],
    searchPlaceholder: translatedTexts[5] || navigationTexts[5],
    vendorText: translatedTexts[6] || navigationTexts[6],
    vendorPageText: translatedTexts[7] || navigationTexts[7]
  }), [translatedTexts, navigationTexts]);

  // Memoize navigation handlers to prevent infinite re-renders
  const handleMarketNavigation = useCallback((type: string) => {
    setMarketType(type as MarketType);
    setLocation("/marketplace");
  }, [setMarketType, setLocation]);

  const handlePageNavigation = useCallback((path: string) => {
    setLocation(path);
  }, [setLocation]);

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

  const totalNotifications = (messagesNotifications?.count || 0) + (generalNotifications?.count || 0);

  const handleProfileClick = useCallback(() => {
    setLocation("/profile");
  }, [setLocation]);

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        {/* Desktop layout - horizontal navigation with absolute centered navigation */}
        <div className="hidden md:flex relative items-center justify-between w-full">
          {/* Profile Picture - LEFT side */}
          <div className="flex-shrink-0">
            {isAuthenticated && (
              <div className="relative">
                {/* Notification badge positioned above frame */}
                {totalNotifications > 0 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold z-10">
                    {totalNotifications > 99 ? '99+' : totalNotifications}
                  </div>
                )}
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
                </button>
              </div>
            )}
          </div>

          {/* Market type navigation buttons - ABSOLUTELY CENTERED */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6 lg:gap-8">
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
              onClick={() => handleMarketNavigation("raw")}
            >
              <div className="relative">
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  marketType === 'raw' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`} style={{ fontSize: '12px' }}>
                  {translatedLabels.rawText}
                </span>
                <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                  marketType === 'raw' 
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
          </div>

          {/* Search bar - positioned on the RIGHT side */}
          <div className="flex-shrink-0">
            {setSearchTerm && (
              <div className="relative min-w-[200px] max-w-md">
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
        </div>

        {/* Mobile layout - hamburger menu */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            {/* Profile Picture for Mobile - moved to left side */}
            {isAuthenticated && (
              <div className="relative">
                {/* Notification badge positioned above frame for mobile */}
                {totalNotifications > 0 && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] text-[9px] font-bold z-10">
                    {totalNotifications > 99 ? '99+' : totalNotifications}
                  </div>
                )}
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
                </button>
              </div>
            )}

            {/* Active market type indicator */}
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">
                {marketType === 'c2c' && translatedLabels.c2cText}
                {marketType === 'b2c' && translatedLabels.b2cText}
                {marketType === 'b2b' && translatedLabels.b2bText}
                {marketType === 'raw' && translatedLabels.rawText}
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
                    handleMarketNavigation("raw");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${marketType === 'raw' ? 'bg-gray-100' : ''}`}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  {translatedLabels.rawText}
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

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}