import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FileText, Users, Heart } from "lucide-react";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { SEOHead } from "@/components/seo/SEOHead";

import documentsImage from "@assets/stock_images/passport_identificat_84d90351.jpg";
import publicServicesImage from "@assets/stock_images/professional_busines_7f598002.jpg";
import youthCentresImage from "@assets/stock_images/diverse_young_people_e35c35b1.jpg";
import heroImage from "@assets/stock_images/government_official__39d60ff1.jpg";

type ServiceCategory = "documents" | "public_services" | "youth_centres";

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
];

export default function GovernmentPage() {
  const { translateText } = useMasterTranslation();
  const [activeTab, setActiveTab] = useState<ServiceCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = services.filter((service) => {
    const matchesTab = activeTab === "all" || service.id === activeTab;
    const matchesSearch =
      searchQuery === "" ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <>
      <SEOHead
        title="Government Services | Dedw3n"
        description="Arrange your government affairs with grace and flair. Access documents, public services, and youth centres."
        keywords="government services, documents, passports, public services, youth centres, government affairs"
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header with Add Service Button and Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <Button
              className="bg-black hover:bg-gray-800 text-white"
              data-testid="button-add-service"
            >
              <Plus className="w-4 h-4 mr-2" />
              {translateText("Add A Service")}
            </Button>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={translateText("Search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("documents")}
              className={`pb-3 px-2 font-medium transition-colors ${
                activeTab === "documents"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-black"
              }`}
              data-testid="tab-documents"
            >
              {translateText("Documents")}
            </button>
            <button
              onClick={() => setActiveTab("public_services")}
              className={`pb-3 px-2 font-medium transition-colors ${
                activeTab === "public_services"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-black"
              }`}
              data-testid="tab-public-services"
            >
              {translateText("Public Services")}
            </button>
            <button
              onClick={() => setActiveTab("youth_centres")}
              className={`pb-3 px-2 font-medium transition-colors ${
                activeTab === "youth_centres"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-black"
              }`}
              data-testid="tab-youth-centres"
            >
              {translateText("Youth Centres")}
            </button>
          </div>

          {/* Hero Section */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {translateText("Arrange your Government affairs with grace and flair.")}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {translateText("Effortlessly Orchestrate the Symphony of Your Governmental Affairs")}
            </p>
            <div className="rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
              <img
                src={heroImage}
                alt="Government Services"
                className="w-full h-auto object-cover"
                data-testid="img-hero"
              />
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              return (
                <Card
                  key={service.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                  data-testid={`card-service-${service.id}`}
                >
                  <CardContent className="p-0">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        data-testid={`img-service-${service.id}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 text-white">
                          <Icon className="w-5 h-5" />
                          <h3 className="text-xl font-bold">{translateText(service.title)}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600">
                        {translateText(service.description)}
                      </p>
                      <Button
                        className="w-full mt-4 bg-black hover:bg-gray-800 text-white"
                        data-testid={`button-request-${service.id}`}
                      >
                        {translateText("Request Service")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {translateText("No services found matching your search.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
