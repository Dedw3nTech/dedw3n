import { Link, useLocation } from "wouter";
import { useView } from "@/hooks/use-view";
import { useState } from "react";
import SearchOverlay from "../ui/search-overlay";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import Logo from "../ui/logo";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNavigation() {
  const { view, setView } = useView();
  const [location, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Get unread message count from API
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user, // Only fetch if logged in
  });

  const handleViewChange = (newView: "marketplace" | "social") => {
    setView(newView);
    setLocation(newView === "marketplace" ? "/" : "/community");
  };

  return (
    <>
      <div className="md:hidden fixed top-3 left-3 z-50 bg-white/80 backdrop-blur-sm rounded-full shadow-md p-1">
        <Logo size="sm" withText={false} />
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-center">
          <div className="flex w-full max-w-lg justify-between px-6">
            <button
              className={`py-3 px-3 flex flex-col items-center justify-center min-w-0 w-16 ${location === "/" || location.startsWith("/marketplace") ? "text-blue-500" : "text-gray-500"}`}
              onClick={() => handleViewChange("marketplace")}
            >
              <i className={`ri-store-2-line text-lg mb-1 ${location === "/" || location.startsWith("/marketplace") ? "text-blue-500" : ""}`}></i>
              <span className="text-xs font-medium">Marketplaces</span>
            </button>
            
            <button
              className={`py-3 px-3 flex flex-col items-center justify-center min-w-0 w-16 ${location === "/community" ? "text-blue-500" : "text-gray-500"}`}
              onClick={() => handleViewChange("social")}
            >
              <i className={`ri-group-line text-lg mb-1 ${location === "/community" ? "text-blue-500" : ""}`}></i>
              <span className="text-xs font-medium">Community</span>
            </button>

            <Link href="/messages">
              <button className="py-3 px-3 text-gray-500 flex flex-col items-center justify-center min-w-0 w-16">
                <div className="relative mb-1">
                  <i className="ri-heart-line text-lg"></i>
                  {messageData && messageData.count > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center">
                      {messageData.count}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">Dating</span>
              </button>
            </Link>

            <Link href="/profile">
              <button className="py-3 px-3 text-gray-500 flex flex-col items-center justify-center min-w-0 w-16">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-7 h-7 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center">
                    <i className="ri-user-line text-sm text-gray-600"></i>
                  </div>
                )}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
