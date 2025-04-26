import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { Loader2, Edit, Settings, Share2, Mail, UserPlus, UserCheck, CalendarDays, ShoppingBag, Store, Users, MessageSquare, Grid3X3, ListFilter } from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("posts");

  // Fetch user profile
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      return response.json();
    },
  });

  // Fetch user's posts
  const {
    data: posts,
    isLoading: isLoadingPosts,
  } = useQuery({
    queryKey: [`/api/users/${username}/posts`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/posts`);
      if (!response.ok) {
        throw new Error("Failed to fetch user posts");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch user's products (if they're a vendor)
  const {
    data: products,
    isLoading: isLoadingProducts,
  } = useQuery({
    queryKey: [`/api/users/${username}/products`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/products`);
      if (!response.ok) {
        throw new Error("Failed to fetch user products");
      }
      return response.json();
    },
    enabled: !!user && user.isVendor,
  });

  // Fetch user's connections
  const {
    data: connections,
    isLoading: isLoadingConnections,
  } = useQuery({
    queryKey: [`/api/users/${username}/connections`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/connections`);
      if (!response.ok) {
        throw new Error("Failed to fetch user connections");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch user's communities
  const {
    data: communities,
    isLoading: isLoadingCommunities,
  } = useQuery({
    queryKey: [`/api/users/${username}/communities`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/communities`);
      if (!response.ok) {
        throw new Error("Failed to fetch user communities");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Check if current user is connected to this profile
  const isConnected = connections?.some(
    (connection: any) => connection.userId === currentUser?.id
  );

  // Follow/Connect mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/users/${user.id}/connect`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to connect with user");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `You are now connected with ${user.name}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/connections`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect with user",
        variant: "destructive",
      });
    },
  });

  // Unfollow/Disconnect mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/users/${user.id}/connect`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to disconnect from user");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `You are no longer connected with ${user.name}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/connections`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect from user",
        variant: "destructive",
      });
    },
  });

  const handleFollow = () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to connect with users",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    followMutation.mutate();
  };

  const handleUnfollow = () => {
    unfollowMutation.mutate();
  };

  const handleMessage = () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to send messages",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    setLocation(`/messages/${username}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl text-red-500 mb-4">User not found</h1>
        <p>The user profile you're looking for doesn't exist or has been removed.</p>
        <Button 
          onClick={() => setLocation("/")} 
          className="mt-4"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="container mx-auto py-8">
      {/* Profile header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"></div>
        <div className="absolute -bottom-16 left-8">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={user.avatar || ""} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="mt-20 mb-6 flex flex-col md:flex-row justify-between">
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
          
          {user.isVendor && (
            <Badge variant="secondary" className="mt-2">
              <Store className="h-3 w-3 mr-1" />
              Vendor
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          {isOwnProfile ? (
            <Button variant="outline" onClick={() => setLocation("/settings/profile")}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleMessage}>
                <Mail className="h-4 w-4 mr-2" />
                Message
              </Button>
              
              {isConnected ? (
                <Button 
                  variant="outline" 
                  onClick={handleUnfollow}
                  disabled={unfollowMutation.isPending}
                >
                  {unfollowMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  Connected
                </Button>
              ) : (
                <Button 
                  onClick={handleFollow}
                  disabled={followMutation.isPending}
                >
                  {followMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Connect
                </Button>
              )}
              
              <Button variant="ghost" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {user.bio && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p>{user.bio}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Posts</CardTitle>
            <CardDescription className="text-2xl font-bold">{posts?.length || 0}</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connections</CardTitle>
            <CardDescription className="text-2xl font-bold">{connections?.length || 0}</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Communities</CardTitle>
            <CardDescription className="text-2xl font-bold">{communities?.length || 0}</CardDescription>
          </CardHeader>
        </Card>
        
        {user.isVendor && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
              <CardDescription className="text-2xl font-bold">{products?.length || 0}</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="posts">
            <MessageSquare className="h-4 w-4 mr-2" />
            Posts
          </TabsTrigger>
          
          {user.isVendor && (
            <TabsTrigger value="products">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
          )}
          
          <TabsTrigger value="connections">
            <Users className="h-4 w-4 mr-2" />
            Connections
          </TabsTrigger>
          
          <TabsTrigger value="communities">
            <Grid3X3 className="h-4 w-4 mr-2" />
            Communities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Posts</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ListFilter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {isLoadingPosts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !posts || posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No posts yet</p>
                {isOwnProfile && (
                  <Button onClick={() => setLocation("/social")}>
                    Create your first post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {posts.map((post: any) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-0">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || ""} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3 inline mr-1" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {post.title && (
                      <h3 className="text-lg font-medium mb-2">{post.title}</h3>
                    )}
                    <p className="mb-4">{post.content}</p>
                    {post.imageUrl && (
                      <div className="rounded-md overflow-hidden mb-4">
                        <img 
                          src={post.imageUrl} 
                          alt="Post image" 
                          className="w-full object-cover h-64"
                        />
                      </div>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {post.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <div className="flex gap-4">
                      <span className="flex items-center text-sm">
                        <i className="ri-heart-line mr-1"></i>
                        {post.likes || 0} Likes
                      </span>
                      <span className="flex items-center text-sm">
                        <i className="ri-chat-1-line mr-1"></i>
                        {post.comments || 0} Comments
                      </span>
                      <span className="flex items-center text-sm">
                        <i className="ri-repeat-line mr-1"></i>
                        {post.shares || 0} Shares
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {user.isVendor && (
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Products</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ListFilter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {isLoadingProducts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !products || products.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No products listed yet</p>
                  {isOwnProfile && (
                    <Button onClick={() => setLocation("/add-product")}>
                      Add your first product
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product: any) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="relative h-48">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                      {product.isOnSale && (
                        <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
                          On Sale
                        </Badge>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-medium">{product.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <div>
                          {product.discountPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="font-bold">${product.discountPrice}</span>
                              <span className="text-sm text-muted-foreground line-through">
                                ${product.price}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold">${product.price}</span>
                          )}
                        </div>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation(`/product/${product.id}`)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="connections">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Connections</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ListFilter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {isLoadingConnections ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !connections || connections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No connections yet</p>
                {isOwnProfile && (
                  <Button onClick={() => setLocation("/members")}>
                    Find people to connect with
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection: any) => (
                <Card key={connection.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={connection.avatar || ""} alt={connection.name} />
                        <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{connection.name}</h3>
                        <p className="text-sm text-muted-foreground">@{connection.username}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setLocation(`/profile/${connection.username}`)}
                    >
                      View Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setLocation(`/messages/${connection.username}`)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="communities">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Communities</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ListFilter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {isLoadingCommunities ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !communities || communities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Grid3X3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Not a member of any communities yet</p>
                {isOwnProfile && (
                  <Button onClick={() => setLocation("/communities")}>
                    Browse communities
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities.map((community: any) => (
                <Card key={community.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={community.logo || ""} alt={community.name} />
                        <AvatarFallback>{getInitials(community.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{community.name}</h3>
                        <div className="flex items-center mt-1">
                          <Badge 
                            variant={community.visibility === "public" ? "outline" : "secondary"}
                            className="text-xs"
                          >
                            {community.visibility}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            {community.memberCount || 0} members
                          </span>
                        </div>
                      </div>
                    </div>
                    {community.description && (
                      <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                        {community.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation(`/communities/${community.id}`)}
                    >
                      View Community
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}