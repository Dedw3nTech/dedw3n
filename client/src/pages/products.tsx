import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link as WouterLink } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';
import { useMarketType } from '@/hooks/use-market-type';
import { useCurrency } from '@/hooks/use-currency';
import { formatPriceWithCurrency } from '@/lib/currencyConverter';
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
import { Loader2, ShoppingCart, Search, SlidersHorizontal, Share2, Mail, Link as LinkIcon, MessageSquare, Users, MessageCircle, Store, Building, Landmark } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showSale, setShowSale] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [, setLocation] = useLocation();
  const { marketType, setMarketType, marketTypeLabel } = useMarketType();
  const { currency } = useCurrency();
  const [forceUpdate, setForceUpdate] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Repost dialog state
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [repostText, setRepostText] = useState('');

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "Added to Cart",
        description: "Product has been added to your shopping bag!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Repost to feed mutation
  const repostMutation = useMutation({
    mutationFn: async ({ productId, text }: { productId: number; text?: string }) => {
      return await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text || `Check out this product: ${selectedProduct?.name}`,
          productId,
          type: 'product_share'
        })
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      toast({
        title: "Posted to Feed!",
        description: "Product has been shared to your community feed.",
      });
      setRepostDialogOpen(false);
      setRepostText('');
      setSelectedProduct(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post to feed. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Force rerender when currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      console.log('Products page detected currency change');
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('currency-changed', handleCurrencyChange);
    
    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, []);

  // Fetch products
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/products');
      return response.json();
    },
  });

  // Fetch categories
  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    },
  });

  // Filter products based on criteria
  const filteredProducts = products.filter((product: any) => {
    // Filter by search term
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !product.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by price range
    if (product.price < priceRange[0] || product.price > priceRange[1]) {
      return false;
    }
    
    // Filter by selected categories
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
      return false;
    }
    
    // Filter by sale status
    if (showSale && !product.isOnSale) {
      return false;
    }
    
    // Filter by new status
    if (showNew && !product.isNew) {
      return false;
    }
    
    return true;
  });

  // Determine highest product price for slider max
  const maxPrice = Math.max(...products.map((p: any) => p.price), 1000);
  
  // Handle category checkbox toggle
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setPriceRange([0, maxPrice]);
    setSelectedCategories([]);
    setShowSale(false);
    setShowNew(false);
  };

  // Count unique categories in the products
  const categoryCount: Record<string, number> = {};
  products.forEach((product: any) => {
    if (product.category) {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
    }
  });

  // Update price range when max price changes
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);
  
  // Share functions
  const shareByEmail = (product: any) => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const emailBody = `I thought you might be interested in this: ${productUrl}\n\n${product.name}\n\n${product.description}`;
    window.open(`mailto:?subject=${encodeURIComponent(`Check out this product: ${product.name}`)}&body=${encodeURIComponent(emailBody)}`, '_blank');
  };
  
  const copyLinkToClipboard = (product: any) => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard.writeText(productUrl)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Product link copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Could not copy link to clipboard",
        });
      });
  };
  
  const shareOnFeed = (product: any) => {
    setSelectedProduct(product);
    setRepostDialogOpen(true);
  };

  const handleRepost = (withText: boolean) => {
    if (selectedProduct) {
      if (withText) {
        // Keep dialog open for text input
        return;
      } else {
        // Repost without text
        repostMutation.mutate({ productId: selectedProduct.id });
      }
    }
  };

  const handleRepostWithText = () => {
    if (selectedProduct) {
      repostMutation.mutate({ 
        productId: selectedProduct.id, 
        text: repostText.trim() 
      });
    }
  };
  
  const shareViaMessage = (product: any) => {
    // Navigate to messages with prefilled share content
    const productUrl = `/product/${product.id}`;
    setLocation(`/messages?share=${product.id}&url=${encodeURIComponent(productUrl)}&title=${encodeURIComponent(product.name)}&content=${encodeURIComponent(`Check out this product: ${product.name}`)}`);
  };

  // Render product grid
  const renderProductGrid = () => {
    if (productsLoading) {
      return (
        <div className="col-span-full flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (productsError) {
      return (
        <div className="col-span-full py-12 text-center">
          <div className="text-red-500 mb-4">Error loading products</div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      );
    }

    if (filteredProducts.length === 0) {
      return (
        <div className="col-span-full py-12 text-center">
          <div className="text-gray-500 mb-4">No products found matching your criteria</div>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      );
    }

    return filteredProducts.map((product: any) => (
      <Card 
        key={product.id} 
        className="overflow-hidden flex flex-col border-0 shadow-none hover:shadow-md transition-shadow duration-300"
      >
        <div 
          className="aspect-[1/3] bg-gray-100 relative overflow-hidden group"
          onClick={() => setLocation(`/product/${product.id}`)}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/product/${product.id}`);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart className="h-12 w-12" />
            </div>
          )}

          {/* Hover overlay with Add to Shopping Bag button */}
          {marketType !== 'c2c' && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCartMutation.mutate(product.id);
                }}
                disabled={addToCartMutation.isPending}
                className="bg-black text-white hover:bg-gray-800 shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300"
                size="sm"
              >
                {addToCartMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="h-4 w-4 mr-2" />
                )}
                Add to Shopping Bag
              </Button>
            </div>
          )}
          
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <Badge className={marketType === 'c2c' ? 'bg-blue-500' : marketType === 'b2c' ? 'bg-green-500' : 'bg-purple-500'}>
                New
              </Badge>
            )}
            {product.isOnSale && (
              <Badge className="bg-red-500">Sale</Badge>
            )}
            
            {/* B2B badge for minimum quantities */}
            {marketType === 'b2b' && (
              <Badge className="bg-gray-700">Min qty: 10</Badge>
            )}

            {/* Verified seller badge for B2C */}
            {marketType === 'b2c' && product.vendorId % 2 === 0 && (
              <Badge className="bg-green-600">Verified</Badge>
            )}

            {/* Friend indicator for C2C */}
            {marketType === 'c2c' && product.vendorId % 3 === 0 && (
              <Badge className="bg-blue-600">Friend</Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-4 flex-grow">
          <div className="font-medium text-sm leading-tight hover:text-primary cursor-pointer min-h-[2.5rem] flex items-center" onClick={() => setLocation(`/product/${product.id}`)}>
            <span className="line-clamp-2">{product.name}</span>
          </div>
          
          {/* Price moved below title */}
          <div className="flex items-center justify-between">
            <div>
              {product.discountPrice ? (
                <div className="flex items-center">
                  <div className="font-bold text-blue-600">
                    {formatPriceWithCurrency(product.discountPrice, currency)}
                    {marketType === 'b2b' && <span className="text-xs ml-1">+VAT</span>}
                  </div>
                  <div className="ml-2 text-sm text-gray-500 line-through">{formatPriceWithCurrency(product.price, currency)}</div>
                </div>
              ) : (
                <div className="font-bold text-blue-600">
                  {formatPriceWithCurrency(product.price, currency)}
                  {marketType === 'b2b' && <span className="text-xs ml-1">+VAT</span>}
                </div>
              )}
            </div>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                if (marketType === 'c2c') {
                  setLocation(`/product/${product.id}`);
                } else {
                  addToCartMutation.mutate(product.id);
                }
              }}
              disabled={addToCartMutation.isPending}
              className="text-black hover:bg-transparent hover:text-gray-700 p-0 h-auto font-normal ml-2"
            >
              {addToCartMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                marketType === 'c2c' ? 'View' : 'Buy'
              )}
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">{product.category}</div>
          
          {/* Additional info based on market type */}
          {marketType === 'b2b' && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Volume discount available</span>
            </div>
          )}
          {marketType === 'c2c' && (
            <div className="text-xs text-gray-500">
              <span>Listed by User{product.vendorId}</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between items-center">
          <Button
            size="sm"
            onClick={() => shareOnFeed(product)}
            className="bg-black text-white hover:bg-gray-800"
          >
            Repost
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Share Product</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => shareByEmail(product)}>
                <Mail className="h-4 w-4 mr-2 text-gray-600" />
                Share via Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyLinkToClipboard(product)}>
                <LinkIcon className="h-4 w-4 mr-2 text-gray-600" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareOnFeed(product)}>
                <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                Share on Feed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareViaMessage(product)}>
                <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                Send via Message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation(`/members?share=${product.id}&url=${encodeURIComponent(`/product/${product.id}`)}&title=${encodeURIComponent(product.name)}`)}>
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                Share with Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    ));
  };

  // Content for the filter sidebar
  const FilterContent = () => (
    <div className="space-y-6 text-[14px]">
      {marketType === 'b2c' && (
        <div>
          <h3 className="font-medium mb-2 text-[14px]">Search for Products</h3>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search Within B2C"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-[12px]"
              />
            </div>
          </div>
        </div>
      )}
      
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
                  checked={selectedCategories.includes(category.name)}
                  onCheckedChange={() => toggleCategory(category.name)}
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="flex justify-between w-full text-sm"
                >
                  <span className="text-[12px] font-normal">{category.name}</span>
                  <span className="text-gray-500">({categoryCount[category.name] || 0})</span>
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2 text-[14px]">Product Status</h3>
        <div className="space-y-2 font-normal text-[12px]">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-sale"
              checked={showSale}
              onCheckedChange={(checked) => setShowSale(checked === true)}
            />
            <Label htmlFor="show-sale" className="text-[12px] font-normal">On Sale</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-new"
              checked={showNew}
              onCheckedChange={(checked) => setShowNew(checked === true)}
            />
            <Label htmlFor="show-new" className="text-[12px] font-normal">New Arrivals</Label>
          </div>
        </div>
      </div>

      {/* Market-specific filters */}
      {marketType === 'c2c' && (
        <div>
          <h3 className="text-lg font-medium mb-2">Friend Options</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="friends-only"
              />
              <Label htmlFor="friends-only" className="text-sm">Friends only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="local-only"
              />
              <Label htmlFor="local-only" className="text-sm">Local pickup only</Label>
            </div>
          </div>
        </div>
      )}

      {marketType === 'b2c' && (
        <div>
          <h3 className="font-medium mb-2 text-[14px]">Store Options</h3>
          <div className="space-y-2 text-[12px] font-normal">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified-only"
              />
              <Label htmlFor="verified-only" className="text-[12px] font-normal">Verified stores only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="free-shipping"
              />
              <Label htmlFor="free-shipping" className="text-[12px] font-normal">Free shipping</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="next-day-delivery"
              />
              <Label htmlFor="next-day-delivery" className="text-[12px] font-normal">Next day delivery</Label>
            </div>
          </div>
        </div>
      )}

      {marketType === 'b2b' && (
        <div>
          <h3 className="text-lg font-medium mb-2">Business Options</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-discount"
              />
              <Label htmlFor="bulk-discount" className="text-sm">Volume discounts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wholesale-only"
              />
              <Label htmlFor="wholesale-only" className="text-sm">Wholesale only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tax-exempt"
              />
              <Label htmlFor="tax-exempt" className="text-sm">Tax exempt eligible</Label>
            </div>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        onClick={resetFilters}
        className="w-full"
      >
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">

      <div className="flex justify-end items-center mb-4">
        {/* Mobile filter button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="md:hidden">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Products</SheetTitle>
              <SheetDescription>
                Narrow down products based on your preferences
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters - desktop */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-20">
            <FilterContent />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Product count and active filters */}
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(category => (
                <Badge variant="outline" key={category} className="flex items-center gap-1">
                  {category}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              
              {showSale && (
                <Badge variant="outline" className="flex items-center gap-1">
                  On Sale
                  <button
                    onClick={() => setShowSale(false)}
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              {showNew && (
                <Badge variant="outline" className="flex items-center gap-1">
                  New Arrivals
                  <button
                    onClick={() => setShowNew(false)}
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              {(selectedCategories.length > 0 || showSale || showNew) && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 px-2">
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {renderProductGrid()}
          </div>
        </div>
      </div>

      {/* Repost Dialog */}
      <Dialog open={repostDialogOpen} onOpenChange={setRepostDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Repost to Community Feed</DialogTitle>
            <DialogDescription>
              Would you like to add a message with this product share?
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="my-4">
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatPriceWithCurrency(selectedProduct.price, currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Add your message (optional)</label>
              <Textarea
                placeholder="What do you think about this product?"
                value={repostText}
                onChange={(e) => setRepostText(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleRepost(false)}
              disabled={repostMutation.isPending}
            >
              Post Without Text
            </Button>
            <Button
              onClick={handleRepostWithText}
              disabled={repostMutation.isPending}
              className="bg-black text-white hover:bg-gray-800"
            >
              {repostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post to Feed'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}