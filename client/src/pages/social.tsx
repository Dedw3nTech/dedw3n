import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useView } from "@/hooks/use-view";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/useUserStats";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  Search, 
  User, 
  MessageCircle, 
  Video, 
  Users, 
  Compass, 
  PlusCircle,
  ShoppingBag,
  ImageIcon,
  Flame,
  Settings,
  LogOut,
  LayoutGrid
} from "lucide-react";

// Import social components
import ContentFeed from "@/components/social/ContentFeed";
import CreatePost from "@/components/social/CreatePost";
import SocialMessaging from "@/components/messaging/SocialMessaging";
import { getInitials } from "@/lib/utils";

// Content types
interface Post {
  id: number;
  content: string;
  author: string;
  authorAvatar?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
}

interface Community {
  id: number;
  name: string;
  logo?: string;
  memberCount: number;
  description: string;
}

interface VideoItem {
  id: number;
  title: string;
  thumbnail?: string;
  creator: string;
  viewCount: number;
  timestamp: string;
}

interface UserStats {
  postCount: number;
  followerCount: number;
  followingCount: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  vendorId: number;
  vendorName: string;
}

export default function Social() {
  const { setView } = useView();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("wall");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedRefreshKey, setFeedRefreshKey] = useState<number>(Date.now()); // For forcing feed refresh
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout");
      if (!response.ok) {
        throw new Error("Failed to log out");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/auth");
    }
  });

  // Get unread message count
  const { data: messageData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user,
  });

  // Fetch trending posts
  const { data: exploreFeedData, isLoading: isLoadingTrending } = useQuery<{popularPosts?: any[]}>({
    queryKey: ["/api/social/explore"],
    enabled: activeTab === "explore",
  });
  
  const trendingPosts = exploreFeedData?.popularPosts || [];

  // Fetch communities
  const { data: communitiesData, isLoading: isLoadingCommunities } = useQuery<{publicCommunities?: any[]}>({
    queryKey: ["/api/social/communities"],
    enabled: activeTab === "communities",
  });
  
  const communities = communitiesData?.publicCommunities || [];

  // Fetch videos
  const { data: videos = [], isLoading: isLoadingVideos } = useQuery({
    queryKey: ["/api/social/videos"],
    enabled: activeTab === "videos",
  });

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: true,
  });
  
  // Use the hook to fetch user statistics
  const { getCurrentUserStats } = useUserStats();
  const { data: userStats } = getCurrentUserStats();

  useEffect(() => {
    setView("social");
  }, [setView]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* User Profile Card removed as requested */}
        
        {/* Social Navigation moved to header */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-0">
            <Tabs 
              defaultValue={activeTab} 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >

              {/* Wall Tab Content */}
              <TabsContent value="wall" className="mt-0 pt-6 px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Sidebar */}
                  <div className="md:col-span-1 space-y-6">
                    {/* User Profile Card */}
                    {user && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-12 w-12">
                              {user.avatar ? (
                                <AvatarImage src={user.avatar} alt={user.name || "User"} />
                              ) : null}
                              <AvatarFallback className="text-lg">
                                {getInitials(user.name || "User")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{user.name}</h3>
                              <p className="text-sm text-blue-500">@{user.username}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                            <div className="bg-muted rounded-md p-2">
                              <div className="font-semibold text-blue-500">{userStats?.postCount || 0}</div>
                              <div className="text-xs text-muted-foreground">Posts</div>
                            </div>
                            <div className="bg-muted rounded-md p-2">
                              <div className="font-semibold text-blue-500">{userStats?.followingCount || 0}</div>
                              <div className="text-xs text-muted-foreground">Following</div>
                            </div>
                            <div className="bg-muted rounded-md p-2">
                              <div className="font-semibold text-blue-500">{userStats?.followerCount || 0}</div>
                              <div className="text-xs text-muted-foreground">Followers</div>
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setActiveTab("profile")}
                          >
                            <User className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Shop Trending */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Shop Trending</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-3">
                          {!isLoadingProducts && products.slice(0, 2).map((product) => (
                            <div 
                              key={product.id}
                              className="flex gap-3 cursor-pointer"
                              onClick={() => setLocation(`/product/${product.id}`)}
                            >
                              <div className="h-14 w-14 bg-muted rounded flex-shrink-0">
                                {product.imageUrl && (
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="h-full w-full object-cover rounded"
                                  />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium line-clamp-1">{product.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm font-semibold">
                                    ${product.discountPrice || product.price}
                                  </span>
                                  {product.discountPrice && (
                                    <span className="text-xs text-muted-foreground line-through">
                                      ${product.price}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setLocation('/products')}
                        >
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          View All Products
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    {/* Trending Topics */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Trending Topics</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-3">
                          {["#Technology", "#Fashion", "#Health", "#Travel", "#Finance"].map((tag, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm font-medium text-primary">{tag}</span>
                              <span className="text-xs text-muted-foreground">{(10 - i) * 1000}+ posts</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("explore")}>
                          See More
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                  
                  {/* Main Content */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Create Post */}
                    {user && (
                      <CreatePost 
                        onSuccess={() => {
                          // Force refresh the feed when a post is created
                          console.log("Post created, refreshing feed");
                          
                          // First, invalidate the feed queries
                          queryClient.invalidateQueries({ 
                            queryKey: ["/api/feed/personal"],
                            refetchType: "all" 
                          });
                          queryClient.invalidateQueries({ 
                            queryKey: ["/api/feed/communities"],
                            refetchType: "all" 
                          });
                          queryClient.invalidateQueries({ 
                            queryKey: ["/api/feed/recommended"],
                            refetchType: "all"
                          });
                          
                          // Also invalidate user stats queries to refresh post count
                          queryClient.invalidateQueries({ 
                            queryKey: ['/api/user/stats'],
                            refetchType: 'all'
                          });
                          queryClient.invalidateQueries({ 
                            queryKey: [`/api/users/${user?.id}/stats`],
                            refetchType: 'all'
                          });
                          queryClient.invalidateQueries({ 
                            queryKey: ['/api/social/posts/count'],
                            refetchType: 'all'
                          });
                          
                          // Add a small delay to ensure server has time to process before remounting
                          setTimeout(() => {
                            // Update the refresh key to force ContentFeed to remount
                            setFeedRefreshKey(Date.now());
                            console.log("Feed component remounted with new key:", Date.now());
                          }, 300);
                        }} 
                      />
                    )}
                    
                    {/* Content Feed */}
                    <div className="bg-white rounded-lg shadow-sm">
                      <div className="p-4">
                        {/* Added key with timestamp to force remounting when feedRefreshKey changes */}
                        <ContentFeed 
                          key={`main-content-feed-${feedRefreshKey}`} 
                          initialFeedType="personal"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Explore Tab Content */}
              <TabsContent value="explore" className="mt-0 pt-6 px-4 pb-4">
                <div className="mb-6">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      placeholder="Search for users, communities, or content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </form>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  {/* Explore Categories */}
                  <div className="md:col-span-1">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-3">Explore</h3>
                        <div className="space-y-1">
                          <Button variant="ghost" className="w-full justify-start">
                            <Flame className="h-4 w-4 mr-2" />
                            Trending
                          </Button>
                          <Button variant="ghost" className="w-full justify-start">
                            <Users className="h-4 w-4 mr-2" />
                            People
                          </Button>
                          <Button variant="ghost" className="w-full justify-start">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Photos
                          </Button>
                          <Button variant="ghost" className="w-full justify-start">
                            <Video className="h-4 w-4 mr-2" />
                            Videos
                          </Button>
                          <Button variant="ghost" className="w-full justify-start">
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Products
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Explore Content */}
                  <div className="md:col-span-5">
                    {/* Trending Posts */}
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Trending Posts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingTrending ? (
                          <div className="space-y-4">
                            {Array(3).fill(0).map((_, i) => (
                              <div key={i} className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <Skeleton className="h-10 w-10 rounded-full" />
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                  </div>
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-32 w-full rounded-md" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            <ContentFeed limit={3} />
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => setActiveTab("wall")}>
                          View All Posts
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    {/* Popular Communities */}
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Popular Communities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {isLoadingCommunities ? (
                            Array(4).fill(0).map((_, i) => (
                              <Card key={i}>
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-1 flex-1">
                                      <Skeleton className="h-4 w-24" />
                                      <Skeleton className="h-3 w-full" />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            Array(4).fill(0).map((_, i) => (
                              <Card 
                                key={i}
                                className="cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => setLocation(`/communities/${i+1}`)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback>
                                        {["TC", "PH", "FT", "GC"][i]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="font-medium">{["Tech Community", "Photography Hub", "Fitness Tribe", "Gaming Collective"][i]}</h3>
                                      <p className="text-xs text-muted-foreground">
                                        {[(i+1) * 5]}k members
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setActiveTab("communities")}
                        >
                          View All Communities
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Profile content moved to permanent card at the top */}

              {/* Messages Tab Content */}
              <TabsContent value="messages" className="mt-0 p-0">
                <div className="h-[calc(80vh-150px)]">
                  <SocialMessaging embedded />
                </div>
              </TabsContent>

              {/* Videos Tab Content */}
              <TabsContent value="videos" className="mt-0 pt-6 px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Video Categories */}
                  <div className="md:col-span-1">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-3">Video Categories</h3>
                        <div className="space-y-1">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={() => setLocation('/videos/trending')}
                          >
                            <Flame className="h-4 w-4 mr-2" />
                            Trending
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={() => setLocation('/videos/shorts')}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Shorts
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={() => setLocation('/videos/stories')}
                          >
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Stories
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={() => setLocation('/videos/live')}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Live
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Video Content */}
                  <div className="md:col-span-2">
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Trending Videos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {isLoadingVideos ? (
                            Array(4).fill(0).map((_, i) => (
                              <div key={i} className="space-y-2">
                                <Skeleton className="aspect-video rounded-md" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            ))
                          ) : (
                            Array(4).fill(0).map((_, i) => (
                              <div 
                                key={i} 
                                className="cursor-pointer group"
                                onClick={() => setLocation(`/videos/${i+1}`)}
                              >
                                <div className="aspect-video bg-muted rounded-md mb-2 overflow-hidden">
                                  <div className="h-full w-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                    <Flame className="h-10 w-10 text-muted-foreground" />
                                  </div>
                                </div>
                                <h3 className="font-medium">Trending Video #{i+1}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {(i+1) * 1000} views • {i+1} days ago
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setLocation('/videos/trending')}
                        >
                          View All Trending Videos
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Live Now</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Array(2).fill(0).map((_, i) => (
                            <div 
                              key={i} 
                              className="cursor-pointer"
                              onClick={() => setLocation(`/videos/live/${i+1}`)}
                            >
                              <div className="aspect-video bg-muted rounded-md mb-2 overflow-hidden relative">
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <span className="h-2 w-2 bg-white rounded-full"></span>
                                  LIVE
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {(i+1) * 1000} viewers
                                </div>
                              </div>
                              <h3 className="font-medium">Live Stream #{i+1}</h3>
                              <p className="text-xs text-muted-foreground">
                                Channel {i+1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setLocation('/videos/live')}
                        >
                          View All Live Streams
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Communities Tab Content */}
              <TabsContent value="communities" className="mt-0 pt-6 px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Community Actions */}
                  <div className="md:col-span-1">
                    <Card className="mb-6">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-3">Community Actions</h3>
                        <div className="space-y-2">
                          <Button 
                            className="w-full"
                            onClick={() => setLocation('/communities')}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            My Communities
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setLocation('/communities/create')}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create Community
                          </Button>
                          <Button 
                            variant="secondary" 
                            className="w-full"
                            onClick={() => setLocation('/communities/discover')}
                          >
                            <Compass className="h-4 w-4 mr-2" />
                            Discover Communities
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {["Technology", "Art & Design", "Health & Fitness", "Gaming", "Finance", "Education", "Entertainment", "Sports"].map((category, i) => (
                            <Button 
                              key={i} 
                              variant="ghost" 
                              className="w-full justify-start"
                              onClick={() => setLocation(`/communities/category/${category.toLowerCase().replace(/ & /g, '-')}`)}
                            >
                              {category}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Community Content */}
                  <div className="md:col-span-3">
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Your Communities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array(4).fill(0).map((_, i) => (
                              <Card 
                                key={i}
                                className="cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => setLocation(`/communities/${i+1}`)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback>
                                        {["TC", "PH", "FT", "GC"][i]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="font-medium">{["Tech Community", "Photography Hub", "Fitness Tribe", "Gaming Collective"][i]}</h3>
                                      <p className="text-xs text-muted-foreground">
                                        {[(i+1) * 5]}k members
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {["A community for tech enthusiasts to discuss the latest trends.", 
                                      "Share your best photos and get feedback from other photographers.", 
                                      "Connect with fitness enthusiasts and share workout tips.", 
                                      "A place for gamers to connect and discuss their favorite games."][i]}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                            <h3 className="text-lg font-medium mb-2">Sign in to view your communities</h3>
                            <p className="text-muted-foreground mb-4">
                              Join communities to connect with like-minded people
                            </p>
                            <Button onClick={() => setLocation("/auth")}>
                              Sign In
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Recommended Communities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Array(4).fill(0).map((_, i) => (
                            <Card 
                              key={i}
                              className="cursor-pointer hover:bg-accent/50 transition-colors"
                              onClick={() => setLocation(`/communities/${i+5}`)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback>
                                      {["FC", "BC", "MC", "AC"][i]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-medium">{["Food Club", "Book Club", "Music Community", "Art Collective"][i]}</h3>
                                    <p className="text-xs text-muted-foreground">
                                      {[(i+1) * 3]}k members
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {["Share recipes and discuss culinary experiences.", 
                                    "Discuss your favorite books and get recommendations.", 
                                    "Connect with music lovers and share your favorite tracks.", 
                                    "A space for artists to share their work and get inspired."][i]}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setLocation('/communities/discover')}
                        >
                          Discover More Communities
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}