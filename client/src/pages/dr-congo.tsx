import { usePageTitle } from '@/hooks/usePageTitle';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Book, Scale, IdCard } from 'lucide-react';

import certificateImage from "@assets/stock_images/passport_identificat_84d90351.jpg";
import passportImage from "@assets/stock_images/professional_busines_7f598002.jpg";
import judgmentImage from "@assets/stock_images/diverse_young_people_e35c35b1.jpg";
import licenseImage from "@assets/stock_images/democratic_republic__5eea171f.jpg";

export default function DrCongo() {
  usePageTitle({ title: 'Dr Congo Services' });
  
  const drCongoTexts = [
    "Certificates",
    "Passport",
    "Supplementary Judgment",
    "Drivers License",
    "Request Service",
    "Official document certification services",
    "Passport application and renewal services",
    "Legal judgment supplementary services",
    "Drivers license application and renewal services"
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
    driversLicenseDescText
  ] = t || drCongoTexts;

  const services = [
    {
      id: 'certificate',
      name: certificatesText,
      description: certificatesDescText,
      icon: FileText,
      image: certificateImage
    },
    {
      id: 'passport',
      name: passportText,
      description: passportDescText,
      icon: Book,
      image: passportImage
    },
    {
      id: 'supplementary_judgment',
      name: supplementaryJudgmentText,
      description: supplementaryDescText,
      icon: Scale,
      image: judgmentImage
    },
    {
      id: 'drivers_license',
      name: driversLicenseText,
      description: driversLicenseDescText,
      icon: IdCard,
      image: licenseImage
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200"
                data-testid={`card-service-${service.id}`}
              >
                <CardContent className="p-0">
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      data-testid={`img-service-${service.id}`}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-black" />
                      <h3 className="text-base font-semibold text-black">{service.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {service.description}
                    </p>
                    <Button
                      className="w-full bg-black hover:bg-gray-800 text-white text-sm"
                      data-testid={`button-request-${service.id}`}
                    >
                      {requestServiceText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
