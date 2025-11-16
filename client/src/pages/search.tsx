import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Package, Briefcase, Store, Globe, Sparkles, Clock } from "lucide-react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useCurrency } from "@/hooks/use-currency";
import { convertCurrency, currencySymbols, CurrencyCode } from "@/lib/currencyConverter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketplaceNav } from "@/components/layout/MarketplaceNav";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { buildSearchActionSchema } from "@/lib/buildSeoStructuredData";

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
  relevanceScore?: number;
  matchedLanguage?: string;
}

// Component to handle price display with currency conversion
function PriceDisplay({ price, productCurrency, userCurrency }: { 
  price: number; 
  productCurrency?: string; 
  userCurrency: string;
}) {
  try {
    const fromCurrency = (productCurrency?.toUpperCase() || 'GBP') as CurrencyCode;
    const toCurrency = userCurrency as CurrencyCode;
    const convertedAmount = convertCurrency(price, fromCurrency, toCurrency);
    const symbol = currencySymbols[toCurrency] || '$';
    
    console.log(`[PriceDisplay] Converting ${price} ${fromCurrency} → ${toCurrency}: ${convertedAmount} (symbol: ${symbol})`);
    
    return (
      <p className="text-[12px] font-semibold text-gray-900">
        {symbol}{convertedAmount.toFixed(2)}
      </p>
    );
  } catch (error) {
    console.error('Error converting currency:', error, { price, productCurrency, userCurrency });
    return (
      <p className="text-[12px] font-semibold text-gray-900">
        £{price.toFixed(2)}
      </p>
    );
  }
}

// Component to handle product title translation
function TranslatedProductTitle({ title, userLanguage, className }: { 
  title: string;
  userLanguage: string;
  className?: string;
}) {
  const [translatedTitle, setTranslatedTitle] = useState(title);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // Reset to original title when title changes
    setTranslatedTitle(title);
    setIsTranslating(false);
    
    // Only translate if user language is not English and title exists
    if (userLanguage && userLanguage !== 'EN' && title && !isTranslating) {
      setIsTranslating(true);
      
      const translateTitle = async () => {
        try {
          const response = await fetch('/api/translate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              texts: [title],
              targetLanguage: userLanguage,
              priority: 'instant'
            })
          });

          if (response.ok) {
            const data = await response.json();
            const translated = data?.translations?.[0]?.translatedText;
            if (translated && translated !== title) {
              setTranslatedTitle(translated);
            }
          }
        } catch (error) {
          console.error('Error translating product title:', error);
        } finally {
          setIsTranslating(false);
        }
      };

      translateTitle();
    }
  }, [title, userLanguage]);

  return <h4 className={className}>{translatedTitle}</h4>;
}

export default function SearchPage() {
  // Master Translation mega-batch for Search (30+ texts)
  const searchTexts = useMemo(() => [
    // Search Interface (11 texts)
    "Search", "Search Results", "No Results Found", "Search for...", "All", "Products", "Users", "Services", "Vendors", "Events", "Enter a search term to find users, products, services, and vendors.",
    
    // Filters & Options (8 texts)
    "Filter Results", "Sort By", "Relevance", "Price Low to High", "Price High to Low", "Newest", "Oldest", "Most Popular",
    
    // Result Types (8 texts)
    "Product", "User", "Service", "Vendor", "Event", "Category", "Brand", "Location",
    
    // Actions (5 texts)
    "View Details", "Add to Cart", "Contact", "Follow", "View",
    
    // No Results (3 texts)
    "No results were found for", "Try adjusting your search terms or search for something else.", "Continue your exploration",
    
    // Results info (2 texts)
    "result", "results",
    
    // Marketplace Types (5 texts)
    "Business to Consumer", "Consumer to Consumer", "Business to Business", "Raw Materials", "Requests"
  ], []);

  const { translations, isLoading: translationsLoading } = useMasterBatchTranslation(searchTexts, 'instant');
  const { currency: userCurrency } = useCurrency();
  const [currencyKey, setCurrencyKey] = useState(0);
  
  // Listen for currency changes to force re-render
  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrencyKey(prev => prev + 1);
    };
    
    window.addEventListener('currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('currency-changed', handleCurrencyChange);
  }, []);
  
  // Update currencyKey when userCurrency changes
  useEffect(() => {
    setCurrencyKey(prev => prev + 1);
  }, [userCurrency]);
  
  // Helper function for safe translation access using array index
  const t = (text: string): string => {
    const index = searchTexts.indexOf(text);
    return index >= 0 && translations ? translations[index] || text : text;
  };
  
  // Helper function to translate marketplace types
  const getMarketplaceLabel = (marketplace: string): string => {
    const marketplaceMap: { [key: string]: string } = {
      'b2c': 'Business to Consumer',
      'c2c': 'Consumer to Consumer',
      'b2b': 'Business to Business',
      'raw': 'Raw Materials',
      'rqst': 'Requests'
    };
    const label = marketplaceMap[marketplace.toLowerCase()];
    return label ? t(label) : marketplace.toUpperCase();
  };
  
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState<URLSearchParams>();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [translatedQuery, setTranslatedQuery] = useState<string | null>(null);
  const [shouldTranslate, setShouldTranslate] = useState(false);
  const [userLanguage, setUserLanguage] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('userLanguage') || 'EN' : 'EN';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
    const searchQuery = params.get('q') || '';
    setQuery(searchQuery);
    setSearchTerm(searchQuery);
    setSearchType(params.get('type') || 'products');
    setTranslatedQuery(null);
    setShouldTranslate(false);
    
    // Get user's language preference
    const storedLanguage = localStorage.getItem('userLanguage') || 'EN';
    setUserLanguage(storedLanguage);
  }, [location]);

  // Search users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/search', { q: query }],
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

  // Search products with multi-language support - handle the response structure from backend
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products/search', { q: query, language: userLanguage }],
    enabled: !!query && (searchType === 'products' || searchType === 'all'),
    select: (data: any) => {
      // Backend returns { results: [], byMarketplace: {}, query: '', marketplaceFilter: '', total: 0, multiLanguage: true, cached: boolean }
      return {
        products: (data?.results || []).map((product: any) => ({
          id: product.id,
          type: 'product' as const,
          title: product.name || product.title,
          description: product.description,
          price: product.price,
          image: product.imageUrl,
          marketplace: product.marketplace,
          vendor: product.vendor,
          relevanceScore: product.relevanceScore,
          matchedLanguage: product.matchedLanguage
        })),
        cached: data?.cached || false,
        multiLanguage: data?.multiLanguage || false,
        searchLanguage: data?.searchLanguage || 'EN'
      };
    }
  });
  
  const products = productsData?.products || [];
  const isCachedResult = productsData?.cached || false;
  const isMultiLanguageSearch = productsData?.multiLanguage || false;

  // Trigger translation when no products found
  useEffect(() => {
    if (!productsLoading && products && products.length === 0 && query && !shouldTranslate && !translatedQuery) {
      setShouldTranslate(true);
    }
  }, [products, productsLoading, query, shouldTranslate, translatedQuery]);

  // Fetch translation when needed
  useEffect(() => {
    if (shouldTranslate && query) {
      const translateQuery = async () => {
        try {
          const response = await fetch('/api/translate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              texts: [query.trim()],
              targetLanguage: 'EN',
              priority: 'instant'
            })
          });

          if (response.ok) {
            const data = await response.json();
            const translated = data?.translations?.[0]?.translatedText;
            if (translated && translated.toLowerCase() !== query.trim().toLowerCase()) {
              setTranslatedQuery(translated);
            } else {
              setTranslatedQuery(null);
            }
          }
        } catch (error) {
          console.error('Translation error:', error);
        } finally {
          setShouldTranslate(false);
        }
      };

      translateQuery();
    }
  }, [shouldTranslate, query]);

  // Search with translated query
  const { data: translatedProducts, isLoading: translatedProductsLoading } = useQuery({
    queryKey: ['/api/products/search', { q: translatedQuery }],
    enabled: !!translatedQuery && (searchType === 'products' || searchType === 'all'),
    select: (data: any) => {
      const productResults = data?.results || [];
      return productResults.map((product: any) => ({
        id: product.id,
        type: 'product' as const,
        title: product.name || product.title,
        description: product.description,
        price: product.price,
        image: product.imageUrl,
        marketplace: product.marketplace,
        vendor: product.vendor
      }));
    }
  });

  // Extract price from content if available
  const extractPrice = (content: string): number | undefined => {
    const priceMatch = content.match(/\$(\d+(?:\.\d{2})?)/);
    return priceMatch ? parseFloat(priceMatch[1]) : undefined;
  };

  // Combine original and translated products
  const finalProducts = (products && products.length > 0) ? products : (translatedProducts || []);

  const allResults: SearchResult[] = [
    ...(users || []),
    ...finalProducts
  ];

  const searchResultsLoading = usersLoading || productsLoading || translatedProductsLoading;

  // Fetch exploration products for "Continue your exploration" section (only when no results)
  const shouldShowExploration = !searchResultsLoading && allResults.length === 0 && !!query;
  
  const { data: explorationProducts, isLoading: explorationLoading } = useQuery({
    queryKey: ['/api/products'],
    enabled: shouldShowExploration,
    select: (data: any[]) => {
      // Take first 10 products from all marketplaces
      return (data || []).slice(0, 10).map((product: any) => ({
        id: product.id,
        title: product.name || product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        image: product.imageUrl || product.image_url,
        marketplace: product.marketplace
      }));
    }
  });

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
      <>
        <SEOHead 
          title="Search Results - Dedw3n"
          description="Search results for products, vendors, and services on Dedw3n marketplace."
          structuredData={buildSearchActionSchema()}
        />
        <MarketplaceNav searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("Search")}</h1>
            <p className="text-gray-600">{t("Enter a search term to find users, products, services, and vendors.")}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title={`Search Results${query ? ` for "${query}"` : ''} - Dedw3n`}
        description={`Search results for products, vendors, and services${query ? ` matching "${query}"` : ''} on Dedw3n marketplace.`}
        structuredData={buildSearchActionSchema()}
      />
      <MarketplaceNav searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-transparent mb-2">
            Search Results for "{query}"
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-transparent"></span>
            <span className="text-sm text-transparent">
              {allResults.length} {allResults.length !== 1 ? t("results") : t("result")} found
            </span>
            
            {/* Multi-language indicator */}
            {isMultiLanguageSearch && (
              <Badge variant="secondary" className="gap-1 opacity-0" data-testid="badge-multilang-search"></Badge>
            )}
            
            {/* Cached result indicator */}
            {isCachedResult && (
              <Badge variant="outline" className="gap-1 opacity-0" data-testid="badge-cached-result"></Badge>
            )}
          </div>
        </div>

        {/* Loading State */}
        {searchResultsLoading && (
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
        {!searchResultsLoading && allResults.length > 0 && (
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-gray-900 truncate">
                          {result.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                          {getIcon(result.type)}
                          {result.type}
                        </span>
                        
                        {/* Language match indicator */}
                        {result.matchedLanguage === 'translated' && (
                          <Badge variant="secondary" className="gap-1 text-xs" data-testid={`badge-translated-${result.id}`}>
                            <Globe className="h-3 w-3" />
                            Translated match
                          </Badge>
                        )}
                        
                        {/* Relevance score for debugging (remove in production) */}
                        {result.relevanceScore && result.relevanceScore > 0 && (
                          <span className="text-xs text-gray-400">
                            Score: {result.relevanceScore}
                          </span>
                        )}
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
                      {t("View")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!searchResultsLoading && allResults.length === 0 && (
          <>
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("No results were found for")} "{query}"</h2>
              <p className="text-gray-600 mb-4">
                {t("Try adjusting your search terms or search for something else.")}
              </p>
            </div>

            {/* Continue your exploration section */}
            {explorationProducts && explorationProducts.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  {t("Continue your exploration")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {explorationProducts.map((product: any) => (
                    <Card 
                      key={`${product.id}-${userCurrency}-${currencyKey}`} 
                      className="border-0 shadow-none bg-white cursor-pointer"
                      onClick={() => window.location.href = `/product/${product.id}`}
                      data-testid={`exploration-product-${product.id}`}
                    >
                      <CardContent className="p-3">
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}