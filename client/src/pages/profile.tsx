import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import ConnectionsCard from "@/components/social/ConnectionsCard";
import PostCard from "@/components/social/PostCard";
import CreatePost from "@/components/social/CreatePost";
import PageHeader from "@/components/layout/PageHeader";
import { getInitials } from "@/lib/utils";
import { 
  User as UserIcon,
  Pencil,
  Mail,
  Store,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  History,
  Loader2,
  Check,
  X,
  Gift,
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Plus,
  Home,
  Briefcase,
  GraduationCap,
  Building,
  Globe,
} from "lucide-react";

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/profile/:username");
  const username = params?.username || (currentUser ? currentUser.username : '');
  
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Fetch user profile data
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        }
        throw new Error("Failed to fetch user profile");
      }
      return response.json();
    },
    enabled: !!username,
  });

  // Fetch user's posts
  const {
    data: userPosts,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: [`/api/users/${username}/posts`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/posts`);
      if (!response.ok) {
        throw new Error("Failed to fetch user posts");
      }
      return response.json();
    },
    enabled: !!username,
  });

  // Fetch user's communities
  const {
    data: userCommunities,
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
    enabled: !!username,
  });

  // Fetch user's vendor info if they are a vendor
  const {
    data: vendorInfo,
    isLoading: isLoadingVendorInfo,
  } = useQuery({
    queryKey: [`/api/users/${username}/vendor`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/vendor`);
      if (!response.ok && response.status !== 404) {
        throw new Error("Failed to fetch vendor information");
      }
      if (response.status === 404) {
        return null;
      }
      return response.json();
    },
    enabled: !!profileData?.isVendor && !!username,
  });

  // Connection status mutation
  const connectionMutation = useMutation({
    mutationFn: async (action: "connect" | "disconnect") => {
      const method = action === "connect" ? "POST" : "DELETE";
      const response = await apiRequest(
        method,
        `/api/users/${profileData?.id}/connect`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} with user`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      refetchProfile();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest(
        "PATCH",
        "/api/users/profile",
        formData,
        true
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      refetchProfile();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Initialize edit form with current user data
  useEffect(() => {
    if (profileData && isEditing) {
      setEditName(profileData.name || "");
      setEditBio(profileData.bio || "");
      setEditLocation(profileData.location || "");
      setEditWebsite(profileData.website || "");
      setAvatarPreview(profileData.avatar || "");
    }
  }, [profileData, isEditing]);

  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Handle profile update submission
  const handleUpdateProfile = () => {
    if (!currentUser) return;
    
    const formData = new FormData();
    formData.append("name", editName);
    formData.append("bio", editBio);
    
    if (editLocation) {
      formData.append("location", editLocation);
    }
    
    if (editWebsite) {
      formData.append("website", editWebsite);
    }
    
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }
    
    updateProfileMutation.mutate(formData);
  };

  // Handle connection action
  const handleConnectionAction = (action: "connect" | "disconnect") => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to connect with users",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    connectionMutation.mutate(action);
  };

  // Determine connection status
  const getConnectionStatus = () => {
    if (!currentUser || !profileData) return "not_connected";
    
    // Can't connect to self
    if (currentUser.id === profileData.id) return "self";
    
    // Check if connected
    return profileData.isConnected ? "connected" : "not_connected";
  };

  // Handle post creation success
  const handlePostSuccess = () => {
    refetchPosts();
  };

  // Render if profile not found or error
  if (profileError) {
    return (
      <div className="container max-w-screen-xl py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <UserIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-muted-foreground mb-6">
            The user you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => setLocation("/")}
          >
            <Home className="h-4 w-4 mr-2" />
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoadingProfile || !profileData) {
    return (
      <div className="container max-w-screen-xl py-6">
        <PageHeader
          title={
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-40" />
            </div>
          }
          description={<Skeleton className="h-4 w-60" />}
          icon={<UserIcon className="h-6 w-6 text-primary" />}
        />
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile sidebar skeleton */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Skeleton className="h-24 w-24 rounded-full mb-4" />
                  <Skeleton className="h-6 w-40 mb-1" />
                  <Skeleton className="h-4 w-32 mb-3" />
                  <Skeleton className="h-16 w-full mb-4" />
                  <div className="flex gap-2 w-full">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Skeleton className="h-64 w-full" />
          </div>
          
          {/* Main content skeleton */}
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const connectionStatus = getConnectionStatus();

  return (
    <div className="bg-background min-h-screen">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            {profileData.name}
            {profileData.isVendor && (
              <Badge variant="outline" className="ml-2">
                <Store className="h-3 w-3 mr-1" />
                Vendor
              </Badge>
            )}
          </div>
        }
        description={`@${profileData.username}`}
        icon={<UserIcon className="h-6 w-6" />}
      />

      <div className="container max-w-screen-xl py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile sidebar */}
          <div className="space-y-6">
            {/* Profile card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Profile picture with edit option */}
                  <div className="relative mb-4">
                    <Avatar className="h-24 w-24">
                      {profileData.avatar ? (
                        <AvatarImage 
                          src={isEditing ? avatarPreview : profileData.avatar} 
                          alt={profileData.name}
                        />
                      ) : null}
                      <AvatarFallback className="text-lg">
                        {getInitials(profileData.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {isEditing && (
                      <div className="absolute bottom-0 right-0">
                        <label
                          htmlFor="avatar-upload"
                          className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Name and username */}
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Name"
                      className="mb-2 text-center"
                    />
                  ) : (
                    <h2 className="text-xl font-bold">{profileData.name}</h2>
                  )}
                  
                  <p className="text-muted-foreground mb-3">@{profileData.username}</p>
                  
                  {/* Bio */}
                  {isEditing ? (
                    <Textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Write a short bio..."
                      className="mb-4 min-h-[100px] text-center"
                    />
                  ) : (
                    <div className="mb-4">
                      {profileData.bio ? (
                        <p className="text-sm">{profileData.bio}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {currentUser?.id === profileData.id
                            ? "Add a bio to tell people about yourself"
                            : "No bio available"}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Additional profile information */}
                  {(profileData.location || profileData.website || isEditing) && (
                    <div className="w-full flex flex-col gap-2 mb-4">
                      {/* Location */}
                      {(profileData.location || isEditing) && (
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {isEditing ? (
                            <Input
                              value={editLocation}
                              onChange={(e) => setEditLocation(e.target.value)}
                              placeholder="Location"
                              className="h-7 text-center"
                            />
                          ) : (
                            <span>{profileData.location}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Website */}
                      {(profileData.website || isEditing) && (
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          {isEditing ? (
                            <Input
                              value={editWebsite}
                              onChange={(e) => setEditWebsite(e.target.value)}
                              placeholder="Website"
                              className="h-7 text-center"
                            />
                          ) : (
                            <a
                              href={profileData.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {profileData.website}
                            </a>
                          )}
                        </div>
                      )}
                      
                      {/* Join date */}
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Joined {new Date(profileData.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 w-full">
                    {/* Edit profile button (only for current user) */}
                    {currentUser?.id === profileData.id ? (
                      isEditing ? (
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsEditing(false)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={handleUpdateProfile}
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setIsEditing(true)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit Profile
                        </Button>
                      )
                    ) : (
                      // Connection and message buttons for other users
                      <>
                        {/* Connect/Disconnect button */}
                        {connectionStatus === "not_connected" ? (
                          <Button
                            className="flex-1"
                            onClick={() => handleConnectionAction("connect")}
                            disabled={connectionMutation.isPending}
                          >
                            {connectionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-1" />
                            )}
                            Connect
                          </Button>
                        ) : connectionStatus === "connected" ? (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleConnectionAction("disconnect")}
                            disabled={connectionMutation.isPending}
                          >
                            {connectionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <UserCheck className="h-4 w-4 mr-1" />
                            )}
                            Connected
                          </Button>
                        ) : null}
                        
                        {/* Message button */}
                        <Button
                          variant={connectionStatus === "connected" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setLocation(`/messages/${profileData.username}`)}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Connections card */}
            <ConnectionsCard
              profileId={profileData.id}
              profileUsername={profileData.username}
              showRecommendations={currentUser?.id === profileData.id}
              className="w-full"
            />
            
            {/* If user is a vendor, show vendor information */}
            {profileData.isVendor && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Store className="h-4 w-4 mr-2 text-primary" />
                    Vendor Information
                  </h3>
                  
                  {isLoadingVendorInfo ? (
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-full mt-2" />
                    </div>
                  ) : vendorInfo ? (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <h4 className="font-medium">{vendorInfo.storeName}</h4>
                        {vendorInfo.rating > 0 && (
                          <div className="flex items-center ml-2">
                            <i className="ri-star-fill text-yellow-500 mr-1 text-sm"></i>
                            <span className="text-sm">
                              {vendorInfo.rating.toFixed(1)}
                              {vendorInfo.ratingCount > 0 && (
                                <span className="text-muted-foreground">
                                  {" "}({vendorInfo.ratingCount})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {vendorInfo.description && (
                        <p className="text-sm text-muted-foreground">
                          {vendorInfo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                        <span>
                          {vendorInfo.productCount || 0} products available
                        </span>
                      </div>
                      
                      <Button
                        className="w-full"
                        onClick={() => setLocation(`/vendor/${vendorInfo.id}`)}
                      >
                        <Store className="h-4 w-4 mr-1" />
                        Visit Store
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Vendor information not available
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Main content area */}
          <div className="md:col-span-2 space-y-6">
            {/* Create post component (only for current user) */}
            {currentUser?.id === profileData.id && (
              <CreatePost onSuccess={handlePostSuccess} />
            )}
            
            {/* Tabs for different content sections */}
            <Tabs 
              defaultValue="posts" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="communities">Communities</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>
              
              {/* Posts tab */}
              <TabsContent value="posts" className="space-y-6 mt-6">
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
                ) : !userPosts || userPosts.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {currentUser?.id === profileData.id
                        ? "Share your thoughts, photos, or products with your network!"
                        : `${profileData.name} hasn't posted anything yet.`}
                    </p>
                    {currentUser?.id === profileData.id && (
                      <Button 
                        onClick={() => document.querySelector("textarea")?.focus()}
                      >
                        Create a Post
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userPosts.map((post: any) => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        onDelete={handlePostSuccess}
                      />
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
                ) : !userCommunities || userCommunities.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium mb-2">No communities yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {currentUser?.id === profileData.id
                        ? "Join communities to connect with like-minded people!"
                        : `${profileData.name} hasn't joined any communities yet.`}
                    </p>
                    {currentUser?.id === profileData.id && (
                      <Button 
                        onClick={() => setLocation("/communities")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Explore Communities
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userCommunities.map((community: any) => (
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
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {community.role || "Member"}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/communities/${community.id}`);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {currentUser?.id === profileData.id && (
                      <Card 
                        className="cursor-pointer border-dashed flex items-center justify-center hover:bg-accent/50 transition-colors"
                        onClick={() => setLocation("/communities")}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                          <Plus className="h-12 w-12 text-muted-foreground mb-3" />
                          <h3 className="font-medium text-center">Join more communities</h3>
                          <p className="text-sm text-muted-foreground text-center mt-1">
                            Discover communities that match your interests
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* About tab */}
              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4">About {profileData.name}</h3>
                    
                    {/* Bio section */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Bio</h4>
                      {profileData.bio ? (
                        <p>{profileData.bio}</p>
                      ) : (
                        <p className="text-muted-foreground italic">
                          {currentUser?.id === profileData.id
                            ? "Add a bio to tell people about yourself"
                            : "No bio available"}
                        </p>
                      )}
                    </div>
                    
                    {/* Basic information */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Basic Information
                      </h4>
                      <div className="space-y-3">
                        {/* Username */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 flex justify-center">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Username</p>
                            <p>@{profileData.username}</p>
                          </div>
                        </div>
                        
                        {/* Join date */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 flex justify-center">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Joined</p>
                            <p>{new Date(profileData.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        {/* Location */}
                        {profileData.location && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 flex justify-center">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Location</p>
                              <p>{profileData.location}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Website */}
                        {profileData.website && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 flex justify-center">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Website</p>
                              <a
                                href={profileData.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                {profileData.website}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Vendor information */}
                    {profileData.isVendor && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Vendor Information
                        </h4>
                        {isLoadingVendorInfo ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        ) : vendorInfo ? (
                          <div className="space-y-3">
                            {/* Store name */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 flex justify-center">
                                <Store className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Store name</p>
                                <p>{vendorInfo.storeName}</p>
                              </div>
                            </div>
                            
                            {/* Rating */}
                            {vendorInfo.rating > 0 && (
                              <div className="flex items-center gap-3">
                                <div className="w-8 flex justify-center">
                                  <i className="ri-star-fill text-yellow-500"></i>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Rating</p>
                                  <p>
                                    {vendorInfo.rating.toFixed(1)} out of 5
                                    {vendorInfo.ratingCount > 0 && (
                                      <span className="text-muted-foreground">
                                        {" "}({vendorInfo.ratingCount} reviews)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Products */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 flex justify-center">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Products</p>
                                <p>{vendorInfo.productCount || 0} products</p>
                              </div>
                            </div>
                            
                            <Button
                              className="ml-8 mt-2"
                              onClick={() => setLocation(`/vendor/${vendorInfo.id}`)}
                            >
                              <Store className="h-4 w-4 mr-1" />
                              Visit Store
                            </Button>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            Vendor information not available
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Options for current user */}
                    {currentUser?.id === profileData.id && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit Profile
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}