import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useView } from "@/hooks/use-view";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  PlusCircle,
  ShoppingBag
} from "lucide-react";

// Import social components
import ContentFeed from "@/components/social/ContentFeed";
import ContentCreator from "@/components/social/ContentCreator";
import TrendingSidebar from "@/components/social/TrendingSidebar";
import SocialMessaging from "@/components/messaging/SocialMessaging";
import { getInitials } from "@/lib/utils";
import PostCard from "@/components/social/PostCard";

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

  // Fetch trending posts
  const {
    data: trendingPosts,
    isLoading: isLoadingTrending,
  } = useQuery({
    queryKey: ["/api/explore/trending"],
  });

  // Fetch popular tags
  const {
    data: popularTags,
    isLoading: isLoadingTags,
  } = useQuery({
    queryKey: ["/api/explore/tags"],
  });

  // Fetch recommended communities
  const {
    data: recommendedCommunities,
    isLoading: isLoadingCommunities,
  } = useQuery({
    queryKey: ["/api/explore/communities"],
  });

  // Fetch featured products
  const {
    data: featuredProducts,
    isLoading: isLoadingProducts,
  } = useQuery({
    queryKey: ["/api/explore/products"],
  });

  // Fetch suggested users
  const {
    data: suggestedUsers,
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ["/api/explore/users"],
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Top user profile summary bar */}
        {user && (
          <Card className="mb-6">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
              
              <div className="flex items-center space-x-1 sm:space-x-3 text-sm text-muted-foreground">
                <div className="text-center px-2">
                  <div className="font-semibold text-foreground">128</div>
                  <div className="hidden sm:block text-xs">Posts</div>
                </div>
                <div className="text-center px-2">
                  <div className="font-semibold text-foreground">843</div>
                  <div className="hidden sm:block text-xs">Following</div>
                </div>
                <div className="text-center px-2">
                  <div className="font-semibold text-foreground">2.4k</div>
                  <div className="hidden sm:block text-xs">Followers</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Main Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full grid grid-cols-6 p-0 rounded-none bg-card border border-border">
            <TabsTrigger 
              value="wall" 
              className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
            >
              <div className="flex items-center">
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Wall</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="explore"
              className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
            >
              <div className="flex items-center">
                <Compass className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Explore</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
            >
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="messages"
              className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary py-3 relative"
            >
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Messages</span>
                {messageData && messageData.count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center sm:static sm:ml-2 sm:h-auto sm:w-auto sm:p-1">
                    {messageData.count}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="videos"
              className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
            >
              <div className="flex items-center">
                <Video className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Videos</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="communities"
              className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Communities</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Wall Tab Content */}
          <TabsContent value="wall" className="m-0 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Content Feed - Center */}
              <div className="md:col-span-2">
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
                          <ContentFeed />
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
                        <ContentFeed />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
              
              {/* Trending/Suggestions Sidebar - Right */}
              <div className="hidden md:block">
                <TrendingSidebar />
              </div>
            </div>
          </TabsContent>

          {/* Explore Tab Content */}
          <TabsContent value="explore" className="m-0 mt-6">
            <div className="space-y-6">
              {/* Search bar */}
              <div className="mb-4">
                <form className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search for users, communities, or content..."
                      className="w-full rounded-md pl-10 py-2 border border-input bg-background"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </form>
              </div>

              {/* Tabs for different explore categories */}
              <Tabs defaultValue="trending" className="w-full">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="communities">Communities</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="people">People</TabsTrigger>
                </TabsList>

                {/* Trending posts tab */}
                <TabsContent value="trending" className="space-y-6 mt-4">
                  <div className="space-y-6">
                    {trendingPosts && Array.isArray(trendingPosts) && trendingPosts.map((post: any) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </TabsContent>

                {/* Communities tab */}
                <TabsContent value="communities" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recommendedCommunities && recommendedCommunities.map((community: any) => (
                      <Card 
                        key={community.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setLocation(`/communities/${community.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-12 w-12">
                              {community.logo ? (
                                <AvatarImage src={community.logo} alt={community.name} />
                              ) : null}
                              <AvatarFallback>
                                {getInitials(community.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{community.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {community.visibility}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {community.memberCount} members
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/communities/${community.id}`);
                            }}
                          >
                            View Community
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Products tab */}
                <TabsContent value="products" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featuredProducts && featuredProducts.map((product: any) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer overflow-hidden hover:shadow-md transition-shadow"
                        onClick={() => setLocation(`/product/${product.id}`)}
                      >
                        <CardContent className="p-0">
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                            {product.isOnSale && (
                              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                SALE
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium">{product.name}</h3>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-primary">
                                  £{product.discountPrice || product.price}
                                </span>
                                {product.discountPrice && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    £{product.price}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button className="w-full mt-3" size="sm">
                              View Product
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* People tab */}
                <TabsContent value="people" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {suggestedUsers && suggestedUsers.map((user: any) => (
                      <Card
                        key={user.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setLocation(`/profile/${user.username}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-12 w-12">
                              {user.avatar ? (
                                <AvatarImage src={user.avatar} alt={user.name} />
                              ) : null}
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{user.name}</h3>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">
                              {user.followerCount} followers
                            </div>
                            <Button variant="outline" size="sm">
                              Follow
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Profile Tab Content */}
          <TabsContent value="profile" className="m-0 mt-6">
            {user ? (
              <div className="space-y-6">
                {/* Profile header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <Avatar className="h-24 w-24">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name} />
                        ) : null}
                        <AvatarFallback className="text-xl">
                          {getInitials(user.name || "User")}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h2 className="text-2xl font-bold">{user.name}</h2>
                            <p className="text-muted-foreground">@{user.username}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                              Edit Profile
                            </Button>
                          </div>
                        </div>
                        
                        {/* Bio */}
                        {user.bio && (
                          <p className="my-3 text-sm">{user.bio}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Profile content tabs */}
                <Tabs defaultValue="posts" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="about">About</TabsTrigger>
                  </TabsList>
                  
                  {/* Posts tab */}
                  <TabsContent value="posts" className="space-y-4">
                    <ContentFeed />
                  </TabsContent>
                  
                  {/* Media tab */}
                  <TabsContent value="media">
                    <Card>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-3 gap-2">
                          {Array(6).fill(0).map((_, i) => (
                            <div 
                              key={i} 
                              className="aspect-square bg-muted rounded-md overflow-hidden cursor-pointer"
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Products tab */}
                  <TabsContent value="products">
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center py-8">
                          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                          <h3 className="text-lg font-medium mb-2">No products yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Start selling by adding products to your store!
                          </p>
                          <Button onClick={() => setLocation("/upload-product")}>
                            Add Product
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* About tab */}
                  <TabsContent value="about">
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          {/* Bio section */}
                          <div>
                            <h3 className="text-lg font-medium mb-2">Bio</h3>
                            <p className="text-muted-foreground">
                              {user.bio || "No bio provided."}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-10">
                <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">Please Sign In</h2>
                <p className="text-muted-foreground mb-6">
                  You need to be logged in to view your profile.
                </p>
                <Button onClick={() => setLocation("/auth")}>
                  Sign In
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Messages Tab Content */}
          <TabsContent value="messages" className="m-0 mt-6">
            <div className="h-[calc(80vh-160px)]">
              <SocialMessaging />
            </div>
          </TabsContent>

          {/* Videos Tab Content */}
          <TabsContent value="videos" className="m-0 mt-6">
            <div className="space-y-6">
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
          </TabsContent>

          {/* Communities Tab Content */}
          <TabsContent value="communities" className="m-0 mt-6">
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
      </div>
    </div>
  );
}