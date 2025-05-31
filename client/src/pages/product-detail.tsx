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
import { useCurrency } from '@/hooks/use-currency';
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
  Heart
} from 'lucide-react';
import { 
  supportedCurrencies, 
  formatCurrency, 
  convertCurrency,
  CurrencyCode,
  formatPriceWithCurrency
} from '@/lib/currencyConverter';
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
  const [, params] = useRoute('/product/:id');
  const productId = params?.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('GBP');
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [convertedDiscountPrice, setConvertedDiscountPrice] = useState<number | null>(null);
  
  // Review form state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
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
  
  // Update selected currency when the global currency changes
  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      if (!productId) return null;
      const response = await apiRequest('GET', `/api/products/${productId}`);
      return response.json();
    },
    enabled: productId !== null,
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

  // Fetch product reviews
  const {
    data: reviews = [],
    isLoading: reviewsLoading,
  } = useQuery({
    queryKey: ['/api/products', productId, 'reviews'],
    queryFn: async () => {
      if (!productId) return [];
      const response = await apiRequest('GET', `/api/products/${productId}/reviews`);
      return response.json();
    },
    enabled: productId !== null,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!productId || !user) throw new Error('Product or user not available');
      return apiRequest('POST', '/api/cart', {
        productId,
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Added to Cart',
        description: `${product?.name} has been added to your cart.`,
      });
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
      if (!productId || !user) throw new Error('Product or user not available');
      return apiRequest('POST', `/api/products/${productId}/reviews`, {
        ...reviewData,
        productId: productId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId, 'reviews'] });
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
  
  // Effect to handle currency conversion
  useEffect(() => {
    if (!product || selectedCurrency === 'GBP') {
      setConvertedPrice(null);
      setConvertedDiscountPrice(null);
      return;
    }
    
    const updateConvertedPrices = async () => {
      try {
        setIsConverting(true);
        
        // Convert main price
        const newPrice = await convertCurrency(product.price, 'GBP', selectedCurrency);
        setConvertedPrice(newPrice);
        
        // Convert discount price if it exists
        if (product.discountPrice && product.discountPrice < product.price) {
          const newDiscountPrice = await convertCurrency(product.discountPrice, 'GBP', selectedCurrency);
          setConvertedDiscountPrice(newDiscountPrice);
        } else {
          setConvertedDiscountPrice(null);
        }
        
      } catch (error) {
        console.error('Error converting currency:', error);
        toast({
          title: 'Currency Conversion Error',
          description: 'Unable to convert currency at this time.',
          variant: 'destructive',
        });
      } finally {
        setIsConverting(false);
      }
    };
    
    updateConvertedPrices();
  }, [product, selectedCurrency, toast, forceUpdate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Product Not Found</h1>
              <p className="text-gray-500 mb-6">
                The product you're looking for could not be found or has been removed.
              </p>
              <Button onClick={() => setLocation('/')}>Back to Products</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      {/* Breadcrumbs */}
      <div className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${encodeURIComponent(product.category)}`} className="hover:text-primary">
          {product.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.name}</span>
      </div>

      {/* Product overview */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Product image */}
        <div className="md:w-1/2">
          <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
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

        {/* Product info */}
        <div className="md:w-1/2">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">{product.name}</h1>
          
          {/* Vendor info */}
          {!vendorLoading && vendor && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Sold by{' '}
                <Link href={`/vendor/${vendor.id}`} className="text-primary hover:underline">
                  {vendor.storeName}
                </Link>
              </p>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            <div className="flex flex-col space-y-2">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {product.discountPrice && product.discountPrice < product.price ? (
                    <>
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(product.discountPrice)}
                      </span>
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(product.price)}
                      </span>
                      <Badge className="bg-red-500">
                        Save {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                      </Badge>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                  )}
                  {product.location && (
                    <span className="text-lg font-bold text-gray-700">
                      • {product.location}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Currency converter */}
              <div className="flex items-center mt-2">
                <div className="flex-1 flex items-center">
                  <div className="w-48 mr-2">
                    <Select
                      value={selectedCurrency}
                      onValueChange={(value) => setSelectedCurrency(value as CurrencyCode)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedCurrencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedCurrency !== 'GBP' && (
                    <>
                      {isConverting ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <RefreshCw 
                          className="ml-2 h-4 w-4 text-gray-500 cursor-pointer hover:text-primary" 
                          onClick={() => {
                            setConvertedPrice(null);
                            setConvertedDiscountPrice(null);
                            setSelectedCurrency(selectedCurrency); // Retrigger conversion
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Converted price display */}
              {selectedCurrency !== 'GBP' && convertedPrice !== null && (
                <div className="mt-1 text-sm text-gray-600">
                  {convertedDiscountPrice !== null ? (
                    <>
                      <span className="font-medium">
                        {formatCurrency(convertedDiscountPrice, selectedCurrency)}
                      </span>
                      <span className="ml-2 text-gray-400 line-through">
                        {formatCurrency(convertedPrice, selectedCurrency)}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">
                      {formatCurrency(convertedPrice, selectedCurrency)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.isNew && (
              <Badge variant="outline" className="bg-blue-100 hover:bg-blue-100 text-blue-800 border-blue-200">
                New Arrival
              </Badge>
            )}
            {product.isOnSale && (
              <Badge variant="outline" className="bg-red-100 hover:bg-red-100 text-red-800 border-red-200">
                On Sale
              </Badge>
            )}
            <Badge variant="outline" className="bg-gray-100 hover:bg-gray-100 text-gray-800 border-gray-200">
              {product.category}
            </Badge>
          </div>

          {/* Rating */}
          <div className="flex items-center mb-6">
            <div className="flex mr-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <span className="text-sm text-gray-500">
              {reviews.length === 0
                ? 'No reviews yet'
                : `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`}
            </span>
          </div>

          {/* Add to cart */}
          <div className="flex items-center mb-8">
            <div className="flex items-center border rounded-md mr-4">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => handleQuantityChange(-1)}
                className="px-3 py-2 text-gray-600 hover:text-primary disabled:text-gray-300"
              >
                -
              </button>
              <span className="px-3 py-2 text-center w-12">{quantity}</span>
              <button
                type="button"
                disabled={quantity >= (product?.inventory || 1)}
                onClick={() => handleQuantityChange(1)}
                className="px-3 py-2 text-gray-600 hover:text-primary disabled:text-gray-300"
              >
                +
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || product.inventory <= 0}
              className="flex-1 bg-black hover:bg-gray-800 text-white"
            >
              {addToCartMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : product.inventory <= 0 ? (
                'Out of Stock'
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>

          {/* Inventory */}
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              {product.inventory > 0 ? (
                <>
                  <span className="text-green-600 font-medium">In Stock</span>
                  {product.inventory < 10 && (
                    <span className="ml-2 text-orange-500">
                      Only {product.inventory} left!
                    </span>
                  )}
                </>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toast({
                  title: "Product Liked",
                  description: "Added to your favorites!",
                });
              }}
              className="p-2 hover:bg-gray-100"
            >
              <Heart className="h-5 w-5 text-black" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (user) {
                  setLocation('/dating');
                  toast({
                    title: "Added to Dating Profile",
                    description: "Product added to your dating wishlist!",
                  });
                } else {
                  toast({
                    title: "Login Required",
                    description: "Please log in to add to dating profile",
                    variant: "destructive"
                  });
                  setLocation('/auth');
                }
              }}
              className="p-2 hover:bg-gray-100"
            >
              <span className="text-black text-lg font-bold">+</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (user) {
                  toast({
                    title: "Offer Sent",
                    description: "Your offer has been sent to the product owner!",
                  });
                } else {
                  toast({
                    title: "Login Required",
                    description: "Please log in to send an offer",
                    variant: "destructive"
                  });
                  setLocation('/auth');
                }
              }}
              className="p-2 hover:bg-gray-100"
            >
              <span className="text-black font-bold">Send Offer</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for description and reviews */}
      <Tabs defaultValue="description" className="mb-12">
        <TabsList className="mb-6 border-b w-full justify-start rounded-none">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({reviews.length})
          </TabsTrigger>
          
          <div className="ml-auto flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <Share2 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  window.open(`mailto:?subject=${encodeURIComponent(`Check out this product: ${product.name}`)}&body=${encodeURIComponent(`I thought you might be interested in this: ${window.location.href}`)}`, '_blank');
                }}>
                  <Mail className="h-4 w-4 mr-2 text-gray-600" />
                  Share via Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: "Link Copied",
                    description: "Product link copied to clipboard",
                  });
                }}>
                  <LinkIcon className="h-4 w-4 mr-2 text-gray-600" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (user) {
                    setLocation(`/social?share=${productId}`);
                  } else {
                    toast({
                      title: "Login Required",
                      description: "Please log in to share on feed",
                      variant: "destructive"
                    });
                    setLocation('/auth');
                  }
                }}>
                  <Share2 className="h-4 w-4 mr-2 text-blue-600" />
                  Share on Feed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (user) {
                    setLocation(`/messages?share=${productId}`);
                  } else {
                    toast({
                      title: "Login Required",
                      description: "Please log in to share via messages",
                      variant: "destructive"
                    });
                    setLocation('/auth');
                  }
                }}>
                  <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                  Send via Message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (user) {
                    setLocation(`/members?share=${productId}`);
                  } else {
                    toast({
                      title: "Login Required",
                      description: "Please log in to share with members",
                      variant: "destructive"
                    });
                    setLocation('/auth');
                  }
                }}>
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  Share with Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TabsList>
        <TabsContent value="description">
          <div className="prose max-w-none">
            <p className="whitespace-pre-line">{product.description}</p>
          </div>
        </TabsContent>
        <TabsContent value="reviews">
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">This product has no reviews yet.</p>
                {user && (
                  <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="mt-4">
                        Write a Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Write a Review</DialogTitle>
                        <DialogDescription>
                          Share your experience with this product
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="rating">Rating</Label>
                          <div className="flex gap-1">
                            {renderInteractiveStars(reviewRating, setReviewRating)}
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="title">Title (optional)</Label>
                          <Input
                            id="title"
                            value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)}
                            placeholder="Brief summary of your review"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="content">Review</Label>
                          <Textarea
                            id="content"
                            value={reviewContent}
                            onChange={(e) => setReviewContent(e.target.value)}
                            placeholder="Tell others about your experience with this product..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsReviewDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSubmitReview}
                          disabled={submitReviewMutation.isPending}
                        >
                          {submitReviewMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Review'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : (
              <>
                {reviewsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-b pb-6 mb-6 last:border-0">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <div className="font-medium">{review.user?.name || 'Anonymous'}</div>
                            <span className="mx-2 text-gray-300">•</span>
                            <div className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex">{renderStars(review.rating)}</div>
                        </div>
                        <p className="text-gray-700">{review.content}</p>
                      </div>
                    ))}
                    {user && (
                      <div className="mt-8 text-center">
                        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>Write a Review</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Write a Review</DialogTitle>
                              <DialogDescription>
                                Share your experience with this product
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="rating">Rating</Label>
                                <div className="flex gap-1">
                                  {renderInteractiveStars(reviewRating, setReviewRating)}
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="title">Title (optional)</Label>
                                <Input
                                  id="title"
                                  value={reviewTitle}
                                  onChange={(e) => setReviewTitle(e.target.value)}
                                  placeholder="Brief summary of your review"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="content">Review</Label>
                                <Textarea
                                  id="content"
                                  value={reviewContent}
                                  onChange={(e) => setReviewContent(e.target.value)}
                                  placeholder="Tell others about your experience with this product..."
                                  rows={4}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsReviewDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleSubmitReview}
                                disabled={submitReviewMutation.isPending}
                              >
                                {submitReviewMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  'Submit Review'
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Similar products section - can be implemented in the future */}
    </div>
  );
}