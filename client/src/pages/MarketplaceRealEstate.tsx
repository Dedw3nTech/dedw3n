import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Home, MapPin, BedDouble, Bath, Square, DollarSign, Filter, Search } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMarketType } from "@/hooks/use-market-type";

interface RealEstateProperty {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: 'house' | 'apartment' | 'condo' | 'commercial' | 'land';
  listingType: 'sale' | 'rent';
  featured: boolean;
  createdAt: string;
  agent: {
    id: number;
    name: string;
    company: string;
    avatar: string;
  };
}

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP'
  }).format(price);
};

const formatSquareFeet = (sqft: number) => {
  return new Intl.NumberFormat('en-GB').format(sqft);
};

export default function MarketplaceRealEstate() {
  const { setMarketType } = useMarketType();
  const [searchTerm, setSearchTerm] = useState("");
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setMarketType("real-estate");
  }, [setMarketType]);

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['/api/real-estate/properties', { page, listingType: listingTypeFilter, propertyType: propertyTypeFilter, search: searchTerm }],
    enabled: true
  });

  const filteredProperties = properties?.filter((property: RealEstateProperty) =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filters Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                data-testid="input-search"
                placeholder="Search properties or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Select value={listingTypeFilter} onValueChange={setListingTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by listing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Listings</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-300 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">Failed to load properties</div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No properties found</div>
            <p className="text-sm text-gray-400">
              {searchTerm || listingTypeFilter !== 'all' || propertyTypeFilter !== 'all'
                ? 'Try adjusting your search or filters' 
                : 'Be the first to list a property!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property: RealEstateProperty) => (
              <Card key={property.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                  <img
                    src={property.imageUrl || '/api/placeholder/600/450'}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Featured Badge */}
                  {property.featured && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-yellow-500 text-white font-semibold">
                        Featured
                      </Badge>
                    </div>
                  )}

                  {/* Listing Type Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className={property.listingType === 'sale' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}>
                      For {property.listingType === 'sale' ? 'Sale' : 'Rent'}
                    </Badge>
                  </div>

                  {/* Price Overlay */}
                  <div className="absolute bottom-3 left-3 bg-white px-3 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center gap-1 font-bold text-lg text-gray-900">
                      <DollarSign className="w-5 h-5" />
                      {formatPrice(property.price, property.currency)}
                      {property.listingType === 'rent' && (
                        <span className="text-sm text-gray-600 font-normal">/month</span>
                      )}
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <h3 className="font-bold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {property.title}
                  </h3>
                  
                  {/* Location */}
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{property.location}</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-3">
                  {/* Property Details */}
                  <div className="flex items-center gap-4 text-sm text-gray-700 mb-3">
                    {property.bedrooms > 0 && (
                      <div className="flex items-center gap-1">
                        <BedDouble className="w-4 h-4" />
                        {property.bedrooms} bed
                      </div>
                    )}
                    {property.bathrooms > 0 && (
                      <div className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        {property.bathrooms} bath
                      </div>
                    )}
                    {property.squareFeet > 0 && (
                      <div className="flex items-center gap-1">
                        <Square className="w-4 h-4" />
                        {formatSquareFeet(property.squareFeet)} sqft
                      </div>
                    )}
                  </div>

                  {/* Property Type */}
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 capitalize">{property.propertyType}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {property.description}
                  </p>
                </CardContent>

                <CardFooter className="pt-0">
                  <Link href={`/property/${property.id}`} className="w-full">
                    <Button 
                      data-testid={`button-view-${property.id}`}
                      className="w-full" 
                      variant="default"
                    >
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredProperties.length > 0 && filteredProperties.length >= 12 && (
          <div className="text-center mt-8">
            <Button 
              data-testid="button-load-more"
              onClick={() => setPage(page + 1)} 
              variant="outline"
              disabled={isLoading}
            >
              Load More Properties
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
