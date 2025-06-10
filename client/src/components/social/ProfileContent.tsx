import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import ConnectionsCard from "@/components/social/ConnectionsCard";
import PostCard from "@/components/social/PostCard";
import { getInitials } from "@/lib/utils";
import { 
  User as UserIcon, 
  MapPin, 
  Calendar, 
  Link as LinkIcon, 
  Grid, 
  BookOpen,
  PlusCircle,
  Settings,
  Edit,
  Camera,
  Loader2
} from "lucide-react";

interface ProfileContentProps {
  user: any;
  username?: string;
}

export default function ProfileContent({ user, username }: ProfileContentProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
  });

  // Fetch profile data if username is provided (viewing someone else's profile)
  // or use the current user data if not (viewing own profile)
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/users/profile", username || user?.username],
    queryFn: async () => {
      // If no username and no user, we can't fetch anything
      if (!username && !user) return null;

      // If username is provided, fetch that user's profile
      if (username) {
        const response = await fetch(`/api/users/profile/${username}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        return response.json();
      }
      
      // Otherwise use the current user data
      return user;
    },
    enabled: !!username || !!user,
    onSuccess: (data) => {
      if (data) {
        setProfileUser(data);
        // Initialize form with current data
        setProfileForm({
          name: data.name || "",
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
        });
      }
    },
  });

  // Fetch user posts
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/posts/user", profileUser?.id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/user/${profileUser.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user posts");
      }
      return response.json();
    },
    enabled: !!profileUser?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/users/profile`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      setProfileUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/users/follow/${userId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to follow user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      toast({
        title: "Success",
        description: profileUser.isFollowing 
          ? `Unfollowed ${profileUser.name}`
          : `Now following ${profileUser.name}`,
      });
      // Update local state to reflect the change
      setProfileUser({
        ...profileUser,
        isFollowing: !profileUser.isFollowing,
        followerCount: profileUser.isFollowing 
          ? profileUser.followerCount - 1
          : profileUser.followerCount + 1
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmitProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handleFollowClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    if (profileUser?.id) {
      followMutation.mutate(profileUser.id);
    }
  };

  const isOwnProfile = !username && !!user;
  const displayUser = profileUser || userData;

  if (isLoadingUser) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="text-center py-10">
        <UserIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
        <p className="text-muted-foreground mb-6">
          The user you're looking for doesn't exist or you might not have permission to view this profile.
        </p>
        <Button onClick={() => setLocation("/social/wall")}>
          Return to Wall
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="h-24 w-24">
              {displayUser.avatar ? (
                <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
              ) : null}
              <AvatarFallback className="text-xl">
                {getInitials(displayUser.name || "User")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{displayUser.name}</h2>
                  <p className="text-muted-foreground">@{displayUser.username}</p>
                </div>
                
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <>
                      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                            <DialogDescription>
                              Make changes to your profile information.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <form onSubmit={handleSubmitProfileUpdate} className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="bio">Bio</Label>
                              <Textarea
                                id="bio"
                                value={profileForm.bio}
                                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                rows={3}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="location">Location</Label>
                              <Input
                                id="location"
                                value={profileForm.location}
                                onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="website">Website</Label>
                              <Input
                                id="website"
                                value={profileForm.website}
                                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                                placeholder="https://"
                              />
                            </div>
                            
                            <DialogFooter>
                              <Button 
                                type="submit" 
                                disabled={updateProfileMutation.isPending}
                              >
                                {updateProfileMutation.isPending && (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="outline" onClick={() => setLocation("/settings")}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={handleFollowClick}
                      variant={displayUser.isFollowing ? "outline" : "default"}
                      disabled={followMutation.isPending}
                    >
                      {followMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlusCircle className="h-4 w-4 mr-2" />
                      )}
                      {displayUser.isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Bio */}
              {displayUser.bio && (
                <p className="my-3 text-sm">{displayUser.bio}</p>
              )}
              
              {/* Profile details */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                {displayUser.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {displayUser.location}
                  </div>
                )}
                
                {displayUser.website && (
                  <div className="flex items-center">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    <a 
                      href={displayUser.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {displayUser.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                
                {displayUser.joinedAt && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {new Date(displayUser.joinedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex gap-x-4 mt-3">
                <div className="text-sm">
                  <span className="font-bold">{displayUser.postCount || 0}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
                <div className="text-sm">
                  <span className="font-bold">{displayUser.followerCount || 0}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div className="text-sm">
                  <span className="font-bold">{displayUser.followingCount || 0}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Profile content tabs */}
      <Tabs
        defaultValue="posts"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        {/* Posts tab */}
        <TabsContent value="posts" className="space-y-4">
          {isLoadingPosts ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : !userPosts || userPosts.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                {isOwnProfile 
                  ? "Share your thoughts, photos, and more with your followers!"
                  : "This user hasn't posted anything yet."}
              </p>
              {isOwnProfile && (
                <Button onClick={() => setLocation("/social/wall")}>
                  Create Post
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {userPosts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Media tab */}
        <TabsContent value="media">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-2">
                {/* This would be replaced with actual media from the user */}
                {Array(6).fill(0).map((_, i) => (
                  <div 
                    key={i} 
                    className="aspect-square bg-muted rounded-md overflow-hidden cursor-pointer"
                  >
                    <Skeleton className="h-full w-full" />
                  </div>
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
                  {isOwnProfile 
                    ? "Start selling by adding products to your store!"
                    : "This user hasn't listed any products yet."}
                </p>
                {isOwnProfile && (
                  <Button onClick={() => setLocation("/upload-product")}>
                    Add Product
                  </Button>
                )}
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
                    {displayUser.bio || "No bio provided."}
                  </p>
                </div>
                
                <Separator />
                
                {/* Connections */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Connections</h3>
                  <ConnectionsCard userId={displayUser.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}