import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, MoreHorizontal, Plus, Search, Users, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";

export default function CommunityManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCommunityDialog, setShowAddCommunityDialog] = useState(false);
  const [showEditCommunityDialog, setShowEditCommunityDialog] = useState(false);
  const [currentCommunity, setCurrentCommunity] = useState<any>(null);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    category: "",
    isPrivate: false,
    imageUrl: "",
    bannerUrl: "",
  });

  // Fetch communities
  const { data: communities, isLoading } = useQuery({
    queryKey: ["/api/admin/communities", searchTerm],
    queryFn: async () => {
      const endpoint = searchTerm 
        ? `/api/admin/communities/search?term=${encodeURIComponent(searchTerm)}` 
        : "/api/admin/communities";
      const res = await fetch(endpoint);
      return res.json();
    },
  });

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Create community mutation
  const createCommunityMutation = useMutation({
    mutationFn: async (communityData: any) => {
      const res = await apiRequest("POST", "/api/admin/communities", communityData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Community Created",
        description: "Community has been created successfully.",
      });
      setNewCommunity({
        name: "",
        description: "",
        category: "",
        isPrivate: false,
        imageUrl: "",
        bannerUrl: "",
      });
      setShowAddCommunityDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create community.",
        variant: "destructive",
      });
    },
  });

  // Update community mutation
  const updateCommunityMutation = useMutation({
    mutationFn: async (communityData: any) => {
      const res = await apiRequest("PATCH", `/api/admin/communities/${communityData.id}`, communityData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Community Updated",
        description: "Community has been updated successfully.",
      });
      setShowEditCommunityDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communities"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update community.",
        variant: "destructive",
      });
    },
  });

  // Delete community mutation
  const deleteCommunityMutation = useMutation({
    mutationFn: async (communityId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/communities/${communityId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Community Deleted",
        description: "Community has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete community.",
        variant: "destructive",
      });
    },
  });

  const handleAddCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    createCommunityMutation.mutate(newCommunity);
  };

  const handleUpdateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCommunity) {
      updateCommunityMutation.mutate(currentCommunity);
    }
  };

  const handleEditCommunity = (community: any) => {
    setCurrentCommunity({ ...community });
    setShowEditCommunityDialog(true);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">Community Management</CardTitle>
          <Button 
            size="sm" 
            onClick={() => setShowAddCommunityDialog(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Community
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search communities..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-2.5 top-2.5"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communities && communities.length > 0 ? (
                    communities.map((community: any) => (
                      <TableRow key={community.id}>
                        <TableCell>{community.id}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          {community.imageUrl ? (
                            <img 
                              src={community.imageUrl} 
                              alt={community.name} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <span className="font-medium">{community.name}</span>
                        </TableCell>
                        <TableCell>{community.category}</TableCell>
                        <TableCell>{community.memberCount || 0}</TableCell>
                        <TableCell>{formatDate(community.createdAt)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            community.isPrivate ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {community.isPrivate ? 'Private' : 'Public'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditCommunity(community)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/community/${community.id}`, '_blank')}>
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this community? This action cannot be undone.")) {
                                    deleteCommunityMutation.mutate(community.id);
                                  }
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No communities found matching your search." : "No communities found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Community Dialog */}
      <Dialog open={showAddCommunityDialog} onOpenChange={setShowAddCommunityDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
            <DialogDescription>
              Create a new community for users to join and interact.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCommunity}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Community Name
                  </label>
                  <Input
                    id="name"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <Select
                    value={newCommunity.category}
                    onValueChange={(value) => setNewCommunity({ ...newCommunity, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  rows={3}
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="imageUrl" className="text-sm font-medium">
                    Community Image URL
                  </label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={newCommunity.imageUrl}
                    onChange={(e) => setNewCommunity({ ...newCommunity, imageUrl: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="bannerUrl" className="text-sm font-medium">
                    Banner Image URL
                  </label>
                  <Input
                    id="bannerUrl"
                    type="url"
                    value={newCommunity.bannerUrl}
                    onChange={(e) => setNewCommunity({ ...newCommunity, bannerUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrivate"
                  checked={newCommunity.isPrivate}
                  onCheckedChange={(checked) => 
                    setNewCommunity({ ...newCommunity, isPrivate: Boolean(checked) })
                  }
                />
                <label htmlFor="isPrivate" className="text-sm font-medium">
                  Private Community (requires approval to join)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddCommunityDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCommunityMutation.isPending}
              >
                {createCommunityMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Community
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Community Dialog */}
      <Dialog open={showEditCommunityDialog} onOpenChange={setShowEditCommunityDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Community</DialogTitle>
            <DialogDescription>
              Update community details and settings.
            </DialogDescription>
          </DialogHeader>
          {currentCommunity && (
            <form onSubmit={handleUpdateCommunity}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="edit-name" className="text-sm font-medium">
                      Community Name
                    </label>
                    <Input
                      id="edit-name"
                      value={currentCommunity.name}
                      onChange={(e) => setCurrentCommunity({ ...currentCommunity, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="edit-category" className="text-sm font-medium">
                      Category
                    </label>
                    <Select
                      value={currentCommunity.category}
                      onValueChange={(value) => setCurrentCommunity({ ...currentCommunity, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories && categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="edit-description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="edit-description"
                    rows={3}
                    value={currentCommunity.description}
                    onChange={(e) => setCurrentCommunity({ ...currentCommunity, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="edit-imageUrl" className="text-sm font-medium">
                      Community Image URL
                    </label>
                    <Input
                      id="edit-imageUrl"
                      type="url"
                      value={currentCommunity.imageUrl}
                      onChange={(e) => setCurrentCommunity({ ...currentCommunity, imageUrl: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="edit-bannerUrl" className="text-sm font-medium">
                      Banner Image URL
                    </label>
                    <Input
                      id="edit-bannerUrl"
                      type="url"
                      value={currentCommunity.bannerUrl}
                      onChange={(e) => setCurrentCommunity({ ...currentCommunity, bannerUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isPrivate"
                    checked={currentCommunity.isPrivate}
                    onCheckedChange={(checked) => 
                      setCurrentCommunity({ ...currentCommunity, isPrivate: Boolean(checked) })
                    }
                  />
                  <label htmlFor="edit-isPrivate" className="text-sm font-medium">
                    Private Community (requires approval to join)
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditCommunityDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateCommunityMutation.isPending}
                >
                  {updateCommunityMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Community
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}