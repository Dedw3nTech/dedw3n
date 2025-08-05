import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
// Analytics types for vendor detail page
interface TopBuyer {
  id: number;
  name: string;
  totalSpent: number;
  orderCount: number;
  user: {
    id: number;
    name: string;
  };
}

interface TopProduct {
  id: number;
  name: string;
  salesCount: number;
  revenue: number;
  product: {
    id: number;
    name: string;
    imageUrl: string;
  };
  totalSold: number;
}
import { Vendor, Product } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Store, 
  User, 
  ShoppingBag, 
  BadgePercent, 
  Star, 
  ArrowRight,
  Mail,
  ChevronLeft,
  Users,
  Package,
  DollarSign,
  BarChart3,
  Award
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Product Card Component
const ProductCard = ({ product }: { product: Product }) => {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow flex flex-col">
      <div className="relative pt-[75%] overflow-hidden rounded-t-lg">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {product.isOnSale && (
          <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
            {t("products.on_sale")}
          </Badge>
        )}
        {product.isNew && (
          <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600">
            {t("products.new")}
          </Badge>
        )}
      </div>
      <CardHeader className="flex-1">
        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold">
              {formatCurrency(product.discountPrice || product.price)}
            </span>
            {product.discountPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => setLocation(`/product/${product.id}`)}
        >
          {t("products.view_details")}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Top Product Item Component
const TopProductItem = ({ product, index }: { product: TopProduct; index: number }) => {
  const [, setLocation] = useLocation();
  
  return (
    <div 
      className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg cursor-pointer"
      onClick={() => setLocation(`/product/${product.product.id}`)}
    >
      <div className="font-bold text-lg text-muted-foreground w-6 text-center">
        {index + 1}
      </div>
      <div className="h-14 w-14 rounded-md overflow-hidden flex-shrink-0">
        <img 
          src={product.product.imageUrl} 
          alt={product.product.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium line-clamp-1">{product.product.name}</h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-3 w-3" />
          <span>{formatNumber(product.totalSold)} sold</span>
          <DollarSign className="h-3 w-3 ml-2" />
          <span>{formatCurrency(product.revenue)}</span>
        </div>
      </div>
    </div>
  );
};

// Top Buyer Item Component
const TopBuyerItem = ({ buyer, index }: { buyer: TopBuyer; index: number }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg">
      <div className="font-bold text-lg text-muted-foreground w-6 text-center">
        {index + 1}
      </div>
      <Link href={`/members/${buyer.user.id}`}>
        <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-1 transition-all">
          <AvatarFallback>
            {buyer.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <h4 className="font-medium line-clamp-1">{buyer.user.name}</h4>
          <Link href={`/members/${buyer.user.id}`} className="ml-2 text-xs text-muted-foreground hover:text-primary">
            <User className="h-3 w-3 inline mr-1" />
            {t('members.view_profile')}
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShoppingBag className="h-3 w-3" />
          <span>{buyer.orderCount} orders</span>
          <DollarSign className="h-3 w-3 ml-2" />
          <span>{formatCurrency(buyer.totalSpent)}</span>
        </div>
      </div>
    </div>
  );
};

export default function VendorDetailPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const vendorSlug = location.split("/").pop() || "";
  const [activeTab, setActiveTab] = useState("products");
  
  // Fetch vendor data
  const { 
    data: vendor, 
    isLoading: isLoadingVendor 
  } = useQuery<Vendor>({
    queryKey: [`/api/vendors/by-slug/${vendorSlug}`],
    enabled: !!vendorSlug,
  });
  
  // Fetch vendor's products
  const { 
    data: products, 
    isLoading: isLoadingProducts 
  } = useQuery<Product[]>({
    queryKey: [`/api/products`, { vendorId: vendor?.id }],
    enabled: !!vendor?.id,
  });
  
  // Get vendor analytics if the viewing user is the vendor
  const isOwner = user && vendor && vendor.userId === user.id;
  // Analytics data for vendor detail page
  const topProducts: TopProduct[] = [];
  const topBuyers: TopBuyer[] = [];
  const isLoadingAnalytics = false;
  
  if (!vendorSlug) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Vendor</h1>
        <Button onClick={() => setLocation("/vendors")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Vendors
        </Button>
      </div>
    );
  }
  
  if (isLoadingVendor) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => setLocation("/vendors")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <Skeleton className="h-14 w-14 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-24 mb-6" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="w-full md:w-2/3">
            <Skeleton className="h-10 w-full mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-60 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!vendor) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Vendor not found</h1>
        <p className="text-muted-foreground mb-6">
          The vendor you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => setLocation("/vendors")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Vendors
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => setLocation("/vendors")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t("navigation.back")}
        </Button>
      </div>
      
      {/* Vendor Info Top Bar */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Section - Vendor Basic Info */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link href={`/members/${vendor.userId}`}>
                <Avatar className="h-16 w-16 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all">
                  <AvatarImage src={vendor.logo || undefined} alt={vendor.storeName} />
                  <AvatarFallback>
                    <Store className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{vendor.storeName}</h1>
                  <Link href={`/members/${vendor.userId}`} className="text-sm text-muted-foreground hover:text-primary">
                    <User className="h-4 w-4 inline mr-1" />
                    {t('vendors.view_profile')}
                  </Link>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {vendor.rating?.toFixed(1) || "New"} 
                    {vendor.ratingCount ? ` (${vendor.ratingCount})` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Center Section - About & Description */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">{t("vendors.about")}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {vendor.description || t("vendors.no_description")}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">{t("vendors.reviews")}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-muted-foreground opacity-50 mr-2" />
                    <span>{t("vendors.no_reviews_message")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button variant="outline" className="w-full md:w-auto">
                <Mail className="mr-2 h-4 w-4" />
                {t("vendors.contact_vendor")}
              </Button>
              {isOwner && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" className="w-full md:w-auto">
                      <Award className="mr-2 h-4 w-4" />
                      {t("vendors.top_products")}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>{t("vendors.top_products")}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 -mx-6">
                      {isLoadingAnalytics ? (
                        <div className="space-y-4 px-6">
                          {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                              <Skeleton className="h-6 w-6" />
                              <Skeleton className="h-14 w-14" />
                              <div className="flex-1">
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-3 w-28" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : topProducts && topProducts.length > 0 ? (
                        topProducts.map((product, i) => (
                          <TopProductItem key={i} product={product} index={i} />
                        ))
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          {t("vendors.no_products_sold")}
                        </p>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="w-full">
        {/* Products Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{t("vendors.products")}</h2>
          <p className="text-muted-foreground">
            Browse all products from {vendor.storeName}
          </p>
        </div>
        
        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-lg" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">
              {t("vendors.no_products")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {t("vendors.no_products_message")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}