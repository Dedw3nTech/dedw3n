import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Search, User, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import UserMenu from "../ui/user-menu";
import Logo from "../ui/logo";

interface SearchSuggestion {
  id: number;
  title: string;
  subtitle: string;
  type: 'user' | 'product';
  avatar?: string;
  image?: string;
}

export default function Header() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch search suggestions when user types
  const { data: suggestions = [] } = useQuery<SearchSuggestion[]>({
    queryKey: ['/api/search/suggestions', searchQuery],
    enabled: searchQuery.length >= 2 && showSuggestions,
    staleTime: 300, // Cache for 300ms to reduce API calls
  });

  // Handle clicks outside search to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const detectSearchType = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // User indicators
    if (lowerQuery.includes('@') || lowerQuery.match(/^user/i) || lowerQuery.match(/profile/i)) {
      return "users";
    }
    
    // Service indicators
    if (lowerQuery.match(/\b(service|help|support|consulting|repair|maintenance|cleaning|delivery)\b/i)) {
      return "services";
    }
    
    // Vendor/business indicators
    if (lowerQuery.match(/\b(vendor|business|company|shop|store|seller)\b/i)) {
      return "vendors";
    }
    
    // Product indicators (default for most searches)
    if (lowerQuery.match(/\b(buy|sell|price|product|item|for sale)\b/i) || 
        lowerQuery.match(/\$\d+/) || 
        lowerQuery.length < 3) {
      return "products";
    }
    
    // Default to products for general searches
    return "products";
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    if (suggestion.type === 'user') {
      setLocation(`/profile/${suggestion.id}`);
    } else if (suggestion.type === 'product') {
      setLocation(`/product/${suggestion.id}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const detectedType = detectSearchType(searchQuery.trim());
      const searchParams = new URLSearchParams({
        q: searchQuery.trim(),
        type: detectedType
      });
      setLocation(`/search?${searchParams.toString()}`);
      setShowSuggestions(false);
    }
  };

  return (
    <header className="bg-background shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Single header row with everything aligned */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            <span className="text-xs font-bold text-blue-600 ml-1">BETA VERSION</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Navigation links next to search */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setLocation("/products")}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                Marketplace
              </button>
              <button
                onClick={() => setLocation("/community")}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                Community
              </button>
              <button
                onClick={() => setLocation("/dating")}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                Dating
              </button>
            </div>
            {/* Smart Search Bar with Suggestions */}
            <div className="relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(e.target.value.length >= 2);
                      setSelectedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (searchQuery.length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                    className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.type}-${suggestion.id}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50 ${
                        index === selectedIndex ? 'bg-gray-100' : ''
                      }`}
                    >
                      {suggestion.type === 'user' ? (
                        <div className="flex items-center space-x-3 w-full">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              @{suggestion.subtitle}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 w-full">
                          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {suggestion.subtitle}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}