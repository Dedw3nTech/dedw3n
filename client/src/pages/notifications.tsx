import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { ar, zhCN, cs, da, nl, enUS, fi, fr, de, hu, it, ja, ko, nb, pl, pt, ru, es, sv, tr } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  CheckCircle,
  Heart,
  MessageSquare,
  Users,
  Bell,
  ShoppingCart,
  AlertCircle,
  Star,
  Package,
  DollarSign,
  Loader2,
  Store,
  HeartHandshake,
  LogIn,
  Menu,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import type { Notification } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

// Map language codes to date-fns locales
const getDateFnsLocale = (languageCode: string) => {
  const localeMap: Record<string, Locale> = {
    'AR': ar,
    'ZH': zhCN,
    'CS': cs,
    'DA': da,
    'NL': nl,
    'EN': enUS,
    'FI': fi,
    'FR': fr,
    'DE': de,
    'HU': hu,
    'IT': it,
    'JA': ja,
    'KO': ko,
    'NO': nb,
    'PL': pl,
    'PT': pt,
    'RU': ru,
    'ES': es,
    'SV': sv,
    'TR': tr,
  };
  return localeMap[languageCode] || enUS;
};

// Function to categorize notifications by section
const categorizeNotifications = (notifications: Notification[]) => {
  const all = notifications;
  
  const finance = notifications.filter(n => 
    ['payment', 'order', 'finance'].includes(n.type)
  );
  
  const government = notifications.filter(n => 
    n.type === 'government'
  );
  
  const lifestyle = notifications.filter(n => 
    n.type === 'lifestyle'
  );
  
  const marketplace = notifications.filter(n => {
    if (n.type === 'marketplace') return true;
    if (n.type === 'system' && n.sourceType === 'cart') return true;
    if (n.type === 'system' && n.sourceType === 'product') return true;
    if (n.type === 'system' && n.sourceType === 'order') return true;
    return false;
  });
  
  const community = notifications.filter(n => {
    if (n.type === 'community') return true;
    return ['like', 'comment', 'follow', 'mention', 'message'].includes(n.type);
  });
  
  return { all, finance, government, lifestyle, marketplace, community };
};

// Function to get notification icon based on type
const getNotificationIcon = (type: string) => {
  // Use marketplace (Store) icon for all notifications
  return <Store className="h-4 w-4 text-white" />;
};

// Function to get notification icon style based on type
const getNotificationIconStyle = (type: string) => {
  switch (type) {
    // Community notifications
    case "like":
    case "dating_like":
      return "bg-red-500";
    case "comment":
    case "message":
      return "bg-blue-500";
    case "follow":
    case "connection_request":
      return "bg-green-500";
    case "mention":
      return "bg-purple-500";
    case "post":
    case "community_join":
      return "bg-violet-500";
    
    // Marketplace notifications
    case "order":
    case "order_status":
      return "bg-orange-500";
    case "payment":
      return "bg-emerald-500";
    case "review":
      return "bg-amber-500";
    case "cart":
    case "product_like":
      return "bg-cyan-500";
    case "vendor":
      return "bg-teal-500";
    
    // Dating notifications
    case "match":
      return "bg-pink-500";
    case "super_like":
      return "bg-rose-500";
    case "profile_view":
      return "bg-indigo-500";
    case "tier_upgrade":
    case "boost":
      return "bg-yellow-500";
    
    // System notifications
    case "system":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

// Component for rendering notification items with translation support
const NotificationItem = ({ 
  notification, 
  onMarkRead, 
  translatedTitle, 
  translatedContent,
  locale
}: { 
  notification: Notification; 
  onMarkRead: (id: number) => void;
  translatedTitle?: string;
  translatedContent?: string;
  locale: Locale;
}) => (
  <div
    key={notification.id}
    className={`p-4 hover:bg-gray-50 cursor-pointer transition duration-150 ${
      !notification.isRead ? "bg-gray-100 border-l-4 border-gray-700" : ""
    }`}
    onClick={() => onMarkRead(notification.id)}
  >
    <div className="flex items-start">
      <div
        className={`h-10 w-10 rounded-full ${getNotificationIconStyle(
          notification.type
        )} flex items-center justify-center mr-4 flex-shrink-0`}
      >
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-gray-900">
          {translatedTitle || notification.title || translatedContent || notification.content}
        </p>
        {notification.title && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {translatedContent || notification.content}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          {notification.createdAt &&
            formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale })}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 bg-gray-700 rounded-full flex-shrink-0 mt-2"></div>
      )}
    </div>
  </div>
);

// Component for rendering notification section
const NotificationSection = ({ 
  notifications, 
  isLoading, 
  onMarkRead, 
  emptyMessage,
  noNotificationsText,
  youllSeeText,
  activityHereText,
  translationMap,
  locale
}: {
  notifications: Notification[];
  isLoading: boolean;
  onMarkRead: (id: number) => void;
  emptyMessage: string;
  noNotificationsText: string;
  youllSeeText: string;
  activityHereText: string;
  translationMap: Map<string, string>;
  locale: Locale;
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p className="text-lg font-medium">{noNotificationsText}</p>
        <p className="text-sm">{youllSeeText} {emptyMessage} {activityHereText}</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onMarkRead={onMarkRead}
          translatedTitle={notification.title ? translationMap.get(notification.title) : undefined}
          translatedContent={notification.content ? translationMap.get(notification.content) : undefined}
          locale={locale}
        />
      ))}
    </div>
  );
};

const NotificationsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentLanguage } = useLanguage();

  // Get date-fns locale based on current language
  const dateFnsLocale = useMemo(() => getDateFnsLocale(currentLanguage), [currentLanguage]);

  // Define translatable texts
  const notificationTexts = useMemo(() => [
    "Notifications",
    "Stay updated with your marketplace, community, and dating activities",
    "unread",
    "Mark all as read",
    "Marking all as read...",
    "All Notifications",
    "Finance",
    "Government",
    "Lifestyle",
    "Marketplace",
    "Community",
    "Finance Activity",
    "Payment confirmations, order transactions, and financial updates",
    "Government Activity",
    "Official notices, regulatory updates, and government communications",
    "Lifestyle Activity",
    "Events, wellness, entertainment, and lifestyle updates",
    "Marketplace Activity",
    "Order updates, product reviews, and vendor messages",
    "Community Activity",
    "Likes, comments, follows, mentions, and community interactions",
    "View all your notifications in one place",
    "No new notifications",
    "You'll see",
    "activity here",
    "Success",
    "All notifications marked as read",
    "Error",
    "Failed to mark notification as read",
    "Failed to mark all notifications as read",
    "Session Expired",
    "Your session has expired. Please log in again to view your notifications.",
    "Go to Login",
    "Unable to load notifications",
    "Something went wrong while loading your notifications. Please try again.",
    "Retry",
    "Notification not found",
    "Invalid notification ID",
    "Loading..."
  ], []);

  // Use master translation system
  const { translations } = useMasterBatchTranslation(notificationTexts, 'high');

  // Memoize translated labels
  const t = useMemo(() => ({
    notifications: (translations[0] || "Notifications") as string,
    subtitle: (translations[1] || "Stay updated with your marketplace, community, and dating activities") as string,
    unread: (translations[2] || "unread") as string,
    markAllRead: (translations[3] || "Mark all as read") as string,
    markingAllRead: (translations[4] || "Marking all as read...") as string,
    allNotifications: (translations[5] || "All Notifications") as string,
    finance: (translations[6] || "Finance") as string,
    government: (translations[7] || "Government") as string,
    lifestyle: (translations[8] || "Lifestyle") as string,
    marketplace: (translations[9] || "Marketplace") as string,
    community: (translations[10] || "Community") as string,
    financeActivity: (translations[11] || "Finance Activity") as string,
    financeDesc: (translations[12] || "Payment confirmations, order transactions, and financial updates") as string,
    governmentActivity: (translations[13] || "Government Activity") as string,
    governmentDesc: (translations[14] || "Official notices, regulatory updates, and government communications") as string,
    lifestyleActivity: (translations[15] || "Lifestyle Activity") as string,
    lifestyleDesc: (translations[16] || "Events, wellness, entertainment, and lifestyle updates") as string,
    marketplaceActivity: (translations[17] || "Marketplace Activity") as string,
    marketplaceDesc: (translations[18] || "Order updates, product reviews, and vendor messages") as string,
    communityActivity: (translations[19] || "Community Activity") as string,
    communityDesc: (translations[20] || "Likes, comments, follows, mentions, and community interactions") as string,
    viewAllDesc: (translations[21] || "View all your notifications in one place") as string,
    noNotifications: (translations[22] || "No new notifications") as string,
    youllSee: (translations[23] || "You'll see") as string,
    activityHere: (translations[24] || "activity here") as string,
    success: (translations[25] || "Success") as string,
    allMarkedRead: (translations[26] || "All notifications marked as read") as string,
    error: (translations[27] || "Error") as string,
    failedMarkRead: (translations[28] || "Failed to mark notification as read") as string,
    failedMarkAllRead: (translations[29] || "Failed to mark all notifications as read") as string,
    sessionExpired: (translations[30] || "Session Expired") as string,
    sessionExpiredDesc: (translations[31] || "Your session has expired. Please log in again to view your notifications.") as string,
    goToLogin: (translations[32] || "Go to Login") as string,
    unableToLoad: (translations[33] || "Unable to load notifications") as string,
    somethingWrong: (translations[34] || "Something went wrong while loading your notifications. Please try again.") as string,
    retry: (translations[35] || "Retry") as string,
    notificationNotFound: (translations[36] || "Notification not found") as string,
    invalidNotificationId: (translations[37] || "Invalid notification ID") as string,
    loading: (translations[38] || "Loading...") as string
  }), [translations]);

  // Fetch all notifications with proper error handling
  const { data: allNotifications, isLoading, error, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
  });

  // Check for authentication error
  const isAuthError = error && (error as any)?.status === 401;
  
  // Categorize notifications safely
  const categorizedNotifications = useMemo(() => {
    if (!allNotifications || !Array.isArray(allNotifications)) {
      return { all: [], finance: [], government: [], lifestyle: [], marketplace: [], community: [] };
    }
    return categorizeNotifications(allNotifications);
  }, [allNotifications]);

  // Extract unique notification content strings for translation
  const notificationContentStrings = useMemo(() => {
    if (!allNotifications || !Array.isArray(allNotifications)) return [];
    
    const uniqueStrings = new Set<string>();
    allNotifications.forEach(notification => {
      if (notification.title) uniqueStrings.add(notification.title);
      if (notification.content) uniqueStrings.add(notification.content);
    });
    
    return Array.from(uniqueStrings);
  }, [allNotifications]);

  // Translate notification content
  const { translations: contentTranslations } = useMasterBatchTranslation(
    notificationContentStrings,
    'high'
  );

  // Create translation map for efficient lookup
  const translationMap = useMemo(() => {
    const map = new Map<string, string>();
    notificationContentStrings.forEach((originalText, index) => {
      const translatedText = contentTranslations[index];
      if (translatedText) {
        map.set(originalText, translatedText);
      }
    });
    return map;
  }, [notificationContentStrings, contentTranslations]);

  // Mutation to mark notification as read
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest('POST', `/api/notifications/${notificationId}/read`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread/count"] });
    },
    onError: (error: any) => {
      const statusCode = error?.status;
      let errorMessage = t.failedMarkRead;
      
      if (statusCode === 401) {
        errorMessage = t.sessionExpiredDesc;
      } else if (statusCode === 404) {
        errorMessage = t.notificationNotFound;
      } else if (statusCode === 400) {
        errorMessage = t.invalidNotificationId;
      }
      
      toast({
        title: t.error,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation to mark all notifications as read
  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', "/api/notifications/read-all");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread/count"] });
      toast({
        title: t.success,
        description: t.allMarkedRead,
      });
    },
    onError: (error: any) => {
      const statusCode = error?.status;
      let errorMessage = t.failedMarkAllRead;
      
      if (statusCode === 401) {
        errorMessage = t.sessionExpiredDesc;
      }
      
      toast({
        title: t.error,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Calculate total unread count safely
  const totalUnread = useMemo(() => {
    if (!allNotifications || !Array.isArray(allNotifications)) return 0;
    return allNotifications.filter((n) => !n.isRead).length;
  }, [allNotifications]);

  // Show authentication error state
  if (isAuthError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4" data-testid="alert-auth-error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t.sessionExpired}</AlertTitle>
            <AlertDescription>{t.sessionExpiredDesc}</AlertDescription>
          </Alert>
          <Link href="/login">
            <Button className="w-full" data-testid="link-login">
              <LogIn className="mr-2 h-4 w-4" />
              {t.goToLogin}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show generic error state with retry
  if (error && !isAuthError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4" data-testid="alert-error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t.unableToLoad}</AlertTitle>
            <AlertDescription>{t.somethingWrong}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => refetch()} 
            className="w-full" 
            disabled={isLoading}
            data-testid="button-retry"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.loading}
              </>
            ) : (
              <>
                {t.retry}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full">
        <div className="bg-white overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t.notifications}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {t.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {totalUnread > 0 && (
                  <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                    {totalUnread} {t.unread}
                  </span>
                )}
                {allNotifications && Array.isArray(allNotifications) && allNotifications.length > 0 ? (
                  <button
                    onClick={() => markAllNotificationsReadMutation.mutate()}
                    disabled={markAllNotificationsReadMutation.isPending}
                    className="px-3 md:px-4 py-2 text-xs md:text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                    data-testid="button-mark-all-read"
                  >
                    {markAllNotificationsReadMutation.isPending ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="hidden md:inline">{t.markingAllRead}</span>
                      </div>
                    ) : (
                      <span className="hidden md:inline">{t.markAllRead}</span>
                    )}
                    <span className="md:hidden">✓</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden border-b border-gray-200">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-gray-50"
              data-testid="button-mobile-menu"
            >
              <div className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                <span className="font-medium">
                  {activeTab === "all" && t.allNotifications}
                  {activeTab === "finance" && t.finance}
                  {activeTab === "government" && t.government}
                  {activeTab === "lifestyle" && t.lifestyle}
                  {activeTab === "marketplace" && t.marketplace}
                  {activeTab === "community" && t.community}
                </span>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileMenuOpen && (
              <div className="border-t divide-y bg-white">
                <button
                  onClick={() => {
                    setActiveTab("all");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    activeTab === "all" ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  data-testid="mobile-menu-all"
                >
                  <span className="text-sm font-medium">{t.allNotifications}</span>
                  {categorizedNotifications.all.filter(n => !n.isRead).length > 0 && (
                    <span className="bg-black text-white text-xs rounded-full px-2 py-0.5">
                      {categorizedNotifications.all.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("finance");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    activeTab === "finance" ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  data-testid="mobile-menu-finance"
                >
                  <span className="text-sm font-medium">{t.finance}</span>
                  {categorizedNotifications.finance.filter(n => !n.isRead).length > 0 && (
                    <span className="bg-black text-white text-xs rounded-full px-2 py-0.5">
                      {categorizedNotifications.finance.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("government");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    activeTab === "government" ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  data-testid="mobile-menu-government"
                >
                  <span className="text-sm font-medium">{t.government}</span>
                  {categorizedNotifications.government.filter(n => !n.isRead).length > 0 && (
                    <span className="bg-black text-white text-xs rounded-full px-2 py-0.5">
                      {categorizedNotifications.government.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("lifestyle");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    activeTab === "lifestyle" ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  data-testid="mobile-menu-lifestyle"
                >
                  <span className="text-sm font-medium">{t.lifestyle}</span>
                  {categorizedNotifications.lifestyle.filter(n => !n.isRead).length > 0 && (
                    <span className="bg-black text-white text-xs rounded-full px-2 py-0.5">
                      {categorizedNotifications.lifestyle.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("marketplace");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    activeTab === "marketplace" ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  data-testid="mobile-menu-marketplace"
                >
                  <span className="text-sm font-medium">{t.marketplace}</span>
                  {categorizedNotifications.marketplace.filter(n => !n.isRead).length > 0 && (
                    <span className="bg-black text-white text-xs rounded-full px-2 py-0.5">
                      {categorizedNotifications.marketplace.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("community");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    activeTab === "community" ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  data-testid="mobile-menu-community"
                >
                  <span className="text-sm font-medium">{t.community}</span>
                  {categorizedNotifications.community.filter(n => !n.isRead).length > 0 && (
                    <span className="bg-black text-white text-xs rounded-full px-2 py-0.5">
                      {categorizedNotifications.community.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Tabbed Notifications */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="hidden md:grid w-full grid-cols-6 bg-white border-b p-0">
              <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black" data-testid="tab-all-notifications">
                {t.allNotifications}
                {categorizedNotifications.all.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-black text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {categorizedNotifications.all.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="finance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black" data-testid="tab-finance">
                {t.finance}
                {categorizedNotifications.finance.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-black text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {categorizedNotifications.finance.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="government" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black" data-testid="tab-government">
                {t.government}
                {categorizedNotifications.government.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-black text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {categorizedNotifications.government.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="lifestyle" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black" data-testid="tab-lifestyle">
                {t.lifestyle}
                {categorizedNotifications.lifestyle.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-black text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {categorizedNotifications.lifestyle.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black" data-testid="tab-marketplace">
                {t.marketplace}
                {categorizedNotifications.marketplace.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-black text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {categorizedNotifications.marketplace.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="community" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black" data-testid="tab-community">
                {t.community}
                {categorizedNotifications.community.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-black text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {categorizedNotifications.community.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="p-4 md:p-6 pt-4">
              <div className="mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{t.allNotifications}</h3>
                <p className="text-sm text-gray-600">
                  {t.viewAllDesc}
                </p>
              </div>
              <NotificationSection
                notifications={categorizedNotifications.all}
                isLoading={isLoading}
                onMarkRead={(id) => markNotificationReadMutation.mutate(id)}
                emptyMessage={t.allNotifications.toLowerCase()}
                noNotificationsText={t.noNotifications}
                youllSeeText={t.youllSee}
                activityHereText={t.activityHere}
                translationMap={translationMap}
                locale={dateFnsLocale}
              />
            </TabsContent>

            <TabsContent value="finance" className="p-4 md:p-6 pt-4">
              <div className="mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{t.financeActivity}</h3>
                <p className="text-sm text-gray-600">
                  {t.financeDesc}
                </p>
              </div>
              <NotificationSection
                notifications={categorizedNotifications.finance}
                isLoading={isLoading}
                onMarkRead={(id) => markNotificationReadMutation.mutate(id)}
                emptyMessage={t.finance.toLowerCase()}
                noNotificationsText={t.noNotifications}
                youllSeeText={t.youllSee}
                activityHereText={t.activityHere}
                translationMap={translationMap}
                locale={dateFnsLocale}
              />
            </TabsContent>

            <TabsContent value="government" className="p-4 md:p-6 pt-4">
              <div className="mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{t.governmentActivity}</h3>
                <p className="text-sm text-gray-600">
                  {t.governmentDesc}
                </p>
              </div>
              <NotificationSection
                notifications={categorizedNotifications.government}
                isLoading={isLoading}
                onMarkRead={(id) => markNotificationReadMutation.mutate(id)}
                emptyMessage={t.government.toLowerCase()}
                noNotificationsText={t.noNotifications}
                youllSeeText={t.youllSee}
                activityHereText={t.activityHere}
                translationMap={translationMap}
                locale={dateFnsLocale}
              />
            </TabsContent>

            <TabsContent value="lifestyle" className="p-4 md:p-6 pt-4">
              <div className="mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{t.lifestyleActivity}</h3>
                <p className="text-sm text-gray-600">
                  {t.lifestyleDesc}
                </p>
              </div>
              <NotificationSection
                notifications={categorizedNotifications.lifestyle}
                isLoading={isLoading}
                onMarkRead={(id) => markNotificationReadMutation.mutate(id)}
                emptyMessage={t.lifestyle.toLowerCase()}
                noNotificationsText={t.noNotifications}
                youllSeeText={t.youllSee}
                activityHereText={t.activityHere}
                translationMap={translationMap}
                locale={dateFnsLocale}
              />
            </TabsContent>

            <TabsContent value="marketplace" className="p-4 md:p-6 pt-4">
              <div className="mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{t.marketplaceActivity}</h3>
                <p className="text-sm text-gray-600">
                  {t.marketplaceDesc}
                </p>
              </div>
              <NotificationSection
                notifications={categorizedNotifications.marketplace}
                isLoading={isLoading}
                onMarkRead={(id) => markNotificationReadMutation.mutate(id)}
                emptyMessage={t.marketplace.toLowerCase()}
                noNotificationsText={t.noNotifications}
                youllSeeText={t.youllSee}
                activityHereText={t.activityHere}
                translationMap={translationMap}
                locale={dateFnsLocale}
              />
            </TabsContent>

            <TabsContent value="community" className="p-4 md:p-6 pt-4">
              <div className="mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{t.communityActivity}</h3>
                <p className="text-sm text-gray-600">
                  {t.communityDesc}
                </p>
              </div>
              <NotificationSection
                notifications={categorizedNotifications.community}
                isLoading={isLoading}
                onMarkRead={(id) => markNotificationReadMutation.mutate(id)}
                emptyMessage={t.community.toLowerCase()}
                noNotificationsText={t.noNotifications}
                youllSeeText={t.youllSee}
                activityHereText={t.activityHere}
                translationMap={translationMap}
                locale={dateFnsLocale}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;