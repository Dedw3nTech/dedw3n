import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Search, Menu, Plus, Utensils, Calendar, Home, MapPin, Car, Plane, Clock, Dumbbell, Package } from 'lucide-react';

interface LifestyleNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  selectedCategory?: string;
  setSelectedCategory?: (category: string) => void;
}

export function LifestyleNav({ 
  searchTerm: externalSearchTerm = '', 
  setSearchTerm: externalSetSearchTerm,
  selectedCategory = '',
  setSelectedCategory 
}: LifestyleNavProps = {}) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [isNavVisible, setIsNavVisible] = useState(true);

  // Use external search term if provided, otherwise use local state
  const searchTerm = externalSearchTerm || localSearchTerm;
  const setSearchTerm = externalSetSearchTerm || setLocalSearchTerm;

  // Define translatable texts
  const navigationTexts = useMemo(() => [
    "Order Food",
    "Reservations",
    "Flights",
    "Hotels",
    "Activities",
    "Food Delivery",
    "Transportation",
    "Search lifestyle services...",
    "Add Service",
    "Cancel",
    "TRENDING SERVICES",
    "POPULAR CATEGORIES",
    "QUICK ACCESS",
    "Restaurants",
    "Hotels & Stays",
    "Travel",
    "Entertainment"
  ], []);

  const { translations: translatedTexts } = useMasterBatchTranslation(navigationTexts);

  const translatedLabels = useMemo(() => ({
    orderFoodText: translatedTexts[0] || navigationTexts[0],
    reservationsText: translatedTexts[1] || navigationTexts[1],
    flightsText: translatedTexts[2] || navigationTexts[2],
    hotelsText: translatedTexts[3] || navigationTexts[3],
    activitiesText: translatedTexts[4] || navigationTexts[4],
    foodDeliveryText: translatedTexts[5] || navigationTexts[5],
    transportationText: translatedTexts[6] || navigationTexts[6],
    searchPlaceholder: translatedTexts[7] || navigationTexts[7],
    addServiceText: translatedTexts[8] || navigationTexts[8],
    cancelText: translatedTexts[9] || navigationTexts[9],
    trendingServicesText: translatedTexts[10] || navigationTexts[10],
    popularCategoriesText: translatedTexts[11] || navigationTexts[11],
    quickAccessText: translatedTexts[12] || navigationTexts[12],
    restaurantsText: translatedTexts[13] || navigationTexts[13],
    hotelsStaysText: translatedTexts[14] || navigationTexts[14],
    travelText: translatedTexts[15] || navigationTexts[15],
    entertainmentText: translatedTexts[16] || navigationTexts[16]
  }), [translatedTexts, navigationTexts]);

  // Handle category navigation
  const handleCategoryClick = useCallback((category: string) => {
    if (setSelectedCategory) {
      setSelectedCategory(category);
    }
  }, [setSelectedCategory]);

  const handleProfileClick = useCallback(() => {
    setLocation("/profile");
  }, [setLocation]);

  const handleAddService = useCallback(() => {
    setLocation('/add-product?type=lifestyle-service');
  }, [setLocation]);

  // Track navbar visibility
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

  // Auto-hide dropdown when user scrolls
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

  // Fetch lifestyle service suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/lifestyle-services/search?q=${encodeURIComponent(query.trim())}`);
      
      if (!response.ok) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }
      
      const data = await response.json();
      const services = Array.isArray(data) ? data : [];
      
      // Limit to 5 suggestions
      setSuggestions(services.slice(0, 5));
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

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      return;
    }
    
    setShowSuggestions(false);
    // The parent component (lifestyle.tsx) will handle the search filtering
  }, []);

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, [setSearchTerm]);

  // Handle search submission
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  }, [handleSearch, searchTerm]);

  return (
    <div ref={navRef} className="bg-white border-b border-gray-200 py-6 relative">
      <div className="container mx-auto px-4">
        {/* Desktop layout */}
        <div className="hidden md:flex relative items-center justify-between w-full">
          {/* Left side - Profile + Add Service */}
          <div className="flex-shrink-0 flex items-center gap-3">
            {isAuthenticated && (
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
            )}
            {isAuthenticated && (
              <Button
                onClick={handleAddService}
                className="h-10 px-4 bg-transparent text-black hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium"
                style={{ fontSize: '12px' }}
                data-testid="button-add-service-desktop"
              >
                <Plus className="h-4 w-4" />
                {translatedLabels.addServiceText}
              </Button>
            )}
          </div>

          {/* Center navigation - Category buttons */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center flex-nowrap gap-2 md:gap-3 lg:gap-4 xl:gap-6">
            {/* Order Food */}
            <div 
              className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center flex-shrink-0"
              onClick={() => handleCategoryClick("restaurant")}
              data-testid="button-category-restaurant"
            >
              <div className="relative">
                <span className={`text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                  selectedCategory === 'restaurant' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  {translatedLabels.orderFoodText}
                </span>
                <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                  selectedCategory === 'restaurant' 
                    ? 'bg-black w-full' 
                    : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
                }`} />
              </div>
            </div>
            
            {/* Reservations */}
            <div 
              className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center flex-shrink-0"
              onClick={() => handleCategoryClick("hotels")}
              data-testid="button-category-hotels"
            >
              <div className="relative">
                <span className={`text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                  selectedCategory === 'hotels' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  {translatedLabels.reservationsText}
                </span>
                <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                  selectedCategory === 'hotels' 
                    ? 'bg-black w-full' 
                    : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
                }`} />
              </div>
            </div>
          </div>

          {/* Right side - Search bar */}
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
          </div>
        </div>
      </div>

      {/* Search suggestions dropdown */}
      {showSuggestions && isNavVisible && (
        <div className="absolute left-0 right-0 top-full bg-white shadow-2xl z-[60] border-t-0 border-x-0 border-b border-gray-200 w-full">
          <div className="container mx-auto px-4">
            <div className="px-6 py-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-black">
                <p className="text-xs font-normal">Find lifestyle services...</p>
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
                  {suggestions.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => {
                        setSearchTerm(service.title);
                        setShowSuggestions(false);
                      }}
                      className="flex items-center gap-3 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                      data-testid={`suggestion-service-${service.id}`}
                    >
                      <div className="w-14 h-14 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                        {service.images && service.images.length > 0 ? (
                          <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{service.title}</p>
                        <p className="text-xs text-gray-500 truncate">{service.description}</p>
                        {service.price && (
                          <p className="text-sm font-semibold text-green-600 mt-0.5">
                            {service.currency || 'USD'} {service.price}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-8">
                  {/* Trending Services */}
                  <div>
                    <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.trendingServicesText}</h3>
                    <div className="space-y-2.5">
                      {[
                        translatedLabels.restaurantsText,
                        translatedLabels.hotelsStaysText,
                        translatedLabels.activitiesText
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

                  {/* Popular Categories */}
                  <div>
                    <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.popularCategoriesText}</h3>
                    <div className="space-y-2.5">
                      {[
                        { label: translatedLabels.orderFoodText, category: 'restaurant' },
                        { label: translatedLabels.reservationsText, category: 'hotels' },
                        { label: translatedLabels.flightsText, category: 'flights' }
                      ].map((item, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            handleCategoryClick(item.category);
                            setShowSuggestions(false);
                          }}
                          className="cursor-pointer"
                        >
                          <span className="text-xs underline hover:no-underline">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Access */}
                  <div>
                    <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.quickAccessText}</h3>
                    <div className="space-y-2.5">
                      {isAuthenticated && (
                        <div
                          onClick={() => {
                            handleAddService();
                            setShowSuggestions(false);
                          }}
                          className="cursor-pointer"
                        >
                          <span className="text-xs underline hover:no-underline">{translatedLabels.addServiceText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile layout */}
      <div className="container mx-auto px-4">
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            {/* Left side - Profile + Add Service */}
            <div className="flex items-center gap-2">
              {isAuthenticated && (
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
              )}
              {isAuthenticated && (
                <Button
                  onClick={handleAddService}
                  className="h-8 px-3 bg-transparent text-black hover:bg-gray-100 transition-colors flex items-center gap-1.5 font-medium"
                  style={{ fontSize: '10px' }}
                  data-testid="button-add-service-mobile"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              )}
            </div>

            {/* Right side - Hamburger menu */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              data-testid="button-hamburger-mobile"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile search bar */}
          <div className="mt-4">
            <div ref={searchRef} className="relative">
              <form onSubmit={handleSearchSubmit}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  data-testid="search-input-mobile"
                  placeholder={translatedLabels.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-10 h-9 pr-4 border-0 border-b-2 border-black rounded-none bg-transparent focus:border-black focus:ring-0"
                />
              </form>
            </div>
          </div>

          {/* Mobile category tabs */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleCategoryClick("restaurant")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === 'restaurant'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="button-category-restaurant-mobile"
            >
              {translatedLabels.orderFoodText}
            </button>
            <button
              onClick={() => handleCategoryClick("hotels")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === 'hotels'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="button-category-hotels-mobile"
            >
              {translatedLabels.reservationsText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
