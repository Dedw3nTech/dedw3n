import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Loader2, Search, Grid3X3, Hash, Flame, TrendingUp, Users, ShoppingBag, Sparkles, Globe, Store, MessageSquare, ThumbsUp, MoreHorizontal, Share2 } from "lucide-react";

export default function ExplorePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("trending");

  // Fetch trending content
  const {
    data: trendingData,
    isLoading: isLoadingTrending,
  } = useQuery({
    queryKey: ["/api/explore/trending"],
    queryFn: async () => {
      const response = await fetch("/api/explore/trending");
      if (!response.ok) {
        throw new Error("Failed to fetch trending content");
      }
      return response.json();
    },
  });

  // Fetch popular communities
  const {
    data: communities,
    isLoading: isLoadingCommunities,
  } = useQuery({
    queryKey: ["/api/explore/communities"],
    queryFn: async () => {
      const response = await fetch("/api/explore/communities");
      if (!response.ok) {
        throw new Error("Failed to fetch popular communities");
      }
      return response.json();
    },
  });

  // Fetch popular products
  const {
    data: products,
    isLoading: isLoadingProducts,
  } = useQuery({
    queryKey: ["/api/explore/products"],
    queryFn: async () => {
      const response = await fetch("/api/explore/products");
      if (!response.ok) {
        throw new Error("Failed to fetch popular products");
      }
      return response.json();
    },
  });

  // Fetch popular tags
  const {
    data: tags,
    isLoading: isLoadingTags,
  } = useQuery({
    queryKey: ["/api/explore/tags"],
    queryFn: async () => {
      const response = await fetch("/api/explore/tags");
      if (!response.ok) {
        throw new Error("Failed to fetch popular tags");
      }
      return response.json();
    },
  });

  // Fetch users to follow
  const {
    data: suggestedUsers,
    isLoading: isLoadingSuggestedUsers,
  } = useQuery({
    queryKey: ["/api/explore/users"],
    queryFn: async () => {
      const response = await fetch("/api/explore/users");
      if (!response.ok) {
        throw new Error("Failed to fetch suggested users");
      }
      return response.json();
    },
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Explore</h1>
        <p className="text-muted-foreground mb-6">
          Discover new content, communities, products, and people
        </p>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            className="pl-10 py-6 text-lg"
            placeholder="Search for anything..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button 
            type="submit" 
            className="absolute right-1 top-1.5 h-10"
            disabled={!searchTerm.trim()}
          >
            Search
          </Button>
        </form>
      </div>

      <Tabs defaultValue="trending" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="trending">
            <Flame className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="communities">
            <Grid3X3 className="h-4 w-4 mr-2" />
            Communities
          </TabsTrigger>
          <TabsTrigger value="products">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="people">
            <Users className="h-4 w-4 mr-2" />
            People
          </TabsTrigger>
          <TabsTrigger value="tags">
            <Hash className="h-4 w-4 mr-2" />
            Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Trending Now
            </h2>
          </div>

          {isLoadingTrending ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !trendingData || trendingData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Flame className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No trending content yet</p>
                <p className="text-sm text-muted-foreground">
                  Check back later for the latest trending content
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {trendingData.map((post: any) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-0">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.user?.avatar || ""} alt={post.user?.name} />
                          <AvatarFallback>{getInitials(post.user?.name || "")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium">{post.user?.name}</p>
                            {post.community && (
                              <>
                                <span className="mx-1 text-muted-foreground">•</span>
                                <Badge variant="outline" className="text-xs">
                                  {post.community.name}
                                </Badge>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
                          className="w-full object-cover max-h-96"
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likes || 0}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => setLocation(`/posts/${post.id}`)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments || 0}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>{post.shares || 0}</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="communities">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              <Grid3X3 className="h-5 w-5 mr-2" />
              Popular Communities
            </h2>
            <Button onClick={() => setLocation("/communities")}>View All</Button>
          </div>

          {isLoadingCommunities ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !communities || communities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Grid3X3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No communities found</p>
                <Button onClick={() => setLocation("/communities/create")}>
                  Create a Community
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community: any) => (
                <Card 
                  key={community.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation(`/communities/${community.id}`)}
                >
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                    {community.bannerImage && (
                      <img 
                        src={community.bannerImage} 
                        alt={community.name} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="pt-4 relative">
                    <Avatar className="absolute -top-8 left-4 h-16 w-16 border-4 border-background">
                      <AvatarImage src={community.logo || ""} alt={community.name} />
                      <AvatarFallback>{getInitials(community.name)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-20">
                      <h3 className="font-bold text-lg">{community.name}</h3>
                      <div className="flex items-center mt-1">
                        <Badge 
                          variant={community.visibility === "public" ? "outline" : "secondary"}
                          className="text-xs flex items-center"
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          {community.visibility}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-2">
                          {community.memberCount || 0} members
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                      {community.description}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t">
                    <Button variant="ghost" className="w-full">View Community</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Popular Products
            </h2>
            <Button onClick={() => setLocation("/products")}>View All</Button>
          </div>

          {isLoadingProducts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !products || products.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No products found</p>
                {user && user.isVendor && (
                  <Button onClick={() => setLocation("/add-product")}>
                    Add a Product
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <Card 
                  key={product.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation(`/product/${product.id}`)}
                >
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
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={product.vendor?.logo || ""} alt={product.vendor?.storeName} />
                        <AvatarFallback>
                          <Store className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{product.vendor?.storeName}</span>
                    </div>
                    <h3 className="font-medium line-clamp-1">{product.name}</h3>
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
                    <Button variant="outline" className="w-full">View Details</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="people">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              <Users className="h-5 w-5 mr-2" />
              People to Follow
            </h2>
            <Button onClick={() => setLocation("/members")}>View All</Button>
          </div>

          {isLoadingSuggestedUsers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !suggestedUsers || suggestedUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No suggested users found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {suggestedUsers.map((user: any) => (
                <Card 
                  key={user.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation(`/profile/${user.username}`)}
                >
                  <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <CardContent className="pt-0 relative flex flex-col items-center text-center">
                    <Avatar className="absolute -top-10 h-20 w-20 border-4 border-background">
                      <AvatarImage src={user.avatar || ""} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="mt-12">
                      <h3 className="font-bold text-lg">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      
                      {user.isVendor && (
                        <Badge variant="secondary" className="mt-2">
                          <Store className="h-3 w-3 mr-1" />
                          Vendor
                        </Badge>
                      )}
                    </div>
                    
                    {user.bio && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                    
                    <div className="flex justify-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div>
                        <span className="font-bold">{user.followers || 0}</span> followers
                      </div>
                      <div>
                        <span className="font-bold">{user.posts || 0}</span> posts
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">View Profile</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tags">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              <Hash className="h-5 w-5 mr-2" />
              Popular Tags
            </h2>
          </div>

          {isLoadingTags ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !tags || tags.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Hash className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No popular tags found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tags.map((tag: any, index: number) => (
                <Card
                  key={index}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation(`/search?tag=${encodeURIComponent(tag.name)}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Hash className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">#{tag.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tag.count} {tag.count === 1 ? "post" : "posts"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50">
                    <p className="text-sm text-muted-foreground w-full truncate">
                      {tag.recentPosts?.join(", ")}
                    </p>
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