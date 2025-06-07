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
import { Loader2 } from "lucide-react";
import { useStableDOMBatchTranslation } from "@/hooks/use-stable-dom-translation";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const { showLoginPrompt } = useLoginPrompt();
  const [, setLocation] = useLocation();

  // Define translatable texts with stable references for DOM-safe translation
  const userMenuTexts = useMemo(() => [
    "Your Profile",
    "Settings", 
    "Messages",
    "Notifications",
    "Dating Dashboard",
    "Vendor Dashboard",
    "Log out",
    "Logging out...",
    "Login"
  ], []);

  // Use DOM-safe batch translation for optimal performance
  const { translations: translatedUserMenuTexts, isLoading: isTranslating } = useStableDOMBatchTranslation(userMenuTexts, 'instant');

  // Memoize translated values to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    profile: translatedUserMenuTexts["Your Profile"] || "Your Profile",
    settings: translatedUserMenuTexts["Settings"] || "Settings",
    messages: translatedUserMenuTexts["Messages"] || "Messages",
    notifications: translatedUserMenuTexts["Notifications"] || "Notifications",
    datingDashboard: translatedUserMenuTexts["Dating Dashboard"] || "Dating Dashboard",
    vendorDashboard: translatedUserMenuTexts["Vendor Dashboard"] || "Vendor Dashboard",
    logout: translatedUserMenuTexts["Log out"] || "Log out",
    loggingOut: translatedUserMenuTexts["Logging out..."] || "Logging out...",
    login: translatedUserMenuTexts["Login"] || "Login"
  }), [translatedUserMenuTexts]);

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
        className="ml-2"
        onClick={() => showLoginPrompt('login')}
      >
        {translatedLabels.login}
      </Button>
    );
  }

  const handleLogout = () => {
    // Show loading state for better UX
    toast({
      title: t('auth.logging_out') || 'Logging out',
      description: t('auth.please_wait') || 'Please wait...',
    });
    
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        // Toast will be shown on logout success page
        setIsOpen(false);
      },
      onError: (error) => {
        toast({
          title: t('auth.logout_error') || 'Logout Error',
          description: error.message || t('auth.try_again') || 'Please try again',
          variant: "destructive"
        });
        setIsOpen(false);
      }
    });
  };

  const handleSwitchToDashboard = () => {
    setLocation('/vendor-dashboard');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center space-x-1">
        <Link href="/wall">
          <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
            {user?.avatar ? (
              <AvatarImage
                src={sanitizeImageUrl(user.avatar, '/assets/default-avatar.png')}
                alt={user.name || user.username}
              />
            ) : null}
            <AvatarFallback>{getInitials(user?.name || user?.username || '')}</AvatarFallback>
          </Avatar>
        </Link>
        <button onClick={() => setIsOpen(!isOpen)}>
          <i className="ri-arrow-down-s-line text-gray-500 hover:text-gray-700 transition-colors"></i>
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <Link href="/profile-settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i className="ri-user-settings-line mr-2"></i> {translatedLabels.profile}
          </Link>
          <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i className="ri-settings-4-line mr-2"></i> {translatedLabels.settings}
          </Link>
          <Link href="/messages" className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <div className="flex items-center">
              <i className="ri-message-3-line mr-2"></i> {translatedLabels.messages}
            </div>
            {(unreadMessages?.count || 0) > 0 && (
              <Badge className="bg-blue-600 text-white text-xs ml-2">
                {unreadMessages?.count || 0}
              </Badge>
            )}
          </Link>
          <Link href="/notifications" className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <div className="flex items-center">
              <i className="ri-notification-3-line mr-2"></i> {translatedLabels.notifications}
            </div>
            {(unreadNotifications?.count || 0) > 0 && (
              <Badge className="bg-red-600 text-white text-xs ml-2">
                {unreadNotifications?.count || 0}
              </Badge>
            )}
          </Link>
          <Link href="/dating-profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i className="ri-heart-3-line mr-2"></i> {translatedLabels.datingDashboard}
          </Link>
          <button 
            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={handleSwitchToDashboard}
          >
            <i className="ri-store-2-line mr-2"></i> {translatedLabels.vendorDashboard}
          </button>
          <div className="border-t border-gray-100"></div>
          <button
            className="w-full text-left block px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <>
                <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin text-blue-600" /> 
                {translatedLabels.loggingOut}
              </>
            ) : (
              <>
                <i className="ri-logout-box-line mr-2 text-blue-600"></i> {translatedLabels.logout}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
