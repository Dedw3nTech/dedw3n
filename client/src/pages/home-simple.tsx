import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useView } from "@/hooks/use-view";
import { useMarketType } from "@/hooks/use-market-type";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
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
  const { formatPrice: formatCurrencyPrice } = useCurrency();
  const { selectedLanguage } = useLanguage();
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

  // Fetch new products (limit to 6)
  const { 
    data: newProducts = [], 
    isLoading: newLoading 
  } = useQuery<Product[]>({
    queryKey: ["/api/products", "new"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      const allProducts = await response.json();
      // Get products in reverse order (newest first) and limit to 6
      return allProducts.reverse().slice(0, 6);
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
            <Badge className="bg-blue-500"><TranslatedText>New</TranslatedText></Badge>
          )}
          {product.isOnSale && (
            <Badge className="bg-red-500"><TranslatedText>Sale</TranslatedText></Badge>
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
                <div className="font-bold text-primary">{formatCurrencyPrice(product.discountPrice)}</div>
                <div className="ml-2 text-sm text-gray-500 line-through">{formatCurrencyPrice(product.price)}</div>
              </div>
            ) : (
              <div className="font-bold">{formatCurrencyPrice(product.price)}</div>
            )}
          </div>
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => {
                  e.stopPropagation();
                }} className="h-8 w-8 p-0">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  toast({
                    title: "Send Offer",
                    description: "Offer functionality coming soon",
                  });
                }}>
                  <Tag className="mr-2 h-4 w-4" />
                  Send Offer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  toast({
                    title: "Share Product",
                    description: "Sharing functionality coming soon",
                  });
                }}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                toast({
                  title: "Added to Favorites",
                  description: `${product.name} has been added to your favorites`,
                });
              }}
              className="h-8 w-8 p-0"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );

  const isLoading = featuredLoading || newLoading || categoriesLoading;

  return (
    <div key={`home-${selectedLanguage.code}`} className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to Dedw3n Marketplace
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Discover amazing products from trusted vendors worldwide
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setLocation('/products')}
              className="px-8"
            >
              <Search className="mr-2 h-5 w-5" />
              <TranslatedText>Browse Products</TranslatedText>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setLocation('/vendor/register')}
              className="px-8 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Store className="mr-2 h-5 w-5" />
              <TranslatedText>Become a Vendor</TranslatedText>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Market Type Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center"><TranslatedText>Choose Your Market</TranslatedText></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setMarketType('B2C');
                setLocation('/products');
              }}
            >
              <CardContent className="text-center p-8">
                <Store className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-bold mb-2"><TranslatedText>Business to Consumer</TranslatedText></h3>
                <p className="text-gray-600"><TranslatedText>Shop from businesses selling directly to customers</TranslatedText></p>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setMarketType('B2B');
                setLocation('/products');
              }}
            >
              <CardContent className="text-center p-8">
                <Building className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-bold mb-2"><TranslatedText>Business to Business</TranslatedText></h3>
                <p className="text-gray-600"><TranslatedText>Wholesale and bulk purchasing for businesses</TranslatedText></p>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setMarketType('C2C');
                setLocation('/products');
              }}
            >
              <CardContent className="text-center p-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-bold mb-2"><TranslatedText>Consumer to Consumer</TranslatedText></h3>
                <p className="text-gray-600"><TranslatedText>Buy and sell between individual users</TranslatedText></p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-500"><TranslatedText>Loading products...</TranslatedText></p>
          </div>
        )}

        {/* Featured Products */}
        {!isLoading && featuredProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold"><TranslatedText>Featured Products</TranslatedText></h2>
              <Button 
                variant="outline"
                onClick={() => setLocation('/products')}
              >
                <TranslatedText>View All</TranslatedText>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map(renderProductCard)}
            </div>
          </div>
        )}

        {/* New Products */}
        {!isLoading && newProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold"><TranslatedText>New Arrivals</TranslatedText></h2>
              <Button 
                variant="outline"
                onClick={() => setLocation('/products')}
              >
                <TranslatedText>View All</TranslatedText>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {newProducts.map(renderProductCard)}
            </div>
          </div>
        )}

        {/* Categories */}
        {!isLoading && categories.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6"><TranslatedText>Shop by Category</TranslatedText></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Card 
                  key={category.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setLocation(`/products?category=${category.name}`)}
                >
                  <CardContent className="text-center p-4">
                    <Tag className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium"><TranslatedText>{category.name}</TranslatedText></p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}