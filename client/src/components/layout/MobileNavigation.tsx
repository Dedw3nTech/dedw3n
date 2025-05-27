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
    setLocation(newView === "marketplace" ? "/" : "/social");
  };

  return (
    <>
      <div className="md:hidden fixed top-3 left-3 z-50 bg-white/80 backdrop-blur-sm rounded-full shadow-md p-1">
        <Logo size="sm" withText={false} />
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around">
          <button
            className={`py-2 px-2 flex flex-col items-center flex-1 ${view === "marketplace" ? "text-primary" : "text-gray-500"}`}
            onClick={() => handleViewChange("marketplace")}
          >
            <i className="ri-store-2-line text-lg"></i>
            <span className="text-xs mt-1">Marketplaces</span>
          </button>
          <button
            className={`py-2 px-2 flex flex-col items-center flex-1 ${view === "social" || location === "/community" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleViewChange("social")}
          >
            <i className={`ri-group-line text-lg ${view === "social" || location === "/community" ? "text-blue-500" : ""}`}></i>
            <span className="text-xs mt-1">Community</span>
          </button>
          <button
            className="py-2 px-2 text-gray-500 flex flex-col items-center flex-1"
            onClick={() => setSearchOpen(true)}
          >
            <i className="ri-search-line text-lg"></i>
            <span className="text-xs mt-1">Explore</span>
          </button>
          <Link href="/messages">
            <button className="py-2 px-2 text-gray-500 flex flex-col items-center flex-1">
              <div className="relative">
                <i className="ri-heart-line text-lg"></i>
                {messageData && messageData.count > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center">
                    {messageData.count}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1">Dating</span>
            </button>
          </Link>

          <Link href="/profile">
            <button className="py-2 px-2 text-gray-500 flex flex-col items-center flex-1">
              <i className="ri-user-line text-lg"></i>
              <span className="text-xs mt-1">{t('account.profile')}</span>
            </button>
          </Link>
        </div>
      </div>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
