import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Filter, User, MessageCircle, ArrowLeft, Users, FileText, BookOpen, ShoppingBag, Hash } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "@/components/social/PostCard";
import ProductCard from "@/components/marketplace/ProductCard";
import PageHeader from "@/components/layout/PageHeader";

// Helper function to get initials for avatar
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// User profile interface
interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  isVendor: boolean | null;
  role: string;
}

// Define interface for posts
interface Post {
  id: number;
  userId: number;
  user: {
    id: number;
    username: string;
    name: string;
    avatar: string | null;
  };
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  isLiked: boolean;
}

// Define interface for products
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  isOnSale: boolean;
  salePrice?: number;
  vendorId: number;
  vendor: {
    id: number;
    name: string;
    logo: string | null;
  };
}

// Define interface for communities
interface Community {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  coverImage: string | null;
  memberCount: number;
  visibility: 'public' | 'private' | 'restricted';
}

export default function SearchPage() {
  // Get search query from URL
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all");
  const [location, setLocation] = useLocation();
  
  // Filters
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState({
    verifiedOnly: false,
    localOnly: false,
    hasProducts: false,
    isPremium: false,
  });
  
  // Use debounced value for search to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Update search parameters in URL when query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      const url = `/search?q=${encodeURIComponent(debouncedSearchQuery)}`;
      window.history.replaceState(null, '', url);
    }
  }, [debouncedSearchQuery]);
  
  // Search users query
  const {
    data: users,
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ["/api/users/search", debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        return [];
      }
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedSearchQuery)}`);
      if (!response.ok) {
        throw new Error("Failed to search users");
      }
      return response.json();
    },
    enabled: !!debouncedSearchQuery && debouncedSearchQuery.length >= 2,
  });
  
  // Search posts query
  const {
    data: posts,
    isLoading: isLoadingPosts,
  } = useQuery({
    queryKey: ["/api/posts/search", debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        return [];
      }
      const response = await fetch(`/api/posts/search?q=${encodeURIComponent(debouncedSearchQuery)}`);
      if (!response.ok) {
        throw new Error("Failed to search posts");
      }
      return response.json();
    },
    enabled: !!debouncedSearchQuery && debouncedSearchQuery.length >= 2,
  });
  
  // Search products query
  const {
    data: products,
    isLoading: isLoadingProducts,
  } = useQuery({
    queryKey: ["/api/products/search", debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        return [];
      }
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(debouncedSearchQuery)}`);
      if (!response.ok) {
        throw new Error("Failed to search products");
      }
      return response.json();
    },
    enabled: !!debouncedSearchQuery && debouncedSearchQuery.length >= 2,
  });
  
  // Search communities query
  const {
    data: communities,
    isLoading: isLoadingCommunities,
  } = useQuery({
    queryKey: ["/api/communities/search", debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        return [];
      }
      const response = await fetch(`/api/communities/search?q=${encodeURIComponent(debouncedSearchQuery)}`);
      if (!response.ok) {
        throw new Error("Failed to search communities");
      }
      return response.json();
    },
    enabled: !!debouncedSearchQuery && debouncedSearchQuery.length >= 2,
  });
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Update the URL with the new query
    setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
  };
  
  // Handle filter changes
  const handleFilterChange = (key: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Count total results across all categories
  const totalResults = (users?.length || 0) + 
                       (posts?.length || 0) + 
                       (products?.length || 0) + 
                       (communities?.length || 0);
  
  // Get results based on active tab
  const getActiveTabResults = () => {
    switch (activeTab) {
      case "users":
        return users?.length || 0;
      case "posts":
        return posts?.length || 0;
      case "products":
        return products?.length || 0;
      case "communities":
        return communities?.length || 0;
      default:
        return totalResults;
    }
  };
  
  return (
    <div className="bg-background min-h-screen">
      <PageHeader
        title="Search Results"
        description={`${getActiveTabResults()} results for "${debouncedSearchQuery}"`}
        icon={<SearchIcon className="h-6 w-6" />}
        backLink="/explore"
        backLinkText="Back to Explore"
      />
      
      <div className="container max-w-screen-xl py-6">
        {/* Search bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Search for users, communities, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit">
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </div>
        
        {/* Main search results container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar - desktop */}
          <div className="hidden lg:block">
            <div className="bg-card rounded-lg border border-border p-4 sticky top-20">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Sort by</h4>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="popular">Most popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Filter options</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="verified" 
                      checked={filters.verifiedOnly}
                      onCheckedChange={() => handleFilterChange('verifiedOnly')}
                    />
                    <label htmlFor="verified" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Verified only
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="local" 
                      checked={filters.localOnly}
                      onCheckedChange={() => handleFilterChange('localOnly')}
                    />
                    <label htmlFor="local" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Local results only
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasProducts" 
                      checked={filters.hasProducts}
                      onCheckedChange={() => handleFilterChange('hasProducts')}
                    />
                    <label htmlFor="hasProducts" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Has products
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="premium" 
                      checked={filters.isPremium}
                      onCheckedChange={() => handleFilterChange('isPremium')}
                    />
                    <label htmlFor="premium" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Premium content
                    </label>
                  </div>
                </div>
                
                <Separator />
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSortBy("relevance");
                    setFilters({
                      verifiedOnly: false,
                      localOnly: false,
                      hasProducts: false,
                      isPremium: false
                    });
                  }}
                >
                  Reset filters
                </Button>
              </div>
            </div>
          </div>
          
          {/* Search results */}
          <div className="lg:col-span-3">
            <Tabs 
              defaultValue="all" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4 grid grid-cols-5">
                <TabsTrigger value="all" className="relative">
                  <Hash className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">All</span>
                  {totalResults > 0 && (
                    <Badge variant="secondary" className="ml-2">{totalResults}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="users" className="relative">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">People</span>
                  {users?.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{users.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="posts" className="relative">
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Posts</span>
                  {posts?.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{posts.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="products" className="relative">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Products</span>
                  {products?.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{products.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="communities" className="relative">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Communities</span>
                  {communities?.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{communities.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              {/* All results tab */}
              <TabsContent value="all" className="mt-4 space-y-8">
                {/* Users section */}
                {users && users.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">People</h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveTab("users")}
                      >
                        See all
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {users.slice(0, 4).map((user: UserProfile) => (
                        <Card key={user.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex items-center gap-3 p-4">
                              <Avatar className="h-12 w-12">
                                {user.avatar ? (
                                  <AvatarImage 
                                    src={user.avatar} 
                                    alt={user.name || user.username} 
                                  />
                                ) : null}
                                <AvatarFallback>
                                  {getInitials(user.name || user.username)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">
                                    {user.name || user.username}
                                  </span>
                                  {user.isVendor && (
                                    <Badge variant="outline" className="text-xs">Vendor</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  @{user.username}
                                </div>
                                {user.bio && (
                                  <div className="text-sm text-muted-foreground truncate mt-1">
                                    {user.bio}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setLocation(`/messages?user=${user.id}`)}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => setLocation(`/profile/${user.username}`)}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Products section */}
                {products && products.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Products</h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveTab("products")}
                      >
                        See all
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {products.slice(0, 3).map((product: Product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Posts section */}
                {posts && posts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Posts</h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveTab("posts")}
                      >
                        See all
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {posts.slice(0, 2).map((post: Post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Communities section */}
                {communities && communities.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Communities</h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveTab("communities")}
                      >
                        See all
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {communities.slice(0, 4).map((community: Community) => (
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
                  </div>
                )}
                
                {/* No results state */}
                {!isLoadingUsers && !isLoadingPosts && !isLoadingProducts && !isLoadingCommunities && 
                 totalResults === 0 && debouncedSearchQuery.length >= 2 && (
                  <div className="text-center py-16">
                    <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">No results found</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      We couldn't find any matches for "{debouncedSearchQuery}". 
                      Try adjusting your search terms or browse categories instead.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation('/explore')}
                      >
                        Browse Categories
                      </Button>
                      <Button 
                        variant="default"
                        onClick={() => {
                          setSearchQuery('');
                          setLocation('/explore');
                        }}
                      >
                        Return to Explore
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Loading state */}
                {(isLoadingUsers || isLoadingPosts || isLoadingProducts || isLoadingCommunities) && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-32" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <Card key={i}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2 flex-1">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Users tab */}
              <TabsContent value="users" className="mt-4">
                {isLoadingUsers ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                            <div className="flex gap-2">
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-16" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !users || users.length === 0 ? (
                  <div className="text-center py-16">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">No users found</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      We couldn't find any users matching "{debouncedSearchQuery}".
                      Try different search terms or browse all users.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/explore')}
                    >
                      Browse All Users
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.map((user: UserProfile) => (
                      <Card key={user.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex items-center gap-3 p-4">
                            <Avatar className="h-12 w-12">
                              {user.avatar ? (
                                <AvatarImage 
                                  src={user.avatar} 
                                  alt={user.name || user.username} 
                                />
                              ) : null}
                              <AvatarFallback>
                                {getInitials(user.name || user.username)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {user.name || user.username}
                                </span>
                                {user.isVendor && (
                                  <Badge variant="outline" className="text-xs">Vendor</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                @{user.username}
                              </div>
                              {user.bio && (
                                <div className="text-sm text-muted-foreground truncate mt-1">
                                  {user.bio}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setLocation(`/messages?user=${user.id}`)}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => setLocation(`/profile/${user.username}`)}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Posts tab */}
              <TabsContent value="posts" className="mt-4">
                {isLoadingPosts ? (
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
                ) : !posts || posts.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">No posts found</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      We couldn't find any posts matching "{debouncedSearchQuery}".
                      Try different search terms or browse all posts.
                    </p>
                    <Button variant="outline" onClick={() => setLocation('/social')}>
                      Browse Posts
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posts.map((post: Post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Products tab */}
              <TabsContent value="products" className="mt-4">
                {isLoadingProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
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
                ) : !products || products.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">No products found</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      We couldn't find any products matching "{debouncedSearchQuery}".
                      Try different search terms or browse all products.
                    </p>
                    <Button variant="outline" onClick={() => setLocation('/products')}>
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {products.map((product: Product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Communities tab */}
              <TabsContent value="communities" className="mt-4">
                {isLoadingCommunities ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                ) : !communities || communities.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">No communities found</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      We couldn't find any communities matching "{debouncedSearchQuery}".
                      Try different search terms or browse all communities.
                    </p>
                    <Button variant="outline" onClick={() => setLocation('/communities')}>
                      Browse Communities
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {communities.map((community: Community) => (
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
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}