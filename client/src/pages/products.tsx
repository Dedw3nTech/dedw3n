import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link as WouterLink } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';
import { useMarketType } from '@/hooks/use-market-type';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { VideoDisplayCard } from '@/components/VideoDisplayCard';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShoppingCart, Search, SlidersHorizontal, Share2, Heart, ChevronDown, Plus, Grid3X3, List, Filter, Gift } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function Products() {
  usePageTitle({ title: 'Products' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [showSale, setShowSale] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [, setLocation] = useLocation();
  const { marketType } = useMarketType();
  const { formatPrice: currencyFormatPrice } = useCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Video content based on marketplace type
  const getMarketplaceVideo = () => {
    switch (marketType) {
      case 'b2b':
        return {
          video: '/attached_assets/Cafe_1749419425062.mp4',
          title: 'Business Networking & Solutions'
        };
      case 'b2c':
        return {
          video: '/attached_assets/Be yourself_1749419131578.mp4',
          title: 'Be Yourself - Shop Your Style'
        };
      case 'c2c':
        return {
          video: '/attached_assets/car selling online  _1749419270298.mp4',
          title: 'Sell Your Vehicle Online'
        };
      default:
        return {
          video: '/attached_assets/Cafe.mp4',
          title: 'Marketplace Experience'
        };
    }
  };

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', { 
      search: searchTerm,
      categories: selectedCategories,
      productTypes: selectedProductTypes,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      showSale,
      showNew,
      sortBy,
      limit: itemsPerPage
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategories.length) params.append('categories', selectedCategories.join(','));
      if (selectedProductTypes.length) params.append('productTypes', selectedProductTypes.join(','));
      if (priceRange[0] > 0) params.append('minPrice', priceRange[0].toString());
      if (priceRange[1] < 1000) params.append('maxPrice', priceRange[1].toString());
      if (showSale) params.append('onSale', 'true');
      if (showNew) params.append('newArrivals', 'true');
      if (sortBy) params.append('sortBy', sortBy);
      if (itemsPerPage) params.append('limit', itemsPerPage.toString());

      const response = await apiRequest('GET', `/api/products?${params.toString()}`);
      return response.json();
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (productId: number) => 
      apiRequest('POST', '/api/cart', { body: { productId, quantity: 1 } }),
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: "Product added to your shopping cart!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to cart.",
        variant: "destructive",
      });
    }
  });

  // Like product mutation
  const likeProductMutation = useMutation({
    mutationFn: (productId: number) => 
      apiRequest('POST', '/api/liked-products', { body: { productId } }),
    onSuccess: () => {
      toast({
        title: "Added to Liked",
        description: "Product added to your liked items!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like product.",
        variant: "destructive",
      });
    }
  });

  // Gift product mutation
  const giftProductMutation = useMutation({
    mutationFn: (productId: number) => 
      apiRequest('POST', '/api/gifts', { body: { productId } }),
    onSuccess: () => {
      toast({
        title: "Gift Prepared",
        description: "Product prepared for gifting!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to prepare gift.",
        variant: "destructive",
      });
    }
  });

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleProductType = (type: string) => {
    setSelectedProductTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Filter sidebar content
  const FilterContent = () => (
    <div className="space-y-4 text-[14px]">
      {/* Video Display Component */}
      <div className="mb-4">
        <div className="relative">
          <video
            src={getMarketplaceVideo().video}
            className="w-full h-32 object-cover rounded-md"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute top-2 left-2">
            <Badge className="bg-green-600 text-white text-xs">{marketType.toUpperCase()}</Badge>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 h-6 w-6 p-0 bg-white/90 hover:bg-white"
            onClick={() => likeProductMutation.mutate(1)}
          >
            <Heart className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-8 right-2 h-6 w-6 p-0 bg-white/90 hover:bg-white"
            onClick={() => setLocation('/add-product')}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="p-2">
          <h4 className="text-sm font-medium text-gray-900">
            {getMarketplaceVideo().title}
          </h4>
          <p className="text-xs text-gray-500">
            {marketType === 'b2b' && 'Business Solutions & Networking'}
            {marketType === 'b2c' && 'Consumer Products & Services'}
            {marketType === 'c2c' && 'Peer-to-Peer Marketplace'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div>
        <h3 className="font-medium mb-2 text-[14px]">Search for Products</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={`Search within ${marketType.toUpperCase()}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 text-[12px]"
          />
        </div>
      </div>

      {/* Product or Service */}
      <div>
        <h3 className="font-medium mb-2 text-[14px]">Product or Service</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-products"
              checked={selectedProductTypes.includes('product')}
              onCheckedChange={() => toggleProductType('product')}
            />
            <Label htmlFor="show-products" className="text-[12px] font-normal">Product</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-services"
              checked={selectedProductTypes.includes('service')}
              onCheckedChange={() => toggleProductType('service')}
            />
            <Label htmlFor="show-services" className="text-[12px] font-normal">Service</Label>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-medium mb-2 text-[14px]">Categories</h3>
        <div className="space-y-2">
          {categoriesLoading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : (
            categories.map((category: any) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id.toString())}
                  onCheckedChange={() => toggleCategory(category.id.toString())}
                />
                <Label htmlFor={`category-${category.id}`} className="text-[12px] font-normal">
                  {category.name} ({category.count || 0})
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Regions */}
      <div>
        <h3 className="font-medium mb-2 text-[14px]">Regions</h3>
        <div className="space-y-2">
          {['Oceania', 'North America', 'Central America', 'South America', 'Middle East', 'Europe', 'Central Asia'].map((region) => (
            <div key={region} className="flex items-center space-x-2">
              <Checkbox id={`region-${region}`} />
              <Label htmlFor={`region-${region}`} className="text-[12px] font-normal">{region}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Product Status */}
      <div>
        <h3 className="font-medium mb-2 text-[14px]">Product Status</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="on-sale"
              checked={showSale}
              onCheckedChange={(checked) => setShowSale(checked === true)}
            />
            <Label htmlFor="on-sale" className="text-[12px] font-normal">On Sale</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="new-arrivals"
              checked={showNew}
              onCheckedChange={(checked) => setShowNew(checked === true)}
            />
            <Label htmlFor="new-arrivals" className="text-[12px] font-normal">New Arrivals</Label>
          </div>
        </div>
      </div>

      {/* Store Options */}
      <div>
        <h3 className="font-medium mb-2 text-[14px]">Store Options</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="verified-stores" />
            <Label htmlFor="verified-stores" className="text-[12px] font-normal">Verified stores only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="free-shipping" />
            <Label htmlFor="free-shipping" className="text-[12px] font-normal">Free shipping</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="next-day-delivery" />
            <Label htmlFor="next-day-delivery" className="text-[12px] font-normal">Next day delivery</Label>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-2 text-[14px]">Price Range</h3>
        <div className="px-3">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            max={1000}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Reset Filters */}
      <div className="pt-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            setSearchTerm('');
            setPriceRange([0, 1000]);
            setSelectedCategories([]);
            setSelectedProductTypes([]);
            setShowSale(false);
            setShowNew(false);
          }}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Desktop */}
          <div className="hidden lg:block w-64 bg-white rounded-lg shadow-sm h-fit">
            <div className="p-4">
              <FilterContent />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header with controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {products.length} products found
                  </span>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                        <SheetDescription>
                          Refine your product search
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="flex items-center gap-4">
                  {/* Clear All Button */}
                  <Button variant="outline" size="sm">
                    Clear All
                  </Button>

                  {/* Items per page */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                        <SelectItem value="120">120</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* View mode toggles */}
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
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

                  {/* Sort dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Sort by</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Best Rating</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                : "space-y-4"
              }>
                {products.map((product: any) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={product.imageUrl || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        {product.isNew && (
                          <Badge className="bg-green-500 text-white text-xs">New</Badge>
                        )}
                        {product.isOnSale && (
                          <Badge className="bg-red-500 text-white text-xs">Sale</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-gray-500">(1)</span>
                      </div>
                      
                      <WouterLink href={`/product/${product.id}`}>
                        <h3 className="font-medium text-base mb-3 hover:text-blue-600 cursor-pointer">
                          {product.name}
                        </h3>
                      </WouterLink>
                      
                      <div className="mb-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-blue-600">
                            {currencyFormatPrice(product.price)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through">
                              {currencyFormatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {product.category || 'Home & Garden'}
                        </p>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-4">
                        Sold by Vendor {product.vendorId}
                      </p>
                      
                      <Button 
                        className="w-full bg-black text-white hover:bg-gray-800 mb-2"
                        onClick={() => addToCartMutation.mutate(product.id)}
                        disabled={addToCartMutation.isPending}
                      >
                        {addToCartMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Buy'
                        )}
                      </Button>
                      
                      <div className="flex justify-between">
                        <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-black">
                          Report
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-black">
                          Send Offer
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}