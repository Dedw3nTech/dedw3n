import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Plus, Briefcase, Users, Heart, GraduationCap, Truck, HandHeart, Menu } from 'lucide-react';

interface Service {
  id: number;
  userId: number;
  category: string;
  title: string;
  description: string | null;
  location: string | null;
  price: string | null;
  currency: string | null;
  images: string[] | null;
}

interface ServicesNavProps {
  selectedCategory?: string;
  setSelectedCategory?: (category: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function ServicesNav({
  selectedCategory = 'all',
  setSelectedCategory = () => {},
  searchTerm: externalSearchTerm = '',
  setSearchTerm: externalSetSearchTerm = () => {}
}: ServicesNavProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Service[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const searchTerm = externalSearchTerm || localSearchTerm;
  const setSearchTerm = externalSetSearchTerm || setLocalSearchTerm;

  const navigationTexts = useMemo(() => [
    "Jobs",
    "Freelance",
    "Health",
    "Education",
    "Utilities",
    "Courier & Freight",
    "Charities & NGOs",
    "All Services",
    "Add a Service",
    "Search",
    "Cancel",
    "TRENDING SERVICES",
    "POPULAR CATEGORIES",
    "QUICK ACCESS",
    "Services"
  ], []);

  const { translations: translatedTexts } = useMasterBatchTranslation(navigationTexts);

  const translatedLabels = useMemo(() => ({
    jobsText: translatedTexts[0] || navigationTexts[0],
    freelancerText: translatedTexts[1] || navigationTexts[1],
    healthText: translatedTexts[2] || navigationTexts[2],
    educationText: translatedTexts[3] || navigationTexts[3],
    utilitiesText: translatedTexts[4] || navigationTexts[4],
    courierFreightText: translatedTexts[5] || navigationTexts[5],
    charitiesNgosText: translatedTexts[6] || navigationTexts[6],
    allServicesText: translatedTexts[7] || navigationTexts[7],
    addServiceText: translatedTexts[8] || navigationTexts[8],
    searchText: translatedTexts[9] || navigationTexts[9],
    cancelText: translatedTexts[10] || navigationTexts[10],
    trendingServicesText: translatedTexts[11] || navigationTexts[11],
    popularCategoriesText: translatedTexts[12] || navigationTexts[12],
    quickAccessText: translatedTexts[13] || navigationTexts[13],
    servicesText: translatedTexts[14] || navigationTexts[14]
  }), [translatedTexts, navigationTexts]);

  const handleCategoryClick = useCallback((category: string) => {
    // Navigate to dedicated route for Jobs and Freelance
    if (category === 'jobs') {
      setLocation('/services/jobs');
    } else if (category === 'freelance') {
      setLocation('/services/freelance');
    } else {
      setSelectedCategory(category);
    }
    setShowSuggestions(false);
  }, [setSelectedCategory, setLocation]);

  const handleProfileClick = useCallback(() => {
    setLocation("/services-profile");
  }, [setLocation]);

  const handleAddService = useCallback(() => {
    setLocation('/add-product');
  }, [setLocation]);

  const handleSearchFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/services/search?q=${encodeURIComponent(query.trim())}`);
      
      if (!response.ok) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }
      
      const data = await response.json();
      const services = Array.isArray(data) ? data : [];
      
      setSuggestions(services.slice(0, 5));
    } catch (error) {
      console.error('Suggestion fetch error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, fetchSuggestions]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      return;
    }
    
    setShowSuggestions(false);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, [setSearchTerm]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  }, [handleSearch, searchTerm]);

  return (
    <div ref={navRef} className="bg-white border-b border-gray-200 py-6 relative">
      <div className="container mx-auto px-4">
        <div className="hidden md:flex relative items-center justify-between w-full">
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

          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center flex-nowrap gap-2 md:gap-3 lg:gap-4 xl:gap-6">
            <div 
              className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center flex-shrink-0"
              onClick={() => handleCategoryClick("jobs")}
              data-testid="button-category-jobs"
            >
              <div className="relative">
                <span className={`text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                  selectedCategory === 'jobs' 
                    ? 'text-black' 
                    : 'text-gray-600 group-hover:text-black'
                }`}>
                  {translatedLabels.jobsText}
                </span>
                <div 
                  className={`absolute -bottom-2 left-0 right-0 h-0.5 bg-black transition-all duration-300 ${
                    selectedCategory === 'jobs' 
                      ? 'opacity-100' 
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                />
              </div>
            </div>

            <div 
              className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center flex-shrink-0"
              onClick={() => handleCategoryClick("freelance")}
              data-testid="button-category-freelance"
            >
              <div className="relative">
                <span className={`text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                  selectedCategory === 'freelance' 
                    ? 'text-black' 
                    : 'text-gray-600 group-hover:text-black'
                }`}>
                  {translatedLabels.freelancerText}
                </span>
                <div 
                  className={`absolute -bottom-2 left-0 right-0 h-0.5 bg-black transition-all duration-300 ${
                    selectedCategory === 'freelance' 
                      ? 'opacity-100' 
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                ref={searchRef}
                type="text"
                placeholder={translatedLabels.searchText}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={handleSearchFocus}
                className="w-[200px] lg:w-[250px] xl:w-[300px] pl-10 pr-4 h-10 bg-white border-gray-300 focus:border-black transition-colors"
                data-testid="input-search-desktop"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </form>
          </div>
        </div>

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
                  className="px-4 bg-transparent text-black hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium"
                  style={{ height: '45px', fontSize: '15px' }}
                  data-testid="button-add-service-mobile"
                >
                  <Plus style={{ height: '21px', width: '21px' }} />
                  Add
                </Button>
              )}
            </div>

            {/* Search bar and hamburger menu for mobile */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="relative flex-1 max-w-[160px]">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    data-testid="input-search-mobile"
                    type="text"
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
                    onFocus={handleSearchFocus}
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

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 mt-0">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold tracking-wide">{translatedLabels.searchText}</h3>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-xs underline hover:no-underline cursor-pointer"
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
                          <Briefcase className="h-6 w-6 text-gray-400" />
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
                <div>
                  <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.trendingServicesText}</h3>
                  <div className="space-y-2.5">
                    {[
                      translatedLabels.jobsText,
                      translatedLabels.freelancerText,
                      translatedLabels.healthText,
                      translatedLabels.educationText
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

                <div>
                  <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.popularCategoriesText}</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: translatedLabels.jobsText, category: 'jobs' },
                      { label: translatedLabels.freelancerText, category: 'freelance' },
                      { label: translatedLabels.healthText, category: 'health' }
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

                <div>
                  <h3 className="text-xs font-bold mb-3 tracking-wide">{translatedLabels.quickAccessText}</h3>
                  <div className="space-y-2.5">
                    <div
                      onClick={() => {
                        handleCategoryClick('all');
                        setShowSuggestions(false);
                      }}
                      className="cursor-pointer"
                    >
                      <span className="text-xs underline hover:no-underline">{translatedLabels.allServicesText}</span>
                    </div>
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
      )}

      {/* Sidebar for services category navigation */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle>{translatedLabels.servicesText}</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-2">
            {/* Services Category Navigation Buttons */}
            <div className="space-y-1">
              
              <Button
                variant="ghost"
                className="w-full justify-start h-12"
                onClick={() => {
                  handleCategoryClick("jobs");
                  setIsSidebarOpen(false);
                }}
                data-testid="sidebar-button-jobs"
              >
                <span className="text-xs">{translatedLabels.jobsText}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-12"
                onClick={() => {
                  handleCategoryClick("freelance");
                  setIsSidebarOpen(false);
                }}
                data-testid="sidebar-button-freelance"
              >
                <span className="text-xs">{translatedLabels.freelancerText}</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
