import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingCart, Eye, TrendingUp, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RecommendedProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  images: string[];
  vendorId: number;
  recommendationReason: string;
  score: number;
}

interface RecommendationsResponse {
  recommendations: RecommendedProduct[];
  personalized: boolean;
  algorithm: string;
  timestamp: string;
}

export function PersonalizedRecommendations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch personalized recommendations
  const { data: recommendationsData, isLoading, error } = useQuery<RecommendationsResponse>({
    queryKey: ['/api/recommendations'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Track interaction mutation
  const trackInteractionMutation = useMutation({
    mutationFn: async ({ productId, interactionType, metadata }: {
      productId: number;
      interactionType: string;
      metadata?: any;
    }) => {
      const response = await fetch('/api/track-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, interactionType, metadata })
      });
      if (!response.ok) throw new Error('Failed to track interaction');
      return response.json();
    },
    onSuccess: () => {
      // Optionally refresh recommendations after interactions
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
    },
    onError: (error) => {
      console.error('Failed to track interaction:', error);
    }
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      // Track add to cart interaction
      trackInteractionMutation.mutate({
        productId: 0, // Will be set properly in actual usage
        interactionType: 'cart'
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    }
  });

  // Like product mutation
  const likeMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      if (!response.ok) throw new Error('Failed to like product');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product liked",
        description: "Product added to your favorites",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/liked-products'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to like product",
        variant: "destructive",
      });
    }
  });

  const handleProductView = (productId: number) => {
    trackInteractionMutation.mutate({
      productId,
      interactionType: 'view',
      metadata: { source: 'recommendations', timestamp: new Date().toISOString() }
    });
  };

  const handleAddToCart = (productId: number) => {
    addToCartMutation.mutate(productId);
    trackInteractionMutation.mutate({
      productId,
      interactionType: 'cart',
      metadata: { source: 'recommendations' }
    });
  };

  const handleLikeProduct = (productId: number) => {
    likeMutation.mutate(productId);
    trackInteractionMutation.mutate({
      productId,
      interactionType: 'like',
      metadata: { source: 'recommendations' }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Personalized for You</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-square">
                <Skeleton className="w-full h-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !recommendationsData) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          Recommendations Unavailable
        </h3>
        <p className="text-gray-500">
          We're learning your preferences. Browse more products to get personalized recommendations.
        </p>
      </div>
    );
  }

  const { recommendations, personalized, algorithm } = recommendationsData;

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          No Recommendations Yet
        </h3>
        <p className="text-gray-500">
          Start shopping to get personalized product recommendations tailored just for you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Personalized for You</h2>
          {personalized && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              AI-Powered
            </Badge>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {algorithm} • {recommendations.length} products
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative aspect-square overflow-hidden">
              <img
                src={product.images?.[0] || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onClick={() => handleProductView(product.id)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                onClick={() => handleLikeProduct(product.id)}
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>
            
            <CardContent className="p-4">
              <div className="mb-2">
                <Badge variant="outline" className="text-xs mb-2">
                  {product.recommendationReason}
                </Badge>
              </div>
              
              <h3 className="font-medium text-sm mb-1 line-clamp-2">
                {product.name}
              </h3>
              
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg">${product.price}</span>
                <Badge variant="secondary" className="text-xs">
                  {product.category}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAddToCart(product.id)}
                  disabled={addToCartMutation.isPending}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProductView(product.id)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] })}
        >
          Refresh Recommendations
        </Button>
      </div>
    </div>
  );
}