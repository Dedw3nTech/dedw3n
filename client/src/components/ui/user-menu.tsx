import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
    toast({
      title: t('auth.logout'),
      description: t('auth.logout') + " " + t('misc.success').toLowerCase(),
    });
    setIsOpen(false);
  };

  const handleSwitchToDashboard = () => {
    toast({
      title: t('vendor.dashboard'),
      description: t('vendor.dashboard') + " " + t('misc.success').toLowerCase(),
    });
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
          <AvatarImage
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
            alt="User profile"
          />
          <AvatarFallback>UN</AvatarFallback>
        </Avatar>
        <i className="ri-arrow-down-s-line text-gray-500"></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <Link href="/profile">
            <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <i className="ri-user-line mr-2"></i> {t('account.profile')}
            </a>
          </Link>
          <Link href="/settings">
            <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <i className="ri-settings-4-line mr-2"></i> {t('account.settings')}
            </a>
          </Link>
          <button 
            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={handleSwitchToDashboard}
          >
            <i className="ri-store-2-line mr-2"></i> {t('vendor.dashboard')}
          </button>
          <div className="border-t border-gray-100"></div>
          <button
            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <i className="ri-logout-box-line mr-2"></i> {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
