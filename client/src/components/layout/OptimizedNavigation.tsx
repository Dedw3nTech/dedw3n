import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
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
  MessageSquare,
  MessageCircle,
  Bell,
  Search,
  User,
  CreditCard,
  Calendar,
  Video,
  Building,
  Compass,
  TrendingUp,
  LogOut,
  Landmark,
  Briefcase,
  Coffee,
  Wrench,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // User authentication state
  const { data: userData } = useQuery<{ id: number; username: string; isVendor: boolean; role: string }>({
    queryKey: ["/api/user"],
  });
  
  const isLoggedIn = !!userData;
  const isAdmin = userData?.role === 'admin';

  // Define translatable texts with stable references for DOM-safe translation
  const headerTexts = useMemo(() => [
    "Finance",
    "Government",
    "Lifestyle",
    "Services",
    "Marketplace",
    "Community", 
    "Currency",
    "Language", 
    "Account",
    "Cart",
    "Log Out",
    "Messages",
    "Notifications"
  ], []);

  // Use master translation system for unified performance
  const { translations: translatedHeaderTexts } = useMasterBatchTranslation(headerTexts, 'high');

  // Memoize translated values to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    finance: translatedHeaderTexts[0] || "Finance",
    government: translatedHeaderTexts[1] || "Government",
    lifestyle: translatedHeaderTexts[2] || "Lifestyle",
    services: translatedHeaderTexts[3] || "Services",
    marketplace: translatedHeaderTexts[4] || "Marketplace",
    community: translatedHeaderTexts[5] || "Community",
    currency: translatedHeaderTexts[6] || "Currency",
    language: translatedHeaderTexts[7] || "Language",
    login: translatedHeaderTexts[8] || "Account",
    cart: translatedHeaderTexts[9] || "Cart",
    logout: translatedHeaderTexts[10] || "Log Out",
    messages: translatedHeaderTexts[11] || "Messages",
    notifications: translatedHeaderTexts[12] || "Notifications"
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
  
  // Cart count
  const { data: cartCount } = useQuery<{ count: number }>({
    queryKey: ["/api/cart/count"],
    enabled: isLoggedIn,
  });

  // Main navigation items using translated labels
  const mainNavItems = useMemo(() => {
    // Check if user has access to Finance section (Admin or Serruti only)
    const hasFinanceAccess = userData?.role === 'admin' || userData?.username === 'Serruti';
    
    const allNavItems = [
      {
        title: translatedLabels.finance,
        href: "/finance",
        icon: Landmark,
        isActive: location.startsWith("/finance"),
      },
      {
        title: translatedLabels.government,
        href: "/government",
        icon: Building,
        isActive: location.startsWith("/government"),
      },
      {
        title: translatedLabels.lifestyle,
        href: "/lifestyle",
        icon: Coffee,
        isActive: location.startsWith("/lifestyle"),
      },
      {
        title: translatedLabels.services,
        href: "/services",
        icon: Wrench,
        isActive: location.startsWith("/services"),
      },
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
    
    // Filter out Finance section for non-authorized users
    return allNavItems.filter(item => item.href !== '/finance' || hasFinanceAccess);
  }, [translatedLabels, location, userData]);

  // Quick access items for authenticated users
  const quickAccessItems = isLoggedIn ? [
    {
      icon: MessageSquare,
      href: "/messages",
      count: unreadMessages?.count || 0,
      label: translatedLabels.messages,
    },
    {
      icon: Bell,
      href: "/notifications",
      count: unreadNotifications?.count || 0,
      label: translatedLabels.notifications,
    },
    {
      icon: CreditCard,
      href: "/cart",
      count: cartCount?.count || 0,
      label: translatedLabels.cart,
    },
  ] : [];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur" style={{ backgroundColor: '#f2f2f2' }}>
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Left corner - Logo */}
          <div className="flex items-center">
            <Logo size="md" withText={false} className="h-12 w-auto" />
          </div>

          {/* Right side - Navigation and settings */}
          <div className="flex items-center space-x-0.5 flex-nowrap">
            {/* Main Navigation */}
            <nav className="hidden md:flex items-center space-x-0.5 mr-1 flex-nowrap">
              {mainNavItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center px-2 py-2 text-xs font-medium text-black transition-colors rounded-md whitespace-nowrap",
                    item.isActive && "text-black"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
            
            {/* Account and Cart */}
            <div className="flex items-center space-x-1 flex-nowrap">
              {isLoggedIn ? (
                <UserMenu />
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-black flex items-center gap-2"
                  onClick={() => showLoginPrompt("login")}
                  data-testid="button-account"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{translatedLabels.login}</span>
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-black flex items-center gap-2"
                data-testid="link-cart"
                asChild
              >
                <Link href="/cart" className="flex items-center gap-2">
                  <div className="relative inline-flex">
                    <CreditCard className="h-4 w-4" />
                    {isLoggedIn && cartCount && cartCount.count > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[9px] font-medium text-white">
                        {cartCount.count > 9 ? "9+" : cartCount.count}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline">{translatedLabels.cart}</span>
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-black flex items-center gap-2"
                data-testid="link-messages"
                asChild
              >
                <Link href="/messages" className="flex items-center gap-2">
                  <div className="relative inline-flex">
                    <MessageCircle className="h-4 w-4" />
                    {isLoggedIn && unreadMessages && unreadMessages.count > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[9px] font-medium text-white">
                        {unreadMessages.count > 9 ? "9+" : unreadMessages.count}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline">{translatedLabels.messages}</span>
                </Link>
              </Button>
              
              {/* Currency Selector */}
              <div className="hidden md:flex items-center gap-0.5 flex-nowrap">
                <CurrencySelector />
              </div>
              {/* Language Selector */}
              <div className="hidden md:flex items-center gap-0.5 flex-nowrap">
                <LanguageSwitcher variant="compact" />
              </div>
            </div>

            {/* Mobile menu - Sidebar */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0" data-testid="button-hamburger-mobile">
                  <div className="flex flex-col space-y-1">
                    <div className="h-0.5 w-4 bg-black"></div>
                    <div className="h-0.5 w-4 bg-black"></div>
                    <div className="h-0.5 w-4 bg-black"></div>
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col p-0">
                <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="flex flex-col space-y-4">
                    {/* Currency and Language Selectors */}
                    <div className="pb-4 border-b">
                      <div className="flex items-center gap-4 justify-center">
                        <CurrencySelector className="text-black hover:bg-transparent" />
                        <LanguageSwitcher variant="compact" className="text-black hover:bg-transparent" />
                      </div>
                    </div>
                    
                    {/* Main Navigation Links */}
                    <div className="space-y-1">
                      {mainNavItems.map((item) => (
                        <SheetClose asChild key={item.title}>
                          <Link href={item.href}>
                            <span
                              className={cn(
                                "flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors cursor-pointer",
                                item.isActive 
                                  ? "bg-gray-100 text-gray-900" 
                                  : "text-gray-700 hover:bg-gray-50"
                              )}
                              data-testid={`link-${item.title.toLowerCase()}`}
                            >
                              {item.title}
                            </span>
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                    
                    {/* Quick Access for Logged In Users */}
                    {isLoggedIn && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          {quickAccessItems.map((item) => (
                            <SheetClose asChild key={item.href}>
                              <Link href={item.href}>
                                <span
                                  className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                  data-testid={`link-${item.label.toLowerCase()}`}
                                >
                                  {item.label}
                                  {(item.count || 0) > 0 && (
                                    <Badge className="ml-auto h-5 min-w-[20px] rounded-full px-2 text-xs bg-black text-white hover:bg-gray-800">
                                      {(item.count || 0) > 99 ? "99+" : item.count}
                                    </Badge>
                                  )}
                                </span>
                              </Link>
                            </SheetClose>
                          ))}
                        </div>
                        
                        <Separator />
                        
                        {/* Logout Button */}
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            onClick={() => performUnifiedLogout()}
                            data-testid="button-logout"
                          >
                            {translatedLabels.logout}
                          </Button>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}