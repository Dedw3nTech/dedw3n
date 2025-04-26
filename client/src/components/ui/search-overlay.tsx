import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface SearchOverlayProps {
  onClose: () => void;
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Recent searches - would come from user profile in a real app
  const recentSearches = [
    "handmade jewelry",
    "desk organizer",
    "wireless earbuds"
  ];

  // Popular categories - would come from API in a real app
  const popularCategories = [
    "Fashion",
    "Electronics",
    "Home & Garden",
    "Beauty",
    "Handcrafted",
    "Eco-Friendly"
  ];

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleRemoveSearch = (search: string) => {
    // Would remove from user's recent searches in a real app
    console.log("Remove search:", search);
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="p-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="p-2 text-gray-600"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </Button>
          <div className="flex-grow ml-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products or posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <i className="ri-search-line absolute left-3 top-2.5 text-gray-400"></i>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-medium text-gray-800 mb-2">Recent Searches</h3>
          <div className="space-y-2">
            {recentSearches.map((search) => (
              <div key={search} className="flex items-center justify-between">
                <div className="flex items-center">
                  <i className="ri-history-line text-gray-400 mr-2"></i>
                  <span className="text-gray-700">{search}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSearch(search)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line"></i>
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-800 mb-2">Popular Categories</h3>
          <div className="flex flex-wrap gap-2">
            {popularCategories.map((category) => (
              <a
                key={category}
                href="#"
                className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-200"
              >
                {category}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
