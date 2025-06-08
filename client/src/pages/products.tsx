import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link as WouterLink } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';
import { useMarketType } from '@/hooks/use-market-type';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMasterBatchTranslation, useMasterTranslation } from '@/hooks/use-master-translation';
import { useLanguage } from '@/contexts/LanguageContext';

import { InstantImageAd, preloadAdvertisementImages } from '@/components/ads/InstantImageAd';

import luxuryB2CImage from '@assets/Dedw3n Marketplace (1).png';
import bottomPromoImage from '@assets/Copy of Dedw3n Marketplace III.png';
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
import { Loader2, ShoppingCart, Search, SlidersHorizontal, Share2, Mail, Link as LinkIcon, MessageSquare, Users, MessageCircle, Store, Building, Landmark, Heart, ChevronDown, Plus, Gift } from 'lucide-react';
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

// Component for translating category names using Master Translation
const CategoryName = ({ categoryName }: { categoryName: string }) => {
  const { translations } = useMasterBatchTranslation([categoryName]);
  const [translatedText] = translations || [categoryName];
  return <span className="text-[12px] font-normal">{translatedText}</span>;
};

// Component for translating region names using Master Translation
const RegionName = ({ regionName }: { regionName: string }) => {
  const { translations } = useMasterBatchTranslation([regionName]);
  const [translatedText] = translations || [regionName];
  return <span>{translatedText}</span>;
};

// Component for translating product names using Master Translation
const ProductName = ({ productName }: { productName: string }) => {
  const { translations } = useMasterBatchTranslation([productName]);
  const [translatedText] = translations || [productName];
  return <span className="line-clamp-2">{translatedText}</span>;
};
import { useToast } from '@/hooks/use-toast';



export default function Products() {
  usePageTitle({ title: 'Products' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [showSale, setShowSale] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [, setLocation] = useLocation();
  const { marketType, setMarketType, marketTypeLabel } = useMarketType();
  const { formatPrice } = useCurrency();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [sortBy, setSortBy] = useState<string>('trending');
  const [productsPerPage, setProductsPerPage] = useState<number>(30);
  const [columnsPerRow, setColumnsPerRow] = useState<number>(4);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguage();
  
  // Master Translation System - Single mega-batch call (34 → 1 API call)
  const productTexts = [
    // Filter & Search (7 texts)
    "Filter", "Filter Products", "Narrow down products based on your preferences",
    "product", "products", "found", "Clear All",
    
    // Sort & Display (7 texts)
    "Show", "Sort by", "Sort Options", "Trending", "Price: Low to High", 
    "Price: High to Low", "Newest Product",
    
    // Product Actions (8 texts)
    "Add to Cart", "Add to shopping cart", "Share on community feed", "Make an offer",
    "Send as gift", "Add to profile", "Share product", "View product details",
    
    // Additional Actions (12 texts)
    "Add to Shopping Bag", "New", "Sale", "Verified", "Min qty", "Buy Now",
    "Share", "View Product", "Cancel", "Sending...", "Posting...",
    
    // Gift & Messaging (11 texts)
    "Search for recipient", "Type name or username...", "No users found matching",
    "Type at least 2 characters to search", "Send Gift", "Buy", "Listed by",
    "Send Gift", "Send this product as a gift to someone special", "By", "Share with Member",
    
    // Community & Sharing (9 texts)
    "Services", "Your Region", "Your Country", "Repost to Community Feed",
    "Would you like to add a message with this product share?", "Add your message (optional)",
    "What do you think about this product?", "Post Without Text", "Repost",
    
    // Offers & Actions (10 texts)
    "Post to Feed", "Send Offer", "Send a price offer to the product owner", "Listed",
    "Your Offer Amount", "Enter your offer amount", "Message (optional)",
    "Add a message with your offer...", "Send via Message", "Send Offer",
    
    // Search & Filters (11 texts)
    "Search for Products", "Search within", "Categories", "Region", "Reset Filters",
    "On Sale", "New Arrivals", "Product or Service", "Product", "Service", "Product Status",
    
    // Friend & Store Options (10 texts)
    "Friend Options", "Friends only", "Local pickup only", "Store Options",
    "Verified stores only", "Free shipping", "Next day delivery", "Business Options",
    
    // Favorites Actions (2 texts)
    "Add to Favorites", "Remove from Favorites"
  ];

  const { translations: t } = useMasterBatchTranslation(productTexts);
  
  // Extract translations with descriptive variable names
  const [
    filterText, filterProductsText, narrowDownText, productText, productsText, 
    productFoundText, clearAllText,
    
    showText, sortByText, sortOptionsText, trendingText, priceLowHighText,
    priceHighLowText, newestProductText,
    
    addToCartText, addToCartTooltipText, shareOnFeedTooltipText, makeOfferTooltipText,
    sendGiftTooltipText, addToProfileTooltipText, shareProductTooltipText, viewProductDetailsText,
    
    addToShoppingBagText, newBadgeText, saleBadgeText, verifiedBadgeText, minQtyText,
    buyNowText, shareText, viewProductText, cancelText, sendingText, postingText,
    
    searchForRecipientText, typeNameUsernameText, noUsersFoundText, typeAtLeastText,
    sendGiftText, buyText, listedByText, sendGiftTitle, sendProductAsGiftText, byText, shareWithMemberText,
    
    servicesText, yourRegionText, yourCountryText, repostToCommunityText, addMessageText,
    addYourMessageText, whatDoYouThinkText, postWithoutTextButton, repostButtonText,
    
    postToFeedButton, sendOfferTitle, sendPriceOfferText, listedText, yourOfferAmountText,
    enterOfferAmountText, messageOptionalText, addMessageWithOfferText, sendViaMessageText, sendOfferText, sendOfferBtnText,
    
    searchForProductsText, searchWithinText, categoriesText, regionText, resetFiltersText,
    onSaleText, newArrivalsText, productOrServiceText, productFilterText, serviceFilterText, productStatusText,
    
    friendOptionsText, friendsOnlyText, localPickupText, storeOptionsText, verifiedStoresText,
    freeShippingText, nextDayDeliveryText, businessOptionsText,
    
    addToFavoritesText, removeFromFavoritesText
  ] = t || textsToTranslate;
  
  // Fix for missing variables
  const shareProductText = shareProductTooltipText;
  const shareViaEmailText = "Share via Email";
  const copyLinkText = "Copy Link";
  const shareOnFeedText = "Share on Feed";
  
  // All individual translation calls now consolidated in mega-batch above
  
  // Repost dialog state
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [repostMessage, setRepostMessage] = useState('');

  // Send Offer dialog state
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedOfferProduct, setSelectedOfferProduct] = useState<any>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  // Gift functionality state
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [selectedGiftProduct, setSelectedGiftProduct] = useState<any>(null);
  const [giftSearchQuery, setGiftSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  // Liked products functionality
  const { data: likedProducts = [] } = useQuery({
    queryKey: ['/api/liked-products'],
    queryFn: () => apiRequest('/api/liked-products'),
  });

  const likeMutation = useMutation({
    mutationFn: (productId: number) => 
      fetch(`/api/products/${productId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to like product');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products/count'] });
      toast({
        title: "Product Liked",
        description: "Product added to your liked items!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like product. Please try again.",
        variant: "destructive",
      });
    }
  });

  const unlikeMutation = useMutation({
    mutationFn: (productId: number) => 
      fetch(`/api/products/${productId}/like`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to unlike product');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products/count'] });
      toast({
        title: "Product Unliked",
        description: "Product removed from your liked items.",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to unlike product. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Check if a product is liked
  const isProductLiked = (productId: number) => {
    return likedProducts.some((likedProduct: any) => likedProduct.id === productId);
  };

  // Handle like/unlike toggle
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
      setRepostMessage('');
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

  // Send offer mutation
  const sendOfferMutation = useMutation({
    mutationFn: ({ productId, amount, message }: { productId: number; amount: string; message: string }) => 
      fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: selectedOfferProduct?.vendorId,
          content: `🎯 OFFER: ${formatPrice(parseFloat(amount))} for "${selectedOfferProduct?.name}"\n\n${message}\n\nProduct: /product/${productId}`,
          category: 'marketplace'
        })
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to send offer');
        }
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Offer Sent!",
        description: "Your offer has been sent to the product owner.",
      });
      setOfferDialogOpen(false);
      setOfferAmount('');
      setOfferMessage('');
      setSelectedOfferProduct(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive",
      });
    }
  });

  // User search for gift recipients
  const { data: userSearchResults = [], isLoading: userSearchLoading } = useQuery({
    queryKey: ['/api/users/search', giftSearchQuery],
    queryFn: async () => {
      if (giftSearchQuery.length < 2) return [];
      const response = await apiRequest('GET', `/api/users/search?q=${encodeURIComponent(giftSearchQuery)}`);
      return response.json();
    },
    enabled: giftSearchQuery.length >= 2,
  });

  // Gift sending mutation
  const sendGiftMutation = useMutation({
    mutationFn: async ({ productId, recipientId }: { productId: number; recipientId: number }) => {
      const response = await apiRequest('POST', '/api/gifts/propose', {
        productId,
        recipientId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Gift Sent!",
        description: `Gift proposal sent to ${selectedRecipient?.username}`,
      });
      setGiftDialogOpen(false);
      setGiftSearchQuery('');
      setSelectedRecipient(null);
      setSelectedGiftProduct(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send gift. Please try again.",
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

  // Fetch products with filters
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['/api/products', {
      search: searchTerm,
      categories: selectedCategories,
      regions: selectedRegions,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      onSale: showSale,
      isNew: showNew,
      sortBy: sortBy
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategories.length > 0) params.append('categories', selectedCategories.join(','));
      if (selectedRegions.length > 0) params.append('regions', selectedRegions.join(','));
      if (priceRange[0] > 0) params.append('minPrice', priceRange[0].toString());
      if (priceRange[1] < 1000) params.append('maxPrice', priceRange[1].toString());
      if (showSale) params.append('onSale', 'true');
      if (showNew) params.append('isNew', 'true');
      if (sortBy) params.append('sortBy', sortBy);
      
      const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest('GET', url);
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

  // Filter and sort products based on criteria
  const filteredAndSortedProducts = products
    .filter((product: any) => {
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
      
      // Filter by product type
      if (selectedProductTypes.length > 0 && !selectedProductTypes.includes(product.productType || 'product')) {
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
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'trending':
          // Sort by popularity/sales - assuming higher vendorId or newer products are trending
          return (b.vendorId || 0) - (a.vendorId || 0);
        case 'price-low-high':
          return a.price - b.price;
        case 'price-high-low':
          return b.price - a.price;
        case 'newest':
          // Sort by ID (newer products have higher IDs)
          return b.id - a.id;
        case 'region':
          // Sort by region - for now just alphabetical by category
          return (a.category || '').localeCompare(b.category || '');
        case 'country':
          // Sort by country - for now just alphabetical by vendor
          return (a.vendorId || 0) - (b.vendorId || 0);
        default:
          return 0;
      }
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

  // Handle region checkbox toggle
  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const toggleProductType = (productType: string) => {
    setSelectedProductTypes(prev => 
      prev.includes(productType)
        ? prev.filter(pt => pt !== productType)
        : [...prev, productType]
    );
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setPriceRange([0, maxPrice]);
    setSelectedCategories([]);
    setSelectedRegions([]);
    setSelectedProductTypes([]);
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
        text: repostMessage.trim() 
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

    if (filteredAndSortedProducts.length === 0) {
      return (
        <div className="col-span-full py-12 text-center">
          <div className="text-gray-500 mb-4">No products found matching your criteria</div>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      );
    }

    // Limit products based on productsPerPage setting
    const displayedProducts = filteredAndSortedProducts.slice(0, productsPerPage);
    
    return displayedProducts.map((product: any) => (
      <Card 
        key={product.id} 
        className="overflow-hidden flex flex-col border-0 shadow-none hover:shadow-md transition-shadow duration-300"
      >
        <div 
          className="aspect-[2/3] bg-gray-100 relative overflow-hidden group"
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
                {addToShoppingBagText}
              </Button>
            </div>
          )}
          
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <Badge className={marketType === 'c2c' ? 'bg-blue-500' : marketType === 'b2c' ? 'bg-green-500' : 'bg-purple-500'}>
                {newBadgeText}
              </Badge>
            )}
            {product.isOnSale && (
              <Badge className="bg-red-500">{saleBadgeText}</Badge>
            )}
            
            {/* B2B badge for minimum quantities */}
            {marketType === 'b2b' && (
              <Badge className="bg-gray-700">{minQtyText}: 10</Badge>
            )}

            {/* Verified seller badge for B2C */}
            {marketType === 'b2c' && product.vendorId % 2 === 0 && (
              <Badge className="bg-green-600">{verifiedBadgeText}</Badge>
            )}

            {/* Friend indicator for C2C */}
            {marketType === 'c2c' && product.vendorId % 3 === 0 && (
              <Badge className="bg-blue-600">{friendText}</Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-4 flex-grow">
          <div className="font-medium text-sm leading-tight hover:text-primary cursor-pointer min-h-[2.5rem] flex items-center" onClick={() => setLocation(`/product/${product.id}`)}>
            <ProductName productName={product.name} />
          </div>
          
          {/* Price moved below title */}
          <div className="flex items-center justify-between">
            <div>
              {product.discountPrice ? (
                <div className="flex items-center">
                  <div className="font-bold text-blue-600 text-sm">
                    {formatPrice(product.discountPrice)}
                    {marketType === 'b2b' && <span className="text-xs ml-1">{vatText}</span>}
                  </div>
                  <div className="ml-2 text-sm text-gray-500 line-through">{formatPrice(product.price)}</div>
                </div>
              ) : (
                <div className="font-bold text-blue-600 text-sm">
                  {formatPrice(product.price)}
                  {marketType === 'b2b' && <span className="text-xs ml-1">{vatText}</span>}
                </div>
              )}
            </div>

          </div>
          
          <div className="text-sm text-gray-500">
            <CategoryName categoryName={product.category} />
          </div>
          
          {/* Additional info based on market type */}
          {marketType === 'b2b' && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">{volumeDiscountText}</span>
            </div>
          )}
          {marketType === 'c2c' && (
            <div className="text-xs text-gray-500">
              <span>{listedByText} User{product.vendorId}</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button 
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
                className="bg-black text-white hover:bg-gray-800 font-bold"
                title={marketType === 'c2c' ? viewProductDetailsText : addToCartTooltipText}
              >
                {addToCartMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  buyText
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => shareOnFeed(product)}
                className="text-black hover:bg-transparent hover:text-gray-700 font-normal"
                title={shareOnFeedTooltipText}
              >
                {repostButtonText}
              </Button>
            </div>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOfferProduct(product);
                setOfferDialogOpen(true);
              }}
              className="text-black hover:bg-transparent hover:text-gray-700 font-normal"
              title={makeOfferTooltipText}
            >
              {sendOfferBtnText}
            </Button>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              title={sendGiftTooltipText}
              onClick={() => {
                setSelectedGiftProduct(product);
                setGiftDialogOpen(true);
              }}
            >
              <Gift className="h-5 w-5 text-blue-500" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              title={addToProfileTooltipText}
            >
              <Plus className="h-5 w-5 font-bold stroke-2" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => handleLikeToggle(product.id)}
              disabled={likeMutation.isPending || unlikeMutation.isPending}
              title={isProductLiked(product.id) ? removeFromFavoritesText : addToFavoritesText}
            >
              <Heart 
                className={`h-5 w-5 ${isProductLiked(product.id) ? 'fill-red-500 text-red-500' : 'fill-black text-black'}`} 
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  title={shareProductTooltipText}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{shareProductText}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => shareByEmail(product)}>
                <Mail className="h-4 w-4 mr-2 text-gray-600" />
                {shareViaEmailText}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyLinkToClipboard(product)}>
                <LinkIcon className="h-4 w-4 mr-2 text-gray-600" />
                {copyLinkText}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareOnFeed(product)}>
                <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                {shareOnFeedText}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareViaMessage(product)}>
                <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                {sendViaMessageText}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation(`/members?share=${product.id}&url=${encodeURIComponent(`/product/${product.id}`)}&title=${encodeURIComponent(product.name)}`)}>
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                {shareWithMemberText}
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>
    ));
  };

  // Content for the filter sidebar
  const FilterContent = () => (
    <div className="space-y-6 text-[14px]">


      <div>
        <h3 className="font-medium mb-2 text-[14px]">{searchForProductsText}</h3>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={`${searchWithinText} ${marketType.toUpperCase()}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 text-[12px]"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2 text-[14px]">{productOrServiceText}</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-products"
              checked={selectedProductTypes.includes('product')}
              onCheckedChange={() => toggleProductType('product')}
            />
            <Label htmlFor="show-products" className="text-[12px] font-normal">{productFilterText}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-services"
              checked={selectedProductTypes.includes('service')}
              onCheckedChange={() => toggleProductType('service')}
            />
            <Label htmlFor="show-services" className="text-[12px] font-normal">{serviceFilterText}</Label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2 text-[14px]">{categoriesText}</h3>
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
                  <CategoryName categoryName={category.name} />
                  <span className="text-gray-500">({categoryCount[category.name] || 0})</span>
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2 text-[14px]">{regionText}</h3>
        <div className="space-y-2">
          {['Africa', 'South Asia', 'East Asia', 'Oceania', 'North America', 'Central America', 'South America', 'Middle East', 'Europe', 'Central Asia'].map((region) => (
            <div key={region} className="flex items-center space-x-2">
              <Checkbox
                id={`region-${region}`}
                checked={selectedRegions.includes(region)}
                onCheckedChange={() => toggleRegion(region)}
              />
              <Label
                htmlFor={`region-${region}`}
                className="text-[12px] font-normal"
              >
                <RegionName regionName={region} />
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2 text-[14px]">{productStatusText}</h3>
        <div className="space-y-2 font-normal text-[12px]">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-sale"
              checked={showSale}
              onCheckedChange={(checked) => setShowSale(checked === true)}
            />
            <Label htmlFor="show-sale" className="text-[12px] font-normal">{onSaleText}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-new"
              checked={showNew}
              onCheckedChange={(checked) => setShowNew(checked === true)}
            />
            <Label htmlFor="show-new" className="text-[12px] font-normal">{newArrivalsText}</Label>
          </div>
        </div>
      </div>

      {/* Market-specific filters */}
      {marketType === 'c2c' && (
        <div>
          <h3 className="font-medium mb-2 text-[14px]">{friendOptionsText}</h3>
          <div className="space-y-2 text-[12px] font-normal">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="friends-only"
              />
              <Label htmlFor="friends-only" className="text-[12px] font-normal">{friendsOnlyText}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="local-only"
              />
              <Label htmlFor="local-only" className="text-[12px] font-normal">{localPickupText}</Label>
            </div>
          </div>
        </div>
      )}

      {marketType === 'b2c' && (
        <div>
          <h3 className="font-medium mb-2 text-[14px]">{storeOptionsText}</h3>
          <div className="space-y-2 text-[12px] font-normal">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified-only"
              />
              <Label htmlFor="verified-only" className="text-[12px] font-normal">{verifiedStoresText}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="free-shipping"
              />
              <Label htmlFor="free-shipping" className="text-[12px] font-normal">{freeShippingText}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="next-day-delivery"
              />
              <Label htmlFor="next-day-delivery" className="text-[12px] font-normal">{nextDayDeliveryText}</Label>
            </div>
          </div>
        </div>
      )}

      {marketType === 'b2b' && (
        <div>
          <h3 className="font-medium mb-2 text-[14px]">{businessOptionsText}</h3>
          <div className="space-y-2 text-[12px] font-normal">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-discount"
              />
              <Label htmlFor="bulk-discount" className="text-[12px] font-normal">{volumeDiscountsText}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wholesale-only"
              />
              <Label htmlFor="wholesale-only" className="text-[12px] font-normal">{wholesaleOnlyText}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tax-exempt"
              />
              <Label htmlFor="tax-exempt" className="text-[12px] font-normal">{taxExemptText}</Label>
            </div>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        onClick={resetFilters}
        className="w-full"
      >
        {resetFiltersText}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">

      <div className="flex justify-end items-center mb-4">
        {/* Mobile filter button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="md:hidden">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {filterText}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{filterProductsText}</SheetTitle>
              <SheetDescription>
                {narrowDownText}
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
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? productText : productsText} {productFoundText}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(category => (
                <Badge variant="outline" key={category} className="flex items-center gap-1">
                  <CategoryName categoryName={category} />
                  <button
                    onClick={() => toggleCategory(category)}
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              
              {selectedRegions.map(region => (
                <Badge variant="outline" key={region} className="flex items-center gap-1">
                  <RegionName regionName={region} />
                  <button
                    onClick={() => toggleRegion(region)}
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              
              {selectedProductTypes.length < 2 && selectedProductTypes.map(productType => (
                <Badge key={productType} variant="outline" className="flex items-center gap-1">
                  {productType === 'product' ? productsText : servicesText}
                  <button
                    onClick={() => toggleProductType(productType)}
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              
              {showSale && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {onSaleText}
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
                  {newArrivalsText}
                  <button
                    onClick={() => setShowNew(false)}
                    className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
                {(selectedCategories.length > 0 || selectedRegions.length > 0 || selectedProductTypes.length < 2 || showSale || showNew) && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 px-2">
                    {clearAllText}
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Products per page selector */}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span>{showText}</span>
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

              {/* Sort by dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 border-0 hover:bg-transparent">
                    {sortByText}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" sideOffset={4} avoidCollisions={false}>
                  <DropdownMenuLabel>{sortOptionsText}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy('trending')}>
                    {trendingText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-low-high')}>
                    {priceLowHighText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-high-low')}>
                    {priceHighLowText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>
                    {newestProductText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('region')}>
                    {yourRegionText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('country')}>
                    {yourCountryText}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Product grid */}
          <div className={`grid gap-6 ${
            columnsPerRow === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
            columnsPerRow === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
            columnsPerRow === 5 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {renderProductGrid()}
          </div>
        </div>
      </div>

      {/* Repost Dialog */}
      <Dialog open={repostDialogOpen} onOpenChange={setRepostDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{repostToCommunityText}</DialogTitle>
            <DialogDescription>
              {addMessageText}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="my-4">
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatPrice(selectedProduct.price)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{addYourMessageText}</label>
              <Textarea
                placeholder={whatDoYouThinkText}
                value={repostMessage}
                onChange={(e) => setRepostMessage(e.target.value)}
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
              {postWithoutTextButton}
            </Button>
            <Button
              onClick={handleRepostWithText}
              disabled={repostMutation.isPending}
              className="bg-black text-white hover:bg-gray-800"
            >
              {repostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {postingText}
                </>
              ) : (
                postToFeedButton
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{sendOfferTitle}</DialogTitle>
            <DialogDescription>
              {sendPriceOfferText}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOfferProduct && (
            <div className="my-4">
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{selectedOfferProduct.name}</h4>
                  <p className="text-sm text-gray-600">
                    {listedText}: {formatPrice(selectedOfferProduct.price)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="offer-amount" className="text-sm font-medium">{yourOfferAmountText}</Label>
              <Input
                id="offer-amount"
                type="number"
                placeholder={enterOfferAmountText}
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="mt-2"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="offer-message" className="text-sm font-medium">{messageOptionalText}</Label>
              <Textarea
                id="offer-message"
                placeholder={addMessageWithOfferText}
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOfferDialogOpen(false)}
              disabled={sendOfferMutation.isPending}
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                if (selectedOfferProduct && offerAmount) {
                  sendOfferMutation.mutate({
                    productId: selectedOfferProduct.id,
                    amount: offerAmount,
                    message: offerMessage
                  });
                }
              }}
              disabled={sendOfferMutation.isPending || !offerAmount}
              className="bg-black text-white hover:bg-gray-800"
            >
              {sendOfferMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {sendingText}
                </>
              ) : (
                sendOfferText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Dialog */}
      <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{sendGiftTitle}</DialogTitle>
            <DialogDescription>
              {sendProductAsGiftText}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGiftProduct && (
            <div className="my-4">
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{selectedGiftProduct.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatPrice(selectedGiftProduct.price)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {byText} {selectedGiftProduct.vendorName || 'Vendor'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="gift-search" className="text-sm font-medium mb-2 block">
                {searchForRecipientText}
              </Label>
              <Input
                id="gift-search"
                type="text"
                placeholder={typeNameUsernameText}
                value={giftSearchQuery}
                onChange={(e) => setGiftSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            {userSearchLoading && giftSearchQuery.length >= 2 && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            
            {Array.isArray(userSearchResults) && userSearchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                {userSearchResults.map((user: any) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRecipient?.id === user.id
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedRecipient(user)}
                  >
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.username}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {selectedRecipient?.id === user.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {giftSearchQuery.length >= 2 && !userSearchLoading && Array.isArray(userSearchResults) && userSearchResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>{noUsersFoundText} "{giftSearchQuery}"</p>
              </div>
            )}
            
            {giftSearchQuery.length < 2 && giftSearchQuery.length > 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                {typeAtLeastText}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGiftDialogOpen(false)}>
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                if (selectedRecipient && selectedGiftProduct) {
                  sendGiftMutation.mutate({
                    productId: selectedGiftProduct.id,
                    recipientId: selectedRecipient.id
                  });
                }
              }}
              disabled={sendGiftMutation.isPending || !selectedRecipient}
              className="bg-pink-500 text-white hover:bg-pink-600"
            >
              {sendGiftMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {sendingText}
                </>
              ) : (
                sendGiftText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      
      </div>
    </div>
  );
}