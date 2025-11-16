import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useView } from "@/hooks/use-view";
import { useMarketType } from "@/hooks/use-market-type";
import UserMenu from "../ui/user-menu";
import CurrencyConverter from "../ui/currency-converter";
import { MasterLanguageSelector } from "../ui/MasterLanguageSelector";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "../ui/badge";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import Logo from "../ui/logo";
import { useMessaging } from "@/hooks/use-messaging";
import SocialNav from "@/components/social/SocialNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<{ users: any[], products: any[] }>({ users: [], products: [] });
  
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

  const { translateText } = useMasterTranslation();
  
  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ users: [], products: [] });
      return;
    }

    try {
      // Search users
      const usersResponse = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const users = usersResponse.ok ? await usersResponse.json() : [];

      // Search products  
      const productsResponse = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const products = productsResponse.ok ? await productsResponse.json() : [];

      setSearchResults({ users, products });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ users: [], products: [] });
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearch(value);
  };

  const handleSearchTabClick = () => {
    setActiveTab("search");
    setSearchExpanded(true);
  };
  
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
        <div className="flex justify-between items-center py-3 md:py-4">
          {/* Left side - User Menu and Navigation Icons */}
          <div className="flex items-center gap-2 md:gap-4 lg:gap-6 flex-1">
            <div className="flex items-center gap-2 md:gap-3 lg:gap-4 flex-nowrap">
              <UserMenu />
              <Link href="/cart">
                <a 
                  className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-2 text-gray-700 hover:text-gray-900 transition-colors flex-shrink-0"
                  data-testid="link-cart"
                >
                  <ShoppingBag className="h-5 w-5 md:h-5 md:w-5 lg:h-5 lg:w-5" />
                  <span className="hidden lg:inline text-sm font-medium">{translateText('Cart')}</span>
                  {cartData && cartData.count > 0 && (
                    <Badge className="bg-black text-white text-xs min-w-[18px] h-5 flex items-center justify-center">
                      {cartData.count > 99 ? "99+" : cartData.count}
                    </Badge>
                  )}
                </a>
              </Link>
              <Link href="/messages">
                <a 
                  className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-2 text-gray-700 hover:text-gray-900 transition-colors flex-shrink-0"
                  data-testid="link-messages"
                >
                  <MessageSquare className="h-5 w-5 md:h-5 md:w-5 lg:h-5 lg:w-5" />
                  <span className="hidden lg:inline text-sm font-medium">{translateText('Messages')}</span>
                  {messageData && messageData.count > 0 && (
                    <Badge className="bg-red-600 text-white text-xs min-w-[18px] h-5 flex items-center justify-center">
                      {messageData.count > 99 ? "99+" : messageData.count}
                    </Badge>
                  )}
                </a>
              </Link>
            </div>
          </div>

          {/* Center - Logo */}
          <div className="flex items-center justify-center flex-shrink-0">
            <Logo size="2xl" variant="navigation" />
            <span className="text-xs font-bold text-red-600 ml-2">{translateText("BETA")}</span>
          </div>

          {/* Right side - Language selector */}
          <div className="flex items-center justify-end flex-1">
            <MasterLanguageSelector />
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
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-5 border-b border-gray-200">
          <div className="flex justify-center items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
            <div 
              className="py-2 px-3 md:px-4 cursor-pointer flex-shrink-0"
              onClick={() => {
                setActiveTab("wall");
                setLocation("/wall");
              }}
              title="Personal timeline showing posts from you and users you follow - API: /api/feed/personal"
            >
              <div className={`flex items-center justify-center gap-1.5 md:gap-2 border-b-2 pb-1 ${activeTab === "wall" ? "border-black text-black font-semibold" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                <Home className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base font-medium">{translateText("Wall")}</span>
              </div>
            </div>
            
            <div 
              className="py-2 px-3 md:px-4 cursor-pointer flex-shrink-0"
              onClick={() => {
                setActiveTab("community");
                setLocation("/community");
              }}
              title="Community feed showing all posts from all users on the platform - API: /api/feed/community"
            >
              <div className={`flex items-center justify-center gap-1.5 md:gap-2 border-b-2 pb-1 ${activeTab === "community" ? "border-black text-black font-semibold" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                <i className="ri-group-line text-lg md:text-xl"></i>
                <span className="text-sm md:text-base font-medium">{translateText("Community")}</span>
              </div>
            </div>
            
            <div 
              className="py-2 px-3 md:px-4 cursor-pointer relative flex-shrink-0"
              onClick={handleSearchTabClick}
              title="Search for users and vendors on the platform - API: /api/users/search"
              data-testid="button-search"
            >
              <div className={`flex items-center justify-center gap-1.5 md:gap-2 border-b-2 pb-1 ${activeTab === "search" ? "border-black text-black font-semibold" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                <Search className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base font-medium">Search User</span>
              </div>
              {/* Permanent long straight line below Search text - 3x longer than text */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-10">
                <div 
                  className="bg-black" 
                  style={{ 
                    width: '180px',
                    height: '2px' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search input field - appears when search tab is clicked */}
      {searchExpanded && (
        <div className="container mx-auto px-4 py-4 border-b border-gray-200 bg-gray-50">
          <div className="max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Type to search users and products..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="w-full"
              data-testid="input-search"
              autoFocus
            />
            {/* Search results */}
            {searchQuery && (searchResults.users.length > 0 || searchResults.products.length > 0) && (
              <div className="mt-4 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
                {searchResults.users.length > 0 && (
                  <div className="p-3 border-b">
                    <h4 className="font-semibold text-gray-700 mb-2">Users</h4>
                    {searchResults.users.slice(0, 5).map((user: any) => (
                      <Link key={user.id} href={`/profile/${user.username}`}>
                        <a className="block p-2 hover:bg-gray-100 rounded flex items-center gap-3" data-testid={`link-user-${user.id}`}>
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name || user.username}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.products.length > 0 && (
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-700 mb-2">Products</h4>
                    {searchResults.products.slice(0, 5).map((product: any) => (
                      <Link key={product.id} href={`/products/${product.id}`}>
                        <a className="block p-2 hover:bg-gray-100 rounded flex items-center gap-3" data-testid={`link-product-${product.id}`}>
                          <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                            <Store className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{product.title}</div>
                            <div className="text-sm text-gray-500">${product.price}</div>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            {searchQuery && searchResults.users.length === 0 && searchResults.products.length === 0 && (
              <div className="mt-4 p-4 text-center text-gray-500 bg-white rounded-lg shadow border">
                <div data-testid="text-no-results">No results found for "{searchQuery}"</div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export { Header };
