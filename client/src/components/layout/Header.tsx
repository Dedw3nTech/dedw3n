import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useView } from "@/hooks/use-view";
import UserMenu from "../ui/user-menu";
import SearchOverlay from "../ui/search-overlay";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../ui/badge";
import { LanguageSelector } from "../lang";
import { useTranslation } from "react-i18next";
import Logo from "../ui/logo";
import { useMessaging } from "@/hooks/use-messaging";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import SocialMessaging from "@/components/messaging/SocialMessaging";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { view, setView } = useView();
  const [, setLocation] = useLocation();

  // Fetch user data to check if logged in
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  const isLoggedIn = !!userData;

  // Fetch cart count
  const { data: cartData } = useQuery<{ count: number }>({
    queryKey: ["/api/cart/count"],
    enabled: isLoggedIn, // Only fetch if logged in
  });

  // Fetch message count
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"], 
    enabled: isLoggedIn, // Only fetch if logged in
  });

  // Placeholder notification count
  const notificationCount = 1;

  const handleViewChange = (newView: "marketplace" | "social") => {
    setView(newView);
    setLocation(newView === "marketplace" ? "/" : "/social");
  };

  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Logo size="md" />
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t('products.search')}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <i className="ri-search-line absolute left-3 top-2.5 text-gray-400"></i>
            </div>

            <Link 
              href="/upload-product" 
              className="hidden md:inline-flex items-center px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-blue-600 transition"
            >
              <i className="ri-add-line mr-1"></i> {t('vendor.add_product')}
            </Link>
            
            <LanguageSelector minimal className="hidden lg:flex" />
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-primary">
              <i className="ri-shopping-cart-2-line text-xl"></i>
              {cartData && cartData.count > 0 && (
                <Badge variant="destructive" className="absolute top-0 right-0 w-4 h-4 p-0 flex items-center justify-center">
                  {cartData.count}
                </Badge>
              )}
            </Link>

            <Link href="/wallet" className="relative p-2 text-gray-600 hover:text-primary">
              <i className="ri-wallet-3-line text-xl"></i>
            </Link>

{/* Messaging button removed as it's integrated into Social button */}

            <button className="relative p-2 text-gray-600 hover:text-primary">
              <i className="ri-notification-3-line text-xl"></i>
              {notificationCount > 0 && (
                <Badge variant="secondary" className="absolute top-0 right-0 w-4 h-4 p-0 flex items-center justify-center">
                  {notificationCount}
                </Badge>
              )}
            </button>

            <UserMenu />
          </div>
        </div>

        <div className="flex border-b border-gray-200 -mb-px">
          <button
            onClick={() => setLocation("/products")}
            className="flex-1 py-4 text-center font-medium text-sm focus:outline-none text-gray-600 hover:text-primary"
          >
            <i className="ri-store-3-line mr-1"></i> Marketplace
          </button>
          {/* Social button with integrated messaging */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex-1 py-4 text-center font-medium text-sm focus:outline-none text-gray-600 hover:text-primary relative">
                <i className="ri-group-line mr-1"></i> Social
                {messageData && messageData.count > 0 && (
                  <Badge className="absolute top-1 right-1/4 w-4 h-4 p-0 flex items-center justify-center">
                    {messageData.count}
                  </Badge>
                )}
              </button>
            </SheetTrigger>
            <SocialMessaging />
          </Sheet>
        </div>
      </div>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
