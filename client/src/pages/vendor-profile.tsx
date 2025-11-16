import { useState, useEffect, useMemo } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMarketType } from "@/hooks/use-market-type";
import { useAuth } from "@/hooks/use-auth";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Store, Package, Heart, ShoppingCart, MessageCircle, Share2, Phone, Mail, Globe, Calendar, Award, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/fallback-states";
import { useCart } from "@/hooks/use-cart";

interface VendorProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  location: string;
  avatar?: string;
  bio?: string;
  storeName?: string;
  businessName?: string;
  businessAddress?: string;
  phone?: string;
  website?: string;
  joinedDate: string;
  totalProducts: number;
  totalSales: number;
  rating: number;
  reviewCount: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  category: string;
  isNew: boolean;
  isOnSale: boolean;
  marketplace: string;
  createdAt: string;
}

export default function VendorProfile() {
  const [match, params] = useRoute("/vendor/:vendorId");
  const vendorId = params?.vendorId;
  const { user } = useAuth();
  const { marketType } = useMarketType();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("products");

  // Translation texts
  const translationTexts = useMemo(() => [
    "Vendor Profile",
    "Products",
    "Reviews",
    "About",
    "Contact Vendor",
    "Share Profile",
    "Add to Cart",
    "View Details",
    "Member Since",
    "Total Products",
    "Total Sales",
    "Customer Rating",
    "Location",
    "Phone",
    "Email", 
    "Website",
    "Business Address",
    "All Products",
    "New Products",
    "On Sale",
    "Loading vendor profile...",
    "Vendor not found",
    "No products available",
    "This vendor hasn't listed any products yet.",
    "Professional Seller",
    "Verified Vendor",
    "Top Rated",
    "Fast Shipping"
  ], []);

  const { translations } = useMasterBatchTranslation(translationTexts);

  const labels = useMemo(() => ({
    vendorProfile: translations[0] || "Vendor Profile",
    products: translations[1] || "Products", 
    reviews: translations[2] || "Reviews",
    about: translations[3] || "About",
    contactVendor: translations[4] || "Contact Vendor",
    shareProfile: translations[5] || "Share Profile",
    addToCart: translations[6] || "Add to Cart",
    viewDetails: translations[7] || "View Details",
    memberSince: translations[8] || "Member Since",
    totalProducts: translations[9] || "Total Products",
    totalSales: translations[10] || "Total Sales", 
    customerRating: translations[11] || "Customer Rating",
    location: translations[12] || "Location",
    phone: translations[13] || "Phone",
    email: translations[14] || "Email",
    website: translations[15] || "Website",
    businessAddress: translations[16] || "Business Address",
    allProducts: translations[17] || "All Products",
    newProducts: translations[18] || "New Products",
    onSale: translations[19] || "On Sale",
    loadingVendor: translations[20] || "Loading vendor profile...",
    vendorNotFound: translations[21] || "Vendor not found",
    noProducts: translations[22] || "No products available",
    noProductsDesc: translations[23] || "This vendor hasn't listed any products yet.",
    professionalSeller: translations[24] || "Professional Seller",
    verifiedVendor: translations[25] || "Verified Vendor", 
    topRated: translations[26] || "Top Rated",
    fastShipping: translations[27] || "Fast Shipping"
  }), [translations]);

  // Fetch vendor profile data
  const { data: vendorProfile, isLoading: vendorLoading, error: vendorError } = useQuery<VendorProfile>({
    queryKey: ['/api/vendors/profile', vendorId],
    enabled: !!vendorId,
  });

  // Fetch vendor's products
  const { data: vendorProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/vendors/products', vendorId],
    enabled: !!vendorId,
  });

  // Filter products based on active tab
  const filteredProducts = useMemo(() => {
    if (!vendorProducts) return [];
    
    switch (activeTab) {
      case "new":
        return vendorProducts.filter(p => p.isNew);
      case "sale":
        return vendorProducts.filter(p => p.isOnSale);
      default:
        return vendorProducts;
    }
  }, [vendorProducts, activeTab]);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContactVendor = () => {
    if (vendorProfile) {
      // Navigate to messaging with vendor
      window.location.href = `/messages?user=${vendorProfile.id}`;
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vendorProfile?.storeName || vendorProfile?.name} - Vendor Profile`,
        text: `Check out ${vendorProfile?.storeName || vendorProfile?.name}'s products on Dedw3n`,
        url: window.location.href,
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard!",
      });
    }
  };

  if (!match) {
    return null;
  }

  if (vendorLoading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <p className="text-gray-600">{labels.loadingVendor}</p>
          </div>
        </div>
      </Container>
    );
  }

  if (vendorError || !vendorProfile) {
    return (
      <Container className="py-8">
        <div className="text-center min-h-[400px] flex items-center justify-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{labels.vendorNotFound}</h2>
            <p className="text-gray-600">The vendor you're looking for doesn't exist.</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Vendor Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Vendor Avatar/Logo */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                {vendorProfile.avatar ? (
                  <img 
                    src={vendorProfile.avatar} 
                    alt={vendorProfile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (vendorProfile.storeName || vendorProfile.name).charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Vendor Info */}
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {vendorProfile.storeName || vendorProfile.businessName || vendorProfile.name}
                  </h1>
                  <p className="text-gray-600 mb-3">@{vendorProfile.username}</p>
                  
                  {/* Vendor Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Award className="w-3 h-3 mr-1" />
                      {labels.verifiedVendor}
                    </Badge>
                    {vendorProfile.rating >= 4.5 && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        {labels.topRated}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {labels.professionalSeller}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleContactVendor} className="bg-blue-600 hover:bg-blue-700">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {labels.contactVendor}
                  </Button>
                  <Button variant="outline" onClick={handleShareProfile}>
                    <Share2 className="w-4 h-4 mr-2" />
                    {labels.shareProfile}
                  </Button>
                </div>
              </div>

              {/* Vendor Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Package className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-xl font-bold text-gray-900">{vendorProfile.totalProducts}</div>
                  <div className="text-xs text-gray-600">{labels.totalProducts}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-xl font-bold text-gray-900">{vendorProfile.totalSales}</div>
                  <div className="text-xs text-gray-600">{labels.totalSales}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500 fill-current" />
                  <div className="text-xl font-bold text-gray-900">{vendorProfile.rating.toFixed(1)}</div>
                  <div className="text-xs text-gray-600">{labels.customerRating}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-xl font-bold text-gray-900">{new Date(vendorProfile.joinedDate).getFullYear()}</div>
                  <div className="text-xs text-gray-600">{labels.memberSince}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {(vendorProfile.location || vendorProfile.phone || vendorProfile.email || vendorProfile.website) && (
            <>
              <Separator className="my-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {vendorProfile.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{vendorProfile.location}</span>
                  </div>
                )}
                {vendorProfile.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{vendorProfile.phone}</span>
                  </div>
                )}
                {vendorProfile.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{vendorProfile.email}</span>
                  </div>
                )}
                {vendorProfile.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-4 h-4" />
                    <a href={vendorProfile.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                      {vendorProfile.website}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Product Tabs */}
      <div className="mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "products"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {labels.allProducts} ({vendorProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "new"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {labels.newProducts} ({vendorProducts.filter(p => p.isNew).length})
          </button>
          <button
            onClick={() => setActiveTab("sale")}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "sale"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {labels.onSale} ({vendorProducts.filter(p => p.isOnSale).length})
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {productsLoading ? (
        <div className="text-center py-12">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{labels.noProducts}</h3>
          <p className="text-gray-600">{labels.noProductsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                {product.isNew && (
                  <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                    New
                  </Badge>
                )}
                {product.isOnSale && (
                  <Badge className="absolute top-2 right-2 bg-red-600 text-white">
                    Sale
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {product.discountPrice ? (
                      <>
                        <span className="text-lg font-bold text-green-600">£{product.discountPrice}</span>
                        <span className="text-sm text-gray-500 line-through">£{product.price}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">£{product.price}</span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {labels.addToCart}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.location.href = `/products/${product.id}`}
                  >
                    {labels.viewDetails}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}