import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Check,
  Shield,
  AlertTriangle,
  X,
  Eye,
  Search,
  Trash2,
  Edit,
  Flag,
  MessageSquare,
  ThumbsUp,
  Share,
  Image,
  Video,
  File,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Post = {
  id: number;
  userId: number;
  content: string;
  title?: string;
  contentType: string;
  imageUrl?: string;
  videoUrl?: string;
  productId?: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  tags?: string[];
  isPromoted: boolean;
  promotionEndDate?: string;
  isPublished: boolean;
  isFlagged?: boolean;
  flagReason?: string;
  reviewStatus?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
    name: string;
  };
};

export default function PostModeration() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [modNote, setModNote] = useState("");
  const [editedContent, setEditedContent] = useState("");

  // Fetch posts
  const {
    data: posts = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["/api/admin/posts", searchTerm, filterStatus],
    queryFn: async () => {
      let url = "/api/admin/posts";
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Approve post mutation
  const approveMutation = useMutation({
    mutationFn: async (post: Post) => {
      const res = await apiRequest("PATCH", `/api/admin/posts/${post.id}/moderate`, {
        status: "approved",
        moderationNote: modNote || "Content approved by moderator",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Approved",
        description: "The post has been approved and is now visible to users",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      setShowViewDialog(false);
      setModNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error Approving Post",
        description: error.message || "Could not approve post",
        variant: "destructive",
      });
    },
  });

  // Reject post mutation
  const rejectMutation = useMutation({
    mutationFn: async (post: Post) => {
      const res = await apiRequest("PATCH", `/api/admin/posts/${post.id}/moderate`, {
        status: "rejected",
        moderationNote: modNote || "Content rejected by moderator",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Rejected",
        description: "The post has been rejected and is not visible to users",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      setShowViewDialog(false);
      setModNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error Rejecting Post",
        description: error.message || "Could not reject post",
        variant: "destructive",
      });
    },
  });

  // Flag post mutation
  const flagMutation = useMutation({
    mutationFn: async (post: Post) => {
      const res = await apiRequest("PATCH", `/api/admin/posts/${post.id}/flag`, {
        isFlagged: true,
        flagReason: modNote || "Flagged for review by moderator",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Flagged",
        description: "The post has been flagged for further review",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      setShowViewDialog(false);
      setModNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error Flagging Post",
        description: error.message || "Could not flag post",
        variant: "destructive",
      });
    },
  });

  // Update post mutation
  const updateMutation = useMutation({
    mutationFn: async (post: Post) => {
      const res = await apiRequest("PATCH", `/api/admin/posts/${post.id}`, {
        content: editedContent,
        moderationNote: modNote || "Content edited by moderator",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Updated",
        description: "The post content has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      setShowEditDialog(false);
      setModNote("");
      setEditedContent("");
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Post",
        description: error.message || "Could not update post",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async (post: Post) => {
      await apiRequest("DELETE", `/api/admin/posts/${post.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Post Deleted",
        description: "The post has been permanently deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      setShowDeleteDialog(false);
      setModNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Post",
        description: error.message || "Could not delete post",
        variant: "destructive",
      });
    },
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  // Handle post viewing
  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setShowViewDialog(true);
  };

  // Handle post editing
  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setEditedContent(post.content);
    setShowEditDialog(true);
  };

  // Handle post deletion
  const handleDeleteConfirm = (post: Post) => {
    setSelectedPost(post);
    setShowDeleteDialog(true);
  };

  // Render content type icon
  const renderContentTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "article":
        return <File className="h-4 w-4" />;
      case "advertisement":
        return <Tag className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Render review status badge
  const renderStatusBadge = (post: Post) => {
    if (post.isFlagged) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Flag className="h-3 w-3" />
          Flagged
        </Badge>
      );
    }

    switch (post.reviewStatus) {
      case "approved":
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <Check className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <X className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Unreviewed
          </Badge>
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-bold">Error Loading Posts</h3>
        <p className="text-muted-foreground mb-4">
          There was an error loading the posts. Please try again.
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Post Moderation
        </CardTitle>
        <CardDescription>
          Review, approve, flag, or remove user-generated content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end justify-between">
            <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-sm">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="search" className="sr-only">
                  Search Posts
                </Label>
                <Input
                  id="search"
                  placeholder="Search by title, content, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button type="submit" size="sm" className="h-9 px-3">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </form>

            <div className="flex items-center space-x-2">
              <Label htmlFor="status-filter" className="whitespace-nowrap">
                Filter by Status:
              </Label>
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value)}
              >
                <SelectTrigger id="status-filter" className="w-[180px]">
                  <SelectValue placeholder="All Posts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Posts Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="hidden md:table-cell">User</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mb-2" />
                        <p>No posts found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post: Post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {post.title ? (
                          <span className="font-medium">{post.title}</span>
                        ) : (
                          <span>{post.content.substring(0, 50)}{post.content.length > 50 ? "..." : ""}</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {post.user?.name || `User ID: ${post.userId}`}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="flex items-center gap-1">
                          {renderContentTypeIcon(post.contentType)}
                          <span className="capitalize">{post.contentType}</span>
                        </span>
                      </TableCell>
                      <TableCell>{renderStatusBadge(post)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewPost(post)}
                            title="View Post"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPost(post)}
                            title="Edit Post"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteConfirm(post)}
                            title="Delete Post"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* View Post Dialog */}
      {selectedPost && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Reviewing Post #{selectedPost.id}</DialogTitle>
              <DialogDescription>
                {selectedPost.user ? (
                  <span>Posted by {selectedPost.user.name} (@{selectedPost.user.username})</span>
                ) : (
                  <span>Posted by User ID: {selectedPost.userId}</span>
                )}
                {" • "}
                {new Date(selectedPost.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              {/* Post title if available */}
              {selectedPost.title && (
                <h3 className="text-lg font-semibold">{selectedPost.title}</h3>
              )}

              {/* Post content */}
              <div className="border rounded-md p-3 whitespace-pre-wrap">
                {selectedPost.content}
              </div>

              {/* Post media */}
              {selectedPost.imageUrl && (
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={selectedPost.imageUrl}
                    alt="Post image"
                    className="w-full h-auto max-h-[300px] object-cover"
                  />
                </div>
              )}

              {selectedPost.videoUrl && (
                <div className="border rounded-md overflow-hidden">
                  <video
                    src={selectedPost.videoUrl}
                    controls
                    className="w-full h-auto max-h-[300px]"
                  />
                </div>
              )}

              {/* Post stats */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" /> {selectedPost.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> {selectedPost.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Share className="h-4 w-4" /> {selectedPost.shares}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {selectedPost.views}
                </span>
              </div>

              {/* Tags */}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedPost.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Flag reason if flagged */}
              {selectedPost.isFlagged && selectedPost.flagReason && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800">
                  <div className="flex items-center gap-2 font-medium">
                    <Flag className="h-4 w-4" />
                    <span>Flagged for Review</span>
                  </div>
                  <p className="mt-1">{selectedPost.flagReason}</p>
                </div>
              )}

              {/* Moderation note field */}
              <div className="space-y-2">
                <Label htmlFor="moderation-note">Moderation Notes</Label>
                <Textarea
                  id="moderation-note"
                  placeholder="Add notes about this moderation decision..."
                  value={modNote}
                  onChange={(e) => setModNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  type="button"
                  className="flex-1"
                  onClick={() => flagMutation.mutate(selectedPost)}
                  disabled={flagMutation.isPending}
                >
                  {flagMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Flag className="h-4 w-4 mr-2" />
                  )}
                  Flag
                </Button>
                <Button
                  variant="destructive"
                  type="button"
                  className="flex-1"
                  onClick={() => rejectMutation.mutate(selectedPost)}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  variant="default"
                  type="button"
                  className="flex-1"
                  onClick={() => approveMutation.mutate(selectedPost)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Post Dialog */}
      {selectedPost && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Post #{selectedPost.id}</DialogTitle>
              <DialogDescription>
                Edit the content of this post. Media cannot be modified.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-moderation-note">Moderation Notes</Label>
                <Textarea
                  id="edit-moderation-note"
                  placeholder="Add notes about why this post was edited..."
                  value={modNote}
                  onChange={(e) => setModNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => updateMutation.mutate(selectedPost)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedPost && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete this post and cannot be undone.
                Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 my-2">
              <Label htmlFor="delete-reason">Reason for Deletion (Optional)</Label>
              <Textarea
                id="delete-reason"
                placeholder="Reason for deleting this post..."
                value={modNote}
                onChange={(e) => setModNote(e.target.value)}
                rows={2}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(selectedPost)}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Post
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}