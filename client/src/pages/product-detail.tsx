import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute, Link } from 'wouter';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useMasterTranslation } from '@/hooks/use-master-translation';
import { useWeightUnit } from '@/contexts/WeightUnitContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { buildProductSchema, normalizeTitle, normalizeDescription, absolutizeImageUrl } from '@/lib/buildSeoStructuredData';

import { 
  Loader2, 
  Star, 
  ShoppingCart, 
  RefreshCw, 
  Share2, 
  Mail, 
  Link as LinkIcon,
  MessageCircle,
  MessageSquare,
  Users,
  Heart,
  Gift,
  Search,
  X,
  Smartphone,
  Phone,
  CreditCard,
  Tag,
  Flag
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ProductDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/product/:identifier');
  const identifier = params?.identifier;
  const { user } = useAuth();
  const { formatPriceFromGBP } = useCurrency();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  
  // Translation system
  const { translateText } = useMasterTranslation();
  
  // Weight unit system
  const { formatWeight } = useWeightUnit();

  // Mobile device detection
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Calculate delivery date range (1-5 working days from today)
  const getDeliveryDateRange = () => {
    const today = new Date();
    let workingDaysAdded = 0;
    let currentDate = new Date(today);
    
    // Add 1 working day for minimum delivery
    while (workingDaysAdded < 1) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysAdded++;
      }
    }
    const minDate = new Date(currentDate);
    
    // Add 4 more working days for maximum delivery (total 5)
    workingDaysAdded = 0;
    while (workingDaysAdded < 4) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysAdded++;
      }
    }
    const maxDate = new Date(currentDate);
    
    const formatDate = (date: Date) => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    };
    
    return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
  };


  
  // Review form state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');

  // Gift search state
  const [isGiftSearchOpen, setIsGiftSearchOpen] = useState(false);
  const [giftSearchQuery, setGiftSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Offer dialog state
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  
  // Report Product dialog state
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  
  // User search query for gift functionality
  const { data: userSearchResults = [], isLoading: userSearchLoading } = useQuery<any[]>({
    queryKey: ['/api/users/search', giftSearchQuery],
    queryFn: async () => {
      if (giftSearchQuery.length < 2) {
        return [];
      }
      
      try {
        const data = await apiRequest(`/api/users/search?q=${encodeURIComponent(giftSearchQuery)}`);
        return data || [];
      } catch (error: any) {
        if (error?.status === 401) {
          console.log('Authentication required for user search');
          return [];
        }
        console.error('Error searching users:', error);
        return [];
      }
    },
    enabled: giftSearchQuery.length >= 2,
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
      toast({
        title: "Product Liked",
        description: "Product added to your liked items!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like product. Please try again.",
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
      toast({
        title: "Product Unliked",
        description: "Product removed from your liked items.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to unlike product. Please try again.",
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
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to like products",
        variant: "destructive"
      });
      setLocation('/auth');
      return;
    }

    if (isProductLiked(productId)) {
      unlikeMutation.mutate(productId);
    } else {
      likeMutation.mutate(productId);
    }
  };

  // Send offer mutation for product detail page
  const sendOfferMutation = useMutation({
    mutationFn: async ({ amount, message }: { amount: string; message: string }) => {
      if (!product?.vendorId) {
        throw new Error('Product vendor information is missing');
      }

      const response = await apiRequest('POST', '/api/messages/send', {
        receiverId: product.vendorId,
        content: `🎯 OFFER: ${formatPriceFromGBP(parseFloat(amount))} for "${product?.name}"\n\n${message}\n\nProduct: /product/${product.slug || product.id}`,
        category: 'marketplace'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send offer');
      }
      
      return response.json();
    },
    onSuccess: () => {
      const vendorName = product?.vendorId === 1 ? 'Kinshasa DR Congo' : `Vendor ${product?.vendorId}`;
      toast({
        title: "Offer Sent!",
        description: `Your offer has been sent to ${vendorName}`,
      });
      setIsOfferDialogOpen(false);
      setOfferAmount('');
      setOfferMessage('');
    },
    onError: (error: any) => {
      console.error('Product detail send offer error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send offer. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Force rerender when currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      console.log('Product detail page detected currency change');
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('currency-changed', handleCurrencyChange);
    
    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, []);
  


  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/products', identifier],
    queryFn: async () => {
      if (!identifier) return null;
      const response = await apiRequest('GET', `/api/products/${identifier}`);
      return response.json();
    },
    enabled: !!identifier,
  });

  // Fetch vendor details
  const {
    data: vendor,
    isLoading: vendorLoading,
  } = useQuery({
    queryKey: ['/api/vendors', product?.vendorId],
    queryFn: async () => {
      if (!product?.vendorId) return null;
      const response = await apiRequest('GET', `/api/vendors/${product.vendorId}`);
      return response.json();
    },
    enabled: !!product?.vendorId,
  });

  // Fetch product uploader's profile to get location
  const {
    data: uploaderProfile,
    isLoading: uploaderLoading,
  } = useQuery({
    queryKey: ['/api/user', product?.userId],
    queryFn: async () => {
      if (!product?.userId) return null;
      const response = await apiRequest('GET', `/api/user/${product.userId}/profile`);
      return response.json();
    },
    enabled: !!product?.userId,
  });

  // Fetch product reviews
  const {
    data: reviews = [],
    isLoading: reviewsLoading,
  } = useQuery({
    queryKey: ['/api/products', identifier, 'reviews'],
    queryFn: async () => {
      if (!identifier) return [];
      const response = await apiRequest('GET', `/api/products/${identifier}/reviews`);
      return response.json();
    },
    enabled: !!identifier,
  });

  // Fetch vendor products (for "More from this vendor" section)
  const {
    data: vendorProducts = [],
    isLoading: vendorProductsLoading,
  } = useQuery({
    queryKey: ['/api/vendors', product?.vendorId, 'products'],
    queryFn: async () => {
      if (!product?.vendorId) return [];
      const response = await apiRequest('GET', `/api/vendors/${product.vendorId}/products?limit=6`);
      const data = await response.json();
      // Filter out current product and limit to 5
      return data.products?.filter((p: any) => p.id !== product.id).slice(0, 5) || [];
    },
    enabled: !!product?.vendorId,
  });

  // Fetch similar products from the whole website (for "Continue your exploration!" section)
  const {
    data: similarProducts = [],
    isLoading: similarProductsLoading,
  } = useQuery({
    queryKey: ['/api/products', 'similar', product?.category, product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      // Fetch products from same category if available, otherwise fetch from all products
      const categoryParam = product.category ? `category=${encodeURIComponent(product.category)}&` : '';
      const response = await apiRequest('GET', `/api/products?${categoryParam}limit=20`);
      const data = await response.json();
      // Filter out current product and limit to 5
      return data?.filter((p: any) => p.id !== product.id).slice(0, 5) || [];
    },
    enabled: !!product?.id,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!product?.id || !user) throw new Error('Product or user not available');
      return apiRequest('POST', '/api/cart', {
        productId: product.id,
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to add to cart: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Review submission mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; title: string; content: string }) => {
      if (!product?.id || !user) throw new Error('Product or user not available');
      return apiRequest('POST', `/api/products/${product.id}/reviews`, {
        ...reviewData,
        productId: product.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', identifier, 'reviews'] });
      setIsReviewDialogOpen(false);
      setReviewRating(0);
      setReviewTitle('');
      setReviewContent('');
      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive"
      });
    }
  });

  // Send gift proposition mutation
  const sendGiftMutation = useMutation({
    mutationFn: async (recipientId: number) => {
      if (!product?.id || !user) {
        throw new Error('Product or user not available');
      }
      return apiRequest('POST', '/api/gifts/propose', {
        recipientId,
        productId: product.id,
        message: `Hi! I'd like to send you this gift: ${product?.name}`,
      });
    },
    onSuccess: () => {
      setIsGiftSearchOpen(false);
      setGiftSearchQuery('');
      setSelectedRecipient(null);
      toast({
        title: 'Gift Proposition Sent',
        description: 'Your gift proposition has been sent successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gift Failed',
        description: error.message || 'Failed to send gift proposition',
        variant: 'destructive',
      });
    },
  });

  // Report product mutation
  const reportProductMutation = useMutation({
    mutationFn: async () => {
      if (!product?.id || !user) {
        throw new Error('Product or user not available');
      }
      return apiRequest('POST', `/api/products/${product.id}/report`, {
        reason: reportReason,
        customMessage: reportMessage
      });
    },
    onSuccess: () => {
      setIsReportDialogOpen(false);
      setReportReason('');
      setReportMessage('');
      toast({
        title: translateText('Report Submitted'),
        description: translateText('Thank you for reporting. We will review this product.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: translateText('Error'),
        description: error.message || translateText('Failed to submit report. Please try again.'),
        variant: 'destructive',
      });
    }
  });

  // Handle quantity change
  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.inventory || 1)) {
      setQuantity(newQuantity);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to add items to your cart.',
        variant: 'destructive',
      });
      setLocation('/auth');
      return;
    }

    addToCartMutation.mutate();
  };

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
    : 0;

  // Generate star ratings
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  // Interactive star rating for review form
  const renderInteractiveStars = (rating: number, onRatingChange: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-6 w-6 cursor-pointer transition-colors ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200'
        }`}
        onClick={() => onRatingChange(i + 1)}
      />
    ));
  };

  // Handle review submission
  const handleSubmitReview = () => {
    if (!reviewRating) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive"
      });
      return;
    }
    if (!reviewContent.trim()) {
      toast({
        title: "Review Required",
        description: "Please write a review",
        variant: "destructive"
      });
      return;
    }

    submitReviewMutation.mutate({
      rating: reviewRating,
      title: reviewTitle,
      content: reviewContent
    });
  };

  // SMS sharing function for product detail
  const shareViaSMS = () => {
    if (!product) return;
    
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

  // WhatsApp order function
  const handleWhatsAppOrder = () => {
    if (!product) return;
    
    const productUrl = `${window.location.origin}/product/${product.slug || product.id}`;
    const price = product.discountPrice && product.discountPrice < product.price 
      ? formatPriceFromGBP(product.discountPrice)
      : formatPriceFromGBP(product.price);
    
    // Create WhatsApp message with product details
    const message = `Hi! I'm interested in ordering this product:\n\n` +
      `*${product.name}*\n` +
      `Price: ${price}\n` +
      `Category: ${product.category}\n\n` +
      `Product Link: ${productUrl}\n\n` +
      `Please let me know the availability and how to proceed with the order.`;
    
    // Get vendor's WhatsApp number if available, otherwise use a default support number
    const whatsappNumber = vendor?.phone || vendor?.whatsappNumber || '';
    
    // Create WhatsApp URL
    const whatsappUrl = whatsappNumber 
      ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Opening WhatsApp",
      description: "WhatsApp will open with product details ready to send",
    });
  };

  // Email order function
  const handleEmailOrder = () => {
    if (!product) return;
    
    const productUrl = `${window.location.origin}/product/${product.slug || product.id}`;
    const price = product.discountPrice && product.discountPrice < product.price 
      ? formatPriceFromGBP(product.discountPrice)
      : formatPriceFromGBP(product.price);
    
    // Create email subject and body
    const subject = `Product Inquiry: ${product.name}`;
    const body = `Hi,\n\n` +
      `I'm interested in ordering the following product:\n\n` +
      `Product: ${product.name}\n` +
      `Price: ${price}\n` +
      `Category: ${product.category}\n\n` +
      `Product Link: ${productUrl}\n\n` +
      `Please let me know the availability and how to proceed with the order.\n\n` +
      `Thank you.`;
    
    // Get vendor's email if available, otherwise use a default support email
    const vendorEmail = vendor?.email || 'support@dedw3n.com';
    
    // Create mailto URL
    const mailtoUrl = `mailto:${vendorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.location.href = mailtoUrl;
    
    toast({
      title: "Opening Email",
      description: "Your email client will open with product details ready to send",
    });
  };

  // Share product via email
  const shareViaEmail = () => {
    if (!product) return;
    const productUrl = `${window.location.origin}/product/${product.slug || product.id}`;
    const subject = `Check out this product: ${product.name}`;
    const body = `I thought you might be interested in this product:\n\n${product.name}\n${formatPriceFromGBP(product.price)}\n\n${productUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast({
      title: "Opening Email",
      description: "Share this product via email",
    });
  };

  // Copy product link
  const copyProductLink = () => {
    if (!product) return;
    const productUrl = `${window.location.origin}/product/${product.slug || product.id}`;
    navigator.clipboard.writeText(productUrl);
    toast({
      title: "Link Copied",
      description: "Product link copied to clipboard",
    });
  };

  // Repost function
  const handleRepost = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to repost.',
        variant: 'destructive',
      });
      setLocation('/auth');
      return;
    }
    toast({
      title: "Repost",
      description: "Product reposted to your feed",
    });
  };

  // Share with member function
  const shareWithMember = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to share with members.',
        variant: 'destructive',
      });
      setLocation('/auth');
      return;
    }
    setIsGiftSearchOpen(true);
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    if (!product) return;
    const productUrl = `${window.location.origin}/product/${product.slug || product.id}`;
    const message = `Check out this product: ${product.name}\n\n${formatPriceFromGBP(product.price)}\n\n${productUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    toast({
      title: "Opening WhatsApp",
      description: "Share this product via WhatsApp",
    });
  };
  


  // Loading state
  if (isLoading) {
    return (
      <div className="w-full py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="w-full py-12 px-4">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">{translateText('Product Not Found')}</h1>
              <p className="text-gray-500 mb-6">
                {translateText('The product you\'re looking for could not be found or has been removed.')}
              </p>
              <Button onClick={() => setLocation('/')}>{translateText('Back to Products')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build SEO data with normalization
  const seoTitle = normalizeTitle(product.name, 'Product - Dedw3n Marketplace');
  const seoDescription = normalizeDescription(
    product.description, 
    `Buy ${product.name} on Dedw3n marketplace. High-quality products from verified vendors with secure payments and fast delivery.`
  );
  const seoKeywords = `${product.name}, ${product.category || 'marketplace'}, buy ${product.name}, ${vendor?.storeName || 'vendor'}, online shopping, e-commerce`;
  const seoImage = product.imageUrl || '/assets/og-image.png';
  
  // Build structured data for rich search results
  const productSchema = buildProductSchema(product);

  return (
    <div className="w-full py-12 px-4">
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
        type="product"
        structuredData={productSchema}
      />
      {/* Full-width Product Image */}
      <div className="w-full mb-8">
        <div className="bg-gray-100 rounded-lg overflow-hidden aspect-[2/1] flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-gray-400">
              <ShoppingCart className="h-24 w-24" />
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* LEFT COLUMN - Product Title, Variations, Size, Details, Reviews */}
        <div className="w-full">
          {/* Product Title */}
          <h1 className="text-xl font-semibold text-gray-900 mb-4">{translateText(product.name)}</h1>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              {product.discountPrice && product.discountPrice < product.price ? (
                <>
                  <span className="text-base font-bold text-black">
                    {formatPriceFromGBP(product.discountPrice)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPriceFromGBP(product.price)}
                  </span>
                  <Badge className="bg-black text-white">
                    Save {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                  </Badge>
                </>
              ) : (
                <span className="text-base font-bold text-black">
                  {formatPriceFromGBP(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Vendor info */}
          {!vendorLoading && vendor && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                {translateText('Sold by')}{' '}
                <span 
                  className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => setLocation(`/vendor/${vendor.id}`)}
                  data-testid="link-vendor-store"
                >
                  {vendor.storeName}
                </span>
              </p>
            </div>
          )}

          {/* Uploader location */}
          {!uploaderLoading && uploaderProfile?.location && (
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                📍 {uploaderProfile.location}
              </p>
            </div>
          )}

          {/* Product Description */}
          <div className="mb-6">
            <h2 className="text-sm font-bold mb-2">{translateText('PRODUCT DESCRIPTION')}</h2>
            <p className="text-sm text-gray-700 mb-4">{translateText(product.description)}</p>

            {/* Collapsible Sections */}
            <Accordion type="single" collapsible>
              <AccordionItem value="details" className="border-b border-gray-200">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  {translateText('Product Details')}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-700 pb-4">
                  <p className="text-xs text-gray-500 mb-2">
                    {translateText('Product ID')}: {product.productCode || product.id}
                  </p>
                  <div className="space-y-2">
                    <p>{translateText('Category')}: {product.category}</p>
                    {product.weight && (
                      <p>
                        {translateText('Weight')}: {formatWeight(product.weight)}
                      </p>
                    )}
                    {product.dimensions && (
                      <p>
                        {translateText('Dimensions')}: {product.dimensions} {product.dimensionUnit || 'cm'}
                      </p>
                    )}
                    {product.inventory > 0 && (
                      <p className="text-green-600 font-medium">{translateText('In Stock')}</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="materials" className="border-b border-gray-200">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  {translateText('Materials & Care')}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-700 pb-4">
                  <p>{translateText('Please refer to product label for detailed care instructions.')}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="commitment" className="border-b border-gray-200">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  {translateText('Our Commitment')}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-700 pb-4">
                  <p>{translateText('We are committed to quality, sustainability, and exceptional customer service.')}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="report" className="border-b border-gray-200">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  {translateText('Report')}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-700 pb-4">
                  <button
                    onClick={() => {
                      if (!user) {
                        toast({
                          title: translateText('Login Required'),
                          description: translateText('Please log in to report a product.'),
                          variant: 'destructive'
                        });
                        return;
                      }
                      setIsReportDialogOpen(true);
                    }}
                    className="text-left text-sm text-gray-700 hover:text-black cursor-pointer transition-colors bg-transparent border-none p-0"
                    data-testid="button-open-report-dialog"
                  >
                    {translateText('Something Wrong with this product?')}{' '}
                    <span className="underline">{translateText('Please Report')}</span>
                  </button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="add-review" className="border-b border-gray-200">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  {translateText('Add Review')}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-700 pb-4">
                  {user ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">{translateText('Rating')}</Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none transition-colors"
                              data-testid={`star-rating-${star}`}
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= reviewRating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="review-content" className="text-sm font-medium mb-2 block">
                          {translateText('Your Review')}
                        </Label>
                        <Textarea
                          id="review-content"
                          placeholder={translateText('Share your experience with this product...')}
                          value={reviewContent}
                          onChange={(e) => setReviewContent(e.target.value)}
                          rows={4}
                          className="w-full"
                          data-testid="input-review-content"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={submitReviewMutation.isPending || !reviewRating || !reviewContent.trim()}
                        className="w-full bg-black text-white hover:bg-gray-800"
                        data-testid="button-submit-review"
                      >
                        {submitReviewMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {translateText('Submitting...')}
                          </>
                        ) : (
                          translateText('Submit Review')
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {translateText('Please log in to leave a review.')}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Reviews Section */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-2">{translateText('REVIEWS')}</h3>
            <div className="flex items-center mb-4">
              <div className="flex mr-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <span className="text-sm text-gray-500">
                {reviews.length === 0
                  ? translateText('No reviews yet')
                  : `${averageRating.toFixed(1)} (${reviews.length} ${reviews.length === 1 ? translateText('review') : translateText('reviews')})`}
              </span>
            </div>
            
            {/* Individual Reviews */}
            {reviews.length > 0 && (
              <div className="space-y-4 mt-4 max-h-96 overflow-y-auto">
                {reviews.map((review: any) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {review.userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{review.userName || 'Anonymous'}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex mb-2">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-sm text-gray-700">{review.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Add to Cart, Delivery, Services, Description */}
        <div className="w-full">
          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending || product.inventory <= 0}
            className="w-full bg-black hover:bg-gray-800 text-white py-6 mb-4"
            data-testid="button-add-to-cart"
          >
            {addToCartMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {translateText('Adding...')}
              </>
            ) : product.inventory <= 0 ? (
              translateText('Out of Stock')
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {translateText('ADD TO CART')}
              </>
            )}
          </Button>

          {/* Delivery Information */}
          <div className="mb-4 text-sm">
            <p className="flex items-center text-gray-700">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {translateText(`Estimated complimentary delivery: ${getDeliveryDateRange()}`)}
            </p>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              {translateText('Some regions may take up to 20+ working days')}
            </p>
          </div>

          {/* Order via WhatsApp and Email + Action Icons */}
          <div className="mb-6 text-sm flex gap-6 items-center border-t border-gray-200 pt-4">
            <button 
              onClick={handleWhatsAppOrder}
              className="flex items-center text-black hover:underline"
              data-testid="button-order-whatsapp"
            >
              <FaWhatsapp className="h-4 w-4 mr-2" />
              {translateText('Order via Whatsapp')}
            </button>
            <button 
              onClick={handleEmailOrder}
              className="flex items-center text-black hover:underline"
              data-testid="button-order-email"
            >
              <Mail className="h-4 w-4 mr-2" />
              {translateText('Order via Mail')}
            </button>
            
            <button
              onClick={() => setIsOfferDialogOpen(true)}
              className="text-gray-700 hover:text-black transition-colors"
              data-testid="button-send-offer"
              title="Send offer"
            >
              <Tag className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || product.inventory <= 0}
              className="text-gray-700 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-add-to-cart-icon"
              title="Add to cart"
            >
              <CreditCard className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => product && handleLikeToggle(product.id)}
              disabled={likeMutation.isPending || unlikeMutation.isPending}
              className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                product && isProductLiked(product.id)
                  ? 'text-black hover:text-gray-700'
                  : 'text-gray-700 hover:text-black'
              }`}
              data-testid="button-add-favourite"
              title={product && isProductLiked(product.id) ? "Remove from favourites" : "Add to favourites"}
            >
              <Heart 
                className={`h-5 w-5 ${product && isProductLiked(product.id) ? 'fill-black' : ''}`}
              />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-gray-700 hover:text-black transition-colors"
                  data-testid="button-share-product"
                  title="Share product"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={shareViaEmail} className="cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  <span>{translateText('Share via Email')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyProductLink} className="cursor-pointer">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  <span>{translateText('Copy Link')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRepost} className="cursor-pointer">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>{translateText('Repost')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareWithMember} className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  <span>{translateText('Share with Member')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareViaWhatsApp} className="cursor-pointer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>{translateText('Share via WhatsApp')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareViaSMS} className="cursor-pointer">
                  <Smartphone className="mr-2 h-4 w-4" />
                  <span>{translateText('Share via Text')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Services Accordion */}
          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem value="services" className="border-b border-gray-200">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                + {translateText('Dedw3n Support')}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-700 pb-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{translateText('Shipping Options')}</h4>
                    <p className="mb-1">{translateText('Delivery via Dedw3n Shipping')}</p>
                    <p>
                      {translateText('For detailed information on shipping methods, costs, and delivery times, please refer to our')}{' '}
                      <Link href="/delivery-returns" className="underline hover:text-primary">
                        {translateText('Delivery & Return options')}
                      </Link>
                    </p>
                    <p className="mt-2">{translateText('Your invoice will be sent to you via email')}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">{translateText('Payment Methods')}</h4>
                    <p className="mb-1">
                      <strong>{translateText('Card Payments:')}</strong> {translateText('Accepting Visa®, MasterCard®, Maestro®, American Express®, JCB®, Revolut® and Carte Bancaire®')}
                    </p>
                    <p className="mb-2">
                      {translateText('Card payments are authenticated and secured with 3D Secure: Verified by Visa®, MasterCard® SecureCode, American Express SafeKey®')}
                    </p>
                    <p>
                      {translateText('Additional options include PayPal®, Apple Pay®, Google Play®, Klarna®, African Mobile Money Providers, Bankwire')}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">{translateText('Returns and Exchanges')}</h4>
                    <p className="mb-1">{translateText('Returns and exchanges are easy and complimentary within 30 days')}</p>
                    <p className="mb-2">{translateText('We suggest reaching out to the vendor initially for additional details regarding return options.')}</p>
                    <p>
                      {translateText('For more information, see the conditions and procedures outlined in our')}{' '}
                      <Link href="/delivery-returns" className="underline hover:text-primary">
                        {translateText('Delivery & Return options')}
                      </Link>.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p>
                      {translateText('Want to learn more? Reach out to')}{' '}
                      <Link href="/contact" className="underline hover:text-primary">
                        {translateText('Customer Relations')}
                      </Link>.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* More from this vendor section */}
      {vendor && vendorProducts.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {translateText('More from this vendor')}
            </h2>
            <Link href={`/vendor/${vendor.id}`}>
              <Button variant="ghost" className="text-black hover:bg-gray-100 border-0">
                {translateText('Visit vendor store for more')}
              </Button>
            </Link>
          </div>
          
          {vendorProductsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {vendorProducts.map((vendorProduct: any) => (
                <Card 
                  key={vendorProduct.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/product/${vendorProduct.slug || vendorProduct.id}`)}
                  data-testid={`vendor-product-card-${vendorProduct.id}`}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {vendorProduct.imageUrl ? (
                      <img
                        src={vendorProduct.imageUrl}
                        alt={vendorProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {vendorProduct.isNew && (
                      <Badge className="absolute top-2 left-2 bg-black text-white">
                        {translateText('New')}
                      </Badge>
                    )}
                    {vendorProduct.isOnSale && (
                      <Badge className="absolute top-2 right-2 bg-black text-white">
                        {translateText('Sale')}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm mb-1 truncate" title={vendorProduct.name}>
                      {translateText(vendorProduct.name)}
                    </h3>
                    <div className="flex items-center gap-2">
                      {vendorProduct.discountPrice && vendorProduct.discountPrice < vendorProduct.price ? (
                        <>
                          <span className="font-bold text-black text-sm">
                            {formatPriceFromGBP(vendorProduct.discountPrice)}
                          </span>
                          <span className="text-xs text-gray-500 line-through">
                            {formatPriceFromGBP(vendorProduct.price)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-black text-sm">
                          {formatPriceFromGBP(vendorProduct.price)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Continue your exploration section */}
      {similarProducts.length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {translateText('Continue your exploration')}
            </h2>
          </div>
          
          {similarProductsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {similarProducts.map((similarProduct: any) => (
                <Card 
                  key={similarProduct.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/product/${similarProduct.slug || similarProduct.id}`)}
                  data-testid={`similar-product-card-${similarProduct.id}`}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {similarProduct.imageUrl ? (
                      <img
                        src={similarProduct.imageUrl}
                        alt={similarProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {similarProduct.isNew && (
                      <Badge className="absolute top-2 left-2 bg-black text-white">
                        {translateText('New')}
                      </Badge>
                    )}
                    {similarProduct.isOnSale && (
                      <Badge className="absolute top-2 right-2 bg-black text-white">
                        {translateText('Sale')}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm mb-1 truncate" title={similarProduct.name}>
                      {translateText(similarProduct.name)}
                    </h3>
                    <div className="flex items-center gap-2">
                      {similarProduct.discountPrice && similarProduct.discountPrice < similarProduct.price ? (
                        <>
                          <span className="font-bold text-black text-sm">
                            {formatPriceFromGBP(similarProduct.discountPrice)}
                          </span>
                          <span className="text-xs text-gray-500 line-through">
                            {formatPriceFromGBP(similarProduct.price)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-black text-sm">
                          {formatPriceFromGBP(similarProduct.price)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Gift Search Dialog */}
      <Dialog open={isGiftSearchOpen} onOpenChange={setIsGiftSearchOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send as Gift</DialogTitle>
            <DialogDescription>
              Search for a user to send this product as a gift
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Type username or name to search..."
                value={giftSearchQuery}
                onChange={(e) => setGiftSearchQuery(e.target.value)}
                className="pl-9"
              />
              {giftSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGiftSearchQuery('');
                    setSelectedRecipient(null);
                  }}
                  className="absolute right-2 top-2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {userSearchLoading && giftSearchQuery.length >= 2 && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            
            {userSearchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                {userSearchResults.map((user: any) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRecipient?.id === user.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-gray-50 border-transparent'
                    } border`}
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
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-sm ${user.avatar ? 'hidden' : 'flex'}`}
                      >
                        {(user.name || user.username).charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.name || user.username}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-gray-400 truncate mt-1">{user.bio}</p>
                      )}
                    </div>
                    {selectedRecipient?.id === user.id && (
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {giftSearchQuery.length >= 2 && !userSearchLoading && userSearchResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No users found matching "{giftSearchQuery}"</p>
              </div>
            )}
            
            {giftSearchQuery.length < 2 && giftSearchQuery.length > 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Type at least 2 characters to search
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsGiftSearchOpen(false);
                setGiftSearchQuery('');
                setSelectedRecipient(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedRecipient) {
                  sendGiftMutation.mutate(selectedRecipient.id);
                }
              }}
              disabled={!selectedRecipient || sendGiftMutation.isPending}
            >
              {sendGiftMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  Send Gift
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Offer Dialog */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Offer</DialogTitle>
            <DialogDescription>
              Send a price offer for this product
            </DialogDescription>
          </DialogHeader>
          
          {product && (
            <div className="my-4">
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0">
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{product.name}</h4>
                  <p className="text-sm text-gray-600">
                    Listed: {formatPriceFromGBP(product.price)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="offer-amount">Your Offer Amount</Label>
              <Input
                id="offer-amount"
                type="number"
                placeholder="0.00"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="offer-message">Message (Optional)</Label>
              <Textarea
                id="offer-message"
                placeholder="Add a message with your offer..."
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsOfferDialogOpen(false)}
              disabled={sendOfferMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (offerAmount) {
                  sendOfferMutation.mutate({
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
                  Sending...
                </>
              ) : (
                'Send Offer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Product Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">{translateText('Report Product')}</DialogTitle>
            <DialogDescription>
              {translateText('Help us maintain a safe marketplace by reporting products that violate our policies')}
            </DialogDescription>
          </DialogHeader>
          
          {product && (
            <div className="my-4">
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{product.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatPriceFromGBP(product.price)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason" className="text-sm font-medium">
                {translateText('Reason for reporting')}
              </Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-2" data-testid="select-report-reason">
                  <SelectValue placeholder={translateText('Select a reason')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="counterfeit">{translateText('Counterfeit Product')}</SelectItem>
                  <SelectItem value="fraud">{translateText('Fraudulent Listing')}</SelectItem>
                  <SelectItem value="prohibited">{translateText('Prohibited Item')}</SelectItem>
                  <SelectItem value="misinformation">{translateText('Misleading Information')}</SelectItem>
                  <SelectItem value="harassment">{translateText('Harassment or Abuse')}</SelectItem>
                  <SelectItem value="spam">{translateText('Spam')}</SelectItem>
                  <SelectItem value="copyright">{translateText('Copyright Violation')}</SelectItem>
                  <SelectItem value="other">{translateText('Other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="report-message" className="text-sm font-medium">
                {translateText('Additional details (optional)')}
              </Label>
              <Textarea
                id="report-message"
                placeholder={translateText('Provide more information about why you\'re reporting this product...')}
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                className="mt-2"
                rows={4}
                data-testid="textarea-report-message"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsReportDialogOpen(false)}
              data-testid="button-cancel-report"
            >
              {translateText('Cancel')}
            </Button>
            <Button
              onClick={() => {
                if (reportReason) {
                  reportProductMutation.mutate();
                }
              }}
              disabled={reportProductMutation.isPending || !reportReason}
              className="bg-black text-white hover:bg-gray-800"
              data-testid="button-submit-report"
            >
              {reportProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translateText('Submitting...')}
                </>
              ) : (
                translateText('Submit Report')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Similar products section - can be implemented in the future */}
    </div>
  );
}