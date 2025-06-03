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
    <div className="bg-white border-b-2 border-gray-300 py-8 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => handleSectionChange("general", "/community")}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  activeSection === 'general' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  General Community
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                activeSection === 'general' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
            
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => handleSectionChange("groups", "/community/groups")}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  activeSection === 'groups' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  Groups & Communities
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                activeSection === 'groups' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
            
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => handleSectionChange("events", "/community/events")}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  activeSection === 'events' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  Events & Meetups
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                activeSection === 'events' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>
            
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