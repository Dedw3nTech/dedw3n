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

export default function LikedPage() {
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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-[2/3] bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-base font-bold text-gray-900 mb-2">{translatedLabels.likedProducts}</h1>
        </div>

        {likedProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{translatedLabels.noLikedProducts}</h3>
            <p className="text-gray-600 mb-6 text-[14px]">
              {translatedLabels.browseMessage}
            </p>
            <Button onClick={() => setLocation('/products')} className="bg-black text-white hover:bg-gray-800">
              {translatedLabels.exploreProducts}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {likedProducts.map((product) => (
              <Card 
                key={product.id} 
                className="overflow-hidden flex flex-col border-0 shadow-none hover:shadow-md transition-shadow duration-300"
              >
                <div 
                  className="aspect-[2/3] bg-gray-100 relative overflow-hidden group cursor-pointer"
                  onClick={() => setLocation(`/product/${product.slug || product.id}`)}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {translatedLabels.noImage}
                    </div>
                  )}
                  
                  {/* Overlay with Add to Cart button */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="bg-black text-white hover:bg-gray-800 px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {getButtonText()}
                    </Button>
                  </div>

                  {/* Product badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isNew && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        {translatedLabels.new}
                      </span>
                    )}
                    {product.isOnSale && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                        {translatedLabels.sale}
                      </span>
                    )}
                  </div>

                  {/* Heart icon - always filled for liked products */}
                  <div className="absolute top-2 right-2">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  {/* Product title */}
                  <h3 
                    className="font-medium text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-gray-700"
                    onClick={() => setLocation(`/product/${product.slug || product.id}`)}
                  >
                    {getTranslatedProductName(product.name)}
                  </h3>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    {product.discountPrice ? (
                      <>
                        <span className="text-lg font-bold text-gray-900">
                          {formatPriceFromGBP(product.discountPrice)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPriceFromGBP(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {formatPriceFromGBP(product.price)}
                      </span>
                    )}
                  </div>

                  {/* Vendor info */}
                  {product.vendor && (
                    <div className="text-sm text-gray-600 mb-2">
                      {translatedLabels.by} {getTranslatedStoreName(product.vendor.storeName)}
                      {product.vendor.rating && (
                        <span className="ml-2">
                          ⭐ {product.vendor.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Category */}
                  <div className="text-sm text-gray-500 mt-auto">
                    {getTranslatedCategoryName(product.category)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}