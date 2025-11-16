import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  FileText, 
  Users, 
  Heart, 
  Building2, 
  Briefcase,
  GraduationCap,
  Filter,
  X
} from "lucide-react";
import { useMasterTranslation, useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ServiceCategory = "all" | "documents" | "public_services" | "youth_centres" | "business" | "education";

interface GovernmentService {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  icon: any;
  featured: boolean;
  processingTime: string;
  requiredDocuments: string[];
}

const serviceCategories = [
  { id: "all", label: "All Services", icon: Building2 },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "public_services", label: "Public Services", icon: Users },
  { id: "youth_centres", label: "Youth Centres", icon: Heart },
  { id: "business", label: "Business Services", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
];

const governmentServices: GovernmentService[] = [
  {
    id: "passport-application",
    title: "Passport Application",
    description: "Apply for a new passport or renew your existing one",
    category: "documents",
    icon: FileText,
    featured: true,
    processingTime: "14-21 days",
    requiredDocuments: ["Birth Certificate", "ID Photo", "Proof of Address"],
  },
  {
    id: "id-card-renewal",
    title: "ID Card Renewal",
    description: "Renew your national identity card online",
    category: "documents",
    icon: FileText,
    featured: false,
    processingTime: "7-10 days",
    requiredDocuments: ["Current ID", "Recent Photo"],
  },
  {
    id: "birth-certificate",
    title: "Birth Certificate Request",
    description: "Request a certified copy of your birth certificate",
    category: "documents",
    icon: FileText,
    featured: false,
    processingTime: "5-7 days",
    requiredDocuments: ["Parent ID", "Hospital Records"],
  },
  {
    id: "social-security",
    title: "Social Security Registration",
    description: "Register for social security benefits and programs",
    category: "public_services",
    icon: Users,
    featured: true,
    processingTime: "10-14 days",
    requiredDocuments: ["ID Card", "Employment Records", "Bank Details"],
  },
  {
    id: "healthcare-card",
    title: "Healthcare Card",
    description: "Apply for government healthcare benefits card",
    category: "public_services",
    icon: Users,
    featured: false,
    processingTime: "14-21 days",
    requiredDocuments: ["ID Card", "Proof of Address", "Medical Records"],
  },
  {
    id: "youth-sports-program",
    title: "Youth Sports Programs",
    description: "Enroll in government-sponsored youth sports activities",
    category: "youth_centres",
    icon: Heart,
    featured: false,
    processingTime: "Immediate",
    requiredDocuments: ["Parent Consent", "Medical Certificate"],
  },
  {
    id: "youth-mentorship",
    title: "Youth Mentorship Program",
    description: "Connect with mentors for career and personal development",
    category: "youth_centres",
    icon: Heart,
    featured: true,
    processingTime: "7 days",
    requiredDocuments: ["Application Form", "Parental Consent"],
  },
  {
    id: "business-license",
    title: "Business License",
    description: "Apply for a new business operating license",
    category: "business",
    icon: Briefcase,
    featured: true,
    processingTime: "21-30 days",
    requiredDocuments: ["Business Plan", "ID", "Tax Registration"],
  },
  {
    id: "tax-registration",
    title: "Tax Registration",
    description: "Register your business for tax purposes",
    category: "business",
    icon: Briefcase,
    featured: false,
    processingTime: "10-14 days",
    requiredDocuments: ["Business License", "ID", "Proof of Address"],
  },
  {
    id: "student-grant",
    title: "Student Financial Aid",
    description: "Apply for government student grants and scholarships",
    category: "education",
    icon: GraduationCap,
    featured: true,
    processingTime: "30-45 days",
    requiredDocuments: ["Enrollment Letter", "Academic Records", "Financial Statement"],
  },
  {
    id: "school-enrollment",
    title: "Public School Enrollment",
    description: "Enroll your child in public education system",
    category: "education",
    icon: GraduationCap,
    featured: false,
    processingTime: "Immediate",
    requiredDocuments: ["Birth Certificate", "Vaccination Records", "Proof of Address"],
  },
];

export default function GovernmentServicesPage() {
  const { translateText } = useMasterTranslation();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const serviceTexts = [
    "Government Services",
    "Browse and request government services online",
    "Search services...",
    "All Services",
    "Documents",
    "Public Services",
    "Youth Centres",
    "Business Services",
    "Education",
    "Filter",
    "Featured Services Only",
    "Clear Filters",
    "Request Service",
    "Processing Time",
    "Required Documents",
    "services found",
    "No services found matching your criteria",
    "Featured"
  ];

  const { translations: t } = useMasterBatchTranslation(serviceTexts);

  const [
    governmentServicesText,
    browseServicesText,
    searchPlaceholder,
    allServicesText,
    documentsText,
    publicServicesText,
    youthCentresText,
    businessServicesText,
    educationText,
    filterText,
    featuredOnlyText,
    clearFiltersText,
    requestServiceText,
    processingTimeText,
    requiredDocumentsText,
    servicesFoundText,
    noServicesFoundText,
    featuredText
  ] = t || serviceTexts;

  const filteredServices = governmentServices.filter((service) => {
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFeatured = !showFeaturedOnly || service.featured;
    
    return matchesCategory && matchesSearch && matchesFeatured;
  });

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setShowFeaturedOnly(false);
  };

  const hasActiveFilters = selectedCategory !== "all" || searchQuery !== "" || showFeaturedOnly;

  return (
    <>
      <SEOHead
        title="Government Services | Dedw3n"
        description="Browse and request government services online. Access documents, public services, youth programs, business licenses, and education services."
        keywords="government services, online services, documents, passports, business license, education, youth programs"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {governmentServicesText}
            </h1>
            <p className="text-gray-600">{browseServicesText}</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-services"
              />
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="sm:hidden" data-testid="button-filter-mobile">
                  <Filter className="w-4 h-4 mr-2" />
                  {filterText}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>{filterText}</SheetTitle>
                  <SheetDescription>
                    {browseServicesText}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured-mobile"
                      checked={showFeaturedOnly}
                      onCheckedChange={(checked) => setShowFeaturedOnly(checked as boolean)}
                      data-testid="checkbox-featured-mobile"
                    />
                    <label htmlFor="featured-mobile" className="text-sm font-medium">
                      {featuredOnlyText}
                    </label>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      onClick={handleClearFilters}
                      className="w-full"
                      data-testid="button-clear-filters-mobile"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {clearFiltersText}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex gap-6">
            {/* Desktop Sidebar Filter */}
            <aside className="hidden sm:block w-64 flex-shrink-0">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">{filterText}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={showFeaturedOnly}
                        onCheckedChange={(checked) => setShowFeaturedOnly(checked as boolean)}
                        data-testid="checkbox-featured"
                      />
                      <label htmlFor="featured" className="text-sm font-medium">
                        {featuredOnlyText}
                      </label>
                    </div>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        onClick={handleClearFilters}
                        className="w-full"
                        data-testid="button-clear-filters"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {clearFiltersText}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Category Tabs */}
              <div className="mb-6 flex flex-wrap gap-2">
                {serviceCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id as ServiceCategory)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        isActive
                          ? "bg-black text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      data-testid={`button-category-${category.id}`}
                    >
                      <Icon className="w-4 h-4" />
                      {translateText(category.label)}
                    </button>
                  );
                })}
              </div>

              {/* Results Count */}
              <div className="mb-4 text-sm text-gray-600">
                {filteredServices.length} {servicesFoundText}
              </div>

              {/* Service Cards Grid */}
              {filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => {
                    const Icon = service.icon;
                    return (
                      <Card
                        key={service.id}
                        className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                        data-testid={`card-service-${service.id}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                              <Icon className="w-6 h-6" />
                            </div>
                            {service.featured && (
                              <Badge className="bg-black text-white">
                                {featuredText}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {translateText(service.title)}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            {translateText(service.description)}
                          </p>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-medium">{processingTimeText}:</span>
                              <span>{service.processingTime}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">{requiredDocumentsText}:</span>
                              <ul className="list-disc list-inside mt-1">
                                {service.requiredDocuments.slice(0, 2).map((doc, idx) => (
                                  <li key={idx}>{doc}</li>
                                ))}
                                {service.requiredDocuments.length > 2 && (
                                  <li>+{service.requiredDocuments.length - 2} more</li>
                                )}
                              </ul>
                            </div>
                          </div>

                          <Button
                            className="w-full bg-black hover:bg-gray-800 text-white"
                            data-testid={`button-request-${service.id}`}
                          >
                            {requestServiceText}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">{noServicesFoundText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
