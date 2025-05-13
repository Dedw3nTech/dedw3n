import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { sanitizeImageUrl } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center space-x-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar>
          {user?.avatar ? (
            <AvatarImage
              src={sanitizeImageUrl(user.avatar, '/assets/default-avatar.png')}
              alt={user.name || user.username}
            />
          ) : null}
          <AvatarFallback>{getInitials(user?.name || user?.username || '')}</AvatarFallback>
        </Avatar>
        <i className="ri-arrow-down-s-line text-gray-500"></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <Link href={user ? `/profile/${user.username}` : "/profile"} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i className="ri-user-line mr-2"></i> {t('account.profile')}
          </Link>
          <Link href="/profile-settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i className="ri-user-settings-line mr-2"></i> {t('account.profile_settings') || 'Profile Settings'}
          </Link>
          <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i className="ri-settings-4-line mr-2"></i> {t('account.settings')}
          </Link>
          <button 
            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={handleSwitchToDashboard}
          >
            <i className="ri-store-2-line mr-2"></i> {t('vendor.dashboard')}
          </button>
          <div className="border-t border-gray-100"></div>
          <button
            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <>
                <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" /> 
                {t('auth.logging_out') || 'Logging out...'}
              </>
            ) : (
              <>
                <i className="ri-logout-box-line mr-2"></i> {t('auth.logout')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
