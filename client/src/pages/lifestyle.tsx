import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { LifestyleNav } from "@/components/layout/LifestyleNav";
import {
  Car,
  Plane,
  Bus,
  Clock,
  Utensils,
  Package,
  Home,
  Dumbbell,
  MapPin,
  Heart,
  ShoppingCart,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Share2,
  Star
} from "lucide-react";
import type { LifestyleService } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Category icons and colors mapping
const categoryConfig: Record<string, { icon: any; color: string; image: string }> = {
  ride_sharing: {
    icon: Car,
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop"
  },
  flights: {
    icon: Plane,
    color: "bg-gradient-to-br from-sky-500 to-sky-600",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop"
  },
  public_transportation: {
    icon: Bus,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop"
  },
  free_time: {
    icon: Clock,
    color: "bg-gradient-to-br from-amber-500 to-amber-600",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop"
  },
  restaurant: {
    icon: Utensils,
    color: "bg-gradient-to-br from-red-500 to-red-600",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"
  },
  food_delivery: {
    icon: Package,
    color: "bg-gradient-to-br from-orange-500 to-orange-600",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&h=300&fit=crop"
  },
  hotels: {
    icon: Home,
    color: "bg-gradient-to-br from-teal-500 to-teal-600",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"
  },
  house_sharing: {
    icon: MapPin,
    color: "bg-gradient-to-br from-green-500 to-green-600",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop"
  },
  activities: {
    icon: Dumbbell,
    color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=300&fit=crop"
  },
};

export default function LifestylePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [priceFilterActive, setPriceFilterActive] = useState(false);
  const [sortBy, setSortBy] = useState<string>("trending");
  const [columnsPerRow, setColumnsPerRow] = useState<number>(4);
  const [showFeatured, setShowFeatured] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Translatable texts
  const texts = useMemo(() => [
    "Lifestyle",
    "Restaurant",
    "Ride Sharing",
    "Flights",
    "Public Transportation",
    "Free time",
    "Hotels",
    "House sharing",
    "Activities",
    "Food Delivery",
    "SPEND YOUR FREE TIME IN EASE AND PEACE",
    "Embrace tranquility and grace as you journey with Dedw3n.",
    "All Services",
    "Ride Sharing & Taxi",
    "service",
    "services",
    "found",
    "Back to all categories",
    "No services found matching your search.",
    "No services available in this category yet.",
    "Loading services...",
    "Featured"
  ], []);

  const { translations: t } = useMasterBatchTranslation(texts);

  // Fetch lifestyle services
  const { data: services = [], isLoading } = useQuery<LifestyleService[]>({
    queryKey: ['/api/lifestyle-services'],
    enabled: true,
  });

  // Filter and sort services
  const filteredServices = useMemo(() => {
    // Clone array to avoid mutations
    let filtered = [...services];
    
    // Filter by category if not 'all'
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.title?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.location?.toLowerCase().includes(query)
      );
    }

    // Filter by price range (only if user has interacted with slider)
    if (priceFilterActive && priceRange) {
      filtered = filtered.filter(service => {
        if (!service.price) return true; // Keep "Price on request" items
        const price = parseFloat(String(service.price));
        if (isNaN(price)) return true; // Keep non-numeric prices
        // Open-ended upper bound when slider is at max
        const upperBound = priceRange[1] >= 5000 ? Infinity : priceRange[1];
        return price >= priceRange[0] && price <= upperBound;
      });
    }

    // Filter by featured (handle both camelCase and snake_case)
    if (showFeatured) {
      filtered = filtered.filter(service => {
        const featured = (service as any).is_featured || service.isFeatured;
        return featured === true;
      });
    }

    // Sort services (on cloned array) - normalize featured flag
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => {
          const priceA = parseFloat(String(a.price || '0'));
          const priceB = parseFloat(String(b.price || '0'));
          return priceA - priceB;
        });
        break;
      case 'price_high':
        filtered.sort((a, b) => {
          const priceA = parseFloat(String(a.price || '0'));
          const priceB = parseFloat(String(b.price || '0'));
          return priceB - priceA;
        });
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => {
          const ratingA = parseFloat(String(a.rating || '0'));
          const ratingB = parseFloat(String(b.rating || '0'));
          return ratingB - ratingA;
        });
        break;
      default: // trending - normalize featured flag for both cases
        filtered.sort((a, b) => {
          const featuredA = (a as any).is_featured || a.isFeatured || false;
          const featuredB = (b as any).is_featured || b.isFeatured || false;
          return (featuredB ? 1 : 0) - (featuredA ? 1 : 0);
        });
    }
    
    return filtered;
  }, [services, searchQuery, selectedCategory, priceRange, showFeatured, sortBy]);

  // Category navigation items
  const categoryNavItems = [
    { key: "restaurant", label: t[1] || "Restaurant" },
    { key: "ride_sharing", label: t[2] || "Ride Sharing" },
    { key: "flights", label: t[3] || "Flights" },
    { key: "public_transportation", label: t[4] || "Public Transportation" },
    { key: "free_time", label: t[5] || "Free time" },
    { key: "hotels", label: t[6] || "Hotels" },
    { key: "house_sharing", label: t[7] || "House sharing" },
    { key: "activities", label: t[8] || "Activities" },
    { key: "food_delivery", label: t[9] || "Food Delivery" },
  ];

  // Group services by category for the grid view
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, LifestyleService[]> = {};
    services.forEach(service => {
      if (!grouped[service.category]) {
        grouped[service.category] = [];
      }
      grouped[service.category].push(service);
    });
    return grouped;
  }, [services]);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      return apiRequest("POST", "/api/cart", {
        productId: serviceId,
        quantity: 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart/count"] });
      toast({
        title: "Added to cart",
        description: "Service added to your cart successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add to cart",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Lifestyle Navigation */}
      <LifestyleNav 
        searchTerm={searchQuery}
        setSearchTerm={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Service Categories Grid - Only show when 'all' or no category selected */}
      {(selectedCategory === 'all' || !selectedCategory) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(categoryConfig).map(([category, config]) => {
              const Icon = config.icon;
              const categoryServices = servicesByCategory[category] || [];
              const displayName = categoryNavItems.find(c => c.key === category)?.label || category.replace('_', ' ');

              return (
                <div
                  key={category}
                  data-testid={`card-category-${category}`}
                  className="group cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Category Image */}
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img 
                        src={config.image}
                        alt={displayName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      
                      {/* Icon */}
                      <div className={`absolute top-4 right-4 p-3 ${config.color} rounded-full text-white shadow-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Service Count Badge */}
                      {categoryServices.length > 0 && (
                        <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 rounded-full text-sm font-medium">
                          {categoryServices.length} {categoryServices.length === 1 ? (t[14] || 'service') : (t[15] || 'services')}
                        </div>
                      )}
                    </div>

                    {/* Category Name */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="text-white font-semibold text-lg">
                        {displayName}
                      </h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Service Listings - Show when a specific category is selected */}
      {selectedCategory && selectedCategory !== 'all' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <button
                onClick={() => setSelectedCategory('all')}
                className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
                data-testid="button-back-to-all"
              >
                ← {t[17] || "Back to all categories"}
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                {categoryNavItems.find(c => c.key === selectedCategory)?.label || selectedCategory}
              </h2>
              <p className="text-gray-600">
                {filteredServices.length} {filteredServices.length === 1 ? (t[14] || 'service') : (t[15] || 'services')} {t[16] || 'found'}
              </p>
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              <Select value={String(columnsPerRow)} onValueChange={(val) => setColumnsPerRow(Number(val))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 per row</SelectItem>
                  <SelectItem value="4">4 per row</SelectItem>
                  <SelectItem value="5">5 per row</SelectItem>
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Services</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Price Range</label>
                      <Slider
                        value={priceRange}
                        onValueChange={(val) => {
                          setPriceRange(val as [number, number]);
                          setPriceFilterActive(true);
                        }}
                        max={5000}
                        step={50}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}+</span>
                      </div>
                      {priceFilterActive && (
                        <button
                          onClick={() => {
                            setPriceRange([0, 5000]);
                            setPriceFilterActive(false);
                          }}
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          Clear price filter
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="featured"
                        checked={showFeatured}
                        onCheckedChange={(checked) => setShowFeatured(checked as boolean)}
                      />
                      <label htmlFor="featured" className="text-sm">Featured only</label>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${
            columnsPerRow === 3 ? 'lg:grid-cols-3' :
            columnsPerRow === 4 ? 'lg:grid-cols-4' :
            columnsPerRow === 5 ? 'lg:grid-cols-5' :
            'lg:grid-cols-4'
          }`}>
            {filteredServices.map((service) => {
              const Icon = categoryConfig[service.category]?.icon || MapPin;
              const color = categoryConfig[service.category]?.color || 'bg-gray-500';
              // Normalize featured flag for UI rendering
              const isFeatured = (service as any).is_featured === true || service.isFeatured === true;
              const isVerified = (service as any).is_verified === true || service.isVerified === true;
              
              return (
                <Card key={service.id} className="overflow-hidden hover:shadow-md transition" data-testid={`card-service-${service.id}`}>
                  <div className="relative">
                    {service.images && service.images.length > 0 ? (
                      <img 
                        src={service.images[0]} 
                        alt={service.title} 
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <Icon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {isFeatured && (
                      <div className="absolute top-0 left-0 bg-yellow-500 text-white text-xs font-medium px-2 py-1">
                        {t[21] || "Featured"}
                      </div>
                    )}
                    
                    <button 
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-gray-700 hover:text-red-500 disabled:opacity-50"
                      data-testid={`button-favorite-${service.id}`}
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <div className={`p-1 ${color} rounded text-white mr-1`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="mr-2">{service.contactName || 'Service Provider'}</span>
                      {isVerified && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 mr-2">Verified</Badge>
                      )}
                      {service.rating && (
                        <div className="flex items-center ml-auto">
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3 h-3 ${parseFloat(service.rating || '0') >= star ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                          <span className="ml-1">({service.reviewCount || 0})</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{service.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{service.description}</p>
                    
                    {service.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{service.location}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      {service.price ? (
                        <span className="font-bold text-gray-900">
                          {service.currency || 'USD'} {service.price}
                          {service.priceType && <span className="text-xs text-gray-500">/{service.priceType.replace('per_', '')}</span>}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Price on request</span>
                      )}
                      <button 
                        className="p-2 bg-black text-white rounded-full hover:bg-gray-800"
                        onClick={() => addToCartMutation.mutate(service.id)}
                        disabled={addToCartMutation.isPending}
                        data-testid={`button-cart-${service.id}`}
                      >
                        {addToCartMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
                      <button 
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 transition"
                        data-testid={`button-save-${service.id}`}
                      >
                        <Heart className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                      <button 
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition"
                        data-testid={`button-share-${service.id}`}
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">{t[20] || "Loading services..."}</p>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredServices.length === 0 && selectedCategory && selectedCategory !== 'all' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-600 text-lg">
              {searchQuery ? (t[18] || 'No services found matching your search.') : (t[19] || 'No services available in this category yet.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
