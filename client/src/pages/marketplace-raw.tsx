import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useView } from "@/hooks/use-view";
import { useMarketType } from "@/hooks/use-market-type";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Search, Package, Clock, MapPin, Building2, Plus, Filter, SortAsc, Warehouse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";

interface RawMaterial {
  id: number;
  title: string;
  description: string;
  category: string;
  pricePerUnit: number;
  unit: string; // kg, tons, liters, etc.
  currency: string;
  location: string;
  quality: 'premium' | 'standard' | 'bulk';
  availability: 'in_stock' | 'limited' | 'out_of_stock' | 'pre_order';
  minimumOrder: number;
  createdAt: string;
  totalOrders?: number;
  vendor?: {
    id: number;
    name: string;
    avatar?: string;
    badgeLevel?: string;
  };
}

export default function MarketplaceRaw() {
  const { setView } = useView();
  const { user } = useAuth();
  const { setMarketType } = useMarketType();
  const { selectedCurrency, formatPrice } = useCurrency();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Set page title and market type
  usePageTitle({ title: 'Raw Marketplace - Raw Materials & Commodities' });

  useEffect(() => {
    setView("marketplace");
    setMarketType("raw");
  }, [setView, setMarketType]);

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedQuality, setSelectedQuality] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showCreateListing, setShowCreateListing] = useState(false);

  // Create listing form state
  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    category: "",
    pricePerUnit: "",
    unit: "",
    location: "",
    quality: "standard" as 'premium' | 'standard' | 'bulk',
    minimumOrder: ""
  });

  // Translation texts
  const rawTexts = [
    "Raw Marketplace",
    "Raw Materials & Commodities",
    "Find bulk raw materials, commodities, and unfinished goods for your business",
    "List Raw Material",
    "Search raw materials...",
    "All Categories",
    "All Quality Levels",
    "Newest First",
    "Price (High to Low)",
    "Price (Low to High)",
    "Most Popular",
    "Metals & Alloys",
    "Textiles & Fabrics",
    "Chemicals & Plastics",
    "Wood & Paper",
    "Food & Agriculture",
    "Electronics Components",
    "Construction Materials",
    "Energy & Fuels",
    "Premium Quality",
    "Standard Quality",
    "Bulk Grade",
    "In Stock",
    "Limited Supply", 
    "Out of Stock",
    "Pre-Order",
    "List Your Material",
    "What raw material are you offering?",
    "Material Name",
    "Describe your raw material...",
    "Material Description",
    "Select Category",
    "Price per Unit",
    "Unit (kg, tons, liters, etc.)",
    "Your Location",
    "Material Quality",
    "Minimum Order Quantity",
    "Cancel",
    "List Material",
    "Contact Vendor",
    "View Details",
    "Price per unit:",
    "Location:",
    "Quality:",
    "Listed:",
    "Orders:",
    "Availability:",
    "Minimum order:",
    "No raw materials found",
    "Try adjusting your search or filters",
    "Be the first to list raw materials!",
    "Loading materials...",
    "Material listed successfully!",
    "Your raw material is now available for bulk buyers.",
    "Failed to list material",
    "Please try again or contact support if the problem persists.",
    "In Stock",
    "Limited",
    "Out of Stock",
    "Pre-Order"
  ];

  const { translations: translatedTexts } = useMasterBatchTranslation(rawTexts);

  // Mock data for raw materials - in real app this would come from API
  const mockRawMaterials: RawMaterial[] = [
    {
      id: 1,
      title: "Premium Steel Rods",
      description: "High-grade steel rods suitable for construction and manufacturing. Meets industry standards with certification.",
      category: "Metals & Alloys",
      pricePerUnit: 850,
      unit: "ton",
      currency: "GBP",
      location: "Birmingham, UK",
      quality: "premium",
      availability: "in_stock",
      minimumOrder: 5,
      createdAt: "2025-01-10T10:00:00Z",
      totalOrders: 24,
      vendor: {
        id: 1,
        name: "MetalCorp Industries",
        badgeLevel: "top_vendor"
      }
    },
    {
      id: 2,
      title: "Organic Cotton Fabric",
      description: "100% organic cotton fabric rolls. Perfect for textile manufacturing and clothing production.",
      category: "Textiles & Fabrics",
      pricePerUnit: 12.50,
      unit: "meter",
      currency: "GBP",
      location: "Manchester, UK",
      quality: "premium",
      availability: "limited",
      minimumOrder: 100,
      createdAt: "2025-01-09T14:30:00Z",
      totalOrders: 18,
      vendor: {
        id: 2,
        name: "EcoTextiles Ltd",
        badgeLevel: "level_2_vendor"
      }
    },
    {
      id: 3,
      title: "Industrial PVC Pellets",
      description: "High-quality PVC pellets for plastic manufacturing. Consistent quality and fast delivery available.",
      category: "Chemicals & Plastics",
      pricePerUnit: 1.20,
      unit: "kg",
      currency: "GBP",
      location: "London, UK",
      quality: "standard",
      availability: "in_stock",
      minimumOrder: 500,
      createdAt: "2025-01-08T09:15:00Z",
      totalOrders: 42,
      vendor: {
        id: 3,
        name: "ChemSupply Direct",
        badgeLevel: "elite_vendor"
      }
    }
  ];

  // Filter materials based on search and filters
  const filteredMaterials = mockRawMaterials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || material.category === selectedCategory;
    const matchesQuality = selectedQuality === "all" || material.quality === selectedQuality;
    
    return matchesSearch && matchesCategory && matchesQuality;
  });

  // Sort materials
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "price_high":
        return b.pricePerUnit - a.pricePerUnit;
      case "price_low":
        return a.pricePerUnit - b.pricePerUnit;
      case "popular":
        return (b.totalOrders || 0) - (a.totalOrders || 0);
      default:
        return 0;
    }
  });

  const handleCreateListing = () => {
    // In a real app, this would submit to an API
    toast({
      title: translatedTexts[49] || rawTexts[49],
      description: translatedTexts[50] || rawTexts[50],
    });
    setShowCreateListing(false);
    setNewListing({
      title: "",
      description: "",
      category: "",
      pricePerUnit: "",
      unit: "",
      location: "",
      quality: "standard",
      minimumOrder: ""
    });
  };

  const getQualityBadgeColor = (quality: string) => {
    switch (quality) {
      case "premium": return "bg-purple-100 text-purple-800";
      case "standard": return "bg-blue-100 text-blue-800";
      case "bulk": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAvailabilityBadgeColor = (availability: string) => {
    switch (availability) {
      case "in_stock": return "bg-green-100 text-green-800";
      case "limited": return "bg-yellow-100 text-yellow-800";
      case "out_of_stock": return "bg-red-100 text-red-800";
      case "pre_order": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {translatedTexts[0] || rawTexts[0]}
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {translatedTexts[2] || rawTexts[2]}
          </p>
          
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={translatedTexts[4] || rawTexts[4]}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={translatedTexts[5] || rawTexts[5]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translatedTexts[5] || rawTexts[5]}</SelectItem>
                <SelectItem value="Metals & Alloys">{translatedTexts[11] || rawTexts[11]}</SelectItem>
                <SelectItem value="Textiles & Fabrics">{translatedTexts[12] || rawTexts[12]}</SelectItem>
                <SelectItem value="Chemicals & Plastics">{translatedTexts[13] || rawTexts[13]}</SelectItem>
                <SelectItem value="Wood & Paper">{translatedTexts[14] || rawTexts[14]}</SelectItem>
                <SelectItem value="Food & Agriculture">{translatedTexts[15] || rawTexts[15]}</SelectItem>
                <SelectItem value="Electronics Components">{translatedTexts[16] || rawTexts[16]}</SelectItem>
                <SelectItem value="Construction Materials">{translatedTexts[17] || rawTexts[17]}</SelectItem>
                <SelectItem value="Energy & Fuels">{translatedTexts[18] || rawTexts[18]}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedQuality} onValueChange={setSelectedQuality}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={translatedTexts[6] || rawTexts[6]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translatedTexts[6] || rawTexts[6]}</SelectItem>
                <SelectItem value="premium">{translatedTexts[19] || rawTexts[19]}</SelectItem>
                <SelectItem value="standard">{translatedTexts[20] || rawTexts[20]}</SelectItem>
                <SelectItem value="bulk">{translatedTexts[21] || rawTexts[21]}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{translatedTexts[7] || rawTexts[7]}</SelectItem>
                <SelectItem value="price_high">{translatedTexts[8] || rawTexts[8]}</SelectItem>
                <SelectItem value="price_low">{translatedTexts[9] || rawTexts[9]}</SelectItem>
                <SelectItem value="popular">{translatedTexts[10] || rawTexts[10]}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Listing Button */}
          <Dialog open={showCreateListing} onOpenChange={setShowCreateListing}>
            <DialogTrigger asChild>
              <Button className="mb-6">
                <Plus className="mr-2 h-4 w-4" />
                {translatedTexts[3] || rawTexts[3]}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{translatedTexts[26] || rawTexts[26]}</DialogTitle>
                <DialogDescription>
                  {translatedTexts[27] || rawTexts[27]}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <Input
                  placeholder={translatedTexts[28] || rawTexts[28]}
                  value={newListing.title}
                  onChange={(e) => setNewListing({...newListing, title: e.target.value})}
                />
                
                <Textarea
                  placeholder={translatedTexts[29] || rawTexts[29]}
                  value={newListing.description}
                  onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                />
                
                <Select value={newListing.category} onValueChange={(value) => setNewListing({...newListing, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={translatedTexts[31] || rawTexts[31]} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Metals & Alloys">{translatedTexts[11] || rawTexts[11]}</SelectItem>
                    <SelectItem value="Textiles & Fabrics">{translatedTexts[12] || rawTexts[12]}</SelectItem>
                    <SelectItem value="Chemicals & Plastics">{translatedTexts[13] || rawTexts[13]}</SelectItem>
                    <SelectItem value="Wood & Paper">{translatedTexts[14] || rawTexts[14]}</SelectItem>
                    <SelectItem value="Food & Agriculture">{translatedTexts[15] || rawTexts[15]}</SelectItem>
                    <SelectItem value="Electronics Components">{translatedTexts[16] || rawTexts[16]}</SelectItem>
                    <SelectItem value="Construction Materials">{translatedTexts[17] || rawTexts[17]}</SelectItem>
                    <SelectItem value="Energy & Fuels">{translatedTexts[18] || rawTexts[18]}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    placeholder={translatedTexts[32] || rawTexts[32]}
                    value={newListing.pricePerUnit}
                    onChange={(e) => setNewListing({...newListing, pricePerUnit: e.target.value})}
                    type="number"
                    className="flex-1"
                  />
                  <Input
                    placeholder={translatedTexts[33] || rawTexts[33]}
                    value={newListing.unit}
                    onChange={(e) => setNewListing({...newListing, unit: e.target.value})}
                    className="flex-1"
                  />
                </div>

                <Input
                  placeholder={translatedTexts[34] || rawTexts[34]}
                  value={newListing.location}
                  onChange={(e) => setNewListing({...newListing, location: e.target.value})}
                />

                <Select value={newListing.quality} onValueChange={(value) => setNewListing({...newListing, quality: value as 'premium' | 'standard' | 'bulk'})}>
                  <SelectTrigger>
                    <SelectValue placeholder={translatedTexts[35] || rawTexts[35]} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">{translatedTexts[19] || rawTexts[19]}</SelectItem>
                    <SelectItem value="standard">{translatedTexts[20] || rawTexts[20]}</SelectItem>
                    <SelectItem value="bulk">{translatedTexts[21] || rawTexts[21]}</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder={translatedTexts[36] || rawTexts[36]}
                  value={newListing.minimumOrder}
                  onChange={(e) => setNewListing({...newListing, minimumOrder: e.target.value})}
                  type="number"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateListing(false)}>
                  {translatedTexts[37] || rawTexts[37]}
                </Button>
                <Button onClick={handleCreateListing}>
                  {translatedTexts[38] || rawTexts[38]}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMaterials.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Warehouse className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {translatedTexts[47] || rawTexts[47]}
              </h3>
              <p className="text-gray-500 mb-4">
                {filteredMaterials.length === 0 && searchTerm ? 
                  translatedTexts[48] || rawTexts[48] : 
                  translatedTexts[49] || rawTexts[49]
                }
              </p>
            </div>
          ) : (
            sortedMaterials.map((material) => (
              <Card key={material.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {material.title}
                    </CardTitle>
                    <Badge className={`ml-2 ${getQualityBadgeColor(material.quality)}`}>
                      {material.quality === 'premium' && (translatedTexts[19] || rawTexts[19])}
                      {material.quality === 'standard' && (translatedTexts[20] || rawTexts[20])}
                      {material.quality === 'bulk' && (translatedTexts[21] || rawTexts[21])}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {material.description}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Package className="mr-1 h-4 w-4" />
                    <span>{material.category}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>{material.location}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{translatedTexts[39] || rawTexts[39]}</span>
                      <span className="font-medium">
                        {formatPrice(material.pricePerUnit, material.currency)} / {material.unit}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{translatedTexts[46] || rawTexts[46]}</span>
                      <span>{material.minimumOrder} {material.unit}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{translatedTexts[45] || rawTexts[45]}</span>
                      <Badge className={getAvailabilityBadgeColor(material.availability)}>
                        {material.availability === 'in_stock' && (translatedTexts[54] || rawTexts[54])}
                        {material.availability === 'limited' && (translatedTexts[55] || rawTexts[55])}
                        {material.availability === 'out_of_stock' && (translatedTexts[56] || rawTexts[56])}
                        {material.availability === 'pre_order' && (translatedTexts[57] || rawTexts[57])}
                      </Badge>
                    </div>
                  </div>

                  {material.vendor && (
                    <div className="flex items-center text-sm text-gray-500 pt-2 border-t">
                      <Building2 className="mr-1 h-4 w-4" />
                      <span>{material.vendor.name}</span>
                      {material.vendor.badgeLevel && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {material.vendor.badgeLevel.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    {translatedTexts[40] || rawTexts[40]}
                  </Button>
                  <Button size="sm" className="flex-1">
                    {translatedTexts[39] || rawTexts[39]}
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}