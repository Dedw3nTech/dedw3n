import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, Heart, Globe } from "lucide-react";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { SEOHead } from "@/components/seo/SEOHead";
import { useLocation } from "wouter";

import documentsImage from "@assets/stock_images/passport_identificat_84d90351.jpg";
import publicServicesImage from "@assets/stock_images/professional_busines_7f598002.jpg";
import youthCentresImage from "@assets/stock_images/diverse_young_people_e35c35b1.jpg";
import drCongoImage from "@assets/stock_images/democratic_republic__5eea171f.jpg";

const services = [
  {
    id: "documents",
    title: "Documents",
    image: documentsImage,
    icon: FileText,
    description: "Apply for passports, ID cards, and official documents",
  },
  {
    id: "public_services",
    title: "Public Services",
    image: publicServicesImage,
    icon: Users,
    description: "Access government services and support programs",
  },
  {
    id: "youth_centres",
    title: "Youth Centres",
    image: youthCentresImage,
    icon: Heart,
    description: "Explore youth programs and community centers",
  },
  {
    id: "dr_congo",
    title: "Dr Congo",
    image: drCongoImage,
    icon: Globe,
    description: "Access Dr Congo government services: Certificates, Passports, and Supplementary Judgments",
  },
];

export default function GovernmentPage() {
  const { translateText } = useMasterTranslation();
  const [, setLocation] = useLocation();

  return (
    <>
      <SEOHead
        title="Government Services | Dedw3n"
        description="Access government services including documents, public services, youth centres, and Dr Congo services."
        keywords="government services, documents, passports, public services, youth centres, dr congo, government affairs"
      />

      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Service Cards Grid */}
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
                        alt={service.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-service-${service.id}`}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-black" />
                        <h3 className="text-base font-semibold text-black">{translateText(service.title)}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {translateText(service.description)}
                      </p>
                      <Button
                        onClick={() => {
                          if (service.id === "dr_congo") {
                            setLocation("/dr-congo");
                          }
                        }}
                        className="w-full bg-black hover:bg-gray-800 text-white text-sm"
                        data-testid={`button-request-${service.id}`}
                      >
                        {service.id === "dr_congo" 
                          ? translateText("Access Services")
                          : translateText("Request Service")
                        }
                      </Button>
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
