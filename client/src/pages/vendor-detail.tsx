import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { useMasterTranslation, useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useAuth } from "@/hooks/use-auth";
import { SEOHead } from "@/components/seo/SEOHead";
import { buildVendorSchema, normalizeDescription, normalizeTitle } from "@/lib/buildSeoStructuredData";
import { Vendor, Product } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Store, 
  User, 
  ShoppingBag, 
  Star, 
  Mail,
  ChevronLeft,
  SlidersHorizontal,
  ChevronDown,
  ShoppingCart,
  Share2,
  LinkIcon,
  Users,
  Smartphone,
  Filter,
  CreditCard,
  Repeat2,
  Tag,
  Flag,
  Heart,
  Loader2
} from "lucide-react";
import { Textarea } from '@/components/ui/textarea';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';

const nullishToUndefined = <T,>(value: T | null | undefined): T | undefined => value ?? undefined;

// Helper function to convert vendor store name to slug
const createVendorSlug = (storeName: string): string => {
  return storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Component for translating category names
const CategoryName = ({ categoryName }: { categoryName: string }) => {
  const { translations } = useMasterBatchTranslation([categoryName]);
  const [translatedText] = translations || [categoryName];
  return <span className="text-[12px] font-normal">{translatedText}</span>;
};

// Component for translating product names
const ProductName = ({ productName }: { productName: string }) => {
  const { translations } = useMasterBatchTranslation([productName]);
  const [translatedText] = translations || [productName];
  return <span className="line-clamp-2">{translatedText}</span>;
};

export default function VendorDetailPage() {
  const { translateText } = useMasterTranslation();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const vendorSlug = location.split("/").pop() || "";

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(['product', 'service', 'digital_product']);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [showSale, setShowSale] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [productsPerPage, setProductsPerPage] = useState(30);
  const [columnsPerRow, setColumnsPerRow] = useState(4);

  // Filter panel state
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [productOrServiceOpen, setProductOrServiceOpen] = useState(false);
  const [productStatusOpen, setProductStatusOpen] = useState(false);
  const [sortByOpen, setSortByOpen] = useState(false);

  // Dialog states
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [repostMessage, setRepostMessage] = useState('');
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedOfferProduct, setSelectedOfferProduct] = useState<any>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReportProduct, setSelectedReportProduct] = useState<any>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [vendorMessage, setVendorMessage] = useState('');

  // Translation texts
  const productTexts = [
    "Filter", "Filter Products", "Narrow down your search", "Product", "Products", 
    "found", "Clear All",
    "Show", "Sort by", "Sort Options", "Trending", "Price: Low to High", 
    "Price: High to Low", "Newest Product",
    "Add to Cart", "Add to shopping cart", "Share on community feed", "Make an offer",
    "Send as gift", "Add to profile", "Share product", "View product details",
    "Add to Shopping Bag", "New", "Sale", "Verified", "Buy Now",
    "Share", "View Product", "Cancel", "Sending...", "Posting...",
    "Would you like to add a message with this product share?", "Add your message (optional)",
    "What do you think about this product?", "Repost", "Post to Feed",
    "Send Offer", "Send a price offer to the product owner", "Listed",
    "Your Offer Amount", "Enter your offer amount", "Message (optional)",
    "Add a message with your offer...", "Would you like to add a message with this offer ?",
    "Categories", "Reset Filters", "On Sale", "New Arrivals", 
    "Product or Service", "Product", "Service", "Digital Product", "Product Status",
    "Add to Favorites", "Remove from Favorites", "Sold by",
    "Report Product", "Reason for reporting", "Select a reason",
    "Counterfeit Product", "Fraudulent Listing", "Prohibited Item",
    "Misleading Information", "Harassment or Abuse", "Spam",
    "Copyright Violation", "Other", "Additional details (optional)",
    "Provide more information about why you're reporting this product...",
    "Your Region", "Your Country", "Share with Member", "Share via Text Message",
    "Share via E-mail", "Share via Email", "Currency", "Copy Link",
    "Min qty",
    "Contact Vendor", "Send Message to Vendor", "Type your message here...",
    "Send Message", "Message sent successfully"
  ];

  const { translations: t } = useMasterBatchTranslation(productTexts);
  const [
    filterText, filterProductsText, narrowDownText, productText, productsText, 
    productFoundText, clearAllText,
    showText, sortByText, sortOptionsText, trendingText, priceLowHighText,
    priceHighLowText, newestProductText,
    addToCartText, addToCartTooltipText, shareOnFeedTooltipText, makeOfferTooltipText,
    sendAsGiftTooltipText, addToProfileTooltipText, shareProductTooltipText, viewProductDetailsTooltipText,
    addToShoppingBagText, newBadgeText, saleBadgeText, verifiedBadgeText, buyNowText,
    shareText, viewProductText, cancelText, sendingText, postingText,
    wouldYouLikeAddMessageText, addYourMessageText,
    whatDoYouThinkText, repostText, postToFeedText,
    sendOfferTitle, sendOfferDescription, listedText,
    yourOfferAmountText, enterOfferAmountText, messageOptionalText,
    addMessageWithOfferText, wouldYouLikeAddMessageOfferText,
    categoriesText, resetFiltersText, onSaleText, newArrivalsText,
    productOrServiceText, productFilterText, serviceFilterText, digitalProductFilterText, productStatusText,
    addToFavoritesText, removeFromFavoritesText, soldByText,
    reportProductText, reasonForReportingText, selectReasonText,
    counterfeitProductText, fraudulentListingText, prohibitedItemText,
    misleadingInfoText, harassmentAbuseText, spamText,
    copyrightViolationText, otherText, additionalDetailsText,
    provideMoreInfoText,
    yourRegionText, yourCountryText, shareWithMemberText, shareViaTextMessageText,
    shareViaEmailAlt, shareViaEmailText, currencyText, copyLinkText,
    minQtyText,
    contactVendorText, sendMessageToVendorText, typeMessagePlaceholderText,
    sendMessageButtonText, messageSentSuccessText
  ] = t || productTexts;

  // Fetch vendor data
  const { 
    data: vendor, 
    isLoading: isLoadingVendor 
  } = useQuery<Vendor>({
    queryKey: [`/api/vendors/by-slug/${vendorSlug}`],
    enabled: !!vendorSlug,
  });

  // Fetch vendor's products
  const { 
    data: products = [], 
    isLoading: isLoadingProducts 
  } = useQuery<Product[]>({
    queryKey: [`/api/products`, { vendorId: vendor?.id }],
    enabled: !!vendor?.id,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    },
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
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest('POST', `/api/cart/add/${productId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "Added to Cart",
        description: "Product has been added to your cart",
      });
    },
  });

  // Repost mutation
  const repostMutation = useMutation({
    mutationFn: async ({ productId, message }: { productId: number; message?: string }) => {
      const response = await apiRequest('POST', '/api/posts', {
        content: message || '',
        productId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Posted to Feed",
        description: "Product shared on your community feed",
      });
      setRepostDialogOpen(false);
      setRepostMessage('');
      setSelectedProduct(null);
    },
  });

  // Send offer mutation
  const sendOfferMutation = useMutation({
    mutationFn: async ({ productId, amount, message }: { productId: number; amount: string; message: string }) => {
      const response = await apiRequest('POST', '/api/offers', {
        productId,
        amount: parseFloat(amount),
        message
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Offer Sent",
        description: "Your offer has been sent to the vendor",
      });
      setOfferDialogOpen(false);
      setOfferAmount('');
      setOfferMessage('');
      setSelectedOfferProduct(null);
    },
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
  });

  // Send message to vendor mutation
  const sendVendorMessageMutation = useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: number; content: string }) => {
      const response = await apiRequest('POST', '/api/messages/send', {
        recipientId,
        content,
        category: 'marketplace'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: messageSentSuccessText,
        description: "Your message has been sent to the vendor",
      });
      setMessageDialogOpen(false);
      setVendorMessage('');
    },
  });

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    return products
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
            return (b.vendorId || 0) - (a.vendorId || 0);
          case 'price-low-high':
            return a.price - b.price;
          case 'price-high-low':
            return b.price - a.price;
          case 'newest':
            return b.id - a.id;
          default:
            return 0;
        }
      });
  }, [products, searchTerm, priceRange, selectedCategories, selectedProductTypes, showSale, showNew, sortBy]);

  // Category counts
  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((product: any) => {
      counts[product.category] = (counts[product.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Handle category toggle
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle product type toggle
  const toggleProductType = (productType: string) => {
    setSelectedProductTypes(prev => 
      prev.includes(productType)
        ? prev.filter(pt => pt !== productType)
        : [...prev, productType]
    );
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedProductTypes(['product', 'service']);
    setPriceRange([0, 1000000]);
    setShowSale(false);
    setShowNew(false);
    setSortBy('newest');
  };

  // Check if product is liked
  const isProductLiked = (productId: number) => {
    return Array.isArray(likedProducts) && likedProducts.some((p: any) => p.id === productId);
  };

  // Handle like toggle
  const handleLikeToggle = (productId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to like products",
        variant: "destructive"
      });
      return;
    }
    if (isProductLiked(productId)) {
      unlikeMutation.mutate(productId);
    } else {
      likeMutation.mutate(productId);
    }
  };

  // Share functions
  const shareOnFeed = (product: any) => {
    setSelectedProduct(product);
    setRepostDialogOpen(true);
  };

  const handleRepostWithText = () => {
    if (selectedProduct) {
      repostMutation.mutate({
        productId: selectedProduct.id,
        message: repostMessage
      });
    }
  };

  const shareByEmail = (product: any) => {
    const subject = encodeURIComponent(`Check out ${product.name}`);
    const body = encodeURIComponent(`I found this product: ${product.name}\n\nPrice: ${formatPrice(product.price)}\n\nCheck it out at: ${window.location.origin}/product/${product.id}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const copyLinkToClipboard = (product: any) => {
    const url = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Product link copied to clipboard",
    });
  };

  const shareViaWhatsApp = (product: any) => {
    const text = encodeURIComponent(`Check out ${product.name} - ${formatPrice(product.price)}\n${window.location.origin}/product/${product.id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaSMS = (product: any) => {
    const text = encodeURIComponent(`Check out ${product.name} - ${formatPrice(product.price)}\n${window.location.origin}/product/${product.id}`);
    window.location.href = `sms:?&body=${text}`;
  };

  // Sanitize vendor and products for SEO schema
  const seoVendor = useMemo(() => {
    if (!vendor) return undefined;
    return {
      ...vendor,
      description: nullishToUndefined(vendor.description),
      logo: nullishToUndefined(vendor.logo),
      banner: nullishToUndefined(vendor.banner),
      website: nullishToUndefined(vendor.website),
      taxId: nullishToUndefined(vendor.taxId),
      contactEmail: nullishToUndefined(vendor.contactEmail),
      contactPhone: nullishToUndefined(vendor.contactPhone),
      rating: nullishToUndefined(vendor.rating),
      ratingCount: nullishToUndefined(vendor.ratingCount),
      totalSalesAmount: nullishToUndefined(vendor.totalSalesAmount),
      totalTransactions: nullishToUndefined(vendor.totalTransactions),
    };
  }, [vendor]);

  const seoProducts = useMemo(() => {
    if (!products) return undefined;
    return products.map(product => ({
      ...product,
      discountPrice: nullishToUndefined(product.discountPrice),
      imageUrl: nullishToUndefined(product.imageUrl),
      productCode: nullishToUndefined(product.productCode),
      condition: nullishToUndefined(product.condition),
      createdAt: nullishToUndefined(product.createdAt),
      dimensions: nullishToUndefined(product.dimensions),
      dimensionUnit: nullishToUndefined(product.dimensionUnit),
      weight: nullishToUndefined(product.weight),
      weightUnit: nullishToUndefined(product.weightUnit),
      seoDescription: nullishToUndefined(product.seoDescription),
      seoTitle: nullishToUndefined(product.seoTitle),
    }));
  }, [products]);

  // Render product grid
  const renderProductGrid = () => {
    if (isLoadingProducts) {
      return (
        <>
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-lg" />
          ))}
        </>
      );
    }

    if (filteredAndSortedProducts.length === 0) {
      return (
        <div className="col-span-full py-12 text-center">
          <div className="text-gray-500 mb-4">{translateText("No products found matching your criteria")}</div>
          <Button variant="outline" onClick={resetFilters}>
            {resetFiltersText}
          </Button>
        </div>
      );
    }

    const displayedProducts = filteredAndSortedProducts.slice(0, productsPerPage);

    return displayedProducts.map((product: any) => (
      <Card 
        key={product.id} 
        className="overflow-hidden flex flex-col border-0 shadow-none hover:shadow-md transition-shadow duration-300"
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
            {product.isNew && (
              <Badge className="bg-black text-white">{newBadgeText}</Badge>
            )}
            {product.isOnSale && (
              <Badge className="bg-black text-white">{saleBadgeText}</Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 flex-grow">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div 
              className="font-medium text-sm leading-tight hover:text-primary cursor-pointer flex-1 min-h-[2.5rem] flex items-center" 
              onClick={() => setLocation(`/product/${product.id}`)}
            >
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
                  <DropdownMenuLabel>{shareText}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => shareByEmail(product)}>
                    <Mail className="h-4 w-4 mr-2 text-black" />
                    {shareViaEmailText}
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
                    {repostText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareViaWhatsApp(product)}>
                    <svg className="h-4 w-4 mr-2 text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.598z"/>
                    </svg>
                    Share via WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareViaSMS(product)}>
                    <Smartphone className="h-4 w-4 mr-2 text-black" />
                    {shareViaTextMessageText}
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
                title={reportProductText}
                data-testid={`button-report-${product.id}`}
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              {product.discountPrice ? (
                <div className="flex items-center">
                  <div className="text-black text-sm">{formatPrice(product.discountPrice)}</div>
                  <div className="ml-2 text-sm text-gray-500 line-through">{formatPrice(product.price)}</div>
                </div>
              ) : (
                <div className="text-black text-sm">{formatPrice(product.price)}</div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <CategoryName categoryName={product.category} />
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Filter content component
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
            {categories.map((category: any) => (
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

  if (!vendorSlug) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{translateText("Invalid Vendor")}</h1>
        <Button onClick={() => setLocation("/vendors")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {translateText("Back to Vendors")}
        </Button>
      </div>
    );
  }

  if (isLoadingVendor) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => setLocation("/vendors")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            {translateText("Back")}
          </Button>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <Skeleton className="h-14 w-14 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-24 mb-6" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="w-full md:w-2/3">
            <Skeleton className="h-10 w-full mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-60 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{translateText("Vendor not found")}</h1>
        <p className="text-muted-foreground mb-6">
          {translateText("The vendor you're looking for doesn't exist or has been removed.")}
        </p>
        <Button onClick={() => setLocation("/vendors")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {translateText("Back to Vendors")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={normalizeTitle(vendor?.storeName ? `${vendor.storeName} - Vendor Profile` : undefined, 'Vendor Profile - Dedw3n')}
        description={normalizeDescription(vendor?.description, `Browse products and services from ${vendor?.storeName || 'this vendor'} on Dedw3n marketplace.`)}
        structuredData={seoVendor && seoProducts ? buildVendorSchema(seoVendor as any, seoProducts as any) : undefined}
      />

      {/* Vendor Banner Section */}
      {vendor.banner && (
        <div className="w-full h-48 md:h-64 lg:h-80 overflow-hidden bg-gray-100">
          <img 
            src={vendor.banner} 
            alt={`${vendor.storeName} banner`}
            className="w-full h-full object-cover"
            data-testid="vendor-banner-image"
          />
        </div>
      )}

      {/* Vendor Info Top Bar - Full Width */}
      <div className="w-full py-8">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex items-center gap-4 flex-shrink-0 md:ml-auto">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{vendor.storeName}</h1>
                    <Link 
                      href={`/profile/${(vendor as any).username}`} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                      data-testid="link-view-profile"
                      title={translateText("View Profile")}
                    >
                      <User className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => setMessageDialogOpen(true)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      data-testid="button-contact-vendor"
                      title={contactVendorText}
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {vendor.description || translateText("No description available")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Section with Filters */}
      <div className="container pb-8 px-4">
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
            {/* Product count and filters */}
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

                  {selectedProductTypes.length < 2 && selectedProductTypes.map(productType => (
                    <Badge key={productType} variant="outline" className="flex items-center gap-1">
                      {productType === 'product' ? productsText : serviceFilterText}
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
                    onClick={() => setProductsPerPage(90)}
                    className={`px-2 py-1 hover:text-black transition-colors ${productsPerPage === 90 ? 'text-black font-medium' : ''}`}
                  >
                    90
                  </button>
                </div>

                {/* Column selector */}
                <div className="hidden md:flex items-center gap-2">
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
      </div>

      {/* Repost Dialog */}
      <Dialog open={repostDialogOpen} onOpenChange={setRepostDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">{repostText}</DialogTitle>
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
                repostText
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
              <input
                id="offer-amount"
                type="number"
                placeholder={enterOfferAmountText}
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="mt-2 w-full px-3 py-2 border rounded-md"
                min="0"
                step="0.01"
              />
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
                sendOfferTitle
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{reportProductText}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason" className="text-sm font-medium">{reasonForReportingText}</Label>
              <select
                id="report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="mt-2 w-full px-3 py-2 border rounded-md"
              >
                <option value="">{selectReasonText}</option>
                <option value="counterfeit">{counterfeitProductText}</option>
                <option value="fraudulent">{fraudulentListingText}</option>
                <option value="prohibited">{prohibitedItemText}</option>
                <option value="misleading">{misleadingInfoText}</option>
                <option value="harassment">{harassmentAbuseText}</option>
                <option value="spam">{spamText}</option>
                <option value="copyright">{copyrightViolationText}</option>
                <option value="other">{otherText}</option>
              </select>
            </div>
            <div>
              <Label htmlFor="report-message" className="text-sm font-medium">{additionalDetailsText}</Label>
              <Textarea
                id="report-message"
                placeholder={provideMoreInfoText}
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
              disabled={reportProductMutation.isPending}
            >
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

      {/* Send Message to Vendor Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{sendMessageToVendorText}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="vendor-message" className="text-sm font-medium">{messageOptionalText}</Label>
              <Textarea
                id="vendor-message"
                placeholder={typeMessagePlaceholderText}
                value={vendorMessage}
                onChange={(e) => setVendorMessage(e.target.value)}
                className="mt-2"
                rows={5}
                data-testid="textarea-vendor-message"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setMessageDialogOpen(false)}
              disabled={sendVendorMessageMutation.isPending}
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                if (vendor && vendorMessage.trim()) {
                  sendVendorMessageMutation.mutate({
                    recipientId: vendor.userId,
                    content: vendorMessage
                  });
                }
              }}
              disabled={sendVendorMessageMutation.isPending || !vendorMessage.trim()}
              className="bg-black text-white hover:bg-gray-800"
              data-testid="button-send-message"
            >
              {sendVendorMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {sendingText}
                </>
              ) : (
                sendMessageButtonText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
