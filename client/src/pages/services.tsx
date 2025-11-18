import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, MapPin, Filter } from 'lucide-react';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { ServicesNav } from '@/components/layout/ServicesNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';

interface Service {
  id: number;
  userId: number;
  category: string;
  title: string;
  description: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  price: string | null;
  currency: string | null;
  priceType: string | null;
  images: string[] | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  operatingHours: string | null;
  skills: string[] | null;
  certifications: string[] | null;
  rating: string | null;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

const categoryConfig = {
  jobs: { 
    icon: Briefcase, 
    color: 'bg-green-500'
  },
  freelance: { 
    icon: Briefcase, 
    color: 'bg-orange-500'
  }
};

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('jobs');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [priceFilterActive, setPriceFilterActive] = useState(false);
  const [columnsPerRow, setColumnsPerRow] = useState<number>(4);
  const [servicesPerPage, setServicesPerPage] = useState<number>(30);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showVerified, setShowVerified] = useState(false);

  const texts = useMemo(() => [
    "Jobs",
    "Freelance"
  ], []);

  const { translations: t } = useMasterBatchTranslation(texts);

  const queryUrl = selectedCategory && selectedCategory !== 'all' 
    ? `/api/services?category=${selectedCategory}`
    : '/api/services';
    
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: [queryUrl],
    enabled: true,
  });

  const filteredServices = useMemo(() => {
    let filtered = services;
    
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.title?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.location?.toLowerCase().includes(query)
      );
    }

    // Price filter
    if (priceFilterActive && priceRange) {
      filtered = filtered.filter(service => {
        if (!service.price) return false;
        const price = parseFloat(service.price);
        const upperBound = priceRange[1] >= 5000 ? Infinity : priceRange[1];
        return price >= priceRange[0] && price <= upperBound;
      });
    }

    // Featured filter
    if (showFeatured) {
      filtered = filtered.filter(service => service.isFeatured === true);
    }

    // Verified filter
    if (showVerified) {
      filtered = filtered.filter(service => service.isVerified === true);
    }
    
    return filtered;
  }, [services, searchQuery, selectedCategory, priceRange, priceFilterActive, showFeatured, showVerified]);

  // Limit services based on servicesPerPage setting
  const displayedServices = filteredServices.slice(0, servicesPerPage);

  const categoryNavItems = [
    { key: 'jobs', label: t[0] || 'Jobs' },
    { key: 'freelance', label: t[1] || 'Freelance' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <ServicesNav 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchTerm={searchQuery}
        setSearchTerm={setSearchQuery}
      />

      {/* Service Listings */}
      {selectedCategory && (
        <div className="container mx-auto px-4 py-8">
          {/* Service count and controls */}
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} found
              </div>
              
              <div className="flex flex-wrap gap-2">
                {showFeatured && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Featured
                    <button
                      onClick={() => setShowFeatured(false)}
                      className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                
                {showVerified && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Verified
                    <button
                      onClick={() => setShowVerified(false)}
                      className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Services per page selector */}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span>Show</span>
                <button
                  onClick={() => setServicesPerPage(30)}
                  className={`px-2 py-1 hover:text-black transition-colors ${servicesPerPage === 30 ? 'text-black font-medium' : ''}`}
                >
                  30
                </button>
                <span>|</span>
                <button
                  onClick={() => setServicesPerPage(60)}
                  className={`px-2 py-1 hover:text-black transition-colors ${servicesPerPage === 60 ? 'text-black font-medium' : ''}`}
                >
                  60
                </button>
                <span>|</span>
                <button
                  onClick={() => setServicesPerPage(120)}
                  className={`px-2 py-1 hover:text-black transition-colors ${servicesPerPage === 120 ? 'text-black font-medium' : ''}`}
                >
                  120
                </button>
              </div>

              {/* Grid layout selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setColumnsPerRow(3)}
                  className={`flex gap-1 p-2 hover:opacity-80 transition-opacity ${columnsPerRow === 3 ? 'opacity-100' : 'opacity-50'}`}
                  title="3 columns"
                >
                  <div className="w-1 h-4 bg-black"></div>
                  <div className="w-1 h-4 bg-black"></div>
                  <div className="w-1 h-4 bg-black"></div>
                </button>
                <button
                  onClick={() => setColumnsPerRow(4)}
                  className={`flex gap-1 p-2 hover:opacity-80 transition-opacity ${columnsPerRow === 4 ? 'opacity-100' : 'opacity-50'}`}
                  title="4 columns"
                >
                  <div className="w-1 h-4 bg-black"></div>
                  <div className="w-1 h-4 bg-black"></div>
                  <div className="w-1 h-4 bg-black"></div>
                  <div className="w-1 h-4 bg-black"></div>
                </button>
                <button
                  onClick={() => setColumnsPerRow(5)}
                  className={`flex gap-1 p-2 hover:opacity-80 transition-opacity ${columnsPerRow === 5 ? 'opacity-100' : 'opacity-50'}`}
                  title="5 columns"
                >
                  <div className="w-1 h-4 bg-black"></div>
                  <div className="w-1 h-4 bg-black"></div>
                  <div className="w-1 h-4 bg-black"></div>
                  <div className="w-1 h-4 bg-black"></div>
                  <div className="w-1 h-4 bg-black"></div>
                </button>
              </div>

              {/* Filter button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 border-0 hover:bg-transparent">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filter Services</SheetTitle>
                  </SheetHeader>
                  <div className="py-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    <div className="space-y-6">
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

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="featured"
                            checked={showFeatured}
                            onCheckedChange={(checked) => setShowFeatured(checked as boolean)}
                          />
                          <label htmlFor="featured" className="text-sm">Featured only</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="verified"
                            checked={showVerified}
                            onCheckedChange={(checked) => setShowVerified(checked as boolean)}
                          />
                          <label htmlFor="verified" className="text-sm">Verified only</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Service Grid */}
          <div className={`grid gap-6 ${
            columnsPerRow === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' :
            columnsPerRow === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' :
            columnsPerRow === 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
          }`}>
            {displayedServices.map((service) => {
              const Icon = categoryConfig[service.category as keyof typeof categoryConfig]?.icon || Briefcase;
              const color = categoryConfig[service.category as keyof typeof categoryConfig]?.color || 'bg-gray-500';
              
              return (
                <div
                  key={service.id}
                  data-testid={`card-service-${service.id}`}
                  className="bg-white rounded-lg border-0 shadow-none hover:shadow-md transition-shadow overflow-hidden"
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
                          Featured
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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading services...</p>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredServices.length === 0 && selectedCategory && (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-lg">
              {searchQuery ? 'No services found matching your search.' : 'No services available in this category yet.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
