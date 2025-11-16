import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { useAuth } from "@/hooks/use-auth";
import { SEOHead } from "@/components/seo/SEOHead";
import { buildVendorSchema, normalizeDescription, normalizeTitle } from "@/lib/buildSeoStructuredData";
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
  const { translateText } = useMasterTranslation();
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow flex flex-col">
      <div className="relative pt-[75%] overflow-hidden rounded-t-lg">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {product.isOnSale && (
          <Badge className="absolute top-2 right-2 bg-black text-white hover:bg-gray-800">
            {translateText("On Sale")}
          </Badge>
        )}
        {product.isNew && (
          <Badge className="absolute top-2 left-2 bg-black text-white hover:bg-gray-800">
            {translateText("New")}
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
          {translateText("View Details")}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Top Product Item Component
const TopProductItem = ({ product, index }: { product: TopProduct; index: number }) => {
  const [, setLocation] = useLocation();
  const { translateText } = useMasterTranslation();
  
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
          <span>{formatNumber(product.totalSold)} {translateText("sold")}</span>
          <DollarSign className="h-3 w-3 ml-2" />
          <span>{formatCurrency(product.revenue)}</span>
        </div>
      </div>
    </div>
  );
};

// Top Buyer Item Component
const TopBuyerItem = ({ buyer, index }: { buyer: TopBuyer; index: number }) => {
  const { translateText } = useMasterTranslation();
  
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
            {translateText("View Profile")}
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShoppingBag className="h-3 w-3" />
          <span>{buyer.orderCount} {translateText("orders")}</span>
          <DollarSign className="h-3 w-3 ml-2" />
          <span>{formatCurrency(buyer.totalSpent)}</span>
        </div>
      </div>
    </div>
  );
};

const nullishToUndefined = <T,>(value: T | null | undefined): T | undefined => value ?? undefined;

export default function VendorDetailPage() {
  const { translateText } = useMasterTranslation();
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
  
  // Sanitize vendor and products for SEO schema (convert null to undefined)
  const seoVendor = useMemo(() => {
    if (!vendor) return undefined;
    return {
      ...vendor,
      description: nullishToUndefined(vendor.description),
      logo: nullishToUndefined(vendor.logo),
      banner: nullishToUndefined(vendor.banner),
      website: nullishToUndefined(vendor.website),
      taxId: nullishToUndefined(vendor.taxId),
      contactEmail: nullishToUndefined(vendor.contactEmail),
      contactPhone: nullishToUndefined(vendor.contactPhone),
      rating: nullishToUndefined(vendor.rating),
      ratingCount: nullishToUndefined(vendor.ratingCount),
      totalSalesAmount: nullishToUndefined(vendor.totalSalesAmount),
      totalTransactions: nullishToUndefined(vendor.totalTransactions),
    };
  }, [vendor]);

  const seoProducts = useMemo(() => {
    if (!products) return undefined;
    return products.map(product => ({
      ...product,
      discountPrice: nullishToUndefined(product.discountPrice),
      imageUrl: nullishToUndefined(product.imageUrl),
      productCode: nullishToUndefined(product.productCode),
      condition: nullishToUndefined(product.condition),
      createdAt: nullishToUndefined(product.createdAt),
      dimensions: nullishToUndefined(product.dimensions),
      dimensionUnit: nullishToUndefined(product.dimensionUnit),
      weight: nullishToUndefined(product.weight),
      weightUnit: nullishToUndefined(product.weightUnit),
      seoDescription: nullishToUndefined(product.seoDescription),
      seoTitle: nullishToUndefined(product.seoTitle),
    }));
  }, [products]);
  
  // Get vendor analytics if the viewing user is the vendor
  const isOwner = user && vendor && vendor.userId === user.id;
  // Analytics data for vendor detail page
  const topProducts: TopProduct[] = [];
  const topBuyers: TopBuyer[] = [];
  const isLoadingAnalytics = false;
  
  if (!vendorSlug) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{translateText("Invalid Vendor")}</h1>
        <Button onClick={() => setLocation("/vendors")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {translateText("Back to Vendors")}
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
            {translateText("Back")}
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
        <h1 className="text-2xl font-bold mb-4">{translateText("Vendor not found")}</h1>
        <p className="text-muted-foreground mb-6">
          {translateText("The vendor you're looking for doesn't exist or has been removed.")}
        </p>
        <Button onClick={() => setLocation("/vendors")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {translateText("Back to Vendors")}
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <SEOHead 
        title={normalizeTitle(vendor?.storeName ? `${vendor.storeName} - Vendor Profile` : undefined, 'Vendor Profile - Dedw3n')}
        description={normalizeDescription(vendor?.description, `Browse products and services from ${vendor?.storeName || 'this vendor'} on Dedw3n marketplace.`)}
        structuredData={seoVendor && seoProducts ? buildVendorSchema(seoVendor as any, seoProducts as any) : undefined}
      />
      
      {/* Vendor Banner Section */}
      {vendor.banner && (
        <div className="w-full h-48 md:h-64 lg:h-80 overflow-hidden bg-gray-100">
          <img 
            src={vendor.banner} 
            alt={`${vendor.storeName} banner`}
            className="w-full h-full object-cover"
            data-testid="vendor-banner-image"
          />
        </div>
      )}
      
      <div className="container py-8">
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
                  <Link 
                    href={`/members/${vendor.userId}`} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-view-profile"
                    title={translateText("View Profile")}
                  >
                    <User className="h-4 w-4" />
                  </Link>
                  <button 
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="button-contact-vendor"
                    title={translateText("Contact Vendor")}
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {vendor.description || translateText("No description available")}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {vendor.rating?.toFixed(1) || translateText("New")} 
                    {vendor.ratingCount ? ` (${vendor.ratingCount})` : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="w-full">
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
              {translateText("No products available")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {translateText("This vendor hasn't listed any products yet")}
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}