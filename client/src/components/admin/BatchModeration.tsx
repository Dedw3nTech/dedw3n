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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Check,
  Ban,
  AlertTriangle,
  Loader2,
  ChevronDown,
  EyeOff,
  Shield,
  Trash2,
  Flag,
  ListFilter,
  Search,
  MoreHorizontal,
  Clock,
  Info,
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

type ModerableItem = {
  id: number;
  type: string;
  content: string;
  userId: number;
  userName: string;
  dateCreated: string;
  status: string;
  flagReason?: string;
};

export default function BatchModeration() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [batchAction, setBatchAction] = useState<string>("");
  const [moderationNote, setModerationNote] = useState("");

  // Fetch items
  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ModerableItem[]>({
    queryKey: ["/api/admin/moderation/batch", searchTerm, filterStatus, filterType],
    queryFn: async () => {
      // In a real implementation, this would call the API
      // For now, we'll return mock data for UI development
      
      // Generate some mock items
      const mockItems: ModerableItem[] = Array.from({ length: 20 }).map((_, i) => ({
        id: i + 1,
        type: ["post", "comment", "image", "video"][Math.floor(Math.random() * 4)],
        content: `Sample content ${i + 1} that needs moderation...`,
        userId: Math.floor(Math.random() * 100) + 1,
        userName: `user${Math.floor(Math.random() * 100) + 1}`,
        dateCreated: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString(),
        status: ["pending", "approved", "rejected", "flagged"][Math.floor(Math.random() * 4)],
        flagReason: Math.random() > 0.5 ? "Potentially inappropriate content" : undefined,
      }));
      
      return mockItems;
    },
  });

  // Batch moderation mutation
  const batchModerationMutation = useMutation({
    mutationFn: async (data: { 
      itemIds: number[]; 
      action: string;
      note: string;
    }) => {
      // In a real implementation, this would call the API
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Batch Action Completed",
        description: `Successfully processed ${selectedItems.length} items`,
      });
      setSelectedItems([]);
      setShowConfirmDialog(false);
      setModerationNote("");
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process batch action",
        variant: "destructive",
      });
    },
  });

  // Handle selection
  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Handle batch actions
  const handleBatchAction = (action: string) => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select one or more items to perform this action",
        variant: "destructive",
      });
      return;
    }
    
    setBatchAction(action);
    setShowConfirmDialog(true);
  };

  const confirmBatchAction = () => {
    batchModerationMutation.mutate({
      itemIds: selectedItems,
      action: batchAction,
      note: moderationNote,
    });
  };

  // Filter items based on search and filters
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by status
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      
      // Filter by type
      const matchesType = filterType === "all" || item.type === filterType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [items, searchTerm, filterStatus, filterType]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 text-white">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 text-white">
            Rejected
          </Badge>
        );
      case "flagged":
        return (
          <Badge className="bg-yellow-500 text-white">
            Flagged
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Pending
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
        <h3 className="text-xl font-bold">Error Loading Items</h3>
        <p className="text-muted-foreground mb-4">
          There was an error loading moderation items. Please try again.
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
          Batch Moderation
        </CardTitle>
        <CardDescription>
          Efficiently moderate multiple content items at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          {/* Search */}
          <div className="flex items-center space-x-2 max-w-sm">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <Input
                id="search"
                placeholder="Search content or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <Button type="button" size="sm" className="h-9 px-3">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterType}
              onValueChange={setFilterType}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Batch Actions */}
        <div className="bg-muted/50 rounded-md p-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedItems.length > 0 && selectedItems.length === items.length}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all items"
            />
            <Label htmlFor="select-all" className="text-sm font-medium">
              {selectedItems.length > 0 
                ? `${selectedItems.length} selected` 
                : "Select all"}
            </Label>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction("approve")}
              disabled={selectedItems.length === 0}
              className="h-8"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction("reject")}
              disabled={selectedItems.length === 0}
              className="h-8"
            >
              <Ban className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction("flag")}
              disabled={selectedItems.length === 0}
              className="h-8"
            >
              <Flag className="h-4 w-4 mr-1" />
              Flag
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction("delete")}
              disabled={selectedItems.length === 0}
              className="h-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        {/* Content Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Info className="h-8 w-8 mb-2" />
                      <p>No items match the current filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className={selectedItems.includes(item.id) ? "bg-muted/50" : undefined}>
                    <TableCell className="px-2">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleSelectItem(item.id)}
                        aria-label={`Select item ${item.id}`}
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <span className="text-sm">{item.content}</span>
                      {item.flagReason && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-amber-500 text-xs font-normal">
                            <Flag className="h-3 w-3 mr-1" />
                            {item.flagReason}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{item.type}</TableCell>
                    <TableCell>@{item.userName}</TableCell>
                    <TableCell>{formatDate(item.dateCreated)}</TableCell>
                    <TableCell>{renderStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedItems([item.id]);
                            handleBatchAction("approve");
                          }}>
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedItems([item.id]);
                            handleBatchAction("reject");
                          }}>
                            <Ban className="h-4 w-4 mr-2" />
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedItems([item.id]);
                            handleBatchAction("flag");
                          }}>
                            <Flag className="h-4 w-4 mr-2" />
                            Flag
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedItems([item.id]);
                              handleBatchAction("delete");
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Batch Action Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Batch Action</DialogTitle>
            <DialogDescription>
              {batchAction === "approve" && "Approve all selected items?"}
              {batchAction === "reject" && "Reject all selected items?"}
              {batchAction === "flag" && "Flag all selected items for review?"}
              {batchAction === "delete" && "Delete all selected items? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">
                This action will affect {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="moderation-note">Add a note (optional)</Label>
              <Textarea
                id="moderation-note"
                placeholder="Add a note explaining this moderation decision..."
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={batchModerationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={batchAction === "delete" ? "destructive" : "default"}
              onClick={confirmBatchAction}
              disabled={batchModerationMutation.isPending}
            >
              {batchModerationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {batchAction === "approve" && "Approve"}
                  {batchAction === "reject" && "Reject"}
                  {batchAction === "flag" && "Flag"}
                  {batchAction === "delete" && "Delete"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}