import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMessaging } from "@/hooks/use-messaging";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import SocialMessaging from "@/components/messaging/SocialMessaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  Home,
  Search,
  User,
  MessageCircle,
  Bell,
  Heart,
  Video,
  Flame,
  LayoutGrid,
  BookOpen,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  PlusCircle
} from "lucide-react";

export default function SocialNav() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("navigation");
  
  // Get unread message count
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user,
  });

  // Get unread notifications count
  const { data: notificationData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    enabled: !!user,
  });

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex-1 py-4 text-center font-medium text-sm focus:outline-none text-gray-600 hover:text-primary relative">
          <i className="ri-group-line mr-1"></i> Social
          {messageData && messageData.count > 0 && (
            <Badge className="absolute top-1 right-1/4 w-4 h-4 p-0 flex items-center justify-center">
              {messageData.count}
            </Badge>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 flex flex-col">
        <Tabs 
          defaultValue="navigation" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <TabsList className="grid grid-cols-2 p-0 bg-transparent">
            <TabsTrigger 
              value="navigation" 
              className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none py-3"
            >
              Social Navigation
            </TabsTrigger>
            <TabsTrigger 
              value="messaging" 
              className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none py-3 relative"
            >
              Messages
              {messageData && messageData.count > 0 && (
                <Badge className="absolute top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center">
                  {messageData.count}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Social Navigation Tab */}
          <TabsContent value="navigation" className="flex-1 flex flex-col">
            <SheetHeader className="px-6 pt-6 pb-3">
              <SheetTitle>Social</SheetTitle>
              <SheetDescription>
                Explore, connect, and share with your network
              </SheetDescription>
            </SheetHeader>
            
            <ScrollArea className="flex-1">
              <div className="px-6 py-4">
                {user && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-14 w-14">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name || "User"} />
                        ) : null}
                        <AvatarFallback className="text-lg">
                          {getInitials(user.name || "User")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-sm mb-2">
                      <div className="bg-muted rounded-md p-2">
                        <div className="font-semibold">128</div>
                        <div className="text-xs text-muted-foreground">Posts</div>
                      </div>
                      <div className="bg-muted rounded-md p-2">
                        <div className="font-semibold">843</div>
                        <div className="text-xs text-muted-foreground">Following</div>
                      </div>
                      <div className="bg-muted rounded-md p-2">
                        <div className="font-semibold">2.4k</div>
                        <div className="text-xs text-muted-foreground">Followers</div>
                      </div>
                    </div>
                    
                    <SheetClose asChild>
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => handleNavigation(`/profile/${user.username}`)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </SheetClose>
                  </div>
                )}
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Main</h4>
                    <div className="space-y-1">
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => handleNavigation("/wall")}
                        >
                          <Home className="h-4 w-4 mr-2" />
                          Wall
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => handleNavigation("/explore")}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Explore
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start relative" 
                          onClick={() => setActiveTab("messaging")}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Messages
                          {messageData && messageData.count > 0 && (
                            <Badge className="ml-auto">
                              {messageData.count}
                            </Badge>
                          )}
                        </Button>
                      </SheetClose>
                      <Button variant="ghost" className="w-full justify-start relative">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                        {notificationData && notificationData.count > 0 && (
                          <Badge className="ml-auto">
                            {notificationData.count}
                          </Badge>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Content</h4>
                    <div className="space-y-1">
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => handleNavigation("/videos/trending")}
                        >
                          <Flame className="h-4 w-4 mr-2" />
                          Trending
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => handleNavigation("/videos/shorts")}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Shorts
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => handleNavigation("/videos/live")}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Live
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Communities</h4>
                    <div className="space-y-1">
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => handleNavigation("/communities")}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          My Communities
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => handleNavigation("/communities/create")}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Community
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            {user && (
              <SheetFooter className="px-6 py-4 border-t">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    logoutMutation.mutate();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </SheetFooter>
            )}
          </TabsContent>
          
          {/* Messaging Tab */}
          <TabsContent value="messaging" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <SocialMessaging />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}