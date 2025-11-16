import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link as WouterLink } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';
import { useMarketType } from '@/hooks/use-market-type';
import { PersonalizedRecommendations } from '@/components/PersonalizedRecommendations';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMasterBatchTranslation, useMasterTranslation } from '@/hooks/use-master-translation';
import { useLanguage } from '@/contexts/LanguageContext';

import { InstantImageAd, preloadAdvertisementImages } from '@/components/ads/InstantImageAd';
import { ReportButton } from '@/components/ui/report-button';

// Use server-served static asset paths for production compatibility
const luxuryB2CImage = '/attached_assets/Dedw3n%20Marketplace%20(1).png';
const bottomPromoImage = '/attached_assets/Copy%20of%20Dedw3n%20Marketplace%20III.png';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, ShoppingCart, Search, SlidersHorizontal, Share2, Mail, Link as LinkIcon, MessageSquare, Users, MessageCircle, Store, Building, Landmark, Heart, ChevronDown, Plus, Gift, Smartphone, Filter, CreditCard, Repeat2, Tag, Flag } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

// Helper function to convert vendor store name to slug
const createVendorSlug = (storeName: string): string => {
  return storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
};

import { useToast } from '@/hooks/use-toast';

// Mobile device detection utility
const isMobileDevice = () => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768 && 'ontouchstart' in window);
};

export default function Products() {
  usePageTitle({ title: 'Products' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(['product', 'service', 'digital_product']);
  const [showSale, setShowSale] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [location, setLocation] = useLocation();
  const { marketType, setMarketType, marketTypeLabel } = useMarketType();
  const { formatPrice, formatPriceFromGBP, currencyList, selectedCurrency } = useCurrency();
  
  // Get current marketplace from URL
  const currentMarketplace = location.includes('/marketplace/b2c') ? 'b2c' :
                           location.includes('/marketplace/b2b') ? 'b2b' :
                           location.includes('/marketplace/c2c') ? 'c2c' :
                           location.includes('/marketplace/rqst') ? 'rqst' : null;
  const [forceUpdate, setForceUpdate] = useState(0);
  const [sortBy, setSortBy] = useState<string>('trending');
  const [productsPerPage, setProductsPerPage] = useState<number>(30);
  const [columnsPerRow, setColumnsPerRow] = useState<number>(4);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguage();
  
  // Collapsible section states for filter panel
  const [productOrServiceOpen, setProductOrServiceOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [productStatusOpen, setProductStatusOpen] = useState(false);
  const [storeOptionsOpen, setStoreOptionsOpen] = useState(false);
  const [sortByOpen, setSortByOpen] = useState(false);
  
  // User authentication
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user');
      return response.json();
    }
  });
  
  // Master Translation System - Single mega-batch call (34 → 1 API call)
  const productTexts = [
    // Filter & Search (7 texts)
    "Filter", "Filter Products", "Narrow down products based on your preferences",
    "product", "products", "found", "Clear All",
    
    // Sort & Display (7 texts)
    "Show", "Sort by", "Sort Options", "Trending", "Price: Low to High", 
    "Price: High to Low", "Newest Product",
    
    // Product Actions (9 texts)
    "Add to Cart", "Add to shopping cart", "Share on community feed", "Make an offer",
    "Send as gift", "Add to profile", "Share product", "View product details", "Add Product/Service",
    
    // Additional Actions (12 texts)
    "Add to Shopping Bag", "New", "Sale", "Verified", "Min qty", "Buy Now",
    "Share", "View Product", "Cancel", "Sending...", "Posting...",
    
    // Gift & Messaging (13 texts) - Fixed count
    "Search for recipient", "Type name or username...", "No users found matching",
    "Type at least 2 characters to search", "Send Gift", "Buy", "Listed by",
    "Send Gift", "Send this product as a gift to someone special", "By", "Share with Member",
    "Share via Text", "Share via Text Message", // Updated VAT text to SMS sharing
    
    // Community & Sharing (10 texts)
    "Services", "Your Region", "Your Country",
    "Would you like to add a message with this product share?", "Add your message (optional)",
    "What do you think about this product?", "Repost", "Repost", "Share via E-mail",
    "Share via Email",
    
    // Offers & Actions (12 texts)
    "Post to Feed", "Send Offer", "Send a price offer to the product owner", "Listed",
    "Your Offer Amount", "Enter your offer amount", "Message (optional)",
    "Add a message with your offer...", "Send via Message", "Send Offer",
    "Would you like to add a message with this offer ?", "Currency",
    
    // Search & Filters (10 texts)
    "Categories", "Region", "Reset Filters",
    "On Sale", "New Arrivals", "Product or Service", "Product", "Service", "Digital Product", "Product Status",
    
    // Friend & Store Options (10 texts)
    "Friend Options", "Friends only", "Local pickup only", "Store Options",
    "Verified stores only", "Free shipping", "Next day delivery", "Business Options",
    
    // Favorites Actions (2 texts)
    "Add to Favorites", "Remove from Favorites",
    
    // Vendor Information (1 text)
    "Sold by",
    
    // Report Feature (14 texts)
    "Report Product", "Help us maintain a safe marketplace by reporting products that violate our policies",
    "Reason for reporting", "Select a reason", "Counterfeit Product", "Fraudulent Listing",
    "Prohibited Item", "Misleading Information", "Harassment or Abuse", "Spam",
    "Copyright Violation", "Other", "Additional details (optional)", 
    "Provide more information about why you're reporting this product..."
  ];

  const { translations: t } = useMasterBatchTranslation(productTexts);
  
  // Define VAT text for B2B market type
  const vatText = t?.[121] || "(incl. VAT)";
  
  // Extract translations with descriptive variable names
  const [
    filterText, filterProductsText, narrowDownText, productText, productsText, 
    productFoundText, clearAllText,
    
    showText, sortByText, sortOptionsText, trendingText, priceLowHighText,
    priceHighLowText, newestProductText,
    
    addToCartText, addToCartTooltipText, shareOnFeedTooltipText, makeOfferTooltipText,
    sendGiftTooltipText, addToProfileTooltipText, shareProductTooltipText, viewProductDetailsText, addProductServiceText,
    
    addToShoppingBagText, newBadgeText, saleBadgeText, verifiedBadgeText, minQtyText,
    buyNowText, shareText, viewProductText, cancelText, sendingText, postingText,
    
    searchForRecipientText, typeNameUsernameText, noUsersFoundText, typeAtLeastText,
    sendGiftText, buyText, listedByText, sendGiftTitle, sendProductAsGiftText, byText, shareWithMemberText,
    shareViaTextMessageText,
    
    servicesText, yourRegionText, yourCountryText, addMessageText,
    addYourMessageText, whatDoYouThinkText, postWithoutTextButton, repostButtonText, shareOnFeedText,
    shareViaEmailText,
    
    postToFeedButton, sendOfferTitle, sendPriceOfferText, listedText, yourOfferAmountText,
    enterOfferAmountText, messageOptionalText, addMessageWithOfferText, sendViaMessageText, sendOfferText,
    sendOfferBtnText, wouldYouLikeAddMessageOfferText, currencyText,
    
    categoriesText, regionText, resetFiltersText,
    onSaleText, newArrivalsText, productOrServiceText, productFilterText, serviceFilterText, digitalProductFilterText, productStatusText,
    
    friendOptionsText, friendsOnlyText, localPickupText, storeOptionsText, verifiedStoresText,
    freeShippingText, nextDayDeliveryText, businessOptionsText,
    
    addToFavoritesText, removeFromFavoritesText, soldByText,
    
    reportProductText, reportProductDescriptionText, reasonForReportingText, selectReasonText,
    counterfeitProductText, fraudulentListingText, prohibitedItemText, misleadingInfoText,
    harassmentAbuseText, spamText, copyrightViolationText, otherReasonText,
    additionalDetailsText, reportPlaceholderText
  ] = t || [];
  
  // Fix for missing variables
  const shareProductText = shareProductTooltipText;
  const copyLinkText = "Copy Link";
  const friendText = friendsOnlyText;
  const volumeDiscountText = "Volume Discounts";
  const volumeDiscountsText = "Volume Discounts";
  const wholesaleOnlyText = "Wholesale Only";
  const taxExemptText = "Tax Exempt";
  
  // All individual translation calls now consolidated in mega-batch above
  
  // Repost dialog state
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [repostMessage, setRepostMessage] = useState('');

  // Send Offer dialog state
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedOfferProduct, setSelectedOfferProduct] = useState<any>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerCurrency, setOfferCurrency] = useState(selectedCurrency.code);
  const [offerMessage, setOfferMessage] = useState('');

  // Gift functionality state
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [selectedGiftProduct, setSelectedGiftProduct] = useState<any>(null);
  const [giftSearchQuery, setGiftSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  // Share with Member dialog state
  const [shareWithMemberDialogOpen, setShareWithMemberDialogOpen] = useState(false);
  const [selectedShareProduct, setSelectedShareProduct] = useState<any>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // RQST Sell Confirmation dialog state
  const [sellConfirmationOpen, setSellConfirmationOpen] = useState(false);
  const [selectedSellProduct, setSelectedSellProduct] = useState<any>(null);

  // Report Product dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReportProduct, setSelectedReportProduct] = useState<any>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');

  // Member search query for share functionality  
  const { data: memberSearchResults = [], isLoading: memberSearchLoading } = useQuery({
    queryKey: ['/api/users/search', memberSearchQuery, shareWithMemberDialogOpen],
    queryFn: async () => {
      try {
        if (memberSearchQuery.length >= 2) {
          const result = await apiRequest(`/api/users/search?q=${encodeURIComponent(memberSearchQuery)}`);
          return Array.isArray(result) ? result : [];
        } else if (shareWithMemberDialogOpen) {
          // Show recent users when dialog is open but no search query
          const result = await apiRequest(`/api/users/search?q=&limit=10`);
          return Array.isArray(result) ? result : [];
        }
        return [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: shareWithMemberDialogOpen,
  });

  // Liked products functionality
  const { data: likedProducts = [] } = useQuery({
    queryKey: ['/api/liked-products'],
    queryFn: () => apiRequest('/api/liked-products'),
  });

  const likeMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest('POST', `/api/products/${productId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products/count'] });
      toast({
        title: "Product Liked",
        description: "Product added to your liked items!",
      });
    },
    onError: (error: any) => {
      const isAuthError = error?.status === 401 || 
                         error?.message?.includes("Unauthorized") || 
                         error?.message?.includes("Authentication required");
      
      if (isAuthError) {
        toast({
          title: "Login Required",
          description: "To add products to your favourites, please log in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to like product. Please try again.",
          variant: "destructive",
        });
      }
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
        description: "Product removed from your liked items.",
      });
    },
    onError: (error: any) => {
      const isAuthError = error?.status === 401 || 
                         error?.message?.includes("Unauthorized") || 
                         error?.message?.includes("Authentication required");
      
      if (isAuthError) {
        toast({
          title: "Login Required",
          description: "To add products to your favourites, please log in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error", 
          description: error.message || "Failed to unlike product. Please try again.",
          variant: "destructive",
        });
      }
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
      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('Please log in to add items to your cart.');
      }

      // Get auth token for authentication
      const authToken = localStorage.getItem('dedwen_auth_token');
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if available for JWT auth
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          // Add session cookie support flag
          'X-Use-Session': 'true',
          'X-Client-Auth': 'true',
          'X-Client-User-ID': user?.id?.toString() || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to add to cart: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Repost to feed mutation
  const repostMutation = useMutation({
    mutationFn: async ({ productId, text }: { productId: number; text?: string }) => {
      // Get auth token for authentication
      const authToken = localStorage.getItem('dedwen_auth_token');
      
      return await fetch('/api/posts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if available for JWT auth
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          // Add session cookie support flag
          'X-Use-Session': 'true',
          'X-Client-Auth': 'true',
          'X-Client-User-ID': user?.id?.toString() || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          content: text || `Check out this product: ${selectedProduct?.name}`,
          productId,
          contentType: 'product_share'
        })
      }).then(res => {
        if (!res.ok) {
          throw new Error(`Failed to post: ${res.status} ${res.statusText}`);
        }
        return res.json();
      });
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send offer');
      }
      
      return response.json();
    },
    onSuccess: () => {
      const vendorName = selectedOfferProduct?.vendorId === 1 ? 'Kinshasa DR Congo' : `Vendor ${selectedOfferProduct?.vendorId}`;
      toast({
        title: "Offer Sent!",
        description: `Your offer has been sent to ${vendorName}`,
      });
      setOfferDialogOpen(false);
      setOfferAmount('');
      setOfferMessage('');
      setSelectedOfferProduct(null);
    },
    onError: (error: any) => {
      console.error('Send offer error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send offer. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Share with member mutation
  const shareWithMemberMutation = useMutation({
    mutationFn: async ({ productId, memberId }: { productId: number; memberId: number }) => {
      if (!selectedShareProduct) {
        throw new Error('Product information is missing');
      }

      return await apiRequest('POST', '/api/messages/send', {
        receiverId: memberId,
        content: `📦 PRODUCT SHARE: "${selectedShareProduct.name}"\n\nPrice: ${formatPrice(selectedShareProduct.price)}\n\nCheck it out: /product/${productId}`,
        category: 'marketplace'
      });
    },
    onSuccess: () => {
      const memberName = selectedMember?.name || selectedMember?.username || 'the member';
      toast({
        title: "Product Shared!",
        description: `Product has been shared with ${memberName}`,
      });
      setShareWithMemberDialogOpen(false);
      setMemberSearchQuery('');
      setSelectedMember(null);
      setSelectedShareProduct(null);
    },
    onError: (error: any) => {
      console.error('Share with member error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to share product. Please try again.",
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

  // Report product mutation
  const reportProductMutation = useMutation({
    mutationFn: async ({ productId, reason, customMessage }: { productId: number; reason: string; customMessage: string }) => {
      const response = await apiRequest('POST', `/api/products/${productId}/report`, {
        reason,
        customMessage
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Thank you for reporting. We will review this product.",
      });
      setReportDialogOpen(false);
      setReportReason('');
      setReportMessage('');
      setSelectedReportProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add to dating profile mutation
  const addToDatingProfileMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest('POST', '/api/dating-profile/gifts', {
        productId
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Added to Dating Profile!",
        description: `${data.productName} added to your gifts (${data.giftCount}/20)`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to add to dating profile";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleAddToDatingProfile = (productId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your dating profile",
        variant: "destructive"
      });
      return;
    }
    addToDatingProfileMutation.mutate(productId);
  };
  
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
      sortBy: sortBy,
      marketplace: currentMarketplace
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
      if (currentMarketplace) params.append('marketplace', currentMarketplace);
      
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

  // SMS sharing function - opens native text messaging app on mobile
  const shareViaSMS = (product: any) => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const smsBody = `Check out this product: ${product.name}\n\n${formatPrice(product.price)}\n\n${productUrl}`;
    
    // Create SMS URL scheme
    const smsUrl = `sms:?body=${encodeURIComponent(smsBody)}`;
    
    // Open SMS app
    window.open(smsUrl, '_blank');
    
    toast({
      title: "Opening Text Messages",
      description: "Text messaging app should open with product details",
    });
  };

  const shareViaWhatsApp = async (product: any) => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const whatsappMessage = `🛍️ Check out this amazing product!\n\n*${product.name}*\n💰 ${formatPrice(product.price)}\n\n${product.description ? product.description.substring(0, 100) + '...' : ''}\n\n🔗 ${productUrl}\n\n_Shared via Dedw3n Marketplace_`;
    
    // Track WhatsApp share analytics (optional)
    try {
      await apiRequest('POST', '/api/analytics/share', {
        productId: product.id,
        shareType: 'whatsapp',
        platform: 'whatsapp'
      });
    } catch (error) {
      console.log('Analytics tracking failed:', error);
      // Don't block sharing if analytics fails
    }
    
    // Create WhatsApp URL scheme
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Opening WhatsApp",
      description: "WhatsApp should open with product details ready to share",
    });
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
        <div className="col-span-full py-12 text-center space-y-4">
          <div className="text-red-500 mb-4">Error loading products</div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <ReportButton 
              errorType="Products Loading Error"
              errorMessage={`Failed to load products: ${productsError?.message || 'Unknown error'}`}
              variant="outline"
              size="default"
            />
          </div>
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
          
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <Badge className="bg-black text-white">
                {newBadgeText}
              </Badge>
            )}
            {product.isOnSale && (
              <Badge className="bg-black text-white">{saleBadgeText}</Badge>
            )}
            
            {/* B2B badge for minimum quantities */}
            {marketType === 'b2b' && (
              <Badge className="bg-black text-white">{minQtyText}: 10</Badge>
            )}

            {/* Verified seller badge for B2C */}
            {marketType === 'b2c' && product.vendorId % 2 === 0 && (
              <Badge className="bg-black text-white">{verifiedBadgeText}</Badge>
            )}

            {/* Friend indicator for C2C */}
            {marketType === 'c2c' && product.vendorId % 3 === 0 && (
              <Badge className="bg-black text-white">{friendText}</Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-4 flex-grow">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="font-medium text-sm leading-tight hover:text-primary cursor-pointer flex-1 min-h-[2.5rem] flex items-center" onClick={() => setLocation(`/product/${product.id}`)}>
              <ProductName productName={product.name} />
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
                title={shareOnFeedTooltipText || "Repost"}
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
                title={makeOfferTooltipText || "Send Offer"}
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
                title={addToCartTooltipText || "Add to Cart"}
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
                title={isProductLiked(product.id) ? removeFromFavoritesText : addToFavoritesText}
                data-testid={`button-favorite-${product.id}`}
                data-no-login
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
                    title={shareProductTooltipText}
                    data-testid={`button-share-${product.id}`}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{shareProductText}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => shareByEmail(product)}>
                    <Mail className="h-4 w-4 mr-2 text-black" />
                    Share via Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyLinkToClipboard(product)}>
                    <LinkIcon className="h-4 w-4 mr-2 text-black" />
                    {copyLinkText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareOnFeed(product)}>
                    <svg className="h-4 w-4 mr-2 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 4v6h6M23 20v-6h-6"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    Repost
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedShareProduct(product);
                    setShareWithMemberDialogOpen(true);
                  }}>
                    <Users className="h-4 w-4 mr-2 text-black" />
                    {shareWithMemberText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareViaWhatsApp(product)}>
                    <svg className="h-4 w-4 mr-2 text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.598z"/>
                    </svg>
                    Share via WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareViaSMS(product)}>
                    <Smartphone className="h-4 w-4 mr-2 text-black" />
                    {shareViaTextMessageText || "Share via Text Message"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedReportProduct(product);
                  setReportDialogOpen(true);
                }}
                className="h-8 w-8 text-black hover:bg-gray-100"
                title="Report Product"
                data-testid={`button-report-${product.id}`}
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Price moved below title */}
          <div className="flex items-center justify-between">
            <div>
              {product.discountPrice ? (
                <div className="flex items-center">
                  <div className="text-black text-sm">
                    {formatPriceFromGBP(product.discountPrice)}
                    {marketType === 'b2b' && <span className="text-xs ml-1">{vatText}</span>}
                  </div>
                  <div className="ml-2 text-sm text-gray-500 line-through">{formatPriceFromGBP(product.price)}</div>
                </div>
              ) : (
                <div className="text-black text-sm">
                  {formatPriceFromGBP(product.price)}
                  {marketType === 'b2b' && <span className="text-xs ml-1">{vatText}</span>}
                </div>
              )}
            </div>

          </div>
          
          <div className="text-sm text-gray-500">
            <CategoryName categoryName={product.category} />
          </div>
          
          {/* Vendor/Store information */}
          <div className="text-[12px] text-black mt-1">
            {marketType === 'rqst' ? 'Requested by' : (soldByText || "Sold by")}{' '}
            <WouterLink 
              href={`/vendor/${createVendorSlug(product.vendorStoreName || `Vendor${product.vendorId}`)}`}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="hover:underline cursor-pointer"
              data-testid={`link-vendor-${product.vendorId}`}
            >
              {product.vendorStoreName || `Vendor ${product.vendorId}`}
            </WouterLink>
          </div>
          
          {/* Additional info based on market type */}
          {marketType === 'b2b' && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">{volumeDiscountText}</span>
            </div>
          )}
        </CardContent>
      </Card>
    ));
  };

  // Content for the filter sidebar
  const FilterContent = () => (
    <div className="space-y-6 text-[14px]">
      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => setProductOrServiceOpen(!productOrServiceOpen)}
        >
          <h3 className="font-medium text-[14px]">{productOrServiceText}</h3>
          <ChevronDown className={`h-4 w-4 transition-transform ${productOrServiceOpen ? 'rotate-180' : ''}`} />
        </div>
        {productOrServiceOpen && (
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-digital-products"
                checked={selectedProductTypes.includes('digital_product')}
                onCheckedChange={() => toggleProductType('digital_product')}
              />
              <Label htmlFor="show-digital-products" className="text-[12px] font-normal">{digitalProductFilterText}</Label>
            </div>
          </div>
        )}
      </div>

      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => setCategoriesOpen(!categoriesOpen)}
        >
          <h3 className="font-medium text-[14px]">{categoriesText}</h3>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
        </div>
        {categoriesOpen && (
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
        )}
      </div>

      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => setRegionOpen(!regionOpen)}
        >
          <h3 className="font-medium text-[14px]">{regionText}</h3>
          <ChevronDown className={`h-4 w-4 transition-transform ${regionOpen ? 'rotate-180' : ''}`} />
        </div>
        {regionOpen && (
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
        )}
      </div>

      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => setProductStatusOpen(!productStatusOpen)}
        >
          <h3 className="font-medium text-[14px]">{productStatusText}</h3>
          <ChevronDown className={`h-4 w-4 transition-transform ${productStatusOpen ? 'rotate-180' : ''}`} />
        </div>
        {productStatusOpen && (
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
        )}
      </div>

      {/* Market-specific filters */}
      {marketType === 'c2c' && (
        <div>
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={() => setStoreOptionsOpen(!storeOptionsOpen)}
          >
            <h3 className="font-medium text-[14px]">{friendOptionsText}</h3>
            <ChevronDown className={`h-4 w-4 transition-transform ${storeOptionsOpen ? 'rotate-180' : ''}`} />
          </div>
          {storeOptionsOpen && (
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
          )}
        </div>
      )}

      {marketType === 'b2c' && (
        <div>
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={() => setStoreOptionsOpen(!storeOptionsOpen)}
          >
            <h3 className="font-medium text-[14px]">{storeOptionsText}</h3>
            <ChevronDown className={`h-4 w-4 transition-transform ${storeOptionsOpen ? 'rotate-180' : ''}`} />
          </div>
          {storeOptionsOpen && (
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
          )}
        </div>
      )}

      {marketType === 'b2b' && (
        <div>
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={() => setStoreOptionsOpen(!storeOptionsOpen)}
          >
            <h3 className="font-medium text-[14px]">{businessOptionsText}</h3>
            <ChevronDown className={`h-4 w-4 transition-transform ${storeOptionsOpen ? 'rotate-180' : ''}`} />
          </div>
          {storeOptionsOpen && (
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
          )}
        </div>
      )}

      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => setSortByOpen(!sortByOpen)}
        >
          <h3 className="font-medium text-[14px]">{sortByText}</h3>
          <ChevronDown className={`h-4 w-4 transition-transform ${sortByOpen ? 'rotate-180' : ''}`} />
        </div>
        {sortByOpen && (
          <RadioGroup value={sortBy} onValueChange={setSortBy} className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="trending" id="sort-trending" />
              <Label htmlFor="sort-trending" className="text-[12px] font-normal cursor-pointer">
                {trendingText}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="price-low-high" id="sort-price-low" />
              <Label htmlFor="sort-price-low" className="text-[12px] font-normal cursor-pointer">
                {priceLowHighText}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="price-high-low" id="sort-price-high" />
              <Label htmlFor="sort-price-high" className="text-[12px] font-normal cursor-pointer">
                {priceHighLowText}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="newest" id="sort-newest" />
              <Label htmlFor="sort-newest" className="text-[12px] font-normal cursor-pointer">
                {newestProductText}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="region" id="sort-region" />
              <Label htmlFor="sort-region" className="text-[12px] font-normal cursor-pointer">
                {yourRegionText}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="country" id="sort-country" />
              <Label htmlFor="sort-country" className="text-[12px] font-normal cursor-pointer">
                {yourCountryText}
              </Label>
            </div>
          </RadioGroup>
        )}
      </div>

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
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{filterText}</SheetTitle>
            </SheetHeader>
            <div className="py-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div>
        {/* Main content */}
        <div className="w-full">
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

              {/* Filter button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 border-0 hover:bg-transparent">
                    <SlidersHorizontal className="h-4 w-4" />
                    {filterText}
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{filterText}</SheetTitle>
                  </SheetHeader>
                  <div className="py-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Product grid */}
          <div className={`grid gap-6 ${
            columnsPerRow === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' :
            columnsPerRow === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' :
            columnsPerRow === 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
          }`}>
            {renderProductGrid()}
          </div>
        </div>
      </div>

      {/* Repost Dialog */}
      <Dialog open={repostDialogOpen} onOpenChange={setRepostDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">Repost</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="my-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                  {selectedProduct.imageUrl && (
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
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
                "Repost"
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
          </DialogHeader>
          
          {selectedOfferProduct && (
            <div className="my-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                  {selectedOfferProduct.imageUrl && (
                    <img 
                      src={selectedOfferProduct.imageUrl} 
                      alt={selectedOfferProduct.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
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
              <Label htmlFor="offer-amount" className="text-sm font-medium">{enterOfferAmountText}</Label>
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
              <Label htmlFor="offer-currency" className="text-sm font-medium">{currencyText}</Label>
              <Select value={offerCurrency} onValueChange={setOfferCurrency}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyList.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="offer-message" className="text-sm font-medium">{wouldYouLikeAddMessageOfferText}</Label>
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
                        ? 'bg-black/10 border border-black'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedRecipient(user)}
                  >
                    <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border border-gray-200">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={`${user.name || user.username}'s profile`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full bg-black flex items-center justify-center text-white font-semibold text-sm ${user.avatar ? 'hidden' : 'flex'}`}
                      >
                        {(user.name || user.username).charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.name || user.username}</p>
                      <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-gray-400 truncate mt-1">{user.bio}</p>
                      )}
                    </div>
                    {selectedRecipient?.id === user.id && (
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
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

      {/* Share with Member Dialog */}
      <Dialog open={shareWithMemberDialogOpen} onOpenChange={(open) => {
        setShareWithMemberDialogOpen(open);
        if (!open) {
          setMemberSearchQuery('');
          setSelectedMember(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-xl font-bold">Share with Member</DialogTitle>
            <DialogDescription>
              Share this product with another member via direct message
            </DialogDescription>
          </DialogHeader>
          
          {selectedShareProduct && (
            <div className="my-4">
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                  {selectedShareProduct.imageUrl && (
                    <img 
                      src={selectedShareProduct.imageUrl} 
                      alt={selectedShareProduct.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{selectedShareProduct.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatPrice(selectedShareProduct.price)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sold by {selectedShareProduct.vendorName || 'Vendor'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="member-search" className="text-sm font-medium mb-2 block">
                Search for Member
              </Label>
              <Input
                id="member-search"
                type="text"
                placeholder={typeNameUsernameText}
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            {memberSearchLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-gray-500">Searching...</span>
              </div>
            )}
            
            {Array.isArray(memberSearchResults) && memberSearchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                {memberSearchResults.map((member: any) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedMember?.id === member.id
                        ? 'bg-black/10 border border-black'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border border-gray-200">
                      {member.avatar ? (
                        <img 
                          src={member.avatar} 
                          alt={`${member.name || member.username}'s profile`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full bg-black flex items-center justify-center text-white font-semibold text-sm ${member.avatar ? 'hidden' : 'flex'}`}
                      >
                        {(member.name || member.username).charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.name || member.username}</p>
                      <p className="text-xs text-gray-500 truncate">@{member.username}</p>
                      {member.bio && (
                        <p className="text-xs text-gray-400 truncate mt-1">{member.bio}</p>
                      )}
                    </div>
                    {selectedMember?.id === member.id && (
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {memberSearchQuery.length >= 2 && !memberSearchLoading && Array.isArray(memberSearchResults) && memberSearchResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>{noUsersFoundText} "{memberSearchQuery}"</p>
              </div>
            )}
            
            {memberSearchQuery.length === 0 && !memberSearchLoading && Array.isArray(memberSearchResults) && memberSearchResults.length === 0 && shareWithMemberDialogOpen && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No members available to share with</p>
              </div>
            )}
            
            {memberSearchQuery.length === 0 && Array.isArray(memberSearchResults) && memberSearchResults.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Recent members:</p>
              </div>
            )}
            
            {memberSearchQuery.length < 2 && memberSearchQuery.length > 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                {typeAtLeastText}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareWithMemberDialogOpen(false)}>
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                if (selectedMember && selectedShareProduct) {
                  shareWithMemberMutation.mutate({
                    productId: selectedShareProduct.id,
                    memberId: selectedMember.id
                  });
                }
              }}
              disabled={shareWithMemberMutation.isPending || !selectedMember}
              className="bg-black text-white hover:bg-gray-800"
            >
              {shareWithMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                'Share Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Product Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">{reportProductText}</DialogTitle>
            <DialogDescription>
              {reportProductDescriptionText}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReportProduct && (
            <div className="my-4">
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                  {selectedReportProduct.imageUrl && (
                    <img 
                      src={selectedReportProduct.imageUrl} 
                      alt={selectedReportProduct.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{selectedReportProduct.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatPriceFromGBP(selectedReportProduct.price)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason" className="text-sm font-medium">{reasonForReportingText}</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-2" data-testid="select-report-reason">
                  <SelectValue placeholder={selectReasonText} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="counterfeit">{counterfeitProductText}</SelectItem>
                  <SelectItem value="fraud">{fraudulentListingText}</SelectItem>
                  <SelectItem value="prohibited">{prohibitedItemText}</SelectItem>
                  <SelectItem value="misinformation">{misleadingInfoText}</SelectItem>
                  <SelectItem value="harassment">{harassmentAbuseText}</SelectItem>
                  <SelectItem value="spam">{spamText}</SelectItem>
                  <SelectItem value="copyright">{copyrightViolationText}</SelectItem>
                  <SelectItem value="other">{otherReasonText}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="report-message" className="text-sm font-medium">{additionalDetailsText}</Label>
              <Textarea
                id="report-message"
                placeholder={reportPlaceholderText}
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                className="mt-2"
                rows={4}
                data-testid="textarea-report-message"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)} data-testid="button-cancel-report">
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                if (selectedReportProduct && reportReason) {
                  reportProductMutation.mutate({
                    productId: selectedReportProduct.id,
                    reason: reportReason,
                    customMessage: reportMessage
                  });
                }
              }}
              disabled={reportProductMutation.isPending || !reportReason}
              className="bg-black text-white hover:bg-gray-800"
              data-testid="button-submit-report"
            >
              {reportProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {sendingText}
                </>
              ) : (
                reportProductText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RQST Sell Confirmation Dialog */}
      <Dialog open={sellConfirmationOpen} onOpenChange={setSellConfirmationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold">
              Add to Online Store
            </DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to add the following product to your online store?
            </DialogDescription>
          </DialogHeader>

          {selectedSellProduct && (
            <div className="py-4">
              <div className="flex items-start space-x-4 p-4 border rounded-lg">
                <img
                  src={selectedSellProduct.imageUrl || '/placeholder-image.jpg'}
                  alt={selectedSellProduct.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    <ProductName productName={selectedSellProduct.name} />
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPrice(selectedSellProduct.price)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedSellProduct.category}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSellConfirmationOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSellProduct) {
                  // Collect ALL images from the original product
                  const allImages: string[] = [];
                  
                  // Add primary image
                  if (selectedSellProduct.imageUrl && selectedSellProduct.imageUrl !== '/placeholder-image.jpg') {
                    allImages.push(selectedSellProduct.imageUrl);
                  }
                  
                  // Add additional images from various possible sources
                  if (selectedSellProduct.images && Array.isArray(selectedSellProduct.images)) {
                    selectedSellProduct.images.forEach((img: string) => {
                      if (img && img !== '/placeholder-image.jpg' && !allImages.includes(img)) {
                        allImages.push(img);
                      }
                    });
                  }
                  
                  // Add gallery images if they exist
                  if (selectedSellProduct.gallery && Array.isArray(selectedSellProduct.gallery)) {
                    selectedSellProduct.gallery.forEach((img: string) => {
                      if (img && img !== '/placeholder-image.jpg' && !allImages.includes(img)) {
                        allImages.push(img);
                      }
                    });
                  }
                  
                  // Add imageUrls array if it exists
                  if (selectedSellProduct.imageUrls && Array.isArray(selectedSellProduct.imageUrls)) {
                    selectedSellProduct.imageUrls.forEach((img: string) => {
                      if (img && img !== '/placeholder-image.jpg' && !allImages.includes(img)) {
                        allImages.push(img);
                      }
                    });
                  }
                  
                  // Navigate to add-product page with comprehensive pre-filled data including ALL images
                  const productData = encodeURIComponent(JSON.stringify({
                    name: selectedSellProduct.name,
                    price: selectedSellProduct.price,
                    category: selectedSellProduct.category,
                    description: selectedSellProduct.description || '',
                    imageUrl: allImages[0] || '', // Primary image
                    images: allImages.slice(1), // Additional images
                    gallery: allImages, // Complete gallery for compatibility
                    imageUrls: allImages, // Complete image URLs array
                    weight: selectedSellProduct.weight || 0,
                    stock: selectedSellProduct.stock || 1,
                    type: selectedSellProduct.type || 'product',
                    videoUrl: selectedSellProduct.videoUrl || ''
                  }));
                  setLocation(`/add-product?prefill=${productData}`);
                  setSellConfirmationOpen(false);
                }
              }}
              disabled={false}
              className="bg-red-600 text-white hover:bg-red-700 flex-1"
            >
                'Add to Store'
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
      </div>
    </div>
  );
}