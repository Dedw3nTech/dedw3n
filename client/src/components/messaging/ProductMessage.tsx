import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  ShoppingBag,
  Loader2,
  Maximize,
  Tag,
  DollarSign,
  Users,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  discountPrice?: number | null;
  imageUrl: string;
  vendorId: number;
  vendorName?: string;
}

interface ProductMessageProps {
  product: Product;
  inConversation?: boolean;
  onSend?: (product: Product) => void;
}

export default function ProductMessage({
  product,
  inConversation = true,
  onSend,
}: ProductMessageProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest(
        "POST",
        "/api/cart",
        { productId, quantity: 1 }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add product to cart");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Product added to your cart successfully",
      });
      
      // Invalidate cart data
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to cart",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    addToCartMutation.mutate(product.id);
  };

  const handleSendProduct = () => {
    if (onSend) {
      onSend(product);
    }
  };

  return (
    <Card className={inConversation ? "max-w-sm ml-auto w-4/5 mb-4" : "w-full"}>
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div 
            className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 cursor-pointer" 
            onClick={() => setLocation(`/product/${product.id}`)}
          >
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 
                  className="font-medium text-sm hover:underline cursor-pointer"
                  onClick={() => setLocation(`/product/${product.id}`)}
                >
                  {product.name}
                </h4>
                {product.vendorName && (
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    {product.vendorName}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {product.discountPrice !== null && product.discountPrice !== undefined && (
                    <span className="text-xs line-through text-muted-foreground">
                      £{product.price.toFixed(2)}
                    </span>
                  )}
                  <span className="font-semibold text-primary text-sm">
                    £{(product.discountPrice ?? product.price).toFixed(2)}
                  </span>
                </div>
                {product.discountPrice !== null && product.discountPrice !== undefined && (
                  <Badge className="bg-green-500 hover:bg-green-600 mt-1 text-xs">
                    {Math.round((1 - product.discountPrice / product.price) * 100)}% OFF
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex gap-2">
        {inConversation ? (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
          >
            {addToCartMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <ShoppingBag className="h-4 w-4 mr-1" />
            )}
            Buy Now
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={handleSendProduct}
          >
            <ShoppingBag className="h-4 w-4 mr-1" />
            Share Product
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setLocation(`/product/${product.id}`)}
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}