import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { TranslatedText } from "@/hooks/use-translated-text";
import { Badge } from "@/components/ui/badge";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
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
} from "lucide-react";
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
  const { data: userData } = useQuery<{ id: number; username: string; isVendor: boolean }>({
    queryKey: ["/api/user"],
  });
  
  const isLoggedIn = !!userData;
  
  // Unread counts
  const { data: unreadMessages } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: isLoggedIn,
  });
  
  const { data: unreadNotifications } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread/count"],
    enabled: isLoggedIn,
  });

  // Main navigation items - simplified to 4 core pages
  const mainNavItems = [
    {
      title: "Marketplace",
      href: "/marketplace/b2c",
      icon: Store,
      isActive: location.startsWith("/products") || location.startsWith("/marketplace") || location === "/",
    },
    {
      title: "Community",
      href: "/community",
      icon: Users,
      isActive: location.startsWith("/community") || location.startsWith("/social") || location.startsWith("/communities"),
    },
    {
      title: "Dating",
      href: "/dating",
      icon: Heart,
      isActive: location.startsWith("/dating"),
    },
    {
      title: "Contact",
      href: "/contact",
      icon: MessageSquare,
      isActive: location.startsWith("/contact"),
    },
  ];

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
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
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
                    "flex h-10 items-center px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 rounded-md",
                    item.isActive && "bg-gray-100 text-primary"
                  )}
                >
                  <TranslatedText>{item.title}</TranslatedText>
                </Link>
              ))}
            </nav>
            {/* User menu or login */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                {/* Currency Selector */}
                <div className="hidden md:flex items-center gap-1">
                  <span className="text-gray-600" style={{ fontSize: '10px' }}>Currency</span>
                  <CurrencySelector />
                </div>
                {/* Separator */}
                <div className="hidden md:block h-4 w-px bg-gray-300"></div>
                {/* Language Selector between currency selector and profile */}
                <div className="hidden md:flex items-center gap-1 mr-4">
                  <span className="text-gray-600" style={{ fontSize: '10px' }}>Language</span>
                  <LanguageSwitcher variant="compact" />
                </div>
                <UserMenu />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Currency Selector for non-logged in users */}
                <div className="hidden md:flex items-center gap-1">
                  <span className="text-gray-600" style={{ fontSize: '10px' }}>Currency</span>
                  <CurrencySelector />
                </div>
                {/* Separator */}
                <div className="hidden md:block h-4 w-px bg-gray-300"></div>
                {/* Language Selector for non-logged in users */}
                <div className="hidden md:flex items-center gap-1 mr-4">
                  <span className="text-gray-600" style={{ fontSize: '10px' }}>Language</span>
                  <LanguageSwitcher variant="compact" />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => showLoginPrompt("login")}
                >
                  <TranslatedText>Log in</TranslatedText>
                </Button>
                <Button 
                  size="sm"
                  onClick={() => showLoginPrompt("register")}
                >
                  <TranslatedText>Sign Up</TranslatedText>
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <div className="flex flex-col space-y-1">
                    <div className="h-0.5 w-4 bg-gray-600"></div>
                    <div className="h-0.5 w-4 bg-gray-600"></div>
                    <div className="h-0.5 w-4 bg-gray-600"></div>
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