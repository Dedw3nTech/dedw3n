import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import { useMemo } from "react";

import { useMarketType } from "@/hooks/use-market-type";
import { apiRequest } from "@/lib/queryClient";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  imageUrl: string;
  inventory: number;
  isNew: boolean;
  isOnSale: boolean;
  vendor?: {
    id: number;
    storeName: string;
    rating: number;
  };
}

export default function LikedProductsContent() {
  const [, setLocation] = useLocation();
  const { marketType } = useMarketType();
  const { currentLanguage } = useLanguage();
  const { formatPriceFromGBP } = useCurrency();

  const { data: likedProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/liked-products'],
  });

  // Define texts for translation including product names for batch processing
  const pageTexts = useMemo(() => [
    "Liked Products",
    "No liked products yet",
    "Browse our marketplace and click the heart icon on products you love",
    "Explore Products",
    "View",
    "Add to Cart",
    "NEW",
    "SALE",
    "No Image",
    "by",
    // Add all product names and categories to the batch for efficient translation
    ...(likedProducts?.map(product => product.name) || []),
    ...(likedProducts?.map(product => product.category) || []),
    ...(likedProducts?.map(product => product.vendor?.storeName).filter((name): name is string => Boolean(name)) || [])
  ], [likedProducts]);

  // Use master translation system for unified performance
  const { translations: translatedTexts, isLoading: translationsLoading } = useMasterBatchTranslation(pageTexts, 'normal');

  // Helper function to get translated product name
  const getTranslatedProductName = (productName: string) => {
    const productIndex = pageTexts.indexOf(productName);
    return productIndex >= 0 ? (translatedTexts[productIndex] || productName) : productName;
  };

  // Helper function to get translated category name
  const getTranslatedCategoryName = (categoryName: string) => {
    const categoryIndex = pageTexts.indexOf(categoryName);
    return categoryIndex >= 0 ? (translatedTexts[categoryIndex] || categoryName) : categoryName;
  };

  // Helper function to get translated store name
  const getTranslatedStoreName = (storeName: string) => {
    const storeIndex = pageTexts.indexOf(storeName);
    return storeIndex >= 0 ? (translatedTexts[storeIndex] || storeName) : storeName;
  };

  // Memoize translated values to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    likedProducts: translatedTexts[0] || pageTexts[0],
    noLikedProducts: translatedTexts[1] || pageTexts[1],
    browseMessage: translatedTexts[2] || pageTexts[2],
    exploreProducts: translatedTexts[3] || pageTexts[3],
    view: translatedTexts[4] || pageTexts[4],
    addToCart: translatedTexts[5] || pageTexts[5],
    new: translatedTexts[6] || pageTexts[6],
    sale: translatedTexts[7] || pageTexts[7],
    noImage: translatedTexts[8] || pageTexts[8],
    by: translatedTexts[9] || pageTexts[9]
  }), [translatedTexts, pageTexts]);

  const getButtonText = () => {
    switch (marketType) {
      case 'c2c':
        return translatedLabels.view;
      case 'b2c':
      case 'b2b':
      default:
        return translatedLabels.addToCart;
    }
  };

  const handleAddToCart = (product: Product) => {
    if (marketType === 'c2c') {
      setLocation(`/product/${product.slug || product.id}`);
    } else {
      // Add to cart logic here
      console.log('Adding to cart:', product);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="aspect-[2/3] bg-gray-200"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!likedProducts.length) {
    return (
      <Card className="text-center py-16">
        <h3 className="text-xl font-semibold mb-2">{translatedLabels.noLikedProducts}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {translatedLabels.browseMessage}
        </p>
        <Button onClick={() => setLocation('/products')} variant="link" className="text-black hover:text-gray-800 font-normal">
          {translatedLabels.exploreProducts}
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {likedProducts.map((product) => (
        <Card 
          key={product.id} 
          className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => setLocation(`/product/${product.id}`)}
        >
          <div className="relative aspect-[2/3] overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={getTranslatedProductName(product.name)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-sm">{translatedLabels.noImage}</span>
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.isNew && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
                  {translatedLabels.new}
                </span>
              )}
              {product.isOnSale && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">
                  {translatedLabels.sale}
                </span>
              )}
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
              {getTranslatedProductName(product.name)}
            </h3>
            
            {product.vendor && (
              <p className="text-xs text-gray-600 mb-2">
                {translatedLabels.by} {getTranslatedStoreName(product.vendor.storeName)}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {product.discountPrice ? (
                  <>
                    <span className="font-bold text-lg">
                      {formatPriceFromGBP(product.discountPrice)}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatPriceFromGBP(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="font-bold text-lg">
                    {formatPriceFromGBP(product.price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}