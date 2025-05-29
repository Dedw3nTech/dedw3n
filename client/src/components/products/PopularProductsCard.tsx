import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, Star, ExternalLink, Flame } from "lucide-react";
import { Link } from "wouter";

interface PopularProduct {
  id: number;
  name: string;
  price: number;
  image?: string;
  category?: string;
  rating?: number;
  views?: number;
  purchases?: number;
  vendor?: {
    name: string;
  };
}

export function PopularProductsCard() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products/popular'],
    retry: false,
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-[14px]">
          <Flame className="h-5 w-5 text-blue-600" />
          Popular Products
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : !products || !Array.isArray(products) || products.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No popular products yet</p>
            <Button 
              asChild 
              variant="ghost" 
              className="mt-3 border-0"
              style={{ fontSize: '12px' }}
            >
              <Link href="/products">
                <ExternalLink className="h-4 w-4 mr-2" />
                Explore Products
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {products.slice(0, 3).map((product: PopularProduct, index: number) => (
              <div key={product.id} className="relative flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                {/* Ranking Badge */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
                
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {product.name}
                  </h4>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-orange-600 text-sm">
                      ${product.price}
                    </span>
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">{product.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {product.views && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{product.views}</span>
                      </div>
                    )}
                    {product.category && (
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  
                  {product.vendor && (
                    <p className="text-xs text-gray-500 mt-1">
                      by {product.vendor.name}
                    </p>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  asChild
                >
                  <Link href={`/product/${product.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
            
            <div className="pt-2">
              <Button 
                asChild 
                variant="ghost" 
                className="w-full border-0"
                style={{ fontSize: '12px' }}
              >
                <Link href="/products?sort=popular">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Popular Products
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}