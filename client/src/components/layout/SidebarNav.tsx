import { useState } from "react";
import { useLocation } from "wouter";
import { Heart, Search, Store, Users, MessageCircle, User, Menu, X } from "lucide-react";

interface SidebarNavProps {
  onViewChange?: (view: "marketplace" | "social") => void;
}

export default function SidebarNav({ onViewChange }: SidebarNavProps) {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    {
      id: "marketplaces",
      label: "Marketplaces",
      icon: Store,
      action: () => {
        onViewChange?.("marketplace");
        setLocation("/products");
        setIsOpen(false);
      },
      isActive: location === '/products' || location === '/' || location.startsWith('/product') || location.startsWith('/vendors')
    },
    {
      id: "community",
      label: "Community",
      icon: Users,
      action: () => {
        onViewChange?.("social");
        setLocation("/wall");
        setIsOpen(false);
      },
      isActive: location === '/social' || location === '/wall'
    },
    {
      id: "explore",
      label: "Explore",
      icon: Search,
      action: () => {
        setLocation("/explore");
        setIsOpen(false);
      },
      isActive: location === '/explore' || location.startsWith('/search')
    },
    {
      id: "dating",
      label: "Dating",
      icon: Heart,
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
      action: () => {
        setLocation("/messages");
        setIsOpen(false);
      },
      isActive: location === '/messages'
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      action: () => {
        setLocation("/profile");
        setIsOpen(false);
      },
      isActive: location === '/profile' || location.startsWith('/profile/')
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-black">Dedw3n</h1>
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
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white rounded-lg shadow-md p-2 border"
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