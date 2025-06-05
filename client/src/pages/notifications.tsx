import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { queryClient } from "@/lib/queryClient";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Function to categorize notifications by section
const categorizeNotifications = (notifications: any[]) => {
  const marketplace = notifications.filter(n => 
    ['order', 'order_status', 'payment', 'review', 'cart', 'product_like', 'vendor'].includes(n.type)
  );
  
  const community = notifications.filter(n => 
    ['like', 'comment', 'follow', 'mention', 'connection_request', 'post', 'community_join'].includes(n.type)
  );
  
  const dating = notifications.filter(n => 
    ['match', 'message', 'profile_view', 'tier_upgrade', 'dating_like', 'super_like', 'boost'].includes(n.type)
  );
  
  return { marketplace, community, dating };
};

// Function to get notification icon based on type
const getNotificationIcon = (type: string) => {
  switch (type) {
    // Community notifications
    case "like":
    case "dating_like":
      return <Heart className="h-4 w-4 text-white" />;
    case "comment":
      return <MessageSquare className="h-4 w-4 text-white" />;
    case "follow":
    case "connection_request":
      return <Users className="h-4 w-4 text-white" />;
    case "mention":
      return <Bell className="h-4 w-4 text-white" />;
    
    // Marketplace notifications
    case "order":
    case "order_status":
      return <Package className="h-4 w-4 text-white" />;
    case "payment":
      return <DollarSign className="h-4 w-4 text-white" />;
    case "review":
      return <Star className="h-4 w-4 text-white" />;
    case "cart":
    case "product_like":
      return <ShoppingCart className="h-4 w-4 text-white" />;
    case "vendor":
      return <Store className="h-4 w-4 text-white" />;
    
    // Dating notifications
    case "match":
    case "super_like":
      return <HeartHandshake className="h-4 w-4 text-white" />;
    case "message":
      return <MessageSquare className="h-4 w-4 text-white" />;
    case "profile_view":
      return <Users className="h-4 w-4 text-white" />;
    case "tier_upgrade":
    case "boost":
      return <Star className="h-4 w-4 text-white" />;
    
    // System notifications
    case "system":
      return <AlertCircle className="h-4 w-4 text-white" />;
    default:
      return <Bell className="h-4 w-4 text-white" />;
  }
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

// Component for rendering notification items
const NotificationItem = ({ notification, onMarkRead }: { 
  notification: any; 
  onMarkRead: (id: number) => void; 
}) => (
  <div
    key={notification.id}
    className={`p-4 hover:bg-gray-50 cursor-pointer transition duration-150 ${
      !notification.isRead ? "bg-blue-50 border-l-4 border-blue-500" : ""
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
          {notification.title || notification.content}
        </p>
        {notification.title && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.content}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          {notification.createdAt &&
            formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
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
  emptyIcon: EmptyIcon
}: {
  notifications: any[];
  isLoading: boolean;
  onMarkRead: (id: number) => void;
  emptyMessage: string;
  emptyIcon: any;
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
        <EmptyIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No {emptyMessage} notifications</p>
        <p className="text-sm">You'll see {emptyMessage} activity here</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {notifications.map((notification: any) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onMarkRead={onMarkRead} 
        />
      ))}
    </div>
  );
};

const NotificationsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("marketplace");

  // Fetch all notifications
  const { data: allNotifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: undefined, // Use default fetcher
  });

  // Categorize notifications
  const categorizedNotifications = allNotifications && Array.isArray(allNotifications)
    ? categorizeNotifications(allNotifications) 
    : { marketplace: [], community: [], dating: [] };

  // Debug logging
  console.log('All notifications:', allNotifications);
  console.log('Categorized notifications:', categorizedNotifications);

  // Mutation to mark notification as read
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread/count"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Mutation to mark all notifications as read
  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread/count"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  // Calculate total unread count
  const totalUnread = allNotifications && Array.isArray(allNotifications)
    ? allNotifications.filter((n: any) => !n.isRead).length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Stay updated with your marketplace, community, and dating activities
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {totalUnread > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {totalUnread} unread
                  </span>
                )}
                {allNotifications && allNotifications.length > 0 && (
                  <button
                    onClick={() => markAllNotificationsReadMutation.mutate()}
                    disabled={markAllNotificationsReadMutation.isPending}
                    className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {markAllNotificationsReadMutation.isPending ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Marking all as read...
                      </div>
                    ) : (
                      "Mark all as read"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabbed Notifications */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 m-6 mb-0">
              <TabsTrigger value="marketplace" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Marketplace
                {categorizedNotifications.marketplace.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {categorizedNotifications.marketplace.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Community
                {categorizedNotifications.community.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {categorizedNotifications.community.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="dating" className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4" />
                Dating
                {categorizedNotifications.dating.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    {categorizedNotifications.dating.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marketplace" className="p-6 pt-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketplace Activity</h3>
                <p className="text-sm text-gray-600">
                  Order updates, payment confirmations, product reviews, and vendor messages
                </p>
              </div>
              <NotificationSection
                notifications={categorizedNotifications.marketplace}
                isLoading={isLoading}
                onMarkRead={(id) => markNotificationReadMutation.mutate(id)}
                emptyMessage="marketplace"
                emptyIcon={Store}
              />
            </TabsContent>

            <TabsContent value="community" className="p-6 pt-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Activity</h3>
                <p className="text-sm text-gray-600">
                  Likes, comments, follows, mentions, and community interactions
                </p>
              </div>
              <NotificationSection
                notifications={categorizedNotifications.community}
                isLoading={isLoading}
                onMarkRead={(id) => markNotificationReadMutation.mutate(id)}
                emptyMessage="community"
                emptyIcon={Users}
              />
            </TabsContent>

            <TabsContent value="dating" className="p-6 pt-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Dating Activity</h3>
                <p className="text-sm text-gray-600">
                  Matches, messages, profile views, tier upgrades, and dating interactions
                </p>
              </div>
              <NotificationSection
                notifications={categorizedNotifications.dating}
                isLoading={isLoading}
                onMarkRead={(id) => markNotificationReadMutation.mutate(id)}
                emptyMessage="dating"
                emptyIcon={HeartHandshake}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;