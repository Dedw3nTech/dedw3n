import { useLocation } from "wouter";
import { useState } from "react";
import { Search } from "lucide-react";
import UserMenu from "../ui/user-menu";
import Logo from "../ui/logo";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "products" | "services" | "users" | "vendors">("all");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchParams = new URLSearchParams({
        q: searchQuery.trim(),
        type: searchType
      });
      setLocation(`/search?${searchParams.toString()}`);
      setShowSearchDropdown(false);
    }
  };

  return (
    <header className="bg-background shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Single header row with everything aligned */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            <span className="text-xs font-bold text-red-600 ml-1">BETA VERSION</span>
          </div>

          {/* Center navigation links */}
          <div className="flex items-center space-x-8">
            <button
              onClick={() => setLocation("/products")}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Marketplace
            </button>
            <button
              onClick={() => setLocation("/community")}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Community
            </button>
            <button
              onClick={() => setLocation("/dating")}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Dating
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products, services, users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                    className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                
                {/* Search Type Dropdown */}
                {showSearchDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <div className="text-xs text-gray-500 mb-2">Search in:</div>
                      <div className="space-y-1">
                        {[
                          { value: "all", label: "Everything" },
                          { value: "products", label: "Products" },
                          { value: "services", label: "Services" },
                          { value: "users", label: "Users" },
                          { value: "vendors", label: "Vendors" }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSearchType(option.value as any);
                              setShowSearchDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                              searchType === option.value ? "bg-primary text-white" : "text-gray-700"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}