import { Link, useLocation } from "wouter";
import { useMemo } from "react";
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Define translatable texts with stable references
  const mobileNavTexts = useMemo(() => [
    "Finance",
    "Government", 
    "Lifestyle",
    "Services",
    "Marketplace",
    "Community"
  ], []);

  // Use optimized batch translation for optimal performance
  const { translations } = useMasterBatchTranslation(mobileNavTexts, 'normal');
  
  // Check if user has access to Finance section (Admin or Serruti only)
  const hasFinanceAccess = user?.role === 'admin' || user?.username === 'Serruti';
  
  // Check if user has access to Lifestyle section (Admin or Serruti only)
  const hasLifestyleAccess = user?.role === 'admin' || user?.username === 'Serruti';
  
  // Navigation items configuration
  const allNavItems = useMemo(() => [
    { href: "/finance", icon: "ri-bank-line", label: translations[0] || "Finance" },
    { href: "/government", icon: "ri-government-line", label: translations[1] || "Government" },
    { href: "/lifestyle", icon: "ri-heart-pulse-line", label: translations[2] || "Lifestyle" },
    { href: "/services", icon: "ri-customer-service-line", label: translations[3] || "Services" },
    { href: "/marketplace", icon: "ri-store-2-line", label: translations[4] || "Marketplace" },
    { href: "/community", icon: "ri-group-line", label: translations[5] || "Community" }
  ], [translations]);
  
  // Filter out restricted sections for non-authorized users
  const navItems = useMemo(() => 
    allNavItems.filter(item => {
      if (item.href === '/finance') return hasFinanceAccess;
      if (item.href === '/lifestyle') return hasLifestyleAccess;
      return true;
    }),
    [allNavItems, hasFinanceAccess, hasLifestyleAccess]
  );

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-center">
            <div className="flex w-full max-w-lg justify-around px-4">
              {navItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <button
                          className={`py-4 px-2 flex items-center justify-center transition-colors ${
                            isActive ? "text-gray-700" : "text-gray-500"
                          }`}
                          data-testid={`button-nav-${item.label.toLowerCase()}`}
                        >
                          <i className={`${item.icon} text-2xl`}></i>
                        </button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}
