import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Store, MapPin, Star, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Vendor {
  id: number;
  storeName: string;
  businessName?: string;
  description: string;
  location?: string;
  rating?: number;
  totalProducts: number;
  totalSales?: number;
  imageUrl?: string;
  badges?: string[];
  createdAt: string;
}

export default function VendorsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Translation texts
  const vendorTexts = [
    "Vendor Pages",
    "Discover amazing stores from verified vendors",
    "Search vendors...",
    "Visit Store",
    "Products",
    "Sales",
    "Rating",
    "Verified Vendor",
    "New Vendor",
    "Top Seller",
    "Featured",
    "Loading vendors...",
    "No vendors found",
    "Try adjusting your search terms",
    "Location"
  ];

  const { translations, isLoading: isTranslating } = useMasterBatchTranslation(vendorTexts);
  const t = (text: string) => translations?.[text] || text;

  // Fetch vendors
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['/api/vendors/list'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vendors/list');
      return response.json();
    }
  });

  // Filter vendors based on search term
  const filteredVendors = vendors.filter((vendor: Vendor) =>
    vendor.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVendorClick = (vendor: Vendor) => {
    // Create SEO-friendly URL with vendor store name
    const vendorSlug = vendor.storeName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();
    setLocation(`/vendor/${vendorSlug}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto mb-6" />
            <Skeleton className="h-10 w-80 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t("Vendor Pages")}
          </h1>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {t("Discover amazing stores from verified vendors")}
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("Search vendors...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Vendors Grid */}
        {filteredVendors.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("No vendors found")}
            </h3>
            <p className="text-gray-500">
              {t("Try adjusting your search terms")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor: Vendor) => (
              <Card 
                key={vendor.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleVendorClick(vendor)}
              >
                {/* Vendor Image/Header */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                  {vendor.imageUrl ? (
                    <img 
                      src={vendor.imageUrl} 
                      alt={vendor.storeName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="h-16 w-16 text-white/80" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {vendor.badges?.map((badge) => (
                      <Badge key={badge} variant="secondary" className="text-xs bg-white/90 text-gray-800">
                        {t(badge)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                      {vendor.storeName}
                    </CardTitle>
                    {vendor.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {vendor.description}
                  </p>
                  {vendor.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {vendor.location}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        <span>{vendor.totalProducts} {t("Products")}</span>
                      </div>
                      {vendor.totalSales && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{vendor.totalSales} {t("Sales")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full group-hover:bg-blue-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVendorClick(vendor);
                    }}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    {t("Visit Store")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}