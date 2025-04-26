import { Link, useLocation } from "wouter";
import { useView } from "@/hooks/use-view";
import { useState } from "react";
import SearchOverlay from "../ui/search-overlay";
import { Badge } from "@/components/ui/badge";

export default function MobileNavigation() {
  const { view, setView } = useView();
  const [, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  // Placeholder counts
  const messageCount = 3;

  const handleViewChange = (newView: "marketplace" | "social") => {
    setView(newView);
    setLocation(newView === "marketplace" ? "/" : "/social");
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around">
          <button
            className={`py-3 px-6 flex flex-col items-center ${view === "marketplace" ? "text-primary" : "text-gray-500"}`}
            onClick={() => handleViewChange("marketplace")}
          >
            <i className="ri-store-2-line text-xl"></i>
            <span className="text-xs mt-1">Marketplace</span>
          </button>
          <button
            className={`py-3 px-6 flex flex-col items-center ${view === "social" ? "text-primary" : "text-gray-500"}`}
            onClick={() => handleViewChange("social")}
          >
            <i className="ri-group-line text-xl"></i>
            <span className="text-xs mt-1">Social</span>
          </button>
          <button
            className="py-3 px-6 text-gray-500 flex flex-col items-center"
            onClick={() => setSearchOpen(true)}
          >
            <i className="ri-search-line text-xl"></i>
            <span className="text-xs mt-1">Search</span>
          </button>
          <button className="py-3 px-6 text-gray-500 flex flex-col items-center">
            <div className="relative">
              <i className="ri-message-3-line text-xl"></i>
              {messageCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center">
                  {messageCount}
                </Badge>
              )}
            </div>
            <span className="text-xs mt-1">Messages</span>
          </button>
          <Link href="/profile">
            <button className="py-3 px-6 text-gray-500 flex flex-col items-center">
              <i className="ri-user-line text-xl"></i>
              <span className="text-xs mt-1">Profile</span>
            </button>
          </Link>
        </div>
      </div>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
