import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Package, Briefcase, Store } from "lucide-react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SearchResult {
  id: number;
  type: 'user' | 'product' | 'service' | 'vendor';
  title: string;
  description?: string;
  username?: string;
  name?: string;
  price?: number;
  avatar?: string;
  image?: string;
}

export default function SearchPage() {
  // Master Translation mega-batch for Search (30+ texts)
  const searchTexts = useMemo(() => [
    // Search Interface (10 texts)
    "Search", "Search Results", "No Results Found", "Search for...", "All", "Products", "Users", "Services", "Vendors", "Events",
    
    // Filters & Options (8 texts)
    "Filter Results", "Sort By", "Relevance", "Price Low to High", "Price High to Low", "Newest", "Oldest", "Most Popular",
    
    // Result Types (8 texts)
    "Product", "User", "Service", "Vendor", "Event", "Category", "Brand", "Location",
    
    // Actions (4 texts)
    "View Details", "Add to Cart", "Contact", "Follow"
  ], []);

  const { translations, isLoading } = useMasterBatchTranslation(searchTexts, 'instant');
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading translations...</div>;
  }
  
  const t = (text: string): string => {
    if (Array.isArray(translations)) {
      const index = searchTexts.indexOf(text);
      return index !== -1 ? translations[index] || text : text;
    }
    return text;
  };
  const [
    searchText, searchResultsText, noResultsFoundText, searchForText, allText, productsText, usersText, servicesText, vendorsText, eventsText,
    filterResultsText, sortByText, relevanceText, priceLowToHighText, priceHighToLowText, newestText, oldestText, mostPopularText,
    productText, userText, serviceText, vendorText, eventText, categoryText, brandText, locationText,
    viewDetailsText, addToCartText, contactText, followText
  ] = t || searchTexts;

  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState<URLSearchParams>();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("products");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
    setQuery(params.get('q') || '');
    setSearchType(params.get('type') || 'products');
  }, [location]);

  // Search users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/search', query],
    enabled: !!query && (searchType === 'users' || searchType === 'all'),
    select: (data: any[]) => data.map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.name || user.username,
      description: `@${user.username}${user.bio ? ' • ' + user.bio : ''}`,
      username: user.username,
      name: user.name,
      avatar: user.avatar
    }))
  });

  // Search products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products/search', query],
    enabled: !!query && (searchType === 'products' || searchType === 'all'),
    select: (data: any[]) => data.map(product => ({
      id: product.id,
      type: 'product' as const,
      title: product.name,
      description: product.description,
      price: product.price,
      image: product.imageUrl
    }))
  });

  // Extract price from content if available
  const extractPrice = (content: string): number | undefined => {
    const priceMatch = content.match(/\$(\d+(?:\.\d{2})?)/);
    return priceMatch ? parseFloat(priceMatch[1]) : undefined;
  };

  const allResults: SearchResult[] = [
    ...(users || []),
    ...(products || [])
  ];

  const isLoading = usersLoading || productsLoading;

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="h-4 w-4" />;
      case 'product': return <Package className="h-4 w-4" />;
      case 'service': return <Briefcase className="h-4 w-4" />;
      case 'vendor': return <Store className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'product': return 'bg-green-100 text-green-800';
      case 'service': return 'bg-purple-100 text-purple-800';
      case 'vendor': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Search</h1>
          <p className="text-gray-600">Enter a search term to find users, products, services, and vendors.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-5 w-5 text-gray-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Search Results for "{query}"
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary text-white">
            {getIcon(searchType)}
            {searchType.charAt(0).toUpperCase() + searchType.slice(1)}
          </span>
          <span className="text-sm text-gray-500">
            {allResults.length} result{allResults.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search Results */}
      {!isLoading && allResults.length > 0 && (
        <div className="space-y-4">
          {allResults.map((result) => (
            <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar/Image */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {result.avatar || result.image ? (
                      <img 
                        src={result.avatar || result.image} 
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getIcon(result.type)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {result.title}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                        {getIcon(result.type)}
                        {result.type}
                      </span>
                    </div>
                    
                    {result.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {result.description}
                      </p>
                    )}

                    {result.price && (
                      <p className="text-lg font-bold text-green-600">
                        ${result.price.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (result.type === 'user') {
                        window.location.href = `/profile/${result.username}`;
                      } else {
                        window.location.href = `/product/${result.id}`;
                      }
                    }}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && allResults.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No results found</h2>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or search for something else.
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      )}
    </div>
  );
}