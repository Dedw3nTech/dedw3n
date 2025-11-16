import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMasterTranslation } from "@/hooks/use-master-translation";

export function GovernmentNav() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { translateText } = useMasterTranslation();
  const navRef = useRef<HTMLDivElement>(null);

  const navTexts = [
    "Government Services",
    "Search",
    "Menu",
    "Overview",
    "Services Catalog",
    "Documents",
    "Public Services",
    "Youth Centres",
    "Business Services",
    "Education",
    "Add Service"
  ];

  const [
    governmentServicesText,
    searchText,
    menuText,
    overviewText,
    servicesCatalogText,
    documentsText,
    publicServicesText,
    youthCentresText,
    businessServicesText,
    educationText,
    addServiceText
  ] = navTexts.map(text => translateText(text));

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setLocation(`/government/services?search=${encodeURIComponent(query)}`);
      setIsSearching(false);
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const isActive = (path: string) => {
    const locationWithoutQuery = location.split('?')[0];
    return locationWithoutQuery === path || locationWithoutQuery.startsWith(`${path}/`);
  };

  const handleAddService = () => {
    setLocation("/government/services");
  };

  return (
    <div ref={navRef} className="bg-white border-b border-gray-200 py-6 relative">
      <div className="container mx-auto px-4">
        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Logo/Title and Add Button - LEFT side */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <h1 className="text-xl font-bold text-black">{governmentServicesText}</h1>
            <Button
              onClick={handleAddService}
              className="h-10 px-4 bg-transparent text-black hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium"
              style={{ fontSize: '12px' }}
              data-testid="button-add-service-desktop"
            >
              <Plus className="h-4 w-4" />
              {addServiceText}
            </Button>
          </div>

          {/* Navigation links - CENTER */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6">
            <div 
              className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center"
              onClick={() => setLocation("/government")}
              data-testid="nav-overview"
            >
              <div className="relative">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isActive('/government') && !isActive('/government/services')
                    ? 'text-black' 
                    : 'text-gray-600 group-hover:text-black'
                }`}>
                  {overviewText}
                </span>
                <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                  isActive('/government') && !isActive('/government/services')
                    ? 'bg-black w-full' 
                    : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
                }`} />
              </div>
            </div>
            
            <div 
              className="cursor-pointer group transition-all duration-300 h-[40px] flex items-center"
              onClick={() => setLocation("/government/services")}
              data-testid="nav-services"
            >
              <div className="relative">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isActive('/government/services')
                    ? 'text-black' 
                    : 'text-gray-600 group-hover:text-black'
                }`}>
                  {servicesCatalogText}
                </span>
                <div className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                  isActive('/government/services')
                    ? 'bg-black w-full' 
                    : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
                }`} />
              </div>
            </div>
          </div>

          {/* Search bar and menu - RIGHT side */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="relative min-w-[200px] max-w-md">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  data-testid="search-input-desktop"
                  placeholder={searchText}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(searchTerm);
                    }
                  }}
                  className="pl-10 h-10 pr-4 border-0 border-b-2 border-black rounded-none bg-transparent focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none shadow-none"
                  disabled={isSearching}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                  </div>
                )}
              </form>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
              data-testid="button-hamburger-desktop"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-black">{governmentServicesText}</h1>
              <Button
                onClick={handleAddService}
                className="h-8 px-3 bg-transparent text-black hover:bg-gray-100 transition-colors flex items-center gap-1.5 font-medium"
                style={{ fontSize: '10px' }}
                data-testid="button-add-service-mobile"
              >
                <Plus className="h-3.5 w-3.5" />
                {addServiceText}
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="relative flex-1 max-w-xs">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    data-testid="search-input-mobile"
                    placeholder={searchText}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(searchTerm);
                      }
                    }}
                    className="pl-10 h-8 text-sm pr-4 border-0 border-b-2 border-black rounded-none bg-transparent focus:border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none shadow-none"
                    disabled={isSearching}
                  />
                  {isSearching && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                    </div>
                  )}
                </form>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
                onClick={() => setIsSidebarOpen(true)}
                data-testid="button-hamburger-mobile"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar for navigation */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle>{governmentServicesText}</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-2">
            <Button
              variant={isActive('/government') && !isActive('/government/services') ? 'secondary' : 'ghost'}
              className="w-full justify-start h-12"
              onClick={() => {
                setLocation("/government");
                setIsSidebarOpen(false);
              }}
              data-testid="sidebar-overview"
            >
              <span className="text-xs">{overviewText}</span>
            </Button>

            <Button
              variant={isActive('/government/services') ? 'secondary' : 'ghost'}
              className="w-full justify-start h-12"
              onClick={() => {
                setLocation("/government/services");
                setIsSidebarOpen(false);
              }}
              data-testid="sidebar-services"
            >
              <span className="text-xs">{servicesCatalogText}</span>
            </Button>

            <div className="pt-4 mt-4 border-t">
              <p className="text-xs font-semibold text-gray-500 mb-3 px-3">{servicesCatalogText}</p>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-10 text-xs text-gray-600"
                onClick={() => {
                  setLocation("/government/services?category=documents");
                  setIsSidebarOpen(false);
                }}
                data-testid="sidebar-documents"
              >
                {documentsText}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-10 text-xs text-gray-600"
                onClick={() => {
                  setLocation("/government/services?category=public_services");
                  setIsSidebarOpen(false);
                }}
                data-testid="sidebar-public-services"
              >
                {publicServicesText}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-10 text-xs text-gray-600"
                onClick={() => {
                  setLocation("/government/services?category=youth_centres");
                  setIsSidebarOpen(false);
                }}
                data-testid="sidebar-youth-centres"
              >
                {youthCentresText}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-10 text-xs text-gray-600"
                onClick={() => {
                  setLocation("/government/services?category=business");
                  setIsSidebarOpen(false);
                }}
                data-testid="sidebar-business"
              >
                {businessServicesText}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-10 text-xs text-gray-600"
                onClick={() => {
                  setLocation("/government/services?category=education");
                  setIsSidebarOpen(false);
                }}
                data-testid="sidebar-education"
              >
                {educationText}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
