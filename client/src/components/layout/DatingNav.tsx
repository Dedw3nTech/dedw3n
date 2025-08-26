import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Star,
  Settings,
  Compass
} from "lucide-react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

interface DatingProfile {
  id?: number;
  userId: number;
  displayName: string;
  age: number;
  bio: string;
  location: string;
  interests: string[];
  lookingFor: string;
  relationshipType: string;
  profileImages: string[];
  isActive: boolean;
  isPremium: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DatingNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function DatingNav({ searchTerm = "", setSearchTerm }: DatingNavProps) {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string>("discover");

  // Dating Navigation Translation Batch (7 texts)
  const datingNavTexts = useMemo(() => [
    "Browse Profiles", "My Dating Profile", "Dating Dashboard", "Discover", "Dating Room", "VIP Room", "VVIP Room"
  ], []);

  // Use Master Translation System
  const { translations: t } = useMasterBatchTranslation(datingNavTexts);
  const [browseProfilesText, myDatingProfileText, datingDashboardText, discoverText, datingRoomText, vipRoomText, vvipRoomText] = t || datingNavTexts;

  // Fetch current user's dating profile to check if active
  const { data: datingProfile } = useQuery<DatingProfile>({
    queryKey: ["/api/dating-profile"],
    retry: false,
    // Suppress errors since not all users have dating profiles
    meta: { suppressErrors: true }
  });

  const handleSectionChange = (section: string, path: string) => {
    setActiveSection(section);
    setLocation(path);
  };

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
            {/* Dating Room Navigation Links */}
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => handleSectionChange("dating-room", "/dating?tier=normal")}
            >
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">{datingRoomText}</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => handleSectionChange("vip-room", "/dating?tier=vip")}
            >
              <Star className="h-4 w-4" />
              <span className="text-sm font-medium">{vipRoomText}</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => handleSectionChange("vvip-room", "/dating?tier=vvip")}
            >
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{vvipRoomText}</span>
            </Button>
          </div>
          
          {/* Right corner buttons */}
          <div className="flex items-center gap-2">
            {/* Browse Dating Profiles button - only visible if dating account is active */}
            {datingProfile && datingProfile.isActive && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
                onClick={() => setLocation("/dating")}
              >
                <Compass className="h-4 w-4" />
                <span className="text-sm font-medium">{browseProfilesText}</span>
              </Button>
            )}
            
            {/* My Dating Profile button - only visible if dating account is active */}
            {datingProfile && datingProfile.isActive && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
                onClick={() => setLocation(`/profile/${datingProfile.userId}`)}
              >
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{myDatingProfileText}</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/dating-profile")}
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">{datingDashboardText}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}