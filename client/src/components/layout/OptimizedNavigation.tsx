import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  ChevronDown,
  Home,
  Store,
  Users,
  Heart,
  MessageSquare,
  Bell,
  Search,
  User,
  ShoppingBag,
  Calendar,
  Video,
  Building,
  Compass,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { performUnifiedLogout } from "@/utils/unified-logout-system";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/logo";
import UserMenu from "@/components/ui/user-menu";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function OptimizedNavigation() {
  const [location] = useLocation();
  const { showLoginPrompt } = useLoginPrompt();
  
  // User authentication state
  const { data: userData } = useQuery<{ id: number; username: string; isVendor: boolean; role: string }>({
    queryKey: ["/api/user"],
  });
  
  const isLoggedIn = !!userData;
  const isAdmin = userData?.role === 'admin';

  // Define translatable texts with stable references for DOM-safe translation
  const headerTexts = useMemo(() => [
    "Marketplace",
    "Community", 
    "Dating",
    "Currency",
    "Language",
    "Log in",
    "Log Out"
  ], []);

  // Use master translation system for unified performance
  const { translations: translatedHeaderTexts } = useMasterBatchTranslation(headerTexts, 'high');

  // Memoize translated values to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    marketplace: translatedHeaderTexts[0] || "Marketplace",
    community: translatedHeaderTexts[1] || "Community",
    dating: translatedHeaderTexts[2] || "Dating",
    currency: translatedHeaderTexts[3] || "Currency",
    language: translatedHeaderTexts[4] || "Language",
    login: translatedHeaderTexts[5] || "Log in",
    logout: translatedHeaderTexts[6] || "Log Out"
  }), [translatedHeaderTexts]);
  
  // Unread counts
  const { data: unreadMessages } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: isLoggedIn,
  });
  
  const { data: unreadNotifications } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread/count"],
    enabled: isLoggedIn,
  });

  // Main navigation items using translated labels
  const mainNavItems = useMemo(() => {
    const baseItems = [
      {
        title: translatedLabels.marketplace,
        href: "/marketplace/b2c",
        icon: Store,
        isActive: location.startsWith("/products") || location.startsWith("/marketplace") || location === "/",
      },
      {
        title: translatedLabels.community,
        href: "/community",
        icon: Users,
        isActive: location.startsWith("/community") || location.startsWith("/social") || location.startsWith("/communities"),
      },
    ];

    // Only add dating navigation for admin users
    if (isAdmin) {
      baseItems.push({
        title: translatedLabels.dating,
        href: "/dating",
        icon: Heart,
        isActive: location.startsWith("/dating"),
      });
    }

    return baseItems;
  }, [translatedLabels, location, isAdmin]);

  // Quick access items for authenticated users
  const quickAccessItems = isLoggedIn ? [
    {
      icon: MessageSquare,
      href: "/messages",
      count: unreadMessages?.count || 0,
      label: "Messages",
    },
    {
      icon: Bell,
      href: "/notifications",
      count: unreadNotifications?.count || 0,
      label: "Notifications",
    },
    {
      icon: ShoppingBag,
      href: "/cart",
      label: "Cart",
    },
  ] : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-600 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/70">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo variant="navigation" />
          </div>

          {/* Right side - Navigation and User menu */}
          <div className="flex items-center space-x-1">
            {/* Main Navigation */}
            <nav className="hidden md:flex items-center space-x-1 mr-2">
              {mainNavItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-700 rounded-md",
                    item.isActive && "bg-gray-700 text-white"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
            {/* User menu or login */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                {/* Currency Selector */}
                <div className="hidden md:flex items-center gap-1">
                  <span className="text-white" style={{ fontSize: '10px' }}>{translatedLabels.currency}</span>
                  <CurrencySelector />
                </div>
                {/* Separator */}
                <div className="hidden md:block h-4 w-px bg-gray-300"></div>
                {/* Language Selector between currency selector and profile */}
                <div className="hidden md:flex items-center gap-1 mr-4">
                  <span className="text-white" style={{ fontSize: '10px' }}>{translatedLabels.language}</span>
                  <LanguageSwitcher variant="compact" />
                </div>
                <UserMenu />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Currency Selector for non-logged in users */}
                <div className="hidden md:flex items-center gap-1">
                  <span className="text-white" style={{ fontSize: '10px' }}>{translatedLabels.currency}</span>
                  <CurrencySelector />
                </div>
                {/* Separator */}
                <div className="hidden md:block h-4 w-px bg-gray-300"></div>
                {/* Language Selector for non-logged in users */}
                <div className="hidden md:flex items-center gap-1 mr-4">
                  <span className="text-white" style={{ fontSize: '10px' }}>{translatedLabels.language}</span>
                  <LanguageSwitcher variant="compact" />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:text-gray-200"
                  onClick={() => showLoginPrompt("login")}
                >
                  {translatedLabels.login}
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <div className="flex flex-col space-y-1">
                    <div className="h-0.5 w-4 bg-white"></div>
                    <div className="h-0.5 w-4 bg-white"></div>
                    <div className="h-0.5 w-4 bg-white"></div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Currency and Language Selectors for Mobile */}
                <div className="p-2 border-b space-y-2">
                  <CurrencySelector />
                  <LanguageSwitcher variant="default" />
                </div>
                
                {mainNavItems.map((item) => (
                  <DropdownMenuItem key={item.title} asChild>
                    <Link href={item.href} className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {isLoggedIn && (
                  <>
                    <DropdownMenuSeparator />
                    {quickAccessItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center">
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                          {(item.count || 0) > 0 && (
                            <Badge variant="destructive" className="ml-auto h-5 w-5 rounded-full p-0 text-xs">
                              {(item.count || 0) > 99 ? "99+" : item.count}
                            </Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => performUnifiedLogout()}
                      className="flex items-center text-white hover:text-gray-200 hover:bg-gray-700"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {translatedLabels.logout}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}