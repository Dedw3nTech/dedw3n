import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useView } from "@/hooks/use-view";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/currencyConverter";
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
import { Loader2, ShoppingCart, PlusCircle, Search, Tag, StarIcon, RefreshCw } from "lucide-react";

export default function Home() {
  const { setView } = useView();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCurrency, setSelectedCurrency] = useState('GBP');
  const [convertedPrices, setConvertedPrices] = useState<Record<number, number>>({});
  const [convertedDiscountPrices, setConvertedDiscountPrices] = useState<Record<number, number>>({});
  const [isConverting, setIsConverting] = useState(false);
  
  // List of supported currencies
  const supportedCurrencies = ['GBP', 'USD', 'EUR', 'JPY', 'CNY', 'INR', 'CAD', 'AUD', 'SGD'];
  
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
                    <span>{formatCurrency(convertedDiscountPrices[product.id], selectedCurrency)}</span>
                    <span className="ml-1 text-gray-400 line-through">
                      {formatCurrency(convertedPrices[product.id], selectedCurrency)}
                    </span>
                  </div>
                ) : (
                  <span>{formatCurrency(convertedPrices[product.id], selectedCurrency)}</span>
                )}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            setLocation(`/product/${product.id}`);
          }}>
            View
          </Button>
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
      {/* Hero Section */}
      <div className="rounded-lg bg-gradient-to-r from-primary to-primary-dark p-8 mb-12 text-white">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to SocialMarket</h1>
          <p className="text-lg mb-6">
            Discover amazing products from trusted vendors, connect with other shoppers, 
            and enjoy a seamless shopping experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setLocation("/products")} 
              className="bg-white text-primary hover:bg-gray-100"
            >
              <Search className="mr-2 h-4 w-4" />
              Browse Products
            </Button>
            {user && (
              <Button
                onClick={() => setLocation("/add-product")}
                variant="outline"
                className="border-white text-white hover:bg-white/20"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Sell Your Products
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Currency Selector */}
      <div className="mb-6">
        <div className="flex justify-end items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Currency:</span>
            <Select
              value={selectedCurrency}
              onValueChange={(value) => setSelectedCurrency(value)}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCurrency !== 'GBP' && (
              <>
                {isConverting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <RefreshCw 
                    className="h-4 w-4 text-gray-500 cursor-pointer hover:text-primary" 
                    onClick={() => {
                      setConvertedPrices({});
                      setConvertedDiscountPrices({});
                      setSelectedCurrency(selectedCurrency); // Retrigger conversion
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Button variant="outline" onClick={() => setLocation("/products")}>
            View All
          </Button>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-lg h-80 animate-pulse"
              />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map(product => renderProductCard(product))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Yet</h3>
            <p className="text-gray-500 mb-6">
              Be the first to add products to our marketplace!
            </p>
            {user ? (
              <Button onClick={() => setLocation("/add-product")}>
                Add Product
              </Button>
            ) : (
              <Button onClick={() => setLocation("/auth")}>
                Sign In to Add Products
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        
        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-lg h-24 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map(category => (
              <div
                key={category.id}
                className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setLocation(`/products?category=${encodeURIComponent(category.name)}`)}
              >
                <Tag className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="font-medium text-sm">{category.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Arrivals Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">New Arrivals</h2>
          <Button variant="outline" onClick={() => setLocation("/products?isNew=true")}>
            View All
          </Button>
        </div>

        {newProductsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-lg h-80 animate-pulse"
              />
            ))}
          </div>
        ) : newProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {newProducts.map(product => renderProductCard(product))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No new products available</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Start Selling?</h2>
        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
          Join our marketplace and start selling your products to customers all around the world. 
          It's easy to get started!
        </p>
        <Button 
          onClick={() => user ? setLocation("/add-product") : setLocation("/auth")}
          className="px-6"
        >
          {user ? "Start Selling" : "Sign Up & Sell"}
        </Button>
      </div>
    </div>
  );
}