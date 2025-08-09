import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useView } from "@/hooks/use-view";
import { useMarketType } from "@/hooks/use-market-type";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, formatCurrency } from "@/lib/utils";
import { Product } from "@shared/schema";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";

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

  // Comprehensive Home Page Translation Texts
  const homeTexts = [
    // Main Hero Section
    "Welcome to Dedw3n Marketplace",
    "Your Global Trading Platform", 
    "Spend more time enjoying life.",
    "Connecting buyers and sellers worldwide with secure transactions",
    "Start Shopping",
    "Become a Vendor",
    "Search products...",
    
    // Categories Section
    "Shop by Category",
    "Browse our curated categories",
    "View All Categories",
    "Electronics & Technology",
    "Fashion & Apparel", 
    "Home & Garden",
    "Sports & Fitness",
    "Books & Media",
    "Automotive",
    "Business & Industrial",
    "Health & Beauty",
    
    // Featured Products Section
    "Featured Products",
    "Handpicked products just for you",
    "View All Products",
    "New",
    "Sale",
    "Add to Cart",
    "Quick View",
    "Share",
    
    // New Arrivals Section
    "New Arrivals",
    "Latest products from our vendors",
    "See All New Products",
    
    // Market Types
    "C2C Marketplace",
    "Consumer to Consumer trading",
    "B2C Marketplace", 
    "Business to Consumer shopping",
    "B2B Marketplace",
    "Business to Business solutions",
    
    // Action Buttons & CTAs
    "Shop Now",
    "Learn More",
    "Get Started",
    "Browse Products",
    "Join Community",
    "Contact Support",
    
    // Loading & Status
    "Loading...",
    "No products available",
    "Try again later",
    "Search for products",
    "Filter products",
    
    // Product Cards
    "Price",
    "Rating",
    "Reviews",
    "In Stock",
    "Out of Stock",
    "Free Shipping",
    "Limited Time",
    "Best Seller",
    "Trending",
    
    // Footer/Additional
    "Secure Payments",
    "Fast Delivery", 
    "24/7 Support",
    "Money Back Guarantee",
    
    // Additional Hero Text
    "Welcome to Dedw3n",
    "The all-in-one platform for buying, selling, and connecting with others.",
    "Multi-Vendor Marketplace",
    "Buy from and sell to users across the platform.",
    "Social",
    "Connect with friends, share posts, and build your network.",
    "Dating",
    "Find love or your new friend."
  ];

  // Use Master Translation System for optimal performance and persistence
  const { translations: translatedTexts, isLoading: isTranslating } = useMasterBatchTranslation(homeTexts);
  
  // Create translation function from array
  const t = (text: string) => {
    const index = homeTexts.indexOf(text);
    return index >= 0 && translatedTexts ? translatedTexts[index] || text : text;
  };

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
            <Badge className="bg-blue-500">{t("New") || "New"}</Badge>
          )}
          {product.isOnSale && (
            <Badge className="bg-red-500">{t("Sale") || "Sale"}</Badge>
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
                    title: t("Link Copied") || "Link Copied",
                    description: t("Product link copied to clipboard") || "Product link copied to clipboard",
                  });
                }}>
                  <Share2 className="h-4 w-4 mr-2 text-gray-600" />
{t("Copy Link") || "Copy Link"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  const productUrl = `${window.location.origin}/product/${product.id}`;
                  window.open(`mailto:?subject=${encodeURIComponent(`Check out this product: ${product.name}`)}&body=${encodeURIComponent(`I thought you might be interested in this: ${productUrl}`)}`, '_blank');
                }}>
                  <Mail className="h-4 w-4 mr-2 text-gray-600" />
{t("Share via Email") || "Share via Email"}
                </DropdownMenuItem>
                {user && (
                  <>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/messages?share=${product.id}`);
                    }}>
                      <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
{t("Share in Messages") || "Share in Messages"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/members?share=${product.id}`);
                    }}>
                      <Users className="h-4 w-4 mr-2 text-blue-600" />
{t("Share with Member") || "Share with Member"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              size="sm" 
              className="min-h-[44px] min-w-[44px] touch-target" 
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/product/${product.id}`);
              }}
            >
              {t("View") || "View"}
            </Button>
          </div>
        </div>
        

      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <div 
        className="relative w-full h-screen flex items-center justify-center hero-mobile-optimized"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center px-4 py-8 text-center">
          <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {t("Welcome to Dedw3n") || "Welcome to Dedw3n"}
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white opacity-90 leading-relaxed">
              {t("Spend more time enjoying life.") || "Spend more time enjoying life."}
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-white max-w-3xl mx-auto leading-relaxed opacity-80">
              {t("The all-in-one platform for buying, selling, and connecting with others.") || "The all-in-one platform for buying, selling, and connecting with others."}
            </p>
            
            {/* Feature cards with mobile-optimized layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8 lg:mt-12">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 sm:p-6 rounded-lg hover:bg-opacity-20 transition-all duration-300 touch-target border border-white border-opacity-20">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-white">{t("Multi-Vendor Marketplace") || "Multi-Vendor Marketplace"}</h3>
                <p className="text-white opacity-90 text-sm sm:text-base leading-relaxed">{t("Buy from and sell to users across the platform.") || "Buy from and sell to users across the platform."}</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 sm:p-6 rounded-lg hover:bg-opacity-20 transition-all duration-300 touch-target border border-white border-opacity-20">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-white">{t("Social") || "Social"}</h3>
                <p className="text-white opacity-90 text-sm sm:text-base leading-relaxed">{t("Connect with friends, share posts, and build your network.") || "Connect with friends, share posts, and build your network."}</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 sm:p-6 rounded-lg hover:bg-opacity-20 transition-all duration-300 touch-target border border-white border-opacity-20 sm:col-span-2 lg:col-span-1">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-white">{t("Dating") || "Dating"}</h3>
                <p className="text-white opacity-90 text-sm sm:text-base leading-relaxed">{t("Find love or your new friend.") || "Find love or your new friend."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center sm:text-left">
              {t("Featured Products") || "Featured Products"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map(renderProductCard)}
            </div>
          </div>
        )}

        {/* AI Personalized Recommendations Section */}
        {user && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8">{t("Recommended for You") || "Recommended for You"}</h2>
            <PersonalizedRecommendations />
          </div>
        )}

        {/* New Products Section */}
        {newProducts.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center sm:text-left">
              {t("New Products") || "New Products"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
    </div>
  );
}