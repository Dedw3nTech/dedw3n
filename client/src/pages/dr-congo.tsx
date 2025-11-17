import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { FileText, Book, Scale, IdCard, Share2, Tag, CreditCard, Heart, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { MarketplaceNav } from '@/components/layout/MarketplaceNav';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
    "Government Services",
    "Filter",
    "Service Type",
    "Price Range",
    "Sort by",
    "Trending",
    "Price: Low to High",
    "Price: High to Low",
    "Alphabetical",
    "Reset Filters",
    "Show",
    "services found",
    "service found",
    "Legal Services",
    "Identity Documents"
  ];

  const { translations: t } = useMasterBatchTranslation(drCongoTexts);
  
  const certificatesText = t?.[0] || drCongoTexts[0];
  const passportText = t?.[1] || drCongoTexts[1];
  const supplementaryJudgmentText = t?.[2] || drCongoTexts[2];
  const driversLicenseText = t?.[3] || drCongoTexts[3];
  const requestServiceText = t?.[4] || drCongoTexts[4];
  const certificatesDescText = t?.[5] || drCongoTexts[5];
  const passportDescText = t?.[6] || drCongoTexts[6];
  const supplementaryDescText = t?.[7] || drCongoTexts[7];
  const driversLicenseDescText = t?.[8] || drCongoTexts[8];
  const governmentServicesText = t?.[9] || drCongoTexts[9];
  const filterText = t?.[10] || drCongoTexts[10];
  const serviceTypeText = t?.[11] || drCongoTexts[11];
  const priceRangeText = t?.[12] || drCongoTexts[12];
  const sortByText = t?.[13] || drCongoTexts[13];
  const trendingText = t?.[14] || drCongoTexts[14];
  const priceLowHighText = t?.[15] || drCongoTexts[15];
  const priceHighLowText = t?.[16] || drCongoTexts[16];
  const alphabeticalText = t?.[17] || drCongoTexts[17];
  const resetFiltersText = t?.[18] || drCongoTexts[18];
  const showText = t?.[19] || drCongoTexts[19];
  const servicesFoundText = t?.[20] || drCongoTexts[20];
  const serviceFoundText = t?.[21] || drCongoTexts[21];
  const legalServicesText = t?.[22] || drCongoTexts[22];
  const identityDocumentsText = t?.[23] || drCongoTexts[23];

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('trending');
  const [servicesPerPage, setServicesPerPage] = useState<number>(30);
  const [columnsPerRow, setColumnsPerRow] = useState<number>(4);
  const [serviceTypeOpen, setServiceTypeOpen] = useState(true);
  const [priceRangeOpen, setPriceRangeOpen] = useState(false);
  const [sortByOpen, setSortByOpen] = useState(false);

  // Fetch products from the database filtered by government-dr-congo marketplace
  const { data: productsData, isLoading } = useQuery<any[]>({
    queryKey: ['/api/products', { marketplace: 'government-dr-congo' }],
  });

  // Map fetched products to the expected service format
  const services = (productsData || []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description || '',
    icon: FileText,
    image: product.images?.[0]?.url || product.imageUrl || '',
    price: product.price,
    type: product.category?.includes('certificate') || product.category?.includes('document') ? 'identity' : 'legal'
  }));

  const toggleServiceType = (type: string) => {
    setSelectedServiceTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setPriceRange([0, 200]);
    setSelectedServiceTypes([]);
    setSortBy('trending');
  };

  const filteredAndSortedServices = services
    .filter((service) => {
      if (service.price < priceRange[0] || service.price > priceRange[1]) {
        return false;
      }
      
      if (selectedServiceTypes.length > 0 && !selectedServiceTypes.includes(service.type)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'trending':
          return 0;
        case 'price-low-high':
          return a.price - b.price;
        case 'price-high-low':
          return b.price - a.price;
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const displayedServices = filteredAndSortedServices.slice(0, servicesPerPage);

  const FilterContent = () => (
    <div className="space-y-6 text-[14px]">
      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => setServiceTypeOpen(!serviceTypeOpen)}
        >
          <h3 className="font-medium text-[14px]">{serviceTypeText}</h3>
          <ChevronDown className={`h-4 w-4 transition-transform ${serviceTypeOpen ? 'rotate-180' : ''}`} />
        </div>
        {serviceTypeOpen && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-identity"
                checked={selectedServiceTypes.includes('identity')}
                onCheckedChange={() => toggleServiceType('identity')}
              />
              <Label htmlFor="type-identity" className="text-[12px] font-normal">{identityDocumentsText}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-legal"
                checked={selectedServiceTypes.includes('legal')}
                onCheckedChange={() => toggleServiceType('legal')}
              />
              <Label htmlFor="type-legal" className="text-[12px] font-normal">{legalServicesText}</Label>
            </div>
          </div>
        )}
      </div>

      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => setPriceRangeOpen(!priceRangeOpen)}
        >
          <h3 className="font-medium text-[14px]">{priceRangeText}</h3>
          <ChevronDown className={`h-4 w-4 transition-transform ${priceRangeOpen ? 'rotate-180' : ''}`} />
        </div>
        {priceRangeOpen && (
          <div className="space-y-4">
            <Slider
              min={0}
              max={200}
              step={10}
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{formatPriceFromGBP(priceRange[0])}</span>
              <span>{formatPriceFromGBP(priceRange[1])}</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => setSortByOpen(!sortByOpen)}
        >
          <h3 className="font-medium text-[14px]">{sortByText}</h3>
          <ChevronDown className={`h-4 w-4 transition-transform ${sortByOpen ? 'rotate-180' : ''}`} />
        </div>
        {sortByOpen && (
          <RadioGroup value={sortBy} onValueChange={setSortBy} className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="trending" id="sort-trending" />
              <Label htmlFor="sort-trending" className="text-[12px] font-normal cursor-pointer">
                {trendingText}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="price-low-high" id="sort-price-low" />
              <Label htmlFor="sort-price-low" className="text-[12px] font-normal cursor-pointer">
                {priceLowHighText}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="price-high-low" id="sort-price-high" />
              <Label htmlFor="sort-price-high" className="text-[12px] font-normal cursor-pointer">
                {priceHighLowText}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="alphabetical" id="sort-alphabetical" />
              <Label htmlFor="sort-alphabetical" className="text-[12px] font-normal cursor-pointer">
                {alphabeticalText}
              </Label>
            </div>
          </RadioGroup>
        )}
      </div>

      <Button
        variant="outline"
        onClick={resetFilters}
        className="w-full"
      >
        {resetFiltersText}
      </Button>
    </div>
  );

  return (
    <>
      <MarketplaceNav />
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {filteredAndSortedServices.length} {filteredAndSortedServices.length === 1 ? serviceFoundText : servicesFoundText}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedServiceTypes.map(type => (
                  <Badge key={type} variant="outline" className="flex items-center gap-1">
                    {type === 'identity' ? identityDocumentsText : legalServicesText}
                    <button
                      onClick={() => toggleServiceType(type)}
                      className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span>{showText}</span>
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

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 border-0 hover:bg-transparent">
                    <SlidersHorizontal className="h-4 w-4" />
                    {filterText}
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{filterText}</SheetTitle>
                  </SheetHeader>
                  <div className="py-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading services...</div>
            </div>
          ) : displayedServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services available</h3>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              columnsPerRow === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' :
              columnsPerRow === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' :
              columnsPerRow === 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
            }`}>
              {displayedServices.map((service) => {
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
          )}
        </div>
      </div>
    </>
  );
}
