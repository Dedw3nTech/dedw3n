import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Users, 
  Calendar, 
  MessageSquare, 
  Heart,
  UserPlus,
  Settings
} from "lucide-react";

interface CommunityNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function CommunityNav({ searchTerm = "", setSearchTerm }: CommunityNavProps) {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string>("general");

  const handleSectionChange = (section: string, path: string) => {
    setActiveSection(section);
    setLocation(path);
  };

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12 items-center">
            {/* Explore button */}
            <Button
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/explore")}
            >
              <span className="text-sm font-medium">Explore</span>
            </Button>
            
            {/* Search bar */}
            {setSearchTerm && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search community..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            )}
          </div>
          
          {/* Right corner buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/community/friends")}
            >
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Friends</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/community/chats")}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Chats</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/community/create")}
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-sm font-medium">Create Group</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/community/settings")}
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}