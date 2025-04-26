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
import { Loader2, Star, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/product/:id');
  const productId = params?.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

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
            {product.discountPrice && product.discountPrice < product.price ? (
              <>
                <span className="text-2xl font-bold text-primary mr-2">
                  {formatPrice(product.discountPrice)}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(product.price)}
                </span>
                <Badge className="ml-2 bg-red-500">
                  Save {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                </Badge>
              </>
            ) : (
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
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
              className="flex-1"
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
        </div>
      </div>

      {/* Tabs for description and reviews */}
      <Tabs defaultValue="description" className="mb-12">
        <TabsList className="mb-6 border-b w-full justify-start rounded-none">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({reviews.length})
          </TabsTrigger>
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
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setLocation(`/review/${productId}`)}
                  >
                    Write a Review
                  </Button>
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
                        <Button onClick={() => setLocation(`/review/${productId}`)}>
                          Write a Review
                        </Button>
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