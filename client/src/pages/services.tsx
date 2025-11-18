import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, MapPin } from 'lucide-react';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { ServicesNav } from '@/components/layout/ServicesNav';

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
    
    return filtered;
  }, [services, searchQuery, selectedCategory]);

  const categoryNavItems = [
    { key: 'jobs', label: t[0] || 'Jobs' },
    { key: 'freelance', label: t[1] || 'Freelance' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ServicesNav 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchTerm={searchQuery}
        setSearchTerm={setSearchQuery}
      />

      {/* Service Listings - Jobs Category */}
      {selectedCategory && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {categoryNavItems.find(c => c.key === selectedCategory)?.label || selectedCategory}
            </h2>
            <p className="text-gray-600">
              {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} found
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const Icon = categoryConfig[service.category as keyof typeof categoryConfig]?.icon || Briefcase;
              const color = categoryConfig[service.category as keyof typeof categoryConfig]?.color || 'bg-gray-500';
              
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading services...</p>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredServices.length === 0 && selectedCategory && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
