import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useView } from "@/hooks/use-view";
import { useMarketType } from "@/hooks/use-market-type";
import UserMenu from "../ui/user-menu";
import CurrencyConverter from "../ui/currency-converter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../ui/badge";
import { LanguageSelector } from "../lang/LanguageSelector";
import { CurrencySelector } from "../lang/CurrencySelector";
import { useTranslation } from "react-i18next";
import Logo from "../ui/logo";
import { useMessaging } from "@/hooks/use-messaging";
import SocialNav from "@/components/social/SocialNav";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Store, Users, Building, Landmark, Heart, Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function Header() {
  const { view, setView } = useView();
  const { marketType, setMarketType, marketTypeLabel } = useMarketType();
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

  // Notification functionality has been removed

  const handleViewChange = (newView: "marketplace" | "social") => {
    setView(newView);
    setLocation(newView === "marketplace" ? "/products" : "/social");
  };

  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            <div className="hidden md:flex items-center space-x-1 ml-4">
              <CurrencySelector />
              <LanguageSelector />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {/* Empty div to maintain layout */}
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

            <Popover>
              <PopoverTrigger asChild>
                <div className="relative p-2 text-gray-600 hover:text-primary cursor-pointer">
                  <Bell className="h-5 w-5" />
                  <Badge variant="destructive" className="absolute top-0 right-0 w-4 h-4 p-0 flex items-center justify-center">
                    3
                  </Badge>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="border-b p-3">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="p-3 border-b hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                        <Store className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Order Shipped</p>
                        <p className="text-xs text-gray-500 mt-1">Your order #12345 has been shipped and will arrive in 2-4 days.</p>
                        <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-b hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New Follower</p>
                        <p className="text-xs text-gray-500 mt-1">Alice started following your shop.</p>
                        <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                        <Heart className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New Message</p>
                        <p className="text-xs text-gray-500 mt-1">You have a new message from a dating match.</p>
                        <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2 border-t text-center">
                  <button className="text-xs text-primary font-medium hover:underline">View all notifications</button>
                </div>
              </PopoverContent>
            </Popover>

            <Link href="/wallet" className="relative p-2 text-gray-600 hover:text-primary">
              <i className="ri-wallet-3-line text-xl"></i>
            </Link>

            <UserMenu />
          </div>
        </div>

        <div className="flex border-b border-gray-200 -mb-px">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex-1 py-4 text-center font-medium text-sm focus:outline-none text-gray-600 hover:text-primary flex items-center justify-center"
              >
                <i className="ri-store-3-line mr-1"></i> Marketplace: {marketTypeLabel} <ChevronDown className="ml-1 h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem 
                onClick={() => {
                  setMarketType("c2c");
                  setLocation("/products");
                }}
                className="flex items-center cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Buy from a friend (C2C)</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setMarketType("b2c");
                  setLocation("/products");
                }}
                className="flex items-center cursor-pointer"
              >
                <Store className="mr-2 h-4 w-4" />
                <span>Buy from a store (B2C)</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setMarketType("b2b");
                  setLocation("/products");
                }}
                className="flex items-center cursor-pointer"
              >
                <Building className="mr-2 h-4 w-4" />
                <span>Business (B2B)</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setMarketType("gov");
                  setLocation("/government");
                }}
                className="flex items-center cursor-pointer"
              >
                <Landmark className="mr-2 h-4 w-4" />
                <span>Governmental Services</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Social button with integrated navigation and messaging */}
          <SocialNav />
          
          {/* Dating button */}
          <div className="flex-1">
            <button
              className="w-full py-4 text-center font-medium text-sm focus:outline-none text-gray-600 hover:text-primary relative"
              onClick={() => setLocation("/dating")}
            >
              <Heart className="inline-block h-4 w-4 mr-1" /> Dating
            </button>
          </div>
        </div>
      </div>

      {/* Search functionality removed */}
    </header>
  );
}
