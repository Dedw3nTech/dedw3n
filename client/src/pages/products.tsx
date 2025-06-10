import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link as WouterLink } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';
import { useMarketType } from '@/hooks/use-market-type';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePageTitle } from '@/hooks/usePageTitle';

import { useLanguage } from '@/contexts/LanguageContext';

import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShoppingCart, Search, SlidersHorizontal, Share2, Heart, ChevronDown, Plus } from 'lucide-react';
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
  const [, setLocation] = useLocation();
  const { marketType, setMarketType, marketTypeLabel } = useMarketType();
  const { formatPrice } = useCurrency();
  const [sortBy, setSortBy] = useState<string>('trending');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguage();
  


  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', { marketType, searchTerm, selectedCategories, selectedProductTypes, showSale, showNew, sortBy }],
    queryFn: () => apiRequest('/api/products'),
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('/api/categories'),
  });

  // Toggle functions
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

  const resetFilters = () => {
    setSearchTerm('');
    setPriceRange([0, 1000]);
    setSelectedCategories([]);
    setSelectedProductTypes([]);
    setShowSale(false);
    setShowNew(false);
  };

  // Cart functionality
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

  const FilterSidebar = () => (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="font-medium mb-2 text-[14px]">Search for Products</h3>
        <div className="mb-4">
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
      </div>

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
                  {category.name}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

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

      <Button
        variant="outline"
        onClick={resetFilters}
        className="w-full"
      >
        Reset Filters
      </Button>
      
      <Button
        onClick={() => setLocation('/add-product')}
        className="w-full bg-black text-white hover:bg-gray-800 mt-3"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Product/Service
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <FilterSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="md:hidden mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filter Products</SheetTitle>
                    <SheetDescription>
                      Narrow down products based on your preferences
                    </SheetDescription>
                  </SheetHeader>
                  <FilterSidebar />
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                {products.length} products found
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm">Sort by</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="text-sm">
                      Trending <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setSortBy('trending')}>
                      Trending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('price_low_high')}>
                      Price: Low to High
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('price_high_low')}>
                      Price: High to Low
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('newest')}>
                      Newest Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <Card key={product.id} className="group relative overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="relative mb-3">
                        <img
                          src={product.imageUrl || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {product.isNew && (
                            <Badge className="bg-green-500 text-white text-xs">New</Badge>
                          )}
                          {product.isOnSale && (
                            <Badge className="bg-red-500 text-white text-xs">Sale</Badge>
                          )}
                        </div>
                        <button className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <Heart className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                      
                      <h3 className="font-medium text-sm mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-3">
                        Sold by Vendor {product.vendorId}
                      </p>
                    </CardContent>
                    
                    <CardFooter className="p-4 pt-0 flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => addToCartMutation.mutate(product.id)}
                        disabled={addToCartMutation.isPending}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
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