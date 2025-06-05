import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Star,
  Settings
} from "lucide-react";

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
          </div>
          
          {/* Right corner buttons */}
          <div className="flex items-center gap-2">
            {/* My Dating Profile button - only visible if dating account is active */}
            {datingProfile && datingProfile.isActive && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
                onClick={() => setLocation(`/profile/${datingProfile.userId}`)}
              >
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">My Dating Profile</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/dating-profile")}
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Dating Dashboard</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}