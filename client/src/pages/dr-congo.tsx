import { usePageTitle } from '@/hooks/usePageTitle';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Book, Scale, IdCard, Share2, Tag, CreditCard, Heart } from 'lucide-react';
import { MarketplaceNav } from '@/components/layout/MarketplaceNav';
import { useCurrency } from '@/contexts/CurrencyContext';

import certificateImage from "@assets/stock_images/passport_identificat_84d90351.jpg";
import passportImage from "@assets/stock_images/professional_busines_7f598002.jpg";
import judgmentImage from "@assets/stock_images/diverse_young_people_e35c35b1.jpg";
import licenseImage from "@assets/stock_images/democratic_republic__5eea171f.jpg";

export default function DrCongo() {
  usePageTitle({ title: 'Dr Congo Services' });
  const { formatPriceFromGBP } = useCurrency();
  
  const drCongoTexts = [
    "Certificates",
    "Passport",
    "Supplementary Judgment",
    "Drivers License",
    "Request Service",
    "Official document certification services",
    "Passport application and renewal services",
    "Legal judgment supplementary services",
    "Drivers license application and renewal services",
    "Government Services"
  ];

  const { translations: t } = useMasterBatchTranslation(drCongoTexts);
  
  const [
    certificatesText,
    passportText,
    supplementaryJudgmentText,
    driversLicenseText,
    requestServiceText,
    certificatesDescText,
    passportDescText,
    supplementaryDescText,
    driversLicenseDescText,
    governmentServicesText
  ] = t || drCongoTexts;

  const services = [
    {
      id: 'certificate',
      name: certificatesText,
      description: certificatesDescText,
      icon: FileText,
      image: certificateImage,
      price: 50.00
    },
    {
      id: 'passport',
      name: passportText,
      description: passportDescText,
      icon: Book,
      image: passportImage,
      price: 150.00
    },
    {
      id: 'supplementary_judgment',
      name: supplementaryJudgmentText,
      description: supplementaryDescText,
      icon: Scale,
      image: judgmentImage,
      price: 75.00
    },
    {
      id: 'drivers_license',
      name: driversLicenseText,
      description: driversLicenseDescText,
      icon: IdCard,
      image: licenseImage,
      price: 100.00
    }
  ];

  return (
    <>
      <MarketplaceNav />
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card
                  key={service.id}
                  className="overflow-hidden flex flex-col border-0 shadow-none hover:shadow-md transition-shadow duration-300"
                  data-testid={`card-service-${service.id}`}
                >
                  <div className="aspect-[2/3] bg-gray-100 relative overflow-hidden group">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      data-testid={`img-service-${service.id}`}
                    />
                  </div>

                  <CardContent className="p-4 flex-grow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-medium text-sm leading-tight flex-1 min-h-[2.5rem] flex items-center">
                        <span className="line-clamp-2">{service.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-black hover:bg-gray-100"
                          title="Share"
                          data-testid={`button-share-${service.id}`}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-black hover:bg-gray-100"
                          title="Make an offer"
                          data-testid={`button-offer-${service.id}`}
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Add to Cart"
                          data-testid={`button-cart-${service.id}`}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Add to Favorites"
                          data-testid={`button-favorite-${service.id}`}
                        >
                          <Heart className="h-4 w-4 fill-black text-black" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-black text-sm">
                        {formatPriceFromGBP(service.price)}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      {governmentServicesText}
                    </div>

                    <div className="text-[12px] text-black mt-1">
                      {requestServiceText}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
