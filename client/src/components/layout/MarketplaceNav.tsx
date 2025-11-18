import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
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
import { apiRequest } from '@/lib/queryClient';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Store, ChevronDown, Bell, Users, Building2, Warehouse, Menu, X, Video, Plus, Package } from 'lucide-react';

interface MarketplaceNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function MarketplaceNav({ searchTerm: externalSearchTerm = '', setSearchTerm: externalSetSearchTerm }: MarketplaceNavProps = {}) {
  const [location, setLocation] = useLocation();
  const { marketType, setMarketType } = useMarketType();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const { cartItemCount } = useCart();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  
  const isGovernmentPage = location === '/government' || location === '/dr-congo';
  const isAddProductPage = location.startsWith('/add-product') || location.startsWith('/upload-product');
  const canAddService = user?.role === 'admin' || user?.username === 'Serruti';
  
  // Use external search term if provided, otherwise use local state
  const searchTerm = externalSearchTerm || localSearchTerm;
  const setSearchTerm = externalSetSearchTerm || setLocalSearchTerm;

  // Define translatable texts with stable references
  const navigationTexts = useMemo(() => [
    "Friend to Friend",
    "Online Store", 
    "Wholesale",
    "Raw Material",
    "Content Creators",
    "Real Estate",
    "Request",
    "Search",
    "Vendor Dashboard",
    "Vendor Page",
    "Add Product/Service",
    "Add",
    "All Markets",
    "Marketplace",
    "What are you looking for?",
    "Cancel",
    "TRENDING SEARCHES",
    "NEW IN",
    "FIND THE PERFECT GIFT",
    "Add A Service",
    "Add Service",
    "Dr Congo",
    "POPULAR SERVICES",
    "DOCUMENT SERVICES",
    "QUICK ACCESS",
    "Certificates",
    "Passport Services",
    "Drivers License",
    "Visa Services",
    "Permits & Licenses",
    "Identity Documents",
    "Legal Documents",
    "Travel Documents",
    "Government Portal"
  ], []);

  // Use optimized batch translation for optimal performance
  const { translations: translatedTexts } = useMasterBatchTranslation(navigationTexts);

  // Memoize translated values to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    c2cText: translatedTexts[0] || navigationTexts[0],
    b2cText: translatedTexts[1] || navigationTexts[1], 
    b2bText: translatedTexts[2] || navigationTexts[2],
    rawText: translatedTexts[3] || navigationTexts[3],
    creatorsText: translatedTexts[4] || navigationTexts[4],
    realEstateText: translatedTexts[5] || navigationTexts[5],
    rqstText: translatedTexts[6] || navigationTexts[6],
    searchPlaceholder: translatedTexts[7] || navigationTexts[7],
    vendorText: translatedTexts[8] || navigationTexts[8],
    vendorPageText: translatedTexts[9] || navigationTexts[9],
    addProductServiceText: translatedTexts[10] || navigationTexts[10],
    addText: translatedTexts[11] || navigationTexts[11],
    moreMarketsText: translatedTexts[12] || navigationTexts[12],
    marketplaceText: translatedTexts[13] || navigationTexts[13],
    searchPromptText: translatedTexts[14] || navigationTexts[14],
    cancelText: translatedTexts[15] || navigationTexts[15],
    trendingSearchesText: translatedTexts[16] || navigationTexts[16],
    newInText: translatedTexts[17] || navigationTexts[17],
    findPerfectGiftText: translatedTexts[18] || navigationTexts[18],
    addAServiceText: translatedTexts[19] || navigationTexts[19],
    addServiceText: translatedTexts[20] || navigationTexts[20],
    drCongoText: translatedTexts[21] || navigationTexts[21],
    popularServicesText: translatedTexts[22] || navigationTexts[22],
    documentServicesText: translatedTexts[23] || navigationTexts[23],
    quickAccessText: translatedTexts[24] || navigationTexts[24],
    certificatesText: translatedTexts[25] || navigationTexts[25],
    passportServicesText: translatedTexts[26] || navigationTexts[26],
    driversLicenseText: translatedTexts[27] || navigationTexts[27],
    visaServicesText: translatedTexts[28] || navigationTexts[28],
    permitsLicensesText: translatedTexts[29] || navigationTexts[29],
    identityDocumentsText: translatedTexts[30] || navigationTexts[30],
    legalDocumentsText: translatedTexts[31] || navigationTexts[31],
    travelDocumentsText: translatedTexts[32] || navigationTexts[32],
    governmentPortalText: translatedTexts[33] || navigationTexts[33]
  }), [translatedTexts, navigationTexts]);

  // Memoize navigation handlers to prevent infinite re-renders
  const handleMarketNavigation = useCallback((type: string) => {
    setMarketType(type as MarketType);
    setLocation(`/marketplace/${type}`);
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
    enabled: isAuthenticated && !isGovernmentPage,
  });

  const { data: governmentNotifications } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/government/count'],
    staleTime: 10000,
    enabled: isAuthenticated && isGovernmentPage,
  });

  // Calculate notification count based on page type
  const totalNotifications = isGovernmentPage
    ? (governmentNotifications?.count || 0)
    : (messagesNotifications?.count || 0) + (generalNotifications?.count || 0);

  const handleProfileClick = useCallback(() => {
    setLocation("/profile");
  }, [setLocation]);

  const handleAddProduct = useCallback(() => {
    // For government pages, only authorized users can add services
    if (isGovernmentPage) {
      if (canAddService) {
        // Navigate to add product page with government service context
        // If on Dr Congo page, auto-select Dr Congo marketplace
        if (location === '/dr-congo') {
          setLocation('/add-product?type=government-service&marketplace=government-dr-congo');
        } else {
          setLocation('/add-product?type=government-service');
        }
      }
      return;
    }
    
    // For regular marketplace, check if user has an active vendor account
    if (userVendor) {
      // User has vendor account, proceed to add product
      setLocation('/add-product');
    } else {
      // User doesn't have vendor account, redirect to become a vendor
      setLocation('/vendor-dashboard');
    }
  }, [isGovernmentPage, canAddService, userVendor, setLocation, location]);

  // Track navbar visibility and close dropdown when navbar scrolls out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNavVisible(entry.isIntersecting);
        if (!entry.isIntersecting) {
          setShowSuggestions(false);
        }
      },
      { threshold: 0.1 }
    );

    if (navRef.current) {
      observer.observe(navRef.current);
    }

    return () => {
      if (navRef.current) {
        observer.unobserve(navRef.current);
      }
    };
  }, []);

  // Auto-hide dropdown when user scrolls down the page
  useEffect(() => {
    const handleScroll = () => {
      if (showSuggestions && window.scrollY > 0) {
        setShowSuggestions(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions as user types
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Try searching with original query first
      let response = await fetch(`/api/products/search?q=${encodeURIComponent(query.trim())}`);
      
      if (!response.ok) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }
      
      let data = await response.json();
      let products = data?.results || [];
      
      // If no results found, try translating to English and searching again
      if (products.length === 0) {
        try {
          const translateResponse = await fetch('/api/translate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              texts: [query.trim()],
              targetLanguage: 'EN',
              priority: 'instant'
            })
          });
          
          if (translateResponse.ok) {
            const translateData = await translateResponse.json();
            const translatedQuery = translateData?.translations?.[0]?.translatedText;
            
            if (translatedQuery && translatedQuery.toLowerCase() !== query.trim().toLowerCase()) {
              // Search with translated query
              const translatedResponse = await fetch(`/api/products/search?q=${encodeURIComponent(translatedQuery)}`);
              if (translatedResponse.ok) {
                const translatedData = await translatedResponse.json();
                products = translatedData?.results || [];
              }
            }
          }
        } catch (translateError) {
          console.error('Translation error during search:', translateError);
        }
      }
      
      // Limit to 5 suggestions
      setSuggestions(products.slice(0, 5));
    } catch (error) {
      console.error('Suggestion fetch error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce suggestions fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, fetchSuggestions]);

  // Search function that searches across all marketplaces
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query.trim())}`);
      
      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 400) {
          console.error('Bad request - invalid search parameters');
          setSearchResults([]);
          return;
        } else if (response.status === 500) {
          console.error('Server error during search');
          setSearchResults([]);
          return;
        } else {
          console.error(`Search failed with status: ${response.status}`);
          setSearchResults([]);
          return;
        }
      }
      
      const results = await response.json();
      setSearchResults(results);
      
      // Navigate to a search results page if needed
      setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [setLocation]);

  // Handle search input changes with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    // Trigger search on Enter key or when user stops typing
  }, [setSearchTerm]);

  // Handle search submission
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  }, [handleSearch, searchTerm]);

  return (
    <div ref={navRef} className="bg-white border-b border-gray-200 py-6 relative">
      <div className="container mx-auto px-4">
        {/* Desktop layout - horizontal navigation with absolute centered navigation */}
        <div className="hidden md:flex relative items-center justify-between w-full">
          {/* Left side - Profile + Add Product/Service button for both marketplace and government */}
          <div className="flex-shrink-0 flex items-center gap-3">
            {isAuthenticated && (
              <div className="relative">
                {/* Notification badge positioned at top-right corner */}
                {totalNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-bold z-10 border-2 border-white">
                    {totalNotifications > 99 ? '99+' : totalNotifications}
                  </div>
                )}
                <div
                  onClick={handleProfileClick}
                  className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                  data-testid="button-profile-desktop"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleProfileClick();
                    }
                  }}
                >
                  <UserAvatar
                    userId={user.id}
                    username={user.username}
                    size="md"
                    className="border-2 border-gray-200 hover:border-gray-300 transition-colors"
                  />
                </div>
              </div>
            )}
            {isGovernmentPage ? (
              canAddService && (
                <Button
                  onClick={handleAddProduct}
                  className="h-10 px-4 bg-transparent text-black hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium"
                  style={{ fontSize: '12px' }}
                  data-testid="button-add-service-desktop"
                >
                  <Plus className="h-4 w-4" />
                  {translatedLabels.addAServiceText}
                </Button>
              )
            ) : (
              isAuthenticated && (
                <Button
                  onClick={handleAddProduct}
                  className="h-10 px-4 bg-transparent text-black hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium"
                  style={{ fontSize: '12px' }}
                  data-testid="button-add-product-desktop"
                >
                  <Plus className="h-4 w-4" />
                  {translatedLabels.addProductServiceText}
                </Button>
              )
            )}
          </div>

          {/* Market type navigation buttons - ABSOLUTELY CENTERED, ONE LINE - Hidden on government and add-product pages */}
          {!isGovernmentPage && !isAddProductPage && (
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center flex-nowrap gap-2 md:gap-3 lg:gap-4 xl:gap-6">
              {/* Friend to Friend (C2C) */}
            <div 
              className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center flex-shrink-0"
              onClick={() => handleMarketNavigation("c2c")}
              data-testid="button-market-c2c"
            >
              <div className="relative">
                <span className={`text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                  marketType === 'c2c' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  {translatedLabels.c2cText}
                </span>
                <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                  marketType === 'c2c' 
                    ? 'bg-black w-full' 
                    : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
                }`} />
              </div>
            </div>
            
            {/* Request (RQST) */}
            <div 
              className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center flex-shrink-0"
              onClick={() => handleMarketNavigation("rqst")}
              data-testid="button-market-rqst"
            >
              <div className="relative">
                <span className={`text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                  marketType === 'rqst' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  {translatedLabels.rqstText}
                </span>
                <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                  marketType === 'rqst' 
                    ? 'bg-black w-full' 
                    : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
                }`} />
              </div>
            </div>
            
            {/* Content Creators - Only visible to admin users */}
            {user?.role === 'admin' && (
              <div 
                className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center flex-shrink-0"
                onClick={() => {
                  setMarketType('creators' as MarketType);
                  setLocation("/marketplace/creators");
                }}
                data-testid="button-market-creators"
              >
                <div className="relative">
                  <span className={`text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                    marketType === 'creators' 
                      ? 'text-black' 
                      : 'text-black group-hover:text-black'
                  }`}>
                    {translatedLabels.creatorsText}
                  </span>
                  <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                    marketType === 'creators' 
                      ? 'bg-black w-full' 
                      : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
                  }`} />
                </div>
              </div>
            )}
            
            {/* All Markets Button */}
            <div 
              className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center flex-shrink-0"
              onClick={() => setIsSidebarOpen(true)}
              data-testid="button-more-markets"
            >
              <div className="relative">
                <span className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium transition-colors duration-300 whitespace-nowrap text-black group-hover:text-black">
                  {translatedLabels.moreMarketsText}
                </span>
                <div className="absolute -bottom-1 left-0 h-0.5 bg-transparent w-0 group-hover:w-full group-hover:bg-black transition-all duration-300" />
              </div>
            </div>
          </div>
          )}

          {/* Government navigation - ABSOLUTELY CENTERED - Shown on government page */}
          {isGovernmentPage && (
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center flex-nowrap gap-4">
              <div 
                className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center flex-shrink-0"
                onClick={() => setLocation("/dr-congo")}
                data-testid="button-dr-congo-nav"
              >
                <div className="relative">
                  <span className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium transition-colors duration-300 whitespace-nowrap text-black group-hover:text-black">
                    {translatedLabels.drCongoText}
                  </span>
                  <div className="absolute -bottom-1 left-0 h-0.5 bg-transparent w-0 group-hover:w-full group-hover:bg-black transition-all duration-300" />
                </div>
              </div>
            </div>
          )}

          {/* Search bar and hamburger menu - positioned on the RIGHT side */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <div ref={searchRef} className="relative min-w-[200px] max-w-md">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  data-testid="search-input-desktop"
                  placeholder={translatedLabels.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(searchTerm);
                      setShowSuggestions(false);
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-10 h-10 pr-4 border-0 border-b-2 border-black rounded-none bg-transparent focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none shadow-none"
                  disabled={isSearching}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                  </div>
                )}
              </form>
            </div>
            
            {/* Hamburger menu button for desktop - Hidden on government and add-product pages */}
            {!isGovernmentPage && !isAddProductPage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 hover:bg-gray-100"
                onClick={() => setIsSidebarOpen(true)}
                data-testid="button-hamburger-desktop"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search suggestions dropdown - Full width, linked to navigation bar */}
      {showSuggestions && isNavVisible && (
        <div className="absolute left-0 right-0 top-full bg-white shadow-2xl z-[60] border-t-0 border-x-0 border-b border-gray-200 w-full">
          <div className="container mx-auto px-4">
            <div className="px-6 py-5">
              {/* Header with search prompt and cancel */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-black">
                <p className="text-xs font-normal">{translatedLabels.searchPromptText}</p>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-xs font-normal underline hover:no-underline"
                  data-testid="button-cancel-search"
                >
                  {translatedLabels.cancelText}
                </button>
              </div>

              {isSearching && searchTerm.length >= 2 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                  <span className="text-sm">Searching...</span>
                </div>
              ) : searchTerm.length >= 2 && suggestions.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {suggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setLocation(`/product/${product.id}`);
                        setShowSuggestions(false);
                        setSearchTerm('');
                      }}
                      className="flex items-center gap-3 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                      data-testid={`suggestion-product-${product.id}`}
                    >
                      <div className="w-14 h-14 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500 truncate">{product.description}</p>
                        <p className="text-sm font-semibold text-green-600 mt-0.5">
                          {selectedCurrency?.symbol || '$'}{product.price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isGovernmentPage ? (
                <div className="grid grid-cols-3 gap-8">
                  {/* Popular Services */}
                  <div>
                    <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.popularServicesText}</h3>
                    <div className="space-y-2.5">
                      {[
                        translatedLabels.certificatesText,
                        translatedLabels.passportServicesText,
                        translatedLabels.driversLicenseText,
                        translatedLabels.visaServicesText
                      ].map((item, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSearchTerm(item);
                            setShowSuggestions(false);
                          }}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <Search className="h-3.5 w-3.5 text-black" />
                          <span className="text-xs underline hover:no-underline">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Services */}
                  <div>
                    <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.documentServicesText}</h3>
                    <div className="space-y-2.5">
                      {[
                        translatedLabels.identityDocumentsText,
                        translatedLabels.legalDocumentsText,
                        translatedLabels.travelDocumentsText
                      ].map((item, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSearchTerm(item);
                            setShowSuggestions(false);
                          }}
                          className="cursor-pointer"
                        >
                          <span className="text-xs underline hover:no-underline">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Access */}
                  <div>
                    <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.quickAccessText}</h3>
                    <div className="space-y-2.5">
                      <div
                        onClick={() => {
                          setLocation('/dr-congo');
                          setShowSuggestions(false);
                        }}
                        className="cursor-pointer"
                      >
                        <span className="text-xs underline hover:no-underline">{translatedLabels.drCongoText}</span>
                      </div>
                      <div
                        onClick={() => {
                          setLocation('/government');
                          setShowSuggestions(false);
                        }}
                        className="cursor-pointer"
                      >
                        <span className="text-xs underline hover:no-underline">{translatedLabels.governmentPortalText}</span>
                      </div>
                      {canAddService && (
                        <div
                          onClick={() => {
                            setLocation('/add-product?type=government-service');
                            setShowSuggestions(false);
                          }}
                          className="cursor-pointer"
                        >
                          <span className="text-xs underline hover:no-underline">{translatedLabels.addAServiceText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-8">
                  {/* Trending Searches */}
                  <div>
                    <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.trendingSearchesText}</h3>
                    <div className="space-y-2.5">
                      {[translatedLabels.b2cText, translatedLabels.c2cText, translatedLabels.b2bText, translatedLabels.creatorsText].map((item, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSearchTerm(item);
                            setShowSuggestions(false);
                          }}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <Search className="h-3.5 w-3.5 text-black" />
                          <span className="text-xs underline hover:no-underline">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* New In */}
                  <div>
                    <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.newInText}</h3>
                    <div className="space-y-2.5">
                            {[translatedLabels.c2cText, translatedLabels.b2cText].map((item, index) => (
                              <div
                                key={index}
                                onClick={() => {
                                  const marketTypes = ['c2c', 'b2c'];
                                  handleMarketNavigation(marketTypes[index]);
                                  setShowSuggestions(false);
                                }}
                                className="cursor-pointer"
                              >
                                <span className="text-xs underline hover:no-underline">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Find the Perfect Gift */}
                        <div>
                          <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.findPerfectGiftText}</h3>
                          <div className="space-y-2.5">
                            <div
                              onClick={() => {
                                handleMarketNavigation('b2c');
                                setShowSuggestions(false);
                              }}
                              className="cursor-pointer"
                            >
                              <span className="text-xs underline hover:no-underline">{translatedLabels.b2cText}</span>
                            </div>
                            <div
                              onClick={() => {
                                handleMarketNavigation('creators');
                                setShowSuggestions(false);
                              }}
                              className="cursor-pointer"
                            >
                              <span className="text-xs underline hover:no-underline">{translatedLabels.creatorsText}</span>
                            </div>
                            <div
                              onClick={() => {
                                setLocation('/marketplace');
                                setShowSuggestions(false);
                              }}
                              className="cursor-pointer"
                            >
                              <span className="text-xs underline hover:no-underline">{translatedLabels.marketplaceText}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
      )}

      {/* Mobile layout - hamburger menu */}
      <div className="container mx-auto px-4">
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            {/* Left side - Profile + Add Product/Service button for both marketplace and government */}
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <div className="relative">
                  {/* Notification badge positioned at top-right corner for mobile */}
                  {totalNotifications > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] text-[9px] font-bold z-10 border-[1.5px] border-white">
                      {totalNotifications > 99 ? '99+' : totalNotifications}
                    </div>
                  )}
                  <div
                    onClick={handleProfileClick}
                    className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full"
                    data-testid="button-profile-mobile"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleProfileClick();
                      }
                    }}
                  >
                    <UserAvatar
                      userId={user.id}
                      username={user.username}
                      size="sm"
                      className="border-2 border-gray-200 hover:border-gray-300 transition-colors"
                    />
                  </div>
                </div>
              )}
              {isGovernmentPage ? (
                canAddService && (
                  <Button
                    onClick={handleAddProduct}
                    className="h-8 px-3 bg-transparent text-black hover:bg-gray-100 transition-colors flex items-center gap-1.5 font-medium"
                    style={{ fontSize: '10px' }}
                    data-testid="button-add-service-mobile"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {translatedLabels.addServiceText}
                  </Button>
                )
              ) : (
                isAuthenticated && (
                  <Button
                    onClick={handleAddProduct}
                    className="h-8 px-3 bg-transparent text-black hover:bg-gray-100 transition-colors flex items-center gap-1.5 font-medium"
                    style={{ fontSize: '10px' }}
                    data-testid="button-add-product-mobile"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {translatedLabels.addText}
                  </Button>
                )
              )}
            </div>

            {/* Search bar and hamburger menu for mobile */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="relative flex-1 max-w-[160px]">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    data-testid="search-input-mobile"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(searchTerm);
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-10 h-8 text-sm pr-4 border-0 border-b-2 border-black rounded-none bg-transparent focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none shadow-none"
                    disabled={isSearching}
                  />
                  {isSearching && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                    </div>
                  )}
                </form>
              </div>

              {/* Hamburger menu button for mobile */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
                onClick={() => setIsSidebarOpen(true)}
                data-testid="button-hamburger-mobile"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar for additional marketplace navigation */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle>{isGovernmentPage ? translatedLabels.governmentPortalText : translatedLabels.marketplaceText}</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-2">
            {/* Government Navigation - Only shown on government pages */}
            {isGovernmentPage && (
              <div className="space-y-1 mb-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12"
                  onClick={() => {
                    setLocation("/dr-congo");
                    setIsSidebarOpen(false);
                  }}
                  data-testid="sidebar-button-dr-congo"
                >
                  <span className="text-xs">{translatedLabels.drCongoText}</span>
                </Button>
              </div>
            )}

            {/* All Market Type Navigation Buttons - Only shown on non-government pages */}
            {!isGovernmentPage && (
              <div className="space-y-1">
                
                <Button
                  variant={marketType === 'c2c' ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-12"
                  onClick={() => {
                    handleMarketNavigation("c2c");
                    setIsSidebarOpen(false);
                  }}
                  data-testid="sidebar-button-c2c"
                >
                  <span className="text-xs">{translatedLabels.c2cText}</span>
                </Button>

              <Button
                variant={marketType === 'b2c' ? 'secondary' : 'ghost'}
                className="w-full justify-start h-12"
                onClick={() => {
                  handleMarketNavigation("b2c");
                  setIsSidebarOpen(false);
                }}
                data-testid="sidebar-button-b2c"
              >
                <span className="text-xs">{translatedLabels.b2cText}</span>
              </Button>

              <Button
                variant={marketType === 'b2b' ? 'secondary' : 'ghost'}
                className="w-full justify-start h-12"
                onClick={() => {
                  handleMarketNavigation("b2b");
                  setIsSidebarOpen(false);
                }}
                data-testid="sidebar-button-b2b"
              >
                <span className="text-xs">{translatedLabels.b2bText}</span>
              </Button>

              {user?.role === 'admin' && (
                <Button
                  variant={marketType === 'raw' ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-12"
                  onClick={() => {
                    handleMarketNavigation("raw");
                    setIsSidebarOpen(false);
                  }}
                  data-testid="sidebar-button-raw"
                >
                  <span className="text-xs">{translatedLabels.rawText}</span>
                </Button>
              )}

              {user?.role === 'admin' && (
                <Button
                  variant={marketType === 'creators' ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-12"
                  onClick={() => {
                    setMarketType('creators' as MarketType);
                    setLocation("/marketplace/creators");
                    setIsSidebarOpen(false);
                  }}
                  data-testid="sidebar-button-creators"
                >
                  <span className="text-xs">{translatedLabels.creatorsText}</span>
                </Button>
              )}

              {user?.role === 'admin' && (
                <Button
                  variant={marketType === 'real-estate' ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-12"
                  onClick={() => {
                    setMarketType('real-estate' as MarketType);
                    setLocation("/marketplace/real-estate");
                    setIsSidebarOpen(false);
                  }}
                  data-testid="sidebar-button-real-estate"
                >
                  <span className="text-xs">{translatedLabels.realEstateText}</span>
                </Button>
              )}

              <Button
                variant={marketType === 'rqst' ? 'secondary' : 'ghost'}
                className="w-full justify-start h-12"
                onClick={() => {
                  handleMarketNavigation("rqst");
                  setIsSidebarOpen(false);
                }}
                data-testid="sidebar-button-rqst"
              >
                <span className="text-xs">{translatedLabels.rqstText}</span>
              </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}