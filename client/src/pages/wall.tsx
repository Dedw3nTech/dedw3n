import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { Loader2, Image, Link2, Tag, CalendarDays, Megaphone, ListFilter, MessageSquare, ThumbsUp, Share2, MoreHorizontal } from "lucide-react";

const postFormSchema = z.object({
  content: z.string().min(1, "Post content is required").max(1000, "Post must be less than 1000 characters"),
  title: z.string().optional(),
  imageUrl: z.string().optional(),
  tags: z.string().optional(),
});

type PostFormData = z.infer<typeof postFormSchema>;

export default function WallPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Redirect if not logged in
  if (!user) {
    toast({
      title: "Authentication required",
      description: "Please log in to view your wall",
      variant: "destructive",
    });
    setLocation("/auth");
    return null;
  }

  // Set up form for creating posts
  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      content: "",
      title: "",
      imageUrl: "",
      tags: "",
    },
  });

  // Fetch personal feed (user's posts + connected users' posts)
  const {
    data: personalFeed,
    isLoading: isLoadingPersonal,
    refetch: refetchPersonal,
  } = useQuery({
    queryKey: ["/api/feed/personal"],
    queryFn: async () => {
      const response = await fetch("/api/feed/personal");
      if (!response.ok) {
        throw new Error("Failed to fetch personal feed");
      }
      return response.json();
    },
  });

  // Fetch community feed (posts from communities the user is a member of)
  const {
    data: communityFeed,
    isLoading: isLoadingCommunity,
  } = useQuery({
    queryKey: ["/api/feed/communities"],
    queryFn: async () => {
      const response = await fetch("/api/feed/communities");
      if (!response.ok) {
        throw new Error("Failed to fetch community feed");
      }
      return response.json();
    },
  });

  // Fetch recommended feed (popular posts from across the platform)
  const {
    data: recommendedFeed,
    isLoading: isLoadingRecommended,
  } = useQuery({
    queryKey: ["/api/feed/recommended"],
    queryFn: async () => {
      const response = await fetch("/api/feed/recommended");
      if (!response.ok) {
        throw new Error("Failed to fetch recommended feed");
      }
      return response.json();
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      // Transform tags from comma-separated string to array
      const formattedData = {
        ...data,
        tags: data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        userId: user.id,
      };

      const response = await apiRequest(
        "POST",
        "/api/posts",
        formattedData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully",
      });
      form.reset();
      setPostModalOpen(false);
      // Refetch feeds to include the new post
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      refetchPersonal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest(
        "POST",
        `/api/posts/${postId}/like`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to like post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refetch feeds to update like counts
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/recommended"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PostFormData) => {
    createPostMutation.mutate(data);
  };

  const handleLikePost = (postId: number) => {
    likePostMutation.mutate(postId);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - User profile and quick links */}
        <div className="md:col-span-1">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mb-2"
                onClick={() => setLocation(`/profile/${user.username}`)}
              >
                View Full Profile
              </Button>
              <Button 
                className="w-full"
                onClick={() => setPostModalOpen(true)}
              >
                Create Post
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-semibold">Quick Links</h3>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2">
                <li>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation("/members")}
                  >
                    <i className="ri-user-line mr-2"></i>
                    Find People
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation("/communities")}
                  >
                    <i className="ri-group-line mr-2"></i>
                    Communities
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation("/messages")}
                  >
                    <i className="ri-message-3-line mr-2"></i>
                    Messages
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation("/products")}
                  >
                    <i className="ri-store-2-line mr-2"></i>
                    Marketplace
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation("/wallet")}
                  >
                    <i className="ri-wallet-3-line mr-2"></i>
                    Wallet
                  </Button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Main content - Post creation and feed */}
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div 
                  className="flex-1 rounded-md border px-4 py-2 cursor-pointer hover:bg-accent/50"
                  onClick={() => setPostModalOpen(true)}
                >
                  <span className="text-muted-foreground">What's on your mind, {user.name.split(' ')[0]}?</span>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => setPostModalOpen(true)}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => setPostModalOpen(true)}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Link
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => setPostModalOpen(true)}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Tag
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => setPostModalOpen(true)}
                >
                  <Megaphone className="h-4 w-4 mr-2" />
                  Promote
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full">
              <TabsTrigger value="personal" className="flex-1">Personal</TabsTrigger>
              <TabsTrigger value="communities" className="flex-1">Communities</TabsTrigger>
              <TabsTrigger value="recommended" className="flex-1">Recommended</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {activeTab === "personal" ? "Your Feed" : 
               activeTab === "communities" ? "Community Feed" : "Recommended for You"}
            </h2>
            <Button variant="outline" size="sm">
              <ListFilter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <TabsContent value="personal" className="mt-0">
            {isLoadingPersonal ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !personalFeed || personalFeed.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Your feed is empty</p>
                  <p className="text-sm text-muted-foreground mb-4">Connect with people or create your first post</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setPostModalOpen(true)}>
                      Create Post
                    </Button>
                    <Button variant="outline" onClick={() => setLocation("/members")}>
                      Find People
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {personalFeed.map((post: any) => (
                  <Card key={post.id}>
                    <CardHeader className="pb-0">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.user?.avatar || ""} alt={post.user?.name} />
                            <AvatarFallback>
                              {getInitials(post.user?.name || "")}
                            </AvatarFallback>
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
                              <CalendarDays className="h-3 w-3 inline mr-1" />
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
                          onClick={() => handleLikePost(post.id)}
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

          <TabsContent value="communities" className="mt-0">
            {isLoadingCommunity ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !communityFeed || communityFeed.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <i className="ri-group-line text-5xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground mb-2">No community posts to show</p>
                  <p className="text-sm text-muted-foreground mb-4">Join communities to see posts here</p>
                  <Button onClick={() => setLocation("/communities")}>
                    Browse Communities
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Same card pattern as personal feed but with communityFeed data */}
                {communityFeed.map((post: any) => (
                  <Card key={post.id}>
                    {/* Same card structure as above */}
                    <CardHeader className="pb-0">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.user?.avatar || ""} alt={post.user?.name} />
                            <AvatarFallback>
                              {getInitials(post.user?.name || "")}
                            </AvatarFallback>
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
                              <CalendarDays className="h-3 w-3 inline mr-1" />
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
                          onClick={() => handleLikePost(post.id)}
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

          <TabsContent value="recommended" className="mt-0">
            {isLoadingRecommended ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !recommendedFeed || recommendedFeed.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <i className="ri-magic-line text-5xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground mb-2">No recommendations yet</p>
                  <p className="text-sm text-muted-foreground mb-4">We'll suggest content based on your interests soon</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Same card pattern as personal feed but with recommendedFeed data */}
                {recommendedFeed.map((post: any) => (
                  <Card key={post.id}>
                    {/* Same card structure as above */}
                    <CardHeader className="pb-0">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.user?.avatar || ""} alt={post.user?.name} />
                            <AvatarFallback>
                              {getInitials(post.user?.name || "")}
                            </AvatarFallback>
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
                              <CalendarDays className="h-3 w-3 inline mr-1" />
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
                          onClick={() => handleLikePost(post.id)}
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
        </div>
      </div>

      {/* Post creation modal */}
      <Dialog open={postModalOpen} onOpenChange={setPostModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>
              Share your thoughts, images, or links with your network
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add a title to your post" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What's on your mind?"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add an image URL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a URL for an image to include in your post
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="technology, ideas, questions" {...field} />
                    </FormControl>
                    <FormDescription>
                      Add tags separated by commas to help others find your post
                    </FormDescription>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</>
                  ) : (
                    "Post"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}