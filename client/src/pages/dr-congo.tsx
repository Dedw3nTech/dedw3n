import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Book, Scale } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

type ServiceType = 'certificate' | 'passport' | 'supplementary_judgment' | null;

export default function DrCongo() {
  usePageTitle({ title: 'Dr Congo Services' });
  
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>(null);
  const { formatPrice, formatPriceFromGBP } = useCurrency();
  
  const drCongoTexts = [
    "Dr Congo Services",
    "Select a service type to view available services",
    "Certificates",
    "Passport",
    "Supplementary Judgment",
    "View Services",
    "Back to Service Types",
    "No services available",
    "No services found for this service type.",
    "Loading...",
    "Price",
    "View Details",
    "Official document certification services",
    "Passport application and renewal services",
    "Legal judgment supplementary services"
  ];

  const { translations: t } = useMasterBatchTranslation(drCongoTexts);
  
  const [
    titleText,
    subtitleText,
    certificatesText,
    passportText,
    supplementaryJudgmentText,
    viewServicesText,
    backText,
    noServicesText,
    noServicesDescText,
    loadingText,
    priceText,
    viewDetailsText,
    certificatesDescText,
    passportDescText,
    supplementaryDescText
  ] = t || drCongoTexts;

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['/api/dr-congo-services', selectedServiceType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedServiceType) {
        params.append('serviceType', selectedServiceType);
      }
      const response = await fetch(`/api/dr-congo-services?${params}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
    enabled: !!selectedServiceType,
  });

  const serviceTypes = [
    {
      id: 'certificate' as ServiceType,
      name: certificatesText,
      description: certificatesDescText,
      icon: FileText,
      color: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      id: 'passport' as ServiceType,
      name: passportText,
      description: passportDescText,
      icon: Book,
      color: 'bg-green-50 dark:bg-green-950'
    },
    {
      id: 'supplementary_judgment' as ServiceType,
      name: supplementaryJudgmentText,
      description: supplementaryDescText,
      icon: Scale,
      color: 'bg-purple-50 dark:bg-purple-950'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
              {titleText}
            </h1>
            {!selectedServiceType && (
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {subtitleText}
              </p>
            )}
          </div>

          {!selectedServiceType ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {serviceTypes.map((serviceType) => {
                const Icon = serviceType.icon;
                return (
                  <Card
                    key={serviceType.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${serviceType.color} border-2 border-transparent hover:border-black dark:hover:border-white`}
                    onClick={() => setSelectedServiceType(serviceType.id)}
                    data-testid={`card-service-type-${serviceType.id}`}
                  >
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-black flex items-center justify-center">
                          <Icon className="w-8 h-8 text-black dark:text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-black dark:text-white">
                          {serviceType.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {serviceType.description}
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          data-testid={`button-view-${serviceType.id}`}
                        >
                          {viewServicesText}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedServiceType(null)}
                  data-testid="button-back-to-types"
                >
                  {backText}
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
                  <span className="ml-2 text-black dark:text-white">{loadingText}</span>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                    {noServicesText}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {noServicesDescText}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service: any) => (
                    <Card
                      key={service.id}
                      className="hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800"
                      data-testid={`card-service-${service.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-bold text-black dark:text-white line-clamp-2">
                              {service.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                              {service.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {priceText}
                              </p>
                              <p className="text-xl font-bold text-black dark:text-white">
                                {formatPrice(parseFloat(service.price))}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="w-full"
                            data-testid={`button-view-details-${service.id}`}
                          >
                            {viewDetailsText}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
