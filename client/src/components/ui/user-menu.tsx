import { useState, useRef, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { useQuery } from "@tanstack/react-query";
import { getInitials } from "@/lib/utils";
import { sanitizeImageUrl } from "@/lib/queryClient";
import { Loader2, User, Settings, MessageSquare, Bell, Heart, Store, Shield, LogOut, ChevronDown, Users } from "lucide-react";
import { performUnifiedLogout } from "@/utils/unified-logout-system";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const { showLoginPrompt } = useLoginPrompt();
  const [, setLocation] = useLocation();

  // Define translatable texts for the user menu
  const menuTexts = useMemo(() => [
    "Your Profile",
    "Settings", 
    "Messages",
    "Notifications",
    "Dating Dashboard",
    "Vendor Dashboard",
    "Affiliate Partnership",
    "Admin Centre",
    "Log Out",
    "Log in",
    "Logging out..."
  ], []);

  // Use master translation system for consistent auto-translation
  const { translations: translatedTexts } = useMasterBatchTranslation(menuTexts, 'high');

  // Memoize translated labels to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    yourProfile: translatedTexts[0] || "Your Profile",
    settings: translatedTexts[1] || "Settings",
    messages: translatedTexts[2] || "Messages", 
    notifications: translatedTexts[3] || "Notifications",
    datingDashboard: translatedTexts[4] || "Dating Dashboard",
    vendorDashboard: translatedTexts[5] || "Vendor Dashboard",
    affiliatePartnership: translatedTexts[6] || "Affiliate Partnership",
    adminCentre: translatedTexts[7] || "Admin Centre",
    logout: translatedTexts[8] || "Log Out",
    login: translatedTexts[9] || "Log in",
    loggingOut: translatedTexts[10] || "Logging out..."
  }), [translatedTexts]);

  // Fetch unread message count
  const { data: unreadMessages } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread/count'],
    enabled: user !== null,
  });

  // Fetch unread notifications count
  const { data: unreadNotifications } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread/count'],
    enabled: user !== null,
  });

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // If user is not logged in, show login button
  if (!user) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="ml-2 flex items-center gap-2"
        onClick={() => showLoginPrompt('login')}
      >
        <User className="h-4 w-4" />
        {translatedLabels.login}
      </Button>
    );
  }

  const handleLogout = () => {
    // Close menu and start logout immediately
    setIsOpen(false);
    
    // Start instant logout process (non-blocking)
    performUnifiedLogout({
      redirectToSuccessPage: true,
      clearRememberedCredentials: false,
      broadcastToTabs: true
    }).catch(() => {
      // Silent fail - user already redirected
    });
  };

  const handleSwitchToDashboard = () => {
    setLocation('/vendor-dashboard');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Avatar className="h-8 w-8">
            {user?.avatar ? (
              <AvatarImage
                src={sanitizeImageUrl(user.avatar, '/assets/default-avatar.png')}
                alt={user.name || user.username}
              />
            ) : null}
            <AvatarFallback className="bg-blue-600 text-white text-sm">
              {getInitials(user?.name || user?.username || '')}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          {/* Profile Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {user?.avatar ? (
                  <AvatarImage
                    src={sanitizeImageUrl(user.avatar, '/assets/default-avatar.png')}
                    alt={user.name || user.username}
                  />
                ) : null}
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(user?.name || user?.username || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  @{user?.username}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link 
              href="/profile-settings" 
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4 text-gray-500" />
              {translatedLabels.yourProfile}
            </Link>
            
            <Link 
              href="/settings" 
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4 text-gray-500" />
              {translatedLabels.settings}
            </Link>
            
            <Link 
              href="/messages" 
              className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                {translatedLabels.messages}
              </div>
              {(unreadMessages?.count || 0) > 0 && (
                <Badge className="bg-blue-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {(unreadMessages?.count || 0) > 99 ? "99+" : unreadMessages?.count}
                </Badge>
              )}
            </Link>
            
            <Link 
              href="/notifications" 
              className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-gray-500" />
                {translatedLabels.notifications}
              </div>
              {(unreadNotifications?.count || 0) > 0 && (
                <Badge className="bg-red-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {(unreadNotifications?.count || 0) > 99 ? "99+" : unreadNotifications?.count}
                </Badge>
              )}
            </Link>
            
            <Link 
              href="/dating-profile" 
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Heart className="h-4 w-4 text-gray-500" />
              {translatedLabels.datingDashboard}
            </Link>
            
            <button 
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={handleSwitchToDashboard}
            >
              <Store className="h-4 w-4 text-gray-500" />
              {translatedLabels.vendorDashboard}
            </button>
            
            <Link 
              href="/affiliate-partnership" 
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Users className="h-4 w-4 text-gray-500" />
              {translatedLabels.affiliatePartnership}
            </Link>
            
            {/* Admin Centre - Only visible to admin users */}
            {user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Shield className="h-4 w-4 text-gray-500" />
                {translatedLabels.adminCentre}
              </Link>
            )}
          </div>

          {/* Logout Section */}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {translatedLabels.loggingOut}
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  {translatedLabels.logout}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
