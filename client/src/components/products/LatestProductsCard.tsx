import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Eye, Star, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  category?: string;
  rating?: number;
  vendor?: {
    name: string;
  };
}

export function LatestProductsCard() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
    retry: false,
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-[15px]">
          <ShoppingBag className="h-5 w-5 text-blue-600" />
          Latest Products
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
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No products available</p>
            <Button 
              asChild 
              variant="outline" 
              className="mt-3"
            >
              <Link href="/products">
                <ExternalLink className="h-4 w-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {products.slice(0, 4).map((product: Product) => (
              <div key={product.id} className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h4 className="font-bold text-xs leading-tight break-words line-clamp-2 h-8 overflow-hidden" style={{ fontSize: '12px' }}>
                    {product.name}
                  </h4>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 mt-1 flex-wrap">
                    <span className="font-normal text-blue-600 whitespace-nowrap" style={{ fontSize: '12px' }}>
                      ${product.price}
                    </span>
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">{product.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  {product.vendor && (
                    <p className="text-xs text-gray-500 break-words mt-1">
                      by {product.vendor.name}
                    </p>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 flex-shrink-0 mx-auto sm:mx-0"
                  asChild
                >
                  <Link href={`/product/${product.id}`}>
                    <span className="text-xs font-bold">View</span>
                  </Link>
                </Button>
              </div>
            ))}
            
            <div className="pt-2">
              <Button 
                asChild 
                variant="ghost" 
                className="w-full border-0"
                style={{ fontSize: '14px' }}
              >
                <Link href="/products">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Products
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}