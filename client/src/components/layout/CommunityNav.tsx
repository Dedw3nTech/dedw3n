import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { SearchDropdown } from "@/components/community/SearchDropdown";
import { useAuthToken } from "@/contexts/AuthTokenContext";
import { 
  Search, 
  Calendar, 
  Heart
} from "lucide-react";

interface CommunityNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function CommunityNav({ searchTerm: externalSearchTerm, setSearchTerm: externalSetSearchTerm }: CommunityNavProps) {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string>("general");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const { tokenInfo } = useAuthToken();
  
  // Use external state if provided, otherwise use internal state
  const searchTerm = externalSearchTerm ?? internalSearchTerm;
  const setSearchTerm = externalSetSearchTerm ?? setInternalSearchTerm;
  
  // Check if user is admin
  const isAdmin = tokenInfo.role === 'admin';

  // Master Translation System - CommunityNav (3 texts)
  const communityNavTexts = useMemo(() => [
    "Search community...", "Dating Panel", "Events"
  ], []);

  const { translations } = useMasterBatchTranslation(communityNavTexts);
  const [searchPlaceholderText, datingPanelText, eventsText] = translations || communityNavTexts;

  const handleSectionChange = (section: string, path: string) => {
    setActiveSection(section);
    setLocation(path);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length >= 2);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      setLocation(`/community-search?q=${encodeURIComponent(searchTerm)}`);
      setShowDropdown(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="relative flex flex-col md:flex-row justify-center items-center gap-4">
          {/* Navigation buttons - centered in middle (Admin only) */}
          {isAdmin && (
            <div className="flex justify-center gap-8 md:gap-12 items-center">
              {/* Dating Panel text with icon */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setLocation("/dating-dashboard")}
                data-testid="button-dating-panel"
              >
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">{datingPanelText}</span>
              </div>

              {/* Events text with icon */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setLocation("/events")}
                data-testid="button-events"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">{eventsText}</span>
              </div>
            </div>
          )}

          {/* Search bar - absolute positioned to right on desktop */}
          <div className="absolute right-0 w-64 hidden md:block" ref={searchContainerRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Input
              placeholder={searchPlaceholderText}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
              className="pl-10 h-10 border-0 border-b-2 border-gray-300 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-600"
              data-testid="input-community-search"
            />
            {showDropdown && (
              <div className="absolute left-0 right-0 w-[400px]">
                <SearchDropdown 
                  searchTerm={searchTerm} 
                  onClose={() => setShowDropdown(false)} 
                />
              </div>
            )}
          </div>

          {/* Mobile search bar - below on mobile */}
          <div className="md:hidden w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                placeholder={searchPlaceholderText}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                className="pl-10 h-10 border-0 border-b-2 border-gray-300 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-600"
                data-testid="input-community-search-mobile"
              />
              {showDropdown && (
                <div className="absolute left-0 right-0 w-full z-50">
                  <SearchDropdown 
                    searchTerm={searchTerm} 
                    onClose={() => setShowDropdown(false)} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}