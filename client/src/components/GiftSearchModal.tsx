import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, Heart, Calendar, MapPin, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchResult {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  type: 'product' | 'event';
  vendor?: {
    id: number;
    storeName: string;
    rating: number;
  };
  date?: string;
  location?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  suggestions: string[];
  searchTerm: string;
}

interface GiftSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGift: (gift: SearchResult) => void;
  selectedGifts: number[];
}

export function GiftSearchModal({ isOpen, onClose, onSelectGift, selectedGifts }: GiftSearchModalProps) {
  const { t } = useMasterTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'products' | 'events'>('all');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search query
  const { data: searchData, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ['/api/search/gifts', debouncedSearch, selectedType],
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleGiftSelect = (gift: SearchResult) => {
    onSelectGift(gift);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            {t('dating.gifts.search_title', 'Search Gifts')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                ref={inputRef}
                type="text"
                placeholder={t('dating.gifts.search_placeholder', 'Search for gifts, products, or events...')}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                onFocus={() => setShowSuggestions(true)}
              />
            </div>

            {/* Search Suggestions */}
            {showSuggestions && searchData?.suggestions && searchData.suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-background border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                <div className="p-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    {t('dating.gifts.suggestions', 'Suggestions')}
                  </span>
                </div>
                {searchData.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              {t('dating.gifts.filter_all', 'All')}
            </Button>
            <Button
              variant={selectedType === 'products' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('products')}
              className="flex items-center gap-1"
            >
              <Package className="h-3 w-3" />
              {t('dating.gifts.filter_products', 'Products')}
            </Button>
            <Button
              variant={selectedType === 'events' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('events')}
              className="flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              {t('dating.gifts.filter_events', 'Events')}
            </Button>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && debouncedSearch.length >= 2 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">{t('common.searching', 'Searching...')}</span>
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-destructive">
                {t('common.error_occurred', 'An error occurred while searching')}
              </div>
            )}

            {searchData && searchData.results.length === 0 && debouncedSearch.length >= 2 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                {t('dating.gifts.no_results', 'No gifts found for your search')}
              </div>
            )}

            {debouncedSearch.length < 2 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('dating.gifts.start_typing', 'Start typing to search for gifts...')}
              </div>
            )}

            {searchData && searchData.results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchData.results.map((gift) => (
                  <Card
                    key={`${gift.type}-${gift.id}`}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedGifts.includes(gift.id) ? 'ring-2 ring-pink-500 bg-pink-50' : ''
                    }`}
                    onClick={() => handleGiftSelect(gift)}
                  >
                    <CardContent className="p-4">
                      {/* Gift Image */}
                      {gift.imageUrl && (
                        <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={gift.imageUrl}
                            alt={gift.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Gift Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-sm leading-tight line-clamp-2">
                            {gift.name}
                          </h3>
                          <Badge variant={gift.type === 'product' ? 'default' : 'secondary'} className="ml-2 shrink-0">
                            {gift.type === 'product' ? (
                              <Package className="h-3 w-3 mr-1" />
                            ) : (
                              <Calendar className="h-3 w-3 mr-1" />
                            )}
                            {gift.type}
                          </Badge>
                        </div>

                        {gift.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {gift.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">
                            {formatPrice(gift.price)}
                          </span>
                          {selectedGifts.includes(gift.id) && (
                            <Heart className="h-4 w-4 text-pink-500 fill-current" />
                          )}
                        </div>

                        {gift.vendor && (
                          <div className="text-xs text-muted-foreground">
                            {t('common.by', 'By')} {gift.vendor.storeName}
                            {gift.vendor.rating && (
                              <span className="ml-1">⭐ {gift.vendor.rating.toFixed(1)}</span>
                            )}
                          </div>
                        )}

                        {gift.type === 'event' && gift.location && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {gift.location}
                          </div>
                        )}

                        <Badge variant="outline" className="text-xs">
                          {gift.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}