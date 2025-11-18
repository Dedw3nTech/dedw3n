import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useCurrency } from "@/contexts/CurrencyContext";
import { LifestyleNav } from "@/components/layout/LifestyleNav";
import {
  Utensils,
  Home,
  MapPin,
  Heart,
  ShoppingCart,
  Filter,
  Share2,
  Star,
  Repeat2,
  Tag,
  CreditCard,
  Gift,
  Loader2,
  Mail,
  MessageCircle,
  Smartphone
} from "lucide-react";
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Category configuration for icons and colors
const categoryConfig: Record<string, { icon: any; color: string }> = {
  restaurant: {
    icon: Utensils,
    color: "bg-gradient-to-br from-red-500 to-red-600"
  },
  hotels: {
    icon: Home,
    color: "bg-gradient-to-br from-teal-500 to-teal-600"
  }
};

export default function ReservationPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [priceFilterActive, setPriceFilterActive] = useState(false);
  const [sortBy, setSortBy] = useState<string>("trending");
  const [columnsPerRow, setColumnsPerRow] = useState<number>(4);
  const [productsPerPage, setProductsPerPage] = useState<number>(30);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showSale, setShowSale] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [, setLocation] = useLocation();

  // Dialog states
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [repostMessage, setRepostMessage] = useState('');
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedOfferProduct, setSelectedOfferProduct] = useState<any>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  // Translatable texts - matching products.tsx structure
  const texts = useMemo(() => [
    "Restaurant",
    "Hotels",
    "product",
    "products",
    "found",
    "No products found matching your search.",
    "No products available in this category yet.",
    "Loading products...",
    "Featured",
    "Add to Cart",
    "Share on community feed",
    "Make an offer",
    "Send as gift",
    "Share product",
    "View product details",
    "New",
    "Sale",
    "Verified",
    "Add to Favorites",
    "Remove from Favorites",
    "Cancel",
    "Post to Feed",
    "Share",
    "Share via E-mail",
    "Share via Text Message",
    "Share with Member",
    "Would you like to add a message with this product share?",
    "Add your message (optional)",
    "Send Offer",
    "Send a price offer to the product owner",
    "Your Offer Amount",
    "Enter your offer amount",
    "Message (optional)",
    "Add a message with your offer...",
    "Trending",
    "Price: Low to High",
    "Price: High to Low",
    "Newest Product"
  ], []);

  const { translations: t } = useMasterBatchTranslation(texts);

  // User query
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user');
      return response.json();
    }
  });

  // Fetch products - only reservation related products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', { categories: 'reservations,hotel,hotels' }],
    queryFn: async () => {
      // Fetch only reservation related products
      const params = new URLSearchParams();
      params.append('categories', 'reservations,hotel,hotels,stay,table,venue,event,spa,accommodation');
      
      const response = await apiRequest('GET', `/api/products?${params.toString()}`);
      return response.json();
    },
    enabled: true,
  });

  // Liked products functionality
  const { data: likedProducts = [] } = useQuery({
    queryKey: ['/api/liked-products'],
    queryFn: () => apiRequest('/api/liked-products'),
  });

  const isProductLiked = (productId: number) => {
    return likedProducts.some((likedProduct: any) => likedProduct.id === productId);
  };

  const likeMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest('POST', `/api/products/${productId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products/count'] });
      toast({
        title: "Product Liked",
        description: "Product added to your favorites!",
      });
    },
    onError: (error: any) => {
      const isAuthError = error?.status === 401;
      toast({
        title: isAuthError ? "Login Required" : "Error",
        description: isAuthError ? "Please log in to add favorites." : "Failed to like product.",
        variant: "destructive",
      });
    }
  });

  const unlikeMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest('DELETE', `/api/products/${productId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products/count'] });
      toast({
        title: "Product Unliked",
        description: "Product removed from favorites.",
      });
    },
  });

  const handleLikeToggle = (productId: number) => {
    if (isProductLiked(productId)) {
      unlikeMutation.mutate(productId);
    } else {
      likeMutation.mutate(productId);
    }
  };

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!user?.id) {
        throw new Error('Please log in to add items to your cart.');
      }

      const authToken = localStorage.getItem('dedwen_auth_token');
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'X-Use-Session': 'true',
          'X-Client-Auth': 'true',
          'X-Client-User-ID': user?.id?.toString() || '',
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add to cart');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "Added to Cart",
        description: "Product added to your shopping cart!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to cart.",
        variant: "destructive",
      });
    }
  });

  // Repost to feed mutation
  const repostMutation = useMutation({
    mutationFn: async ({ productId, text }: { productId: number; text?: string }) => {
      const authToken = localStorage.getItem('dedwen_auth_token');
      
      return await fetch('/api/posts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'X-Use-Session': 'true',
          'X-Client-Auth': 'true',
          'X-Client-User-ID': user?.id?.toString() || '',
        },
        body: JSON.stringify({
          content: text || `Check out this product: ${selectedProduct?.name}`,
          productId,
          contentType: 'product_share'
        })
      }).then(res => {
        if (!res.ok) throw new Error('Failed to post');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      toast({
        title: "Posted to Feed!",
        description: "Product shared to your community feed.",
      });
      setRepostDialogOpen(false);
      setRepostMessage('');
      setSelectedProduct(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post to feed.",
        variant: "destructive",
      });
    }
  });

  // Send offer mutation
  const sendOfferMutation = useMutation({
    mutationFn: async ({ productId, amount, message }: { productId: number; amount: string; message: string }) => {
      if (!selectedOfferProduct?.vendorId) {
        throw new Error('Product vendor information is missing');
      }

      const response = await apiRequest('POST', '/api/messages/send', {
        receiverId: selectedOfferProduct.vendorId,
        content: `🎯 OFFER: ${formatPrice(parseFloat(amount))} for "${selectedOfferProduct?.name}"\n\n${message}\n\nProduct: /product/${productId}`,
        category: 'marketplace'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send offer');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Offer Sent!",
        description: "Your offer has been sent to the seller.",
      });
      setOfferDialogOpen(false);
      setOfferAmount('');
      setOfferMessage('');
      setSelectedOfferProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send offer.",
        variant: "destructive",
      });
    }
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }

    if (priceFilterActive && priceRange) {
      filtered = filtered.filter(product => {
        if (!product.price) return true;
        const price = parseFloat(String(product.price));
        if (isNaN(price)) return true;
        const upperBound = priceRange[1] >= 5000 ? Infinity : priceRange[1];
        return price >= priceRange[0] && price <= upperBound;
      });
    }

    if (showFeatured) {
      filtered = filtered.filter(product => (product as any).isFeatured === true || product.isNew || product.isOnSale);
    }

    if (showSale) {
      filtered = filtered.filter(product => product.isOnSale === true);
    }

    if (showNew) {
      filtered = filtered.filter(product => product.isNew === true);
    }

    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => parseFloat(String(a.price || '0')) - parseFloat(String(b.price || '0')));
        break;
      case 'price_high':
        filtered.sort((a, b) => parseFloat(String(b.price || '0')) - parseFloat(String(a.price || '0')));
        break;
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      default:
        filtered.sort((a, b) => {
          const featuredA = (a as any).isFeatured || a.isNew || a.isOnSale || false;
          const featuredB = (b as any).isFeatured || b.isNew || b.isOnSale || false;
          return (featuredB ? 1 : 0) - (featuredA ? 1 : 0);
        });
    }
    
    return filtered;
  }, [products, searchQuery, priceRange, showFeatured, sortBy, priceFilterActive]);

  const categoryNavItems = [
    { key: "restaurant", label: t[0] || "Restaurant" },
    { key: "hotels", label: t[1] || "Hotels" }
  ];

  // Share functions
  const shareByEmail = (product: any) => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const emailBody = `Check out: ${productUrl}\n\n${product.name}\n\n${product.description}`;
    window.open(`mailto:?subject=${encodeURIComponent(`Check out: ${product.name}`)}&body=${encodeURIComponent(emailBody)}`, '_blank');
  };

  const shareViaSMS = (product: any) => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const smsBody = `Check out: ${product.name}\n\n${formatPrice(product.price)}\n\n${productUrl}`;
    window.open(`sms:?body=${encodeURIComponent(smsBody)}`, '_blank');
  };

  const shareOnFeed = (product: any) => {
    setSelectedProduct(product);
    setRepostDialogOpen(true);
  };

  // Limit products based on productsPerPage setting
  const displayedProducts = filteredProducts.slice(0, productsPerPage);

  return (
    <div className="min-h-screen bg-white">
      <LifestyleNav 
        searchTerm={searchQuery}
        setSearchTerm={setSearchQuery}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Product count and controls */}
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {filteredProducts.length} {filteredProducts.length === 1 ? (t[2] || 'product') : (t[3] || 'products')} {t[4] || 'found'}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {showSale && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {t[16] || "Sale"}
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
                  {t[15] || "New"}
                  <button
                    onClick={() => setShowNew(false)}
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {showFeatured && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {t[8] || "Featured"}
                  <button
                    onClick={() => setShowFeatured(false)}
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Products per page selector */}
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>Show</span>
              <button
                onClick={() => setProductsPerPage(30)}
                className={`px-2 py-1 hover:text-black transition-colors ${productsPerPage === 30 ? 'text-black font-medium' : ''}`}
              >
                30
              </button>
              <span>|</span>
              <button
                onClick={() => setProductsPerPage(60)}
                className={`px-2 py-1 hover:text-black transition-colors ${productsPerPage === 60 ? 'text-black font-medium' : ''}`}
              >
                60
              </button>
              <span>|</span>
              <button
                onClick={() => setProductsPerPage(120)}
                className={`px-2 py-1 hover:text-black transition-colors ${productsPerPage === 120 ? 'text-black font-medium' : ''}`}
              >
                120
              </button>
            </div>

            {/* Grid layout selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setColumnsPerRow(3)}
                className={`flex gap-1 p-2 hover:opacity-80 transition-opacity ${columnsPerRow === 3 ? 'opacity-100' : 'opacity-50'}`}
                title="3 columns"
              >
                <div className="w-1 h-4 bg-black"></div>
                <div className="w-1 h-4 bg-black"></div>
                <div className="w-1 h-4 bg-black"></div>
              </button>
              <button
                onClick={() => setColumnsPerRow(4)}
                className={`flex gap-1 p-2 hover:opacity-80 transition-opacity ${columnsPerRow === 4 ? 'opacity-100' : 'opacity-50'}`}
                title="4 columns"
              >
                <div className="w-1 h-4 bg-black"></div>
                <div className="w-1 h-4 bg-black"></div>
                <div className="w-1 h-4 bg-black"></div>
                <div className="w-1 h-4 bg-black"></div>
              </button>
              <button
                onClick={() => setColumnsPerRow(5)}
                className={`flex gap-1 p-2 hover:opacity-80 transition-opacity ${columnsPerRow === 5 ? 'opacity-100' : 'opacity-50'}`}
                title="5 columns"
              >
                <div className="w-1 h-4 bg-black"></div>
                <div className="w-1 h-4 bg-black"></div>
                <div className="w-1 h-4 bg-black"></div>
                <div className="w-1 h-4 bg-black"></div>
                <div className="w-1 h-4 bg-black"></div>
              </button>
            </div>

            {/* Filter button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 border-0 hover:bg-transparent">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter Products</SheetTitle>
                </SheetHeader>
                <div className="py-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Price Range</label>
                      <Slider
                        value={priceRange}
                        onValueChange={(val) => {
                          setPriceRange(val as [number, number]);
                          setPriceFilterActive(true);
                        }}
                        max={5000}
                        step={50}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}+</span>
                      </div>
                      {priceFilterActive && (
                        <button
                          onClick={() => {
                            setPriceRange([0, 5000]);
                            setPriceFilterActive(false);
                          }}
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          Clear price filter
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="featured"
                          checked={showFeatured}
                          onCheckedChange={(checked) => setShowFeatured(checked as boolean)}
                        />
                        <label htmlFor="featured" className="text-sm">Featured only</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="on-sale"
                          checked={showSale}
                          onCheckedChange={(checked) => setShowSale(checked as boolean)}
                        />
                        <label htmlFor="on-sale" className="text-sm">On Sale</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="new-arrivals"
                          checked={showNew}
                          onCheckedChange={(checked) => setShowNew(checked as boolean)}
                        />
                        <label htmlFor="new-arrivals" className="text-sm">New Arrivals</label>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Product Grid */}
        <div className={`grid gap-6 ${
          columnsPerRow === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' :
          columnsPerRow === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' :
          columnsPerRow === 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
        }`}>
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <p className="text-gray-600 text-lg">
                {searchQuery ? (t[5] || 'No products found matching your search.') : (t[6] || 'No products available in this category yet.')}
              </p>
            </div>
          ) : (
            displayedProducts.map((product) => (
              <Card 
                key={product.id} 
                className="overflow-hidden flex flex-col border-0 shadow-none hover:shadow-md transition-shadow duration-300"
                data-testid={`card-product-${product.id}`}
              >
                <div 
                  className="aspect-[2/3] bg-gray-100 relative overflow-hidden group cursor-pointer"
                  onClick={() => setLocation(`/product/${product.id}`)}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingCart className="h-12 w-12" />
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {(product as any).isFeatured && (
                      <Badge className="bg-yellow-500 text-white">{t[8] || "Featured"}</Badge>
                    )}
                    {product.isNew && (
                      <Badge className="bg-black text-white">{t[15] || "New"}</Badge>
                    )}
                    {product.isOnSale && (
                      <Badge className="bg-red-600 text-white">{t[16] || "Sale"}</Badge>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-4 flex-grow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div 
                      className="font-medium text-sm leading-tight hover:text-primary cursor-pointer flex-1 min-h-[2.5rem] flex items-center line-clamp-2"
                      onClick={() => setLocation(`/product/${product.id}`)}
                    >
                      {product.name}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareOnFeed(product);
                        }}
                        className="h-8 w-8 text-black hover:bg-gray-100"
                        title={t[10] || "Repost"}
                        data-testid={`button-repost-${product.id}`}
                      >
                        <Repeat2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost"
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOfferProduct(product);
                          setOfferDialogOpen(true);
                        }}
                        className="h-8 w-8 text-black hover:bg-gray-100"
                        title={t[11] || "Send Offer"}
                        data-testid={`button-offer-${product.id}`}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCartMutation.mutate(product.id);
                        }}
                        disabled={addToCartMutation.isPending}
                        title={t[9] || "Add to Cart"}
                        data-testid={`button-cart-${product.id}`}
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeToggle(product.id);
                        }}
                        disabled={likeMutation.isPending || unlikeMutation.isPending}
                        title={isProductLiked(product.id) ? (t[19] || "Remove from Favorites") : (t[18] || "Add to Favorites")}
                        data-testid={`button-favorite-${product.id}`}
                      >
                        <Heart 
                          className={`h-4 w-4 ${isProductLiked(product.id) ? 'fill-red-500 text-red-500' : 'fill-black text-black'}`} 
                        />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            title={t[13] || "Share"}
                            data-testid={`button-share-${product.id}`}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => shareByEmail(product)}>
                            <Mail className="mr-2 h-4 w-4" />
                            {t[23] || "Share via E-mail"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareViaSMS(product)}>
                            <Smartphone className="mr-2 h-4 w-4" />
                            {t[24] || "Share via Text"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {product.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="font-bold text-lg text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                    {(product as any).rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">{(product as any).rating}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Repost Dialog */}
      <Dialog open={repostDialogOpen} onOpenChange={setRepostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t[21] || "Post to Feed"}</DialogTitle>
            <DialogDescription>{t[26] || "Would you like to add a message with this product share?"}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t[27] || "Add your message (optional)"}
            value={repostMessage}
            onChange={(e) => setRepostMessage(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepostDialogOpen(false)}>
              {t[20] || "Cancel"}
            </Button>
            <Button 
              onClick={() => repostMutation.mutate({ 
                productId: selectedProduct?.id, 
                text: repostMessage.trim() 
              })}
              disabled={repostMutation.isPending}
            >
              {t[21] || "Post to Feed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t[28] || "Send Offer"}</DialogTitle>
            <DialogDescription>{t[29] || "Send a price offer to the product owner"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t[30] || "Your Offer Amount"}</label>
              <Input
                type="number"
                placeholder={t[31] || "Enter your offer amount"}
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t[32] || "Message (optional)"}</label>
              <Textarea
                placeholder={t[33] || "Add a message with your offer..."}
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>
              {t[20] || "Cancel"}
            </Button>
            <Button 
              onClick={() => sendOfferMutation.mutate({
                productId: selectedOfferProduct?.id,
                amount: offerAmount,
                message: offerMessage
              })}
              disabled={!offerAmount || sendOfferMutation.isPending}
            >
              {t[28] || "Send Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
