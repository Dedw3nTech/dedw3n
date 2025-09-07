import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useView } from "@/hooks/use-view";
import { useMarketType } from "@/hooks/use-market-type";
import UserMenu from "../ui/user-menu";
import CurrencyConverter from "../ui/currency-converter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "../ui/badge";
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
import { 
  ChevronDown, 
  Store, 
  Users, 
  Building, 
  Landmark, 
  Heart, 
  Bell, 
  MessageSquare, 
  ShoppingBag, 
  Home, 
  Compass,
  Video,
  User as UserIcon,
  Search
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function Header() {
  const { view, setView } = useView();
  const { marketType, setMarketType, marketTypeLabel } = useMarketType();
  const [location, setLocation] = useLocation();
  // Determine active tab based on current location
  const getCurrentTab = () => {
    if (location === '/wall') return "wall";
    if (location === '/explore') return "explore";
    if (location === '/messages') return "messages";
    if (location.startsWith('/videos')) return "videos";
    if (location === '/communities') return "communities";
    if (location === '/profile' || location.startsWith('/profile/')) return "profile";
    return "wall"; // default
  };
  
  const [activeTab, setActiveTab] = useState(getCurrentTab());
  
  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getCurrentTab());
    
    // Listen for custom locationchange events from other components
    const handleLocationChange = (event: CustomEvent) => {
      if (event.detail?.path) {
        const newPath = event.detail.path;
        if (newPath === '/profile') {
          setActiveTab('profile');
        }
      }
    };
    
    window.addEventListener('locationchange', handleLocationChange as EventListener);
    
    return () => {
      window.removeEventListener('locationchange', handleLocationChange as EventListener);
    };
  }, [location]);

  // Fetch user data to check if logged in
  const { data: userData } = useQuery<{ id: number; username: string; isVendor: boolean; [key: string]: any }>({
    queryKey: ["/api/user"],
  });
  
  const isLoggedIn = !!userData;
  
  // Fetch notifications and count if logged in
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: isLoggedIn,
  });
  
  const { data: unreadNotificationsData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread/count"],
    enabled: isLoggedIn,
  });
  
  const unreadNotificationCount = unreadNotificationsData?.count || 0;
  
  // Mark notification as read mutation
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread/count"] });
    }
  });
  
  // Mark all notifications as read mutation
  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread/count"] });
    }
  });

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
  
  // Helper functions for notification icons
  const getNotificationIconStyle = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-600';
      case 'social':
        return 'bg-green-100 text-green-600';
      case 'message':
        return 'bg-purple-100 text-purple-600';
      case 'payment':
        return 'bg-yellow-100 text-yellow-600';
      case 'system':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="h-4 w-4" />;
      case 'social':
        return <Users className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'payment':
        return <i className="ri-wallet-3-line text-sm" />;
      case 'system':
        return <i className="ri-information-line text-sm" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <header className="bg-background shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3 justify-start flex-1">
            <Logo size="lg" variant="transparent" />
            <span className="text-xs font-bold text-red-600 ml-1">BETA VERSION</span>
          </div>

          <div className="flex items-center space-x-4">
            <UserMenu />
          </div>
        </div>


      </div>

      {/* Social tab navigation - shown on social pages */}
      {(location === '/social' || 
        location === '/wall' || 
        location === '/explore' || 
        location === '/messages' || 
        location.startsWith('/videos') ||
        location === '/communities' ||
        location === '/profile' ||
        location.startsWith('/profile/')) && (
        <div className="container mx-auto px-4 py-6 border-b border-gray-200">
          <div className="flex justify-center overflow-x-auto">
            <div 
              className="py-2 px-4 text-sm font-medium cursor-pointer"
              onClick={() => {
                setActiveTab("wall");
                setLocation("/wall");
              }}
              title="Personal timeline showing posts from you and users you follow - API: /api/feed/personal"
            >
              <div className={`flex items-center justify-center gap-1 border-b-2 ${activeTab === "wall" ? "border-black text-black font-bold" : "border-transparent text-gray-600 hover:text-primary"}`}>
                <Home className="h-4 w-4" />
                <span>Wall</span>
              </div>
            </div>
            
            <div 
              className="py-2 px-4 text-sm font-medium cursor-pointer"
              onClick={() => {
                setActiveTab("community");
                setLocation("/community");
              }}
              title="Community feed showing all posts from all users on the platform - API: /api/feed/community"
            >
              <div className={`flex items-center justify-center gap-1 border-b-2 ${activeTab === "community" ? "border-black text-black font-bold" : "border-transparent text-gray-600 hover:text-primary"}`}>
                <i className="ri-group-line text-base"></i>
                <span>Community</span>
              </div>
            </div>
            
            <div 
              className="py-2 px-4 text-sm font-medium cursor-pointer"
              onClick={() => {
                setActiveTab("search");
                setLocation("/search");
              }}
              title="Search for users and vendors on the platform - API: /api/users/search"
            >
              <div className={`flex items-center justify-center gap-1 border-b-2 ${activeTab === "search" ? "border-black text-black font-bold" : "border-transparent text-gray-600 hover:text-primary"}`}>
                <Search className="h-4 w-4" />
                <span>Search User</span>
              </div>
            </div>




            
            {/* Profile button removed as requested */}
          </div>
        </div>
      )}

      {/* Search functionality removed */}
    </header>
  );
}

export { Header };
