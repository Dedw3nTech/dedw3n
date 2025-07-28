import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useCart } from '@/hooks/use-cart';
import { useCurrency } from '@/contexts/CurrencyContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, Store, MapPin, Star, Users, Heart, ShoppingCart, 
  Filter, Grid, List, ArrowLeft, Share2, MessageCircle, 
  Truck, Shield, Award, Calendar
} from 'lucide-react';

interface VendorStoreData {
  id: number;
  storeName: string;
  businessName?: string;
  description: string;
  location?: string;
  rating?: number;
  totalProducts: number;
  totalSales?: number;
  imageUrl?: string;
  bannerUrl?: string;
  badges?: string[];
  createdAt: string;
  products: Product[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  category: string;
  inventory: number;
  isNew: boolean;
  isOnSale: boolean;
  rating?: number;
  reviews?: number;
}

export default function VendorStorePage() {
  const [match] = useRoute('/vendor/:slug');
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  
  const { addToCart } = useCart();
  const { selectedCurrency, currencyRate } = useCurrency();

  // Translation texts
  const storeTexts = [
    "Visit Store",
    "Products",
    "Sales", 
    "Reviews",
    "Rating",
    "Verified Vendor",
    "New Vendor",
    "Top Seller",
    "Featured",
    "Search products...",
    "Sort by",
    "Price: Low to High",
    "Price: High to Low",
    "Newest First",
    "Best Selling",
    "Highest Rated",
    "Add to Cart",
    "View Product",
    "Contact Vendor",
    "Share Store",
    "About This Store",
    "Store Policies",
    "Fast Shipping",
    "Secure Payment",
    "Quality Guarantee",
    "Member since",
    "All Products",
    "On Sale",
    "New Arrivals",
    "Best Sellers",
    "Store not found",
    "Go back to vendors",
    "Loading store...",
    "No products found",
    "Try adjusting your search or filters"
  ];

  const { translations, isLoading: isTranslating } = useMasterBatchTranslation(storeTexts);
  const t = (text: string) => translations?.[text] || text;

  const vendorSlug = match?.slug;

  // Fetch vendor store data
  const { data: storeData, isLoading, error } = useQuery({
    queryKey: ['/api/vendor/store', vendorSlug],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/vendor/store/${vendorSlug}`);
      return response.json();
    },
    enabled: !!vendorSlug
  });

  // Filter and sort products
  const filteredProducts = storeData?.products?.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  const formatPrice = (price: number) => {
    const convertedPrice = price * currencyRate;
    return `${selectedCurrency.symbol}${convertedPrice.toFixed(2)}`;
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product.id, 1);
  };

  const handleProductClick = (productId: number) => {
    setLocation(`/product/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Store Header Skeleton */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <Skeleton className="h-48 w-full mb-6 rounded-lg" />
              <div className="flex items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-96 mb-4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Products Skeleton */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-6 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t("Store not found")}
          </h2>
          <p className="text-gray-600 mb-6">
            The store you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation('/vendors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("Go back to vendors")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Banner */}
            {storeData.bannerUrl && (
              <div className="h-48 rounded-lg overflow-hidden mb-6">
                <img 
                  src={storeData.bannerUrl} 
                  alt={`${storeData.storeName} banner`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Store Info */}
            <div className="flex items-start gap-6 mb-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {storeData.imageUrl ? (
                  <img 
                    src={storeData.imageUrl} 
                    alt={storeData.storeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="h-12 w-12 text-white" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {storeData.storeName}
                  </h1>
                  {storeData.badges?.map((badge) => (
                    <Badge key={badge} variant="secondary" className="bg-green-100 text-green-800">
                      <Award className="h-3 w-3 mr-1" />
                      {t(badge)}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-gray-600 mb-4 max-w-2xl">
                  {storeData.description}
                </p>
                
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Store className="h-4 w-4" />
                    <span>{storeData.totalProducts} {t("Products")}</span>
                  </div>
                  {storeData.totalSales && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{storeData.totalSales} {t("Sales")}</span>
                    </div>
                  )}
                  {storeData.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{storeData.rating.toFixed(1)} {t("Rating")}</span>
                    </div>
                  )}
                  {storeData.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{storeData.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{t("Member since")} {new Date(storeData.createdAt).getFullYear()}</span>
                  </div>
                </div>
                
                {/* Store Features */}
                <div className="flex gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    <Truck className="h-3 w-3" />
                    {t("Fast Shipping")}
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    <Shield className="h-3 w-3" />
                    {t("Secure Payment")}
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    <Award className="h-3 w-3" />
                    {t("Quality Guarantee")}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t("Contact Vendor")}
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  {t("Share Store")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("Search products...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="featured">{t("Featured")}</option>
                <option value="price-low">{t("Price: Low to High")}</option>
                <option value="price-high">{t("Price: High to Low")}</option>
                <option value="newest">{t("Newest First")}</option>
                <option value="rating">{t("Highest Rated")}</option>
              </select>
              
              <div className="flex border border-gray-300 rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("No products found")}
              </h3>
              <p className="text-gray-500">
                {t("Try adjusting your search or filters")}
              </p>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {sortedProducts.map((product: Product) => (
                <Card 
                  key={product.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        viewMode === 'grid' ? 'h-48' : 'h-32'
                      }`}
                    />
                    {product.isNew && (
                      <Badge className="absolute top-2 left-2 bg-green-500">
                        New
                      </Badge>
                    )}
                    {product.isOnSale && (
                      <Badge className="absolute top-2 right-2 bg-red-500">
                        Sale
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          {formatPrice(product.discountPrice || product.price)}
                        </span>
                        {product.discountPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t("Add to Cart")}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}