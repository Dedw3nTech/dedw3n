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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Vendor Info Sidebar */}
        <div className="w-full lg:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Link href={`/members/${vendor.userId}`}>
                  <Avatar className="h-16 w-16 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all">
                    <AvatarImage src={vendor.logo || undefined} alt={vendor.storeName} />
                    <AvatarFallback>
                      <Store className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <div className="flex items-center">
                    <CardTitle className="text-2xl">{vendor.storeName}</CardTitle>
                    <Link href={`/members/${vendor.userId}`} className="ml-2 text-sm text-muted-foreground hover:text-primary">
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">{t("vendors.about")}</h3>
                <p className="text-sm text-muted-foreground">
                  {vendor.description || t("vendors.no_description")}
                </p>
              </div>
              
              <Separator />
              
              {isOwner && (
                <>
                  <div>
                    <h3 className="font-medium mb-2">{t("vendors.analytics")}</h3>
                    <Button 
                      onClick={() => setLocation(`/vendor-analytics?vendorId=${vendor.id}`)}
                      className="w-full"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {t("vendors.view_analytics")}
                    </Button>
                  </div>
                  <Separator />
                </>
              )}
              
              <div>
                <h3 className="font-medium mb-2">{t("vendors.contact")}</h3>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  {t("vendors.contact_vendor")}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Top Performers Section (Only visible to the vendor) */}
          {isOwner && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <div className="flex items-center">
                      <Award className="mr-2 h-5 w-5 text-yellow-500" />
                      {t("vendors.top_products")}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="space-y-4">
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
                    <div className="-mx-4">
                      {topProducts.slice(0, 3).map((product, i) => (
                        <TopProductItem key={i} product={product} index={i} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      {t("vendors.no_products_sold")}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" className="w-full">
                        {t("vendors.view_all_products")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle>{t("vendors.top_products")}</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 -mx-6">
                        {topProducts && topProducts.length > 0 ? (
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
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <div className="flex items-center">
                      <Users className="mr-2 h-5 w-5 text-blue-500" />
                      {t("vendors.top_buyers")}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-6 w-6" />
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-3 w-28" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : topBuyers && topBuyers.length > 0 ? (
                    <div className="-mx-4">
                      {topBuyers.slice(0, 3).map((buyer, i) => (
                        <TopBuyerItem key={i} buyer={buyer} index={i} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      {t("vendors.no_buyers_yet")}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" className="w-full">
                        {t("vendors.view_all_buyers")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle>{t("vendors.top_buyers")}</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 -mx-6">
                        {topBuyers && topBuyers.length > 0 ? (
                          topBuyers.map((buyer, i) => (
                            <TopBuyerItem key={i} buyer={buyer} index={i} />
                          ))
                        ) : (
                          <p className="text-center text-sm text-muted-foreground py-4">
                            {t("vendors.no_buyers_yet")}
                          </p>
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="w-full lg:w-2/3">
          <Tabs 
            defaultValue="products" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="products">{t("vendors.products")}</TabsTrigger>
              <TabsTrigger value="reviews">{t("vendors.reviews")}</TabsTrigger>
              <TabsTrigger value="about">{t("vendors.about")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="mt-0">
              {isLoadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full rounded-lg" />
                  ))}
                </div>
              ) : products && products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-0">
              <div className="text-center py-16">
                <Star className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">
                  {t("vendors.no_reviews")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  {t("vendors.no_reviews_message")}
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="about" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>{t("vendors.about")} {vendor.storeName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    {vendor.description || t("vendors.no_description")}
                  </p>
                  
                  <h3 className="text-lg font-medium mb-4">{t("vendors.store_details")}</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <span className="text-sm font-medium">{t("vendors.store_name")}</span>
                      <span className="col-span-2">{vendor.storeName}</span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <span className="text-sm font-medium">{t("vendors.rating")}</span>
                      <div className="col-span-2 flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span>
                          {vendor.rating?.toFixed(1) || "New"} 
                          {vendor.ratingCount ? ` (${vendor.ratingCount})` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}