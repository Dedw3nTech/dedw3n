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

const NotificationsPage = () => {
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: undefined, // Use default fetcher
  });

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
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to mark notification as read: ${error.message}`,
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
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to mark all notifications as read: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button
          className="text-sm text-primary font-medium hover:underline"
          onClick={() => markAllNotificationsReadMutation.mutate()}
          disabled={markAllNotificationsReadMutation.isPending}
        >
          {markAllNotificationsReadMutation.isPending ? (
            <span className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Marking all as read...
            </span>
          ) : (
            "Mark all as read"
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !notifications || !Array.isArray(notifications) || notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-sm">You'll see notifications about activity related to you here</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition duration-150 ${
                  !notification.isRead ? "bg-gray-50" : ""
                }`}
                onClick={() => markNotificationReadMutation.mutate(notification.id)}
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
                    <p className="text-base font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {notification.createdAt &&
                        formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;