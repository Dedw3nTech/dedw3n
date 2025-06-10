import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from "@/components/layout/PageHeader";
import { getInitials } from "@/lib/utils";
import { 
  User as UserIcon,
  Users,
  Store,
  Heart,
  MessageSquare,
  Home,
  Compass,
  Bell,
  Pencil,
} from "lucide-react";

export default function ProfileSimple() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/profile/:username");
  
  // Use current user if no username provided
  const usernameOrId = params?.username || (currentUser ? currentUser.id.toString() : '');
  const isUsingId = !params?.username || !usernameOrId;
  
  // Fetch user profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: [isUsingId ? `/api/users/id/${usernameOrId}` : `/api/users/${usernameOrId}`],
    queryFn: async () => {
      const endpoint = isUsingId ? `/api/users/id/${usernameOrId}` : `/api/users/${usernameOrId}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      return response.json();
    },
    enabled: !!usernameOrId,
  });

  // Fetch user's posts
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: [isUsingId ? `/api/users/id/${usernameOrId}/posts` : `/api/users/${usernameOrId}/posts`],
    queryFn: async () => {
      const endpoint = isUsingId ? `/api/users/id/${usernameOrId}/posts` : `/api/users/${usernameOrId}/posts`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch user posts");
      }
      return response.json();
    },
    enabled: !!usernameOrId,
  });

  if (isLoadingProfile || !profileData) {
    return (
      <div className="container max-w-screen-xl py-6">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <PageHeader
        title={profileData.name}
        description={`@${profileData.username}`}
        icon={<UserIcon className="h-6 w-6" />}
      />

      {/* Quick Navigation Menu */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container max-w-screen-xl px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-1 overflow-x-auto">
              <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setLocation("/")}>
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setLocation("/marketplace")}>
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Marketplace</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setLocation("/community")}>
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Community</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setLocation("/messages")}>
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Dating</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setLocation("/wall")}>
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Wall</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setLocation("/explore")}>
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">Explore</span>
              </Button>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/notifications")}>
                <Bell className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={() => setLocation("/messages")}>
                <MessageSquare className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setLocation("/profile-settings")}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-screen-xl py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    {profileData.avatar ? (
                      <AvatarImage src={profileData.avatar} alt={profileData.name} />
                    ) : (
                      <AvatarFallback className="text-lg">
                        {getInitials(profileData.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <h1 className="text-xl font-bold mb-1">{profileData.name}</h1>
                  <p className="text-muted-foreground mb-3">@{profileData.username}</p>
                  
                  {profileData.bio && (
                    <p className="text-sm text-muted-foreground mb-4">{profileData.bio}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Posts ({userPosts?.length || 0})</h2>
                
                {isLoadingPosts ? (
                  <div className="text-center py-8">Loading posts...</div>
                ) : userPosts && userPosts.length > 0 ? (
                  <div className="space-y-4">
                    {userPosts.map((post: any) => (
                      <div key={post.id} className="border-b pb-4 last:border-b-0">
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                        <p>{post.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No posts yet
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