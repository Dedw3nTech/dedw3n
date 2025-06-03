import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useView } from "@/hooks/use-view";
import { useMarketType } from "@/hooks/use-market-type";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, formatCurrency } from "@/lib/utils";
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
  const { selectedCurrency, formatPrice } = useCurrency();
  const [, setLocation] = useLocation();
  
  // Set page title
  usePageTitle({ title: 'Home' });

  useEffect(() => {
    setView("marketplace");
  }, [setView]);

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
        

      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-black text-white rounded-xl p-8 shadow-lg mb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center">Welcome to Dedw3n</h1>
          <p className="text-xl mb-10 text-center">
            The all-in-one platform for buying, selling, and connecting with others.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors">
              <h2 className="text-2xl font-bold mb-3">Multi-Vendor Marketplace</h2>
              <p className="text-gray-200">Buy from and sell to users across the platform.</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors">
              <h2 className="text-2xl font-bold mb-3">Social</h2>
              <p className="text-gray-200">Connect with friends, share posts, and build your network.</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors">
              <h2 className="text-2xl font-bold mb-3">Dating</h2>
              <p className="text-gray-200">Find love or your new friend.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map(renderProductCard)}
          </div>
        </div>
      )}

      {/* New Products Section */}
      {newProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">New Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newProducts.map(renderProductCard)}
          </div>
        </div>
      )}

      {/* Loading State */}
      {(featuredLoading || newProductsLoading) && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
    </div>
  );
}