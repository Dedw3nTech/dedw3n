import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";
import PostCard from "@/components/social/PostCard";
import { getInitials } from "@/lib/utils";
import { 
  CompassIcon, 
  Loader2, 
  Users, 
  Hash, 
  Store, 
  MessageSquare,
  Search,
  UserPlus,
  Building2,
  ShoppingBag,
} from "lucide-react";

export default function ExplorePage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("trending");

  // Fetch trending posts
  const {
    data: trendingPosts,
    isLoading: isLoadingTrending,
  } = useQuery({
    queryKey: ["/api/explore/trending"],
    queryFn: async () => {
      const response = await fetch("/api/explore/trending");
      if (!response.ok) {
        throw new Error("Failed to fetch trending posts");
      }
      return response.json();
    },
  });

  // Fetch popular tags
  const {
    data: popularTags,
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

  // Fetch recommended communities
  const {
    data: recommendedCommunities,
    isLoading: isLoadingCommunities,
  } = useQuery({
    queryKey: ["/api/explore/communities"],
    queryFn: async () => {
      const response = await fetch("/api/explore/communities");
      if (!response.ok) {
        throw new Error("Failed to fetch recommended communities");
      }
      return response.json();
    },
  });

  // Fetch featured products
  const {
    data: featuredProducts,
    isLoading: isLoadingProducts,
  } = useQuery({
    queryKey: ["/api/explore/products"],
    queryFn: async () => {
      const response = await fetch("/api/explore/products");
      if (!response.ok) {
        throw new Error("Failed to fetch featured products");
      }
      return response.json();
    },
  });

  // Fetch suggested users
  const {
    data: suggestedUsers,
    isLoading: isLoadingUsers,
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
    if (!searchQuery.trim()) return;
    
    // Redirect to search results page with query parameter
    setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="bg-background min-h-screen">
      <PageHeader
        title="Explore"
        description="Discover trending content, communities, and people"
        icon={<CompassIcon className="h-6 w-6" />}
      />

      <div className="container max-w-screen-xl py-6">
        {/* Search bar */}
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

        {/* Main content area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2">
            <Tabs 
              defaultValue="trending" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="communities">Communities</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="users">People</TabsTrigger>
              </TabsList>
              
              {/* Trending posts tab */}
              <TabsContent value="trending" className="space-y-6 mt-6">
                {isLoadingTrending ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
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
                        <Skeleton className="h-64 w-full rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : !trendingPosts || trendingPosts.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No trending posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to start a trend by creating engaging content!
                    </p>
                    <Button 
                      onClick={() => setLocation("/wall")}
                    >
                      Create a Post
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {trendingPosts.map((post: any) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Communities tab */}
              <TabsContent value="communities" className="mt-6">
                {isLoadingCommunities ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-1 flex-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-full" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-8 w-20" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !recommendedCommunities || recommendedCommunities.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No communities found</h3>
                    <p className="text-muted-foreground mb-4">
                      Start your own community or join existing ones!
                    </p>
                    <Button 
                      onClick={() => setLocation("/communities/create")}
                    >
                      Create a Community
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recommendedCommunities.map((community: any) => (
                      <Card 
                        key={community.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setLocation(`/communities/${community.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-12 w-12">
                              {community.logo ? (
                                <AvatarImage 
                                  src={community.logo} 
                                  alt={community.name} 
                                />
                              ) : null}
                              <AvatarFallback>
                                {getInitials(community.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{community.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {community.visibility}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {community.memberCount} members
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {community.description}
                          </p>
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
                )}
              </TabsContent>
              
              {/* Products tab */}
              <TabsContent value="products" className="mt-6">
                {isLoadingProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-0 overflow-hidden">
                          <Skeleton className="h-40 w-full" />
                          <div className="p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-8 w-20 mt-2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !featuredProducts || featuredProducts.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No products found</h3>
                    <p className="text-muted-foreground mb-4">
                      Check back later for product listings or become a vendor!
                    </p>
                    <Button 
                      onClick={() => setLocation("/products")}
                    >
                      Browse Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featuredProducts.map((product: any) => (
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
                              <div 
                                className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/vendor/${product.vendorId}`);
                                }}
                              >
                                {product.vendor?.storeName}
                              </div>
                            </div>
                            <Button 
                              className="w-full mt-3"
                              size="sm"
                            >
                              View Product
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Users tab */}
              <TabsContent value="users" className="mt-6">
                {isLoadingUsers ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-1 flex-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-8 w-20" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !suggestedUsers || suggestedUsers.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No users found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try refining your search or check back later!
                    </p>
                    <Button 
                      onClick={() => setLocation("/members")}
                    >
                      Browse Members
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {suggestedUsers.map((user: any) => (
                      <Card 
                        key={user.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setLocation(`/profile/${user.username}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-12 w-12">
                              {user.avatar ? (
                                <AvatarImage 
                                  src={user.avatar} 
                                  alt={user.name} 
                                />
                              ) : null}
                              <AvatarFallback>
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{user.name}</h3>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                          {user.bio ? (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {user.bio}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic mb-3">
                              No bio available
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/profile/${user.username}`);
                              }}
                            >
                              View Profile
                            </Button>
                            <Button 
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle connect functionality
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Connect
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular tags */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center">
                  <Hash className="h-4 w-4 mr-2 text-primary" />
                  Trending Tags
                </h3>
                
                {isLoadingTags ? (
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <Skeleton key={i} className="h-8 w-20" />
                    ))}
                  </div>
                ) : !popularTags || popularTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No trending tags available
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag: any) => (
                      <Badge 
                        key={tag.name} 
                        variant="secondary"
                        className="px-3 py-1 cursor-pointer"
                        onClick={() => setLocation(`/search?tag=${encodeURIComponent(tag.name)}`)}
                      >
                        #{tag.name}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {tag.count}
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Featured vendors */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center">
                  <Store className="h-4 w-4 mr-2 text-primary" />
                  Featured Vendors
                </h3>
                
                {isLoadingProducts ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !featuredProducts || featuredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No featured vendors available
                  </p>
                ) : (
                  // Extract unique vendors from featured products
                  <div className="space-y-3">
                    {Array.from(
                      new Set(featuredProducts.map((product: any) => product.vendorId))
                    )
                      .map(vendorId => 
                        featuredProducts.find((p: any) => p.vendorId === vendorId)
                      )
                      .slice(0, 3)
                      .map((product: any) => (
                        <div 
                          key={product.vendorId}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => setLocation(`/vendor/${product.vendorId}`)}
                        >
                          <Avatar className="h-10 w-10">
                            {product.vendor?.logo ? (
                              <AvatarImage 
                                src={product.vendor.logo} 
                                alt={product.vendor.storeName} 
                              />
                            ) : null}
                            <AvatarFallback>
                              {getInitials(product.vendor?.storeName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{product.vendor?.storeName}</p>
                            <div className="flex items-center">
                              <span className="text-xs text-muted-foreground">
                                {product.vendor?.productCount || 0} products
                              </span>
                              {product.vendor?.rating && (
                                <span className="flex items-center text-xs ml-2">
                                  <i className="ri-star-fill text-yellow-500 mr-1"></i>
                                  {product.vendor.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 text-xs"
                      onClick={() => setLocation("/vendors")}
                    >
                      <Building2 className="h-3.5 w-3.5 mr-1" />
                      View All Vendors
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Suggested communities */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Suggested Communities
                </h3>
                
                {isLoadingCommunities ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !recommendedCommunities || recommendedCommunities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No suggested communities available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recommendedCommunities.slice(0, 3).map((community: any) => (
                      <div 
                        key={community.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => setLocation(`/communities/${community.id}`)}
                      >
                        <Avatar className="h-10 w-10">
                          {community.logo ? (
                            <AvatarImage 
                              src={community.logo} 
                              alt={community.name} 
                            />
                          ) : null}
                          <AvatarFallback>
                            {getInitials(community.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{community.name}</p>
                          <div className="flex items-center">
                            <Badge 
                              variant="outline" 
                              className="h-4 text-[10px]"
                            >
                              {community.visibility}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-2">
                              {community.memberCount} members
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 text-xs"
                      onClick={() => setLocation("/communities")}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      View All Communities
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}