import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import ConnectionsCard from "@/components/social/ConnectionsCard";
import PostCard from "@/components/social/PostCard";
import CreatePost from "@/components/social/CreatePost";
import { getInitials } from "@/lib/utils";
import { Post } from "@shared/schema";
import { 
  PenSquare, 
  Loader2, 
  Users, 
  Building2,
  Activity,
  ShoppingBag,
  Heart,
  TrendingUp,
  Film,
  Clock,
  Radio,
  Upload,
  Bookmark
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function WallPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("personal");

  // Redirect to auth if not logged in
  useEffect(() => {
    if (user === null) {
      toast({
        title: "Authentication required",
        description: "Please log in to view your wall",
        variant: "destructive",
      });
      setLocation("/auth");
    }
  }, [user, toast, setLocation]);

  // Fetch user's personal feed
  const {
    data: personalFeed,
    isLoading: isLoadingPersonal,
    refetch: refetchPersonal,
  } = useQuery<Post[]>({
    queryKey: ["/api/feed/personal"],
    enabled: !!user,
    // Using default query function from queryClient which includes auth headers
  });

  // Fetch user's communities feed
  const {
    data: communitiesFeed,
    isLoading: isLoadingCommunities,
    refetch: refetchCommunities,
  } = useQuery<Post[]>({
    queryKey: ["/api/feed/communities"],
    enabled: !!user,
    // Using default query function from queryClient which includes auth headers
  });

  // Fetch recommended feed
  const {
    data: recommendedFeed,
    isLoading: isLoadingRecommended,
    refetch: refetchRecommended,
  } = useQuery<Post[]>({
    queryKey: ["/api/feed/recommended"],
    enabled: !!user,
    // Using default query function from queryClient which includes auth headers
  });

  // Handle post creation success
  const handlePostSuccess = () => {
    // Refetch all feeds
    refetchPersonal();
    refetchCommunities();
    refetchRecommended();
    
    // Invalidate user stats queries to update post count
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
  };

  if (!user) {
    return (
      <div className="container max-w-screen-xl py-6">
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <PageHeader
        title="Your Wall"
        description="Share and discover content from your network"
        icon={<PenSquare className="h-6 w-6" />}
      />

      <div className="container max-w-screen-xl py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* User profile card */}
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  {user.avatar ? (
                    <AvatarImage 
                      src={user.avatar} 
                      alt={user.name || "User"}
                    />
                  ) : null}
                  <AvatarFallback className="text-lg">
                    {getInitials(user.name || "User")}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground mb-3">@{user.username}</p>
                
                {user.bio ? (
                  <p className="text-sm mb-4">{user.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    No bio yet. Tell people about yourself!
                  </p>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation(`/profile/${user.username}`)}
                >
                  View Full Profile
                </Button>
              </div>
            </Card>
            
            {/* Connections card */}
            <ConnectionsCard 
              profileId={user.id}
              profileUsername={user.username}
              showRecommendations={true} 
              isSidebar={true}
            />
            
            {/* Quick links */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/messages")}
                >
                  <i className="ri-message-3-line mr-2"></i>
                  Messages
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/saved-posts")}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved Posts
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/communities")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Communities
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/vendors")}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Vendors
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/products")}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Marketplace
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/explore")}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Explore
                </Button>
                
                {/* Video section divider */}
                <Separator className="my-2" />
                
                {/* Videos section */}
                <h4 className="text-sm font-medium text-muted-foreground px-2">Videos</h4>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/videos/trending")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending Videos
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/videos/shorts")}
                >
                  <Film className="h-4 w-4 mr-2" />
                  Shorts
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/videos/stories")}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Stories
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/videos/live")}
                >
                  <Radio className="h-4 w-4 mr-2" />
                  Live
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-primary"
                  onClick={() => setLocation("/videos/upload")}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Create post component */}
            <CreatePost onSuccess={handlePostSuccess} />
            
            {/* Tabs for different feeds */}
            <Tabs 
              defaultValue="personal" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="communities">Communities</TabsTrigger>
                <TabsTrigger value="recommended">For You</TabsTrigger>
              </TabsList>
              
              {/* Personal feed */}
              <TabsContent value="personal" className="space-y-6 mt-6">
                {isLoadingPersonal ? (
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
                ) : !personalFeed || (personalFeed as Post[]).length === 0 ? (
                  <div className="text-center py-10">
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Your personal feed shows posts from people you're connected with.
                      <br />
                      Make some connections to get started!
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setLocation("/members")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Find People
                      </Button>
                      <Button 
                        onClick={() => document.querySelector("textarea")?.focus()}
                      >
                        <PenSquare className="h-4 w-4 mr-2" />
                        Create a Post
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(personalFeed as Post[]).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Communities feed */}
              <TabsContent value="communities" className="space-y-6 mt-6">
                {isLoadingCommunities ? (
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
                ) : !communitiesFeed || (communitiesFeed as Post[]).length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No community posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Join communities to see posts from like-minded people.
                      <br />
                      Explore communities to get started!
                    </p>
                    <Button
                      onClick={() => setLocation("/communities")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Explore Communities
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(communitiesFeed as Post[]).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Recommended feed */}
              <TabsContent value="recommended" className="space-y-6 mt-6">
                {isLoadingRecommended ? (
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
                ) : !recommendedFeed || (recommendedFeed as Post[]).length === 0 ? (
                  <div className="text-center py-10">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">We're finding content for you</h3>
                    <p className="text-muted-foreground mb-4">
                      As you interact with the platform, we'll recommend content that matches your interests.
                      <br />
                      Explore the platform to help us understand what you like!
                    </p>
                    <Button
                      onClick={() => setLocation("/explore")}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Explore Content
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(recommendedFeed as Post[]).map((post) => (
                      <PostCard key={post.id} post={post} />
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