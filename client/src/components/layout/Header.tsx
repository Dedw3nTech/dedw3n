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
  User as UserIcon
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
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            <span className="text-xs font-bold text-red-600 ml-1">BETA VERSION</span>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {/* Empty div to maintain layout */}
          </div>

          <div className="flex items-center space-x-4">
            {/* Vendor button - only for logged in non-vendors */}
            {isLoggedIn && userData && userData.isVendor === false && (
              <Link href="/become-vendor">
                <Button size="sm" className="hidden md:flex items-center gap-1 bg-red-600 text-white hover:bg-red-700">
                  <Store className="h-4 w-4" />
                  <span>Become a Vendor</span>
                </Button>
              </Link>
            )}
            
            {/* Cart button - always visible for logged in users */}
            {isLoggedIn && (
              <Link href="/cart" className="relative p-2 text-gray-600 hover:text-primary">
                <i className="ri-shopping-cart-2-line text-xl"></i>
                {cartData?.count && cartData.count > 0 && (
                  <Badge variant="destructive" className="absolute top-0 right-0 w-4 h-4 p-0 flex items-center justify-center">
                    {cartData.count}
                  </Badge>
                )}
              </Link>
            )}

            {/* Notification button - always visible for logged in users */}
            {isLoggedIn && (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative p-2 text-gray-600 hover:text-primary cursor-pointer">
                    <Bell className="h-5 w-5" />
                    {unreadNotificationCount > 0 && (
                      <Badge variant="destructive" className="absolute top-0 right-0 w-4 h-4 p-0 flex items-center justify-center">
                        {unreadNotificationCount}
                      </Badge>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="border-b p-3">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {!notifications || !Array.isArray(notifications) || notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notification: any) => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-gray-50' : ''}`}
                          onClick={() => markNotificationReadMutation.mutate(notification.id)}
                        >
                          <div className="flex items-start">
                            <div className={`h-8 w-8 rounded-full ${getNotificationIconStyle(notification.type)} flex items-center justify-center mr-3`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t flex justify-between items-center">
                    <div 
                      className="text-xs text-primary font-medium hover:underline cursor-pointer"
                      onClick={() => markAllNotificationsReadMutation.mutate()}
                    >
                      Mark all as read
                    </div>
                    <Link 
                      href="/notifications" 
                      className="text-xs text-primary font-medium hover:underline"
                      onClick={() => {
                        // Close the popover when navigating
                        document.body.click();
                      }}
                    >
                      View all notifications
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Wallet button - always visible for logged in users */}
            {isLoggedIn && (
              <Link href="/wallet" className="relative p-2 text-gray-600 hover:text-primary">
                <i className="ri-wallet-3-line text-xl"></i>
              </Link>
            )}
            
            {/* User menu always at the end */}
            <UserMenu />
          </div>
        </div>

        <div className="flex border-b border-gray-200 -mb-px">
          {/* Marketplaces Dropdown */}
          <div className="flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className={`w-full py-4 text-center font-medium text-sm relative cursor-pointer ${['c2c', 'b2c', 'b2b', 'gov'].includes(marketType) ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-primary'}`}
                >
                  <i className="ri-store-3-line mr-1"></i> Marketplaces <ChevronDown className="inline-block h-4 w-4 ml-1" />
                </div>
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
          </div>
          
          {/* Social button with integrated navigation and messaging */}
          <SocialNav />
          
          {/* Dating button */}
          <div className="flex-1">
            <div
              className="w-full py-4 text-center font-medium text-sm text-gray-600 hover:text-primary relative cursor-pointer"
              onClick={() => setLocation("/dating")}
            >
              <Heart className="inline-block h-4 w-4 mr-1" /> Dating
            </div>
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
        <div className="container mx-auto px-4 py-2 border-b border-gray-200 bg-blue-500">
          <div className="flex overflow-x-auto">
            <div 
              className={`py-2 px-4 text-sm font-medium border-b-2 cursor-pointer ${activeTab === "wall" ? "border-yellow-400 text-yellow-400" : "border-transparent text-white hover:text-white"}`}
              onClick={() => {
                setActiveTab("wall");
                setLocation("/wall");
              }}
              title="Personal timeline showing posts from you and users you follow - API: /api/feed/personal"
            >
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>Wall</span>
              </div>
            </div>
            
            <div 
              className={`py-2 px-4 text-sm font-medium border-b-2 cursor-pointer ${activeTab === "explore" ? "border-yellow-400 text-yellow-400" : "border-transparent text-white hover:text-white"}`}
              onClick={() => {
                setActiveTab("explore");
                setLocation("/explore");
              }}
              title="Discover trending content and suggested users - API: /api/feed/discover and /api/users/recommendations"
            >
              <div className="flex items-center gap-1">
                <Compass className="h-4 w-4" />
                <span>Explore</span>
              </div>
            </div>
            
            <div 
              className={`py-2 px-4 text-sm font-medium border-b-2 relative cursor-pointer ${activeTab === "messages" ? "border-yellow-400 text-yellow-400" : "border-transparent text-white hover:text-white"}`}
              onClick={() => {
                setActiveTab("messages");
                setLocation("/messages");
              }}
              title="Direct messages with other users - API: /api/messages and /api/messages/unread/count"
            >
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>Messages</span>
                {messageData?.count && messageData.count > 0 && (
                  <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {messageData.count}
                  </Badge>
                )}
              </div>
            </div>
            
            <div 
              className={`py-2 px-4 text-sm font-medium border-b-2 cursor-pointer ${activeTab === "videos" ? "border-yellow-400 text-yellow-400" : "border-transparent text-white hover:text-white"}`}
              onClick={() => {
                setActiveTab("videos");
                setLocation("/videos/trending");
              }}
              title="Video content including trending, shorts, stories and live streams - API: /api/videos"
            >
              <div className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                <span>Videos</span>
              </div>
            </div>
            
            <div 
              className={`py-2 px-4 text-sm font-medium border-b-2 cursor-pointer ${activeTab === "communities" ? "border-yellow-400 text-yellow-400" : "border-transparent text-white hover:text-white"}`}
              onClick={() => {
                setActiveTab("communities");
                setLocation("/communities");
              }}
              title="Interest-based groups for discussion and content sharing - API: /api/communities and /api/users/communities"
            >
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Communities</span>
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
