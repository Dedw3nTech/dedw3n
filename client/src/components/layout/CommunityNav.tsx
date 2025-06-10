import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { 
  Search, 
  Users, 
  Calendar, 
  MessageSquare, 
  Heart,
  UserPlus,
  Settings,
  Compass
} from "lucide-react";

interface CommunityNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function CommunityNav({ searchTerm = "", setSearchTerm }: CommunityNavProps) {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string>("general");

  // Master Translation System - CommunityNav (2 texts)
  const communityNavTexts = useMemo(() => [
    "Search community...", "Explore"
  ], []);

  const { translations } = useMasterBatchTranslation(communityNavTexts);
  const [searchPlaceholderText, exploreText] = translations || communityNavTexts;

  const handleSectionChange = (section: string, path: string) => {
    setActiveSection(section);
    setLocation(path);
  };

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12 items-center">
            {/* Search bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholderText}
                value={searchTerm}
                onChange={(e) => setSearchTerm?.(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            
            {/* Explore text with icon */}
            <div 
              className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => setLocation("/explore")}
            >
              <Compass className="h-4 w-4" />
              <span className="text-sm font-medium">{exploreText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}