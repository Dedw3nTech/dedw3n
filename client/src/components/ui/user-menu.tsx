import { useState, useMemo, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInitials } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useOfflineStore } from "@/lib/offline";
import { UserAvatar } from "@/components/ui/user-avatar";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProxyAccounts, setShowProxyAccounts] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { showLoginPrompt } = useLoginPrompt();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Subscribe to user data changes for instant avatar updates
  const { data: userData } = useQuery<any>({
    queryKey: ['/api/user'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - rely on cache invalidation for updates
    placeholderData: (previousData: any) => previousData ?? user, // Keep previous data during refetch
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch on mount - use cache invalidation instead
    refetchOnWindowFocus: false, // Don't refetch on focus - rely on cache invalidation
  });
  
  // Use fresh user data if available, fallback to auth user
  const currentUser = (userData || user) as any;

  // Define translatable texts for the user menu
  const menuTexts = useMemo(() => [
    "Profile",
    "Settings", 
    "Notifications",
    "Calendar",
    "Affiliate Partnership",
    "Admin Centre",
    "Log Out",
    "Account",
    "Logging out...",
    "Account Menu",
    "Switch Account",
    "Main Account",
    "kids",
    "company",
    "organization",
    "pending",
    "active",
    "suspended",
    "Offline Mode",
    "Offline Mode Active",
    "Percentage Calculator"
  ], []);

  // Use master translation system for consistent auto-translation
  const { translations: translatedTexts } = useMasterBatchTranslation(menuTexts, 'high');

  // Memoize translated labels to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    yourProfile: translatedTexts[0] || "Profile",
    settings: translatedTexts[1] || "Settings",
    notifications: translatedTexts[2] || "Notifications",
    calendar: translatedTexts[3] || "Calendar",
    affiliatePartnership: translatedTexts[4] || "Affiliate Partnership",
    adminCentre: translatedTexts[5] || "Admin Centre",
    logout: translatedTexts[6] || "Log Out",
    login: translatedTexts[7] || "Account",
    loggingOut: translatedTexts[8] || "Logging out...",
    accountMenu: translatedTexts[9] || "Account Menu",
    switchAccount: translatedTexts[10] || "Switch Account",
    mainAccount: translatedTexts[11] || "Main Account",
    kids: translatedTexts[12] || "kids",
    company: translatedTexts[13] || "company",
    organization: translatedTexts[14] || "organization",
    pending: translatedTexts[15] || "pending",
    active: translatedTexts[16] || "active",
    suspended: translatedTexts[17] || "suspended",
    offlineMode: translatedTexts[18] || "Offline Mode",
    offlineModeActive: translatedTexts[19] || "Offline Mode Active",
    percentageCalculator: translatedTexts[20] || "Percentage Calculator"
  }), [translatedTexts]);

  // Helper function to translate account type and status dynamically
  const translateAccountField = useMemo(() => (field: string): string => {
    const fieldLower = field?.toLowerCase();
    return (translatedLabels as any)[fieldLower] || field;
  }, [translatedLabels]);

  // Fetch unread notifications count
  const { data: unreadNotifications } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread/count'],
    enabled: user !== null,
  });

  // Fetch calendar notifications count
  const { data: calendarNotifications } = useQuery<{ count: number }>({
    queryKey: ['/api/calendar/notifications/count'],
    enabled: user !== null,
  });

  // Fetch proxy accounts
  const { data: proxyAccounts = [] } = useQuery<any[]>({
    queryKey: ['/api/proxy-accounts'],
    enabled: user !== null,
  });

  // Fetch parent user data (for showing in switch account list)
  const { data: parentUser } = useQuery<any>({
    queryKey: ['/api/user/parent'],
    enabled: user !== null && (user as any)?.isProxyAccount === true,
  });

  // Filter out current account from switch options
  const availableAccounts = useMemo(() => {
    return proxyAccounts.filter((account: any) => account.id !== currentUser?.id);
  }, [proxyAccounts, currentUser?.id]);

  // Switch account mutation
  const switchAccountMutation = useMutation({
    mutationFn: async (proxyAccountId: number) => {
      const response = await apiRequest("POST", "/api/proxy-accounts/switch", { proxyAccountId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setShowProxyAccounts(false);
      setIsOpen(false);
      toast({
        title: "Account Switched",
        description: "Successfully switched to the selected account",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch account",
        variant: "destructive",
      });
    },
  });

  // Switch back to parent account mutation
  const switchBackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/proxy-accounts/switch-back");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setShowProxyAccounts(false);
      setIsOpen(false);
      toast({
        title: "Account Switched",
        description: "Successfully switched back to main account",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch back to main account",
        variant: "destructive",
      });
    },
  });


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
    setIsOpen(false);
    logoutMutation.mutate();
  };

  // Offline mode state
  const { isOnline, setOnlineStatus, isWarmingCache, lastCacheWarmUp } = useOfflineStore();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
          <UserAvatar 
            userId={currentUser?.id} 
            username={currentUser?.username} 
            size="sm"
          />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-white">
        <SheetHeader>
          <SheetTitle className="text-black">{translatedLabels.accountMenu}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col space-y-4">
          {/* Profile Header */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <SheetClose asChild>
              <Link href="/profile-settings#profile-picture" title="Update your profile photo">
                <UserAvatar 
                  userId={currentUser?.id} 
                  username={currentUser?.username} 
                  size="lg"
                  className="cursor-pointer ring-2 ring-transparent hover:ring-blue-500 hover:ring-offset-2 transition-all duration-200"
                />
              </Link>
            </SheetClose>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">
                {currentUser?.name || currentUser?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                @{currentUser?.username}
              </p>
            </div>
          </div>

          {/* Switch Account Section */}
          {(availableAccounts.length > 0 || ((currentUser as any)?.isProxyAccount && parentUser)) && (
            <>
              <div className="space-y-2">
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setShowProxyAccounts(!showProxyAccounts)}
                >
                  <span>{translatedLabels.switchAccount}</span>
                </button>
                
                {showProxyAccounts && (
                  <div className="space-y-1 pl-3">
                    {/* Show parent account if currently viewing proxy account */}
                    {(currentUser as any)?.isProxyAccount && parentUser && (
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-black hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                        onClick={() => switchBackMutation.mutate()}
                        disabled={switchBackMutation.isPending}
                      >
                        <UserAvatar userId={parentUser.id} username={parentUser.username} size="sm" className="flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium truncate">{parentUser.name || parentUser.username}</p>
                          <p className="text-xs text-gray-500">{translatedLabels.mainAccount}</p>
                        </div>
                      </button>
                    )}
                    
                    {/* Show available proxy accounts (excluding current) */}
                    {availableAccounts.map((account: any) => (
                      <button
                        key={account.id}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-black hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                        onClick={() => switchAccountMutation.mutate(account.id)}
                        disabled={switchAccountMutation.isPending}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={account.profilePicture} alt={account.accountName} />
                          <AvatarFallback className="bg-black text-white text-xs">
                            {account.accountName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium truncate">{account.accountName}</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {translateAccountField(account.accountType)} • {translateAccountField(account.status)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Menu Items */}
          <div className="space-y-1">
            <SheetClose asChild>
              <Link href="/profile-settings">
                <span className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-black hover:bg-gray-50 hover:text-black transition-colors cursor-pointer">
                  {translatedLabels.yourProfile}
                </span>
              </Link>
            </SheetClose>
            
            <SheetClose asChild>
              <Link href="/settings">
                <span className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-black hover:bg-gray-50 hover:text-black transition-colors cursor-pointer">
                  {translatedLabels.settings}
                </span>
              </Link>
            </SheetClose>
            
            <SheetClose asChild>
              <Link href="/notifications">
                <span className="flex items-center justify-between px-3 py-3 rounded-md text-sm font-medium text-black hover:bg-gray-50 hover:text-black transition-colors cursor-pointer">
                  <span>{translatedLabels.notifications}</span>
                  {(unreadNotifications?.count || 0) > 0 && (
                    <Badge className="bg-black text-white text-xs min-w-[20px] h-5">
                      {(unreadNotifications?.count || 0) > 99 ? "99+" : unreadNotifications?.count}
                    </Badge>
                  )}
                </span>
              </Link>
            </SheetClose>
            
            <SheetClose asChild>
              <Link href="/affiliate-partnership">
                <span className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-black hover:bg-gray-50 hover:text-black transition-colors cursor-pointer">
                  {translatedLabels.affiliatePartnership}
                </span>
              </Link>
            </SheetClose>
            
            {user?.role === 'admin' && (
              <SheetClose asChild>
                <Link href="/admin-control-center">
                  <span className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-black hover:bg-gray-50 hover:text-black transition-colors cursor-pointer">
                    {translatedLabels.adminCentre}
                  </span>
                </Link>
              </SheetClose>
            )}
          </div>

          <Separator />

          {/* Meetings Section */}
          <div className="space-y-1">
            <SheetClose asChild>
              <Link href="/erp">
                <span className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-black hover:bg-white hover:text-black transition-colors cursor-pointer" data-testid="link-erp">
                  ERP
                </span>
              </Link>
            </SheetClose>
            
            <SheetClose asChild>
              <Link href="/crm">
                <span className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-black hover:bg-white hover:text-black transition-colors cursor-pointer" data-testid="link-crm">
                  CRM
                </span>
              </Link>
            </SheetClose>
            
            <SheetClose asChild>
              <Link href="/calendar" data-testid="link-calendar">
                <span className="flex items-center justify-between px-3 py-3 rounded-md text-sm font-medium text-black hover:bg-white hover:text-black transition-colors cursor-pointer">
                  <span>{translatedLabels.calendar}</span>
                  {(calendarNotifications?.count || 0) > 0 && (
                    <Badge className="bg-black text-white text-xs min-w-[20px] h-5">
                      {(calendarNotifications?.count || 0) > 99 ? "99+" : calendarNotifications?.count}
                    </Badge>
                  )}
                </span>
              </Link>
            </SheetClose>
            
            <SheetClose asChild>
              <Link href="/meetings/new">
                <span className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-black hover:bg-white hover:text-black transition-colors cursor-pointer" data-testid="link-new-meeting">
                  New Meeting
                </span>
              </Link>
            </SheetClose>
          </div>

          <Separator />

          {/* Offline Mode Toggle */}
          <div>
            <button
              type="button"
              role="switch"
              aria-checked={!isOnline}
              onClick={() => setOnlineStatus(!isOnline)}
              disabled={isWarmingCache}
              className="w-full flex items-center justify-between text-sm font-medium text-black hover:bg-gray-50 rounded-md px-3 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-offline-toggle"
            >
              <div className="flex items-center gap-2">
                {isOnline ? translatedLabels.offlineMode : translatedLabels.offlineModeActive}
                {isWarmingCache && (
                  <span className="text-xs text-gray-500">(Caching...)</span>
                )}
              </div>
              <div
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out ${
                  isOnline ? 'bg-gray-300' : 'bg-black'
                }`}
                aria-hidden="true"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isOnline ? 'translate-x-0.5' : 'translate-x-4'
                  } mt-0.5`}
                />
              </div>
            </button>
          </div>

          {/* Percentage Calculator Link */}
          <SheetClose asChild>
            <Link href="/percentage-calculator">
              <span className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-black hover:bg-gray-50 hover:text-black transition-colors cursor-pointer">
                {translatedLabels.percentageCalculator}
              </span>
            </Link>
          </SheetClose>

          <Separator />

          {/* Logout Button */}
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-medium text-black hover:text-black hover:bg-gray-50"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? translatedLabels.loggingOut : translatedLabels.logout}
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
