import { useState } from "react";
import { useLocation } from "wouter";
import { Heart, Home, Search, Store, Users, MessageCircle, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import Logo from "@/components/ui/logo";

interface SidebarProps {
  onViewChange?: (view: "marketplace" | "social") => void;
  view?: "marketplace" | "social";
}

export default function Sidebar({ onViewChange, view }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Get unread message count
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: true,
  });

  const navigationItems = [
    {
      id: "marketplaces",
      label: "Marketplaces",
      icon: Store,
      path: "/products",
      action: () => {
        onViewChange?.("marketplace");
        setLocation("/products");
        setIsOpen(false);
      },
      isActive: location === '/products' || location === '/' || location.startsWith('/product') || location.startsWith('/vendors') || location.startsWith('/cart') || location.startsWith('/checkout')
    },
    {
      id: "community",
      label: "Community",
      icon: Users,
      path: "/social",
      action: () => {
        onViewChange?.("social");
        setLocation("/social");
        setIsOpen(false);
      },
      isActive: location === '/social' || location === '/wall'
    },
    {
      id: "explore",
      label: "Explore",
      icon: Search,
      path: "/explore",
      action: () => {
        setLocation("/explore");
        setIsOpen(false);
      },
      isActive: location === '/explore' || location === '/search'
    },
    {
      id: "dating",
      label: "Dating",
      icon: Heart,
      path: "/dating",
      action: () => {
        setLocation("/dating");
        setIsOpen(false);
      },
      isActive: location === '/dating'
    },
    {
      id: "messages",
      label: "Messages",
      icon: MessageCircle,
      path: "/messages",
      action: () => {
        setLocation("/messages");
        setIsOpen(false);
      },
      isActive: location === '/messages',
      badge: messageData?.count ? messageData.count : undefined
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/profile",
      action: () => {
        setLocation("/profile");
        setIsOpen(false);
      },
      isActive: location === '/profile' || location.startsWith('/profile/')
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Logo size="md" withText={true} />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                item.isActive
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <Badge className="ml-auto bg-red-500 text-white">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* Secondary Navigation for Social Pages */}
      {(location === '/social' || location === '/wall' || location === '/explore') && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Social</h3>
          <div className="space-y-1">
            <button
              onClick={() => {
                setLocation("/wall");
                setIsOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 text-left rounded text-sm ${
                location === '/wall'
                  ? "bg-gray-100 text-black font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Wall
            </button>
            <button
              onClick={() => {
                setLocation("/search");
                setIsOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 text-left rounded text-sm ${
                location.startsWith('/search')
                  ? "bg-gray-100 text-black font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Search className="h-4 w-4 mr-2" />
              Search Users
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white rounded-lg shadow-md p-2"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}