import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useView } from "@/hooks/use-view";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Search, 
  User, 
  MessageCircle, 
  Video, 
  Flame, 
  Users, 
  Compass,
  PlusCircle 
} from "lucide-react";

// Import social components
import ContentFeed from "@/components/social/ContentFeed";
import ContentCreator from "@/components/social/ContentCreator";
import TrendingSidebar from "@/components/social/TrendingSidebar";
import ExploreFeed from "@/components/social/ExploreFeed";
import ProfileContent from "@/components/social/ProfileContent";
import SocialMessaging from "@/components/messaging/SocialMessaging";
import { getInitials } from "@/lib/utils";

export default function Social() {
  const { setView } = useView();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("wall");

  // Get unread message count
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user,
  });

  useEffect(() => {
    setView("social");
  }, [setView]);

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* All-in-one social experience with tabs */}
        <Card className="overflow-hidden border-none shadow-sm mb-6">
          <CardContent className="p-0">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-6 rounded-none bg-background p-0 h-auto border-b">
                <TabsTrigger 
                  value="wall" 
                  className="py-4 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 data-[state=active]:border-primary border-transparent transition-none"
                >
                  <Home className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Wall</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="explore"
                  className="py-4 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 data-[state=active]:border-primary border-transparent transition-none"
                >
                  <Compass className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Explore</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="profile"
                  className="py-4 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 data-[state=active]:border-primary border-transparent transition-none"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="messages"
                  className="py-4 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 data-[state=active]:border-primary border-transparent transition-none relative"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Messages</span>
                  {messageData && messageData.count > 0 && (
                    <Badge className="absolute top-2 right-2 h-5 w-5 p-0 flex items-center justify-center sm:relative sm:top-auto sm:right-auto sm:ml-2">
                      {messageData.count}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="videos"
                  className="py-4 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 data-[state=active]:border-primary border-transparent transition-none"
                >
                  <Video className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Videos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="communities"
                  className="py-4 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 data-[state=active]:border-primary border-transparent transition-none"
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Communities</span>
                </TabsTrigger>
              </TabsList>

              {/* Wall Tab Content */}
              <TabsContent value="wall" className="p-0 m-0">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* User Profile Summary - Left */}
                  <div className="lg:col-span-1 order-2 lg:order-1">
                    <Card className="shadow-none">
                      <CardContent className="p-4">
                        {user && (
                          <div className="mb-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-12 w-12">
                                {user.avatar ? (
                                  <AvatarImage src={user.avatar} alt={user.name || "User"} />
                                ) : null}
                                <AvatarFallback className="text-base">
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
                            
                            <Button 
                              variant="outline" 
                              className="w-full mt-2"
                              onClick={() => setActiveTab("profile")}
                            >
                              View Profile
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Trending Topics/Suggestions */}
                    <div className="mt-4">
                      <TrendingSidebar />
                    </div>
                  </div>
                  
                  {/* Content Feed - Center */}
                  <div className="lg:col-span-2 order-1 lg:order-2">
                    <div className="space-y-6">
                      {user && <ContentCreator />}
                      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <Tabs defaultValue="for-you">
                          <TabsList className="w-full grid grid-cols-3">
                            <TabsTrigger value="for-you">For You</TabsTrigger>
                            <TabsTrigger value="following">Following</TabsTrigger>
                            <TabsTrigger value="popular">Popular</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="for-you">
                            <ContentFeed />
                          </TabsContent>
                          
                          <TabsContent value="following">
                            {user ? (
                              <ContentFeed filter="following" />
                            ) : (
                              <div className="bg-white rounded-lg shadow-sm p-8 text-center my-4">
                                <h3 className="text-lg font-medium text-gray-900">Sign in to see posts from people you follow</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                  Follow people to see their posts in your feed
                                </p>
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="popular">
                            <ContentFeed filter="popular" />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Widgets/Content - Right */}
                  <div className="lg:col-span-1 order-3">
                    <Card className="shadow-none">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-3">Suggested For You</h3>
                        <div className="space-y-4">
                          {/* Suggested Users */}
                          {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback>
                                    {['JD', 'SM', 'AK'][i]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {['Jane Doe', 'Sam Miller', 'Alex Kim'][i]}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    @{['janedoe', 'sammiller', 'alexkim'][i]}
                                  </p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                Follow
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4">
                          <Button 
                            variant="ghost" 
                            className="w-full"
                            onClick={() => setActiveTab("explore")}
                          >
                            Show More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Video Highlights */}
                    <Card className="shadow-none mt-4">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">Video Highlights</h3>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setActiveTab("videos")}
                          >
                            See All
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {Array(2).fill(0).map((_, i) => (
                            <div 
                              key={i} 
                              className="aspect-video relative bg-muted rounded-md overflow-hidden cursor-pointer"
                              onClick={() => setLocation('/videos/trending')}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Flame className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-white text-xs">Trending Video #{i+1}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Explore Tab Content */}
              <TabsContent value="explore" className="m-0 p-6">
                <ExploreFeed />
              </TabsContent>

              {/* Profile Tab Content */}
              <TabsContent value="profile" className="m-0 p-6">
                <ProfileContent user={user} />
              </TabsContent>

              {/* Messages Tab Content */}
              <TabsContent value="messages" className="m-0 p-0">
                <div className="h-[calc(80vh-120px)]">
                  <SocialMessaging embedded />
                </div>
              </TabsContent>

              {/* Videos Tab Content */}
              <TabsContent value="videos" className="m-0 p-6">
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <Tabs defaultValue="trending">
                      <TabsList className="w-full grid grid-cols-4">
                        <TabsTrigger value="trending">Trending</TabsTrigger>
                        <TabsTrigger value="shorts">Shorts</TabsTrigger>
                        <TabsTrigger value="stories">Stories</TabsTrigger>
                        <TabsTrigger value="live">Live</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="trending" className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Array(6).fill(0).map((_, i) => (
                            <div 
                              key={i} 
                              className="aspect-video bg-muted rounded-md overflow-hidden cursor-pointer relative"
                              onClick={() => setLocation('/videos/trending')}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Flame className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-white text-sm">Trending Video #{i+1}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-center">
                          <Button onClick={() => setLocation('/videos/trending')}>
                            View All Trending Videos
                          </Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="shorts" className="pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {Array(8).fill(0).map((_, i) => (
                            <div 
                              key={i} 
                              className="aspect-[9/16] bg-muted rounded-md overflow-hidden cursor-pointer"
                              onClick={() => setLocation('/videos/shorts')}
                            >
                              <div className="h-full w-full flex items-center justify-center">
                                <Video className="h-8 w-8 text-muted-foreground" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-center">
                          <Button onClick={() => setLocation('/videos/shorts')}>
                            View All Shorts
                          </Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="stories" className="pt-4">
                        <div className="flex gap-4 overflow-x-auto pb-4">
                          {Array(10).fill(0).map((_, i) => (
                            <div 
                              key={i} 
                              className="w-32 flex-shrink-0"
                              onClick={() => setLocation('/videos/stories')}
                            >
                              <div className="aspect-[9/16] bg-muted rounded-md overflow-hidden cursor-pointer mb-2">
                                <div className="h-full w-full flex items-center justify-center">
                                  <PlusCircle className="h-8 w-8 text-muted-foreground" />
                                </div>
                              </div>
                              <p className="text-sm text-center truncate">User Story {i+1}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-center">
                          <Button onClick={() => setLocation('/videos/stories')}>
                            View All Stories
                          </Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="live" className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Array(4).fill(0).map((_, i) => (
                            <div 
                              key={i} 
                              className="aspect-video bg-muted rounded-md overflow-hidden cursor-pointer relative"
                              onClick={() => setLocation('/videos/live')}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                  <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                                  <span className="text-white font-medium">LIVE</span>
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-white text-sm">Live Stream #{i+1}</p>
                                <p className="text-white/80 text-xs">1.2k watching</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-center">
                          <Button onClick={() => setLocation('/videos/live')}>
                            View All Live Streams
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </TabsContent>

              {/* Communities Tab Content */}
              <TabsContent value="communities" className="m-0 p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button onClick={() => setLocation('/communities')} className="h-auto p-6">
                      <div className="text-center w-full">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <h3 className="text-lg font-medium">My Communities</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          View and manage your communities
                        </p>
                      </div>
                    </Button>
                    
                    <Button onClick={() => setLocation('/communities/create')} variant="outline" className="h-auto p-6">
                      <div className="text-center w-full">
                        <PlusCircle className="h-8 w-8 mx-auto mb-2" />
                        <h3 className="text-lg font-medium">Create Community</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Start your own community
                        </p>
                      </div>
                    </Button>
                    
                    <Button onClick={() => setLocation('/communities')} variant="secondary" className="h-auto p-6">
                      <div className="text-center w-full">
                        <Search className="h-8 w-8 mx-auto mb-2" />
                        <h3 className="text-lg font-medium">Discover Communities</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Find communities to join
                        </p>
                      </div>
                    </Button>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-4">Popular Communities</h3>
                      <div className="space-y-4">
                        {Array(3).fill(0).map((_, i) => (
                          <div 
                            key={i} 
                            className="flex items-center justify-between cursor-pointer hover:bg-accent/50 p-2 rounded-md"
                            onClick={() => setLocation(`/communities/${i+1}`)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {['TC', 'AH', 'PG'][i]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {['Tech Community', 'Art Hub', 'Photography Group'][i]}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {['12.5k members', '8.1k members', '5.3k members'][i]}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">Join</Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        <Button 
                          variant="ghost" 
                          className="w-full"
                          onClick={() => setLocation('/communities')}
                        >
                          Browse All Communities
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}