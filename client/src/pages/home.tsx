import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useView } from "@/hooks/use-view";
import { useMarketType } from "@/hooks/use-market-type";
import { useCurrency } from "@/hooks/use-currency";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, formatCurrency } from "@/lib/utils";
import { convertCurrency, formatPriceWithCurrency, CurrencyCode } from "@/lib/currencyConverter";
import { Product } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, PlusCircle, Search, Tag, StarIcon, RefreshCw, Share2, MessageCircle, Users, Mail, Store, Building, Landmark, Heart, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { setView } = useView();
  const { user } = useAuth();
  const { setMarketType } = useMarketType();
  const { currency } = useCurrency();
  const [, setLocation] = useLocation();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('GBP');
  const [convertedPrices, setConvertedPrices] = useState<Record<number, number>>({});
  const [convertedDiscountPrices, setConvertedDiscountPrices] = useState<Record<number, number>>({});
  const [isConverting, setIsConverting] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // List of supported currencies
  const supportedCurrencies: CurrencyCode[] = ['GBP', 'USD', 'EUR', 'CNY', 'INR', 'BRL'];
  
  // Force rerender when currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      console.log('Home page detected currency change');
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('currency-changed', handleCurrencyChange);
    
    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, []);
  
  useEffect(() => {
    setView("marketplace");
  }, [setView]);
  
  // Update selected currency when the global currency changes
  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  // Fetch featured products (limit to 6)
  const { 
    data: featuredProducts = [], 
    isLoading: featuredLoading 
  } = useQuery<Product[]>({
    queryKey: ["/api/products", "featured"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      const allProducts = await response.json();
      // Get the first 6 products as featured
      return allProducts.slice(0, 6);
    },
  });

  // Fetch newest products (limit to 4)
  const { 
    data: newProducts = [], 
    isLoading: newProductsLoading 
  } = useQuery<Product[]>({
    queryKey: ["/api/products", "new"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      const allProducts = await response.json();
      // Sort by created date (newest first) and get the first 4
      return [...allProducts].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 4);
    },
  });

  // Fetch categories
  const { 
    data: categories = [],
    isLoading: categoriesLoading 
  } = useQuery<{id: number, name: string}[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return response.json();
    },
  });
  
  // Effect to handle currency conversion when currency changes
  useEffect(() => {
    if (selectedCurrency === 'GBP' || (!featuredProducts?.length && !newProducts?.length)) {
      setConvertedPrices({});
      setConvertedDiscountPrices({});
      return;
    }

    const allProducts = [...(featuredProducts || []), ...(newProducts || [])];
    // Remove duplicates
    const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.id, p])).values());
    
    const convertAllPrices = async () => {
      try {
        setIsConverting(true);
        
        const newConvertedPrices: Record<number, number> = {};
        const newConvertedDiscountPrices: Record<number, number> = {};
        
        for (const product of uniqueProducts) {
          // Convert main price
          const newPrice = await convertCurrency(product.price, 'GBP', selectedCurrency);
          newConvertedPrices[product.id] = newPrice;
          
          // Convert discount price if it exists
          if (product.discountPrice && product.discountPrice < product.price) {
            const newDiscountPrice = await convertCurrency(product.discountPrice, 'GBP', selectedCurrency);
            newConvertedDiscountPrices[product.id] = newDiscountPrice;
          }
        }
        
        setConvertedPrices(newConvertedPrices);
        setConvertedDiscountPrices(newConvertedDiscountPrices);
      } catch (error) {
        console.error('Error converting currencies:', error);
      } finally {
        setIsConverting(false);
      }
    };
    
    convertAllPrices();
  }, [selectedCurrency, featuredProducts, newProducts]);

  // Render product card
  const { toast } = useToast();
  
  const renderProductCard = (product: any) => (
    <Card 
      key={product.id} 
      className="overflow-hidden flex flex-col"
      onClick={() => setLocation(`/product/${product.id}`)}
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden group cursor-pointer">
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
            <Badge className="bg-blue-500">New</Badge>
          )}
          {product.isOnSale && (
            <Badge className="bg-red-500">Sale</Badge>
          )}
        </div>
      </div>
      
      <CardContent className="pt-4 flex-grow">
        <div className="font-medium mb-1 line-clamp-1 hover:text-primary">
          {product.name}
        </div>
        <div className="text-sm text-gray-500 mb-2">{product.category}</div>
      </CardContent>
      
      <CardFooter className="flex flex-col w-full">
        <div className="flex justify-between items-center w-full">
          <div>
            {product.discountPrice ? (
              <div className="flex items-center">
                <div className="font-bold text-primary">{formatPrice(product.discountPrice)}</div>
                <div className="ml-2 text-sm text-gray-500 line-through">{formatPrice(product.price)}</div>
              </div>
            ) : (
              <div className="font-bold">{formatPrice(product.price)}</div>
            )}
            
            {/* Converted price display */}
            {selectedCurrency !== 'GBP' && convertedPrices[product.id] && (
              <div className="text-xs text-gray-600 mt-1">
                {product.discountPrice && convertedDiscountPrices[product.id] ? (
                  <div className="flex items-center">
                    <span>{formatPriceWithCurrency(convertedDiscountPrices[product.id], selectedCurrency)}</span>
                    <span className="ml-1 text-gray-400 line-through">
                      {formatPriceWithCurrency(convertedPrices[product.id], selectedCurrency)}
                    </span>
                  </div>
                ) : (
                  <span>{formatPriceWithCurrency(convertedPrices[product.id], selectedCurrency)}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => {
                  e.stopPropagation();
                }} className="h-8 w-8 p-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  const productUrl = `${window.location.origin}/product/${product.id}`;
                  navigator.clipboard.writeText(productUrl);
                  toast({
                    title: "Link Copied",
                    description: "Product link copied to clipboard",
                  });
                }}>
                  <Share2 className="h-4 w-4 mr-2 text-gray-600" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  const productUrl = `${window.location.origin}/product/${product.id}`;
                  window.open(`mailto:?subject=${encodeURIComponent(`Check out this product: ${product.name}`)}&body=${encodeURIComponent(`I thought you might be interested in this: ${productUrl}`)}`, '_blank');
                }}>
                  <Mail className="h-4 w-4 mr-2 text-gray-600" />
                  Share via Email
                </DropdownMenuItem>
                {user && (
                  <>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/messages?share=${product.id}`);
                    }}>
                      <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                      Share in Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/members?share=${product.id}`);
                    }}>
                      <Users className="h-4 w-4 mr-2 text-blue-600" />
                      Share with Member
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={(e) => {
              e.stopPropagation();
              setLocation(`/product/${product.id}`);
            }}>
              View
            </Button>
          </div>
        </div>
        
        {isConverting && (
          <div className="w-full flex justify-center mt-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Empty content as requested */}
    </div>
  );
}