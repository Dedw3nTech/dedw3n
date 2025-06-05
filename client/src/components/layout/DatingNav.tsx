import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  User, 
  Star,
  Settings
} from "lucide-react";

interface DatingNavProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export function DatingNav({ searchTerm = "", setSearchTerm }: DatingNavProps) {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string>("discover");

  const handleSectionChange = (section: string, path: string) => {
    setActiveSection(section);
    setLocation(path);
  };

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">

            
            <div 
              className="cursor-pointer group transition-all duration-300"
              onClick={() => handleSectionChange("matches", "/dating/matches")}
            >
              <div className="mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  activeSection === 'matches' 
                    ? 'text-black' 
                    : 'text-black group-hover:text-black'
                }`}>
                  Matches
                </span>
              </div>
              <div className={`h-0.5 transition-all duration-300 ${
                activeSection === 'matches' 
                  ? 'bg-black w-full' 
                  : 'bg-transparent w-0 group-hover:w-full group-hover:bg-black'
              }`} />
            </div>

            
            {/* Search bar */}
            {setSearchTerm && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search profiles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            )}
          </div>
          
          {/* Right corner buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              onClick={() => setLocation("/dating/profile")}
            >
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">My Dating Profile</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}