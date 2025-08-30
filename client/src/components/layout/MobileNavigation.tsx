import { Link, useLocation } from "wouter";
import { useView } from "@/hooks/use-view";
import { useState, useMemo } from "react";
import SearchOverlay from "../ui/search-overlay";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import Logo from "../ui/logo";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

export default function MobileNavigation() {
  const { view, setView } = useView();
  const [location, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Define translatable texts with stable references
  const mobileNavTexts = useMemo(() => [
    "Marketplace",
    "Community", 
    "Dating"
  ], []);

  // Use optimized batch translation for optimal performance
  const { translations } = useMasterBatchTranslation(mobileNavTexts, 'normal');
  
  // Get unread message count from API
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user, // Only fetch if logged in
  });

  const handleViewChange = (newView: "marketplace" | "social") => {
    setView(newView);
    setLocation(newView === "marketplace" ? "/marketplace" : "/");
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-center">
          <div className="flex w-full max-w-lg justify-between px-6">
            <Link href="/marketplace/b2c">
              <button
                className={`py-3 px-3 flex flex-col items-center justify-center min-w-0 w-16 ${location === "/" || location.startsWith("/marketplace") ? "text-gray-700" : "text-gray-500"}`}
              >
                <i className={`ri-store-2-line text-lg mb-1 ${location === "/" || location.startsWith("/marketplace") ? "text-gray-700" : ""}`}></i>
                <span className="text-xs font-medium">{translations && translations["Marketplace"] || "Marketplace"}</span>
              </button>
            </Link>
            
            <Link href="/community">
              <button
                className={`py-3 px-3 flex flex-col items-center justify-center min-w-0 w-16 ${location === "/community" ? "text-gray-700" : "text-gray-500"}`}
              >
                <i className={`ri-group-line text-lg mb-1 ${location === "/community" ? "text-gray-700" : ""}`}></i>
                <span className="text-xs font-medium">{translations && translations["Community"] || "Community"}</span>
              </button>
            </Link>

            {isAdmin && (
              <Link href="/dating">
                <button className="py-3 px-3 text-gray-500 flex flex-col items-center justify-center min-w-0 w-16">
                  <div className="relative mb-1">
                    <i className="ri-heart-line text-lg"></i>
                    {messageData && messageData.count > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center">
                        {messageData.count}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-medium">{translations && translations["Dating"] || "Dating"}</span>
                </button>
              </Link>
            )}

            <Link href={user ? "/profile" : "/auth"}>
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
