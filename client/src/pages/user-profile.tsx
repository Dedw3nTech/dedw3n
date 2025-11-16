import { useParams, useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import EnhancedPostCard from "@/components/social/EnhancedPostCard";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { 
  MapPin,
  Eye,
  TrendingUp,
  Search,
  Loader2,
  BarChart,
  Plus,
  ShoppingBag,
  X,
  Check
} from "lucide-react";

export default function UserProfilePage() {
  const { translateText } = useMasterTranslation();
  const { username } = useParams<{ username: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");

  // Fetch user profile data
  const { data: profileUser, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null; // User not found - return null instead of throwing
        }
        throw new Error("Failed to fetch user profile");
      }
      // Safe JSON parsing
      try {
        return await response.json();
      } catch (error) {
        throw new Error("Invalid response format");
      }
    },
    enabled: !!username,
  });

  // Fetch user's posts
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: [`/api/users/${username}/posts`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/posts`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user posts");
      }
      return response.json();
    },
    enabled: !!username,
  });

  // Fetch user profile stats
  const { data: profileStats } = useQuery({
    queryKey: [`/api/users/${username}/stats`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/stats`, {
        credentials: 'include'
      });
      if (!response.ok) {
        return { profileViews: 0, postImpressions: 0, searchAppearances: 0 };
      }
      return response.json();
    },
    enabled: !!username,
  });

  // Fetch vendor products if user is a vendor
  const { data: vendorProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: [`/api/users/${username}/products`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/products`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!profileUser?.isVendor && !!username,
  });

  const isOwnProfile = currentUser?.username === username;

  // Initialize bio text when profile loads
  useEffect(() => {
    if (profileUser?.bio) {
      setBioText(profileUser.bio);
    }
  }, [profileUser]);

  // Mutation to update bio
  const updateBioMutation = useMutation({
    mutationFn: async (bio: string) => {
      return await apiRequest('PATCH', '/api/users/profile', { bio });
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      await queryClient.refetchQueries({ queryKey: [`/api/users/${username}`] });
      setIsEditingBio(false);
      toast({
        title: translateText("Success"),
        description: translateText("Bio updated successfully")
      });
    },
    onError: () => {
      toast({
        title: translateText("Error"),
        description: translateText("Failed to update bio"),
        variant: "destructive"
      });
    }
  });

  // Fetch friendship status
  const { data: friendshipStatus } = useQuery({
    queryKey: [`/api/friends/status/${profileUser?.id}`],
    queryFn: async () => {
      if (!profileUser?.id || isOwnProfile) return null;
      const response = await fetch(`/api/friends/status/${profileUser.id}`, {
        credentials: 'include'
      });
      if (!response.ok) return { status: 'none' };
      return response.json();
    },
    enabled: !!profileUser?.id && !isOwnProfile && !!currentUser,
  });

  // Send friend request
  const sendFriendRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/friends/request/${profileUser.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: translateText("Friend Request Sent"),
        description: `${translateText("Friend request sent to")} ${profileUser.name || profileUser.username}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/friends/status/${profileUser?.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: translateText("Error"),
        description: error.message || translateText("Failed to send friend request"),
        variant: "destructive",
      });
    },
  });

  // Track profile view (don't track own profile views)
  useEffect(() => {
    if (profileUser && !isOwnProfile) {
      fetch('/api/analytics/profile-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profileUserId: profileUser.id })
      }).catch(err => console.error('Failed to track profile view:', err));
    }
  }, [profileUser, isOwnProfile]);

  // Redirect to admin profile if user not found (404)
  useEffect(() => {
    if (!isLoadingProfile && profileUser === null && !profileError && username !== "admin") {
      setLocation("/profile/admin");
    }
  }, [isLoadingProfile, profileUser, profileError, username, setLocation]);

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle other errors (auth, network, etc.)
  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{translateText("Error loading profile")}</h1>
          <p className="text-muted-foreground mb-4">{translateText("Unable to load this profile. Please try again later.")}</p>
          <Button onClick={() => setLocation("/community")}>{translateText("Go to Community")}</Button>
        </div>
      </div>
    );
  }

  // User not found (404)
  if (profileUser === null) {
    // For admin profile 404, show error UI instead of redirect
    if (username === "admin") {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{translateText("Profile not found")}</h1>
            <p className="text-muted-foreground mb-4">{translateText("The profile you're looking for doesn't exist.")}</p>
            <Button onClick={() => setLocation("/community")}>{translateText("Go to Community")}</Button>
          </div>
        </div>
      );
    }
    // For other users, redirect will happen via useEffect
    return null;
  }

  const initials = profileUser.name 
    ? profileUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : profileUser.username.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <Card className="border-0 border-b rounded-none">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={profileUser.avatar} alt={profileUser.name || profileUser.username} />
                <AvatarFallback className="text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{profileUser.name || profileUser.username}</h1>
                    <p className="text-muted-foreground mt-1">@{profileUser.username}</p>
                    {profileUser.city && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                        <MapPin className="h-4 w-4" />
                        <span>{profileUser.city}{profileUser.country && `, ${profileUser.country}`}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <Button variant="ghost" onClick={() => setLocation("/profile-settings")}>
                        {translateText("Edit Profile")}
                      </Button>
                    ) : (
                      <>
                        {/* Friend Request Button */}
                        {friendshipStatus?.status === 'none' && (
                          <Button 
                            variant="ghost"
                            onClick={() => sendFriendRequestMutation.mutate()}
                            disabled={sendFriendRequestMutation.isPending}
                          >
                            {sendFriendRequestMutation.isPending ? translateText("Sending...") : translateText("Add Friend")}
                          </Button>
                        )}
                        
                        {/* Pending Request */}
                        {friendshipStatus?.status === 'pending' && (
                          <Button variant="ghost" disabled>
                            {translateText("Request Pending")}
                          </Button>
                        )}
                        
                        {/* Already Friends */}
                        {friendshipStatus?.status === 'accepted' && (
                          <Button variant="ghost" disabled>
                            {translateText("Friends")}
                          </Button>
                        )}
                        
                        {/* Message Button */}
                        <Button variant="ghost" onClick={() => setLocation(`/messages?user=${profileUser.username}`)}>
                          {translateText("Message")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {profileUser.bio && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {profileUser.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        {isOwnProfile && (
          <Card className="border-0 border-b rounded-none">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold mb-4">{translateText("Analytics")}</h2>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-2xl font-bold">{profileStats?.profileViews || 0}</p>
                  <p className="text-sm text-muted-foreground">{translateText("profile views")}</p>
                </div>

                <div>
                  <p className="text-2xl font-bold">{profileStats?.postImpressions || 0}</p>
                  <p className="text-sm text-muted-foreground">{translateText("post impressions")}</p>
                </div>

                <div>
                  <p className="text-2xl font-bold">{profileStats?.searchAppearances || 0}</p>
                  <p className="text-sm text-muted-foreground">{translateText("search appearances")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vendor Products Section */}
        {profileUser.isVendor && (
          <Card className="border-0 border-b rounded-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{translateText("Vendor")}</CardTitle>
                <button
                  onClick={() => setLocation(`/marketplace?vendor=${profileUser.id}`)}
                  className="text-sm text-black hover:underline cursor-pointer"
                >
                  {translateText("View all products")}
                </button>
              </div>
            </CardHeader>
            <CardContent className="border-t-0">
              {isLoadingProducts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : vendorProducts && vendorProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {vendorProducts.slice(0, 8).map((product: any) => (
                    <Link 
                      key={product.id} 
                      href={`/marketplace/products/${product.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">${product.price}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">{translateText("No products yet")}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* About Section */}
        <Card className="border-0 border-b rounded-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{translateText("About")}</CardTitle>
              {isOwnProfile && !isEditingBio && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditingBio(true)}
                  data-testid="button-edit-bio"
                >
                  {translateText("Edit Bio")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="border-t-0">
            {isEditingBio ? (
              <div className="space-y-3">
                <Textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder={translateText("Tell us about yourself...")}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                  data-testid="textarea-bio"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {bioText.length}/500 {translateText("characters")}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBioText(profileUser.bio || "");
                        setIsEditingBio(false);
                      }}
                      disabled={updateBioMutation.isPending}
                      data-testid="button-cancel-bio"
                    >
                      {translateText("Cancel")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateBioMutation.mutate(bioText)}
                      disabled={updateBioMutation.isPending}
                      className="bg-black hover:bg-gray-800 text-white"
                      data-testid="button-save-bio"
                    >
                      {updateBioMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      {translateText("Save")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed">
                {profileUser.bio || translateText("No bio available yet.")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Activity Section */}
        <Card className="border-0 border-b rounded-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg">{translateText("Activity")}</CardTitle>
                <span className="text-sm text-muted-foreground">{userPosts?.length || 0} {translateText("posts")}</span>
              </div>
              {isOwnProfile && (
                <Button variant="ghost" size="sm" onClick={() => setLocation("/community")}>
                  {translateText("Create a post")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="border-t-0">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab("posts")}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "posts"
                    ? "border-black text-black"
                    : "border-transparent text-muted-foreground hover:text-black"
                }`}
                data-testid="tab-posts"
              >
                {translateText("Posts")}
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "comments"
                    ? "border-black text-black"
                    : "border-transparent text-muted-foreground hover:text-black"
                }`}
                data-testid="tab-comments"
              >
                {translateText("Comments")}
              </button>
            </div>

            {activeTab === "posts" && (
              <div className="space-y-6">
                {isLoadingPosts ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : userPosts && userPosts.length > 0 ? (
                  userPosts.map((post: any) => (
                    <EnhancedPostCard 
                      key={post.id} 
                      post={post} 
                      showActions={true}
                      showBookmarkButton={true}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">{translateText("No posts yet")}</p>
                    {isOwnProfile && (
                      <Button 
                        variant="ghost" 
                        className="mt-4"
                        onClick={() => setLocation("/community")}
                      >
                        {translateText("Create your first post")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{translateText("No comments yet")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Languages Section */}
        {(profileUser.languages && profileUser.languages.length > 0) && (
          <Card className="border-0 border-b rounded-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{translateText("Languages")}</CardTitle>
                {isOwnProfile && (
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="border-t-0">
              <div className="space-y-3">
                {profileUser.languages.map((lang: any, index: number) => (
                  <div key={index}>
                    <p className="font-medium">{lang.name || lang}</p>
                    <p className="text-sm text-muted-foreground">
                      {lang.proficiency || translateText("Native or bilingual proficiency")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interests Section */}
        {(profileUser.interests && profileUser.interests.length > 0) && (
          <Card className="border-0 rounded-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{translateText("Interests")}</CardTitle>
                {isOwnProfile && (
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="border-t-0">
              <div className="flex flex-wrap gap-2">
                {profileUser.interests.map((interest: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
