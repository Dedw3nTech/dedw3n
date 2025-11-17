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
import { formatPrice } from "@/lib/utils";

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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
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

  // Filter services by search query and selected category
  const filteredServices = useMemo(() => {
    let filtered = services;
    
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
    
    return filtered;
  }, [services, searchQuery, selectedCategory]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Lifestyle Navigation */}
      <LifestyleNav 
        searchTerm={searchQuery}
        setSearchTerm={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t[10] || "SPEND YOUR FREE TIME IN EASE AND PEACE"}
            </h1>
            <p className="text-lg text-gray-600">
              {t[11] || "Embrace tranquility and grace as you journey with Dedw3n."}
            </p>
          </div>

          {/* Hero Image */}
          <div className="rounded-2xl overflow-hidden shadow-xl max-w-3xl mx-auto">
            <img 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop"
              alt="Travel"
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        </div>
      </div>

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
          <div className="mb-6">
            <button
              onClick={() => setSelectedCategory('all')}
              className="flex items-center gap-2 text-blue-600 hover:underline"
              data-testid="button-back-to-all"
            >
              ← {t[17] || "Back to all categories"}
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">
              {categoryNavItems.find(c => c.key === selectedCategory)?.label || selectedCategory}
            </h2>
            <p className="text-gray-600">
              {filteredServices.length} {filteredServices.length === 1 ? (t[14] || 'service') : (t[15] || 'services')} {t[16] || 'found'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const Icon = categoryConfig[service.category]?.icon || MapPin;
              const color = categoryConfig[service.category]?.color || 'bg-gray-500';
              
              return (
                <div
                  key={service.id}
                  data-testid={`card-service-${service.id}`}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                >
                  {/* Service Image */}
                  {service.images && service.images.length > 0 && (
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <img
                        src={service.images[0]}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">
                        {service.title}
                      </h3>
                      <div className={`p-2 ${color} rounded-lg text-white ml-2`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    {service.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    {service.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{service.location}</span>
                      </div>
                    )}

                    {service.price && (
                      <div className="text-lg font-bold text-blue-600">
                        {service.currency || 'USD'} {service.price}
                        {service.priceType && <span className="text-sm font-normal text-gray-500">/{service.priceType.replace('per_', '')}</span>}
                      </div>
                    )}

                    {service.isFeatured && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          {t[21] || "Featured"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
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
