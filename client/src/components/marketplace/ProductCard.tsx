import { useState } from "react";
import { formatPrice, getStarRating } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to add product to cart. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        return apiRequest("DELETE", `/api/favorites/${product.id}`);
      } else {
        return apiRequest("POST", `/api/favorites/${product.id}`);
      }
    },
    onSuccess: (data: any) => {
      setIsFavorite(!isFavorite);
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: data?.message || (isFavorite ? "Removed from favorites" : "Added to favorites"),
        description: `${product.name} has been ${isFavorite ? "removed from" : "added to"} your favorites.`,
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
          description: error?.message || "Failed to update favorites. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate();
  };

  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
      <div className="relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
        
        {product.isOnSale && (
          <div className="absolute top-0 left-0 bg-amber-500 text-white text-xs font-medium px-2 py-1">
            SALE
          </div>
        )}
        
        {product.isNew && (
          <div className="absolute top-0 left-0 bg-secondary text-white text-xs font-medium px-2 py-1">
            NEW
          </div>
        )}
        
        <button 
          className={`absolute top-2 right-2 p-1.5 bg-white rounded-full ${isFavorite ? 'text-primary' : 'text-gray-700 hover:text-primary'} disabled:opacity-50`}
          onClick={toggleFavorite}
          disabled={toggleFavoriteMutation.isPending}
          data-testid={`button-favorite-${product.id}`}
          data-no-login
        >
          {toggleFavoriteMutation.isPending ? (
            <i className="ri-loader-4-line animate-spin"></i>
          ) : (
            <i className={`${isFavorite ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
          )}
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center text-xs text-gray-500 mb-1">
          <i className="ri-store-2-line mr-1"></i>
          <span>Vendor Name</span>
          <div className="flex ml-2 text-amber-400">
            {getStarRating(4.5).map((starClass, index) => (
              <i key={index} className={`${starClass} ${starClass === 'ri-star-line' ? 'text-gray-300' : 'text-amber-400'}`}></i>
            ))}
          </div>
          <span className="ml-1">(128)</span>
        </div>
        
        <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
        
        <div className="flex justify-between items-center">
          {product.discountPrice ? (
            <div>
              <span className="font-bold text-gray-900">{formatPrice(product.discountPrice)}</span>
              <span className="text-sm text-gray-500 line-through ml-2">
                {formatPrice(product.price)}
              </span>
            </div>
          ) : (
            <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
          )}
          <button 
            className="p-2 bg-primary text-white rounded-full hover:bg-blue-600"
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
          >
            {addToCartMutation.isPending ? (
              <i className="ri-loader-4-line animate-spin"></i>
            ) : (
              <i className="ri-shopping-cart-2-line"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
