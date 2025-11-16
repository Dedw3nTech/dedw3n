import { useQuery } from "@tanstack/react-query";
import { Vendor } from "@shared/schema";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useEffect, useState } from "react";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Store, 
  User, 
  ShoppingBag, 
  BadgePercent, 
  Star, 
  ArrowRight,
  Search,
  ArrowUpRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { createStoreSlug } from "@shared/utils";

const VendorCard = ({ vendor }: { vendor: Vendor }) => {
  const [, setLocation] = useLocation();
  const { translateText } = useMasterTranslation();
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={vendor.logo || undefined} alt={vendor.storeName} />
          <AvatarFallback>
            <Store className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{vendor.storeName}</CardTitle>
          <div className="flex items-center mt-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="text-sm font-medium">
              {vendor.rating?.toFixed(1) || translateText("New")} 
              {vendor.ratingCount ? ` (${vendor.ratingCount})` : ""}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {vendor.description || translateText("No description available")}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation(`/vendor/${createStoreSlug(vendor.storeName)}`)}
        >
          {translateText("View Profile")}
        </Button>
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => setLocation(`/products?vendorId=${vendor.id}`)}
        >
          {translateText("Browse Products")} <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function VendorsPage() {
  usePageTitle({ title: "Vendors" });
  const { translateText } = useMasterTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const { 
    data: vendors, 
    isLoading 
  } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Filter vendors based on search query and active tab
  const filteredVendors = vendors?.filter((vendor) => {
    const matchesSearch = vendor.storeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (vendor.description && vendor.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "popular") return matchesSearch && (vendor.ratingCount || 0) > 0 && (vendor.rating || 0) >= 4;
    if (activeTab === "new") {
      // For this example, consider vendors with 0 ratings as new
      return matchesSearch && (vendor.ratingCount === 0 || vendor.ratingCount === null);
    }
    
    return matchesSearch;
  });
  
  // Redirect to my-vendor page if user is a vendor
  useEffect(() => {
    if (user?.isVendor) {
      // Get the vendor ID from the backend
      const fetchVendorId = async () => {
        try {
          const response = await fetch("/api/vendors/me");
          if (response.ok) {
            const vendor = await response.json();
            setLocation(`/vendor-analytics?vendorId=${vendor.id}`);
          }
        } catch (error) {
          console.error("Error fetching vendor data:", error);
        }
      };
      
      fetchVendorId();
    }
  }, [user, setLocation]);
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{translateText("Vendors")}</h1>
          <p className="text-muted-foreground mt-1">
            {translateText("Discover and connect with trusted sellers")}
          </p>
        </div>
        
        {user && !user.isVendor && (
          <Button onClick={() => setLocation("/become-vendor")}>
            {translateText("Become a Vendor")}
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={translateText("Search vendors...")}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs 
          defaultValue="all" 
          className="w-full sm:w-auto"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">{translateText("All")}</TabsTrigger>
            <TabsTrigger value="popular">{translateText("Popular")}</TabsTrigger>
            <TabsTrigger value="new">{translateText("New")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Separator className="my-6" />
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredVendors && filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-medium">
            {searchQuery 
              ? translateText("No vendors found") 
              : translateText("No vendors yet")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {searchQuery 
              ? translateText("Try adjusting your search")
              : translateText("Check back later for new vendors")}
          </p>
        </div>
      )}
    </div>
  );
}