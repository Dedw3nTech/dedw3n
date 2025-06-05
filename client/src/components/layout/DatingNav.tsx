import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { 
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
          </div>
          
          {/* Right corner buttons */}
          <div className="flex items-center gap-0">
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