import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, GraduationCap, Briefcase, Users, Truck, HandHeart, MapPin } from 'lucide-react';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { ServicesNav } from '@/components/layout/ServicesNav';

import healthImage from '@assets/stock_images/person_holding_red_h_e5c24926.jpg';
import educationImage from '@assets/stock_images/teacher_in_classroom_ab8eb30d.jpg';
import jobsImage from '@assets/stock_images/professional_office__1082d449.jpg';
import freelanceImage from '@assets/stock_images/freelance_worker_lap_414c8b06.jpg';
import courierImage from '@assets/stock_images/delivery_courier_pac_0f3db2e7.jpg';
import charitiesImage from '@assets/stock_images/charity_volunteers_h_b5235fcc.jpg';

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
  health: { 
    icon: Heart, 
    color: 'bg-red-500',
    image: healthImage
  },
  education: { 
    icon: GraduationCap, 
    color: 'bg-blue-500',
    image: educationImage
  },
  utilities: { 
    icon: Briefcase, 
    color: 'bg-purple-500',
    image: jobsImage
  },
  jobs: { 
    icon: Briefcase, 
    color: 'bg-green-500',
    image: jobsImage
  },
  freelance: { 
    icon: Users, 
    color: 'bg-orange-500',
    image: freelanceImage
  },
  courier_freight: { 
    icon: Truck, 
    color: 'bg-indigo-500',
    image: courierImage
  },
  charities_ngos: { 
    icon: HandHeart, 
    color: 'bg-pink-500',
    image: charitiesImage
  },
};

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const texts = useMemo(() => [
    "Health",
    "Education",
    "Utilities",
    "Jobs",
    "Freelance",
    "Courier & Freight",
    "Charities & NGOs",
    "All Services",
    "Arrange your affairs with grace and flair.",
    "Effortlessly Orchestrate the Symphony of Your Affairs",
    "Add a Service",
    "Search",
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

  const servicesByCategory = useMemo(() => {
    return services.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services]);

  const categoryNavItems = [
    { key: 'all', label: t[7] || 'All Services' },
    { key: 'health', label: t[0] || 'Health' },
    { key: 'education', label: t[1] || 'Education' },
    { key: 'utilities', label: t[2] || 'Utilities' },
    { key: 'jobs', label: t[3] || 'Jobs' },
    { key: 'freelance', label: t[4] || 'Freelance' },
    { key: 'courier_freight', label: t[5] || 'Courier & Freight' },
    { key: 'charities_ngos', label: t[6] || 'Charities & NGOs' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ServicesNav 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchTerm={searchQuery}
        setSearchTerm={setSearchQuery}
      />

      {/* Service Categories Grid - Only show when 'all' or no category selected */}
      {(selectedCategory === 'all' || !selectedCategory) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                    {/* Category Image */}
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img 
                        src={config.image}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                      
                      {/* Category Name */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <h3 className="text-white font-semibold text-lg">
                          {displayName}
                        </h3>
                      </div>
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
            >
              ← Back to all categories
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">
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
      {!isLoading && filteredServices.length === 0 && selectedCategory && selectedCategory !== 'all' && (
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
