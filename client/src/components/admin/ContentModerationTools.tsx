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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
  PlusCircle,
  Upload,
  ImageOff,
  BookOpen,
  BookX,
  FileWarning,
  MessageSquare,
  Filter,
  Image,
  Ban,
  ThumbsUp,
  Settings,
  ListFilter,
  BarChart3,
  TrendingUp,
  Lightbulb,
  MessageSquareText,
  Brain,
  Sparkles,
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
import { Switch } from "@/components/ui/switch";

// Mock types for content moderation
type FlaggedItem = {
  id: number;
  contentType: string;
  contentId: number;
  reason: string;
  status: string;
  reportedBy: number;
  createdAt: string;
  content?: string;
  imageUrl?: string;
};

type AllowListItem = {
  id: number;
  term: string;
  category: string;
  addedBy: string;
  createdAt: string;
};

type BlockListItem = {
  id: number;
  term: string;
  category: string;
  matchType: string;
  severity: string;
  addedBy: string;
  createdAt: string;
};

type Report = {
  id: number;
  contentType: string;
  contentId: number;
  reason: string;
  description: string;
  status: string;
  reportedBy: number;
  createdAt: string;
};

// Types for content analysis
type Topic = {
  name: string;
  count: number;
  percentage: number;
};

type Sentiment = {
  positive: number;
  neutral: number;
  negative: number;
};

type ContentInsight = {
  type: string;
  engagement: number;
  recommendation: string;
};

export default function ContentModerationTools() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("content-flagging");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // For content/image flagging
  const [selectedItem, setSelectedItem] = useState<FlaggedItem | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [modNote, setModNote] = useState("");
  
  // For allow list
  const [newAllowTerm, setNewAllowTerm] = useState("");
  const [newAllowCategory, setNewAllowCategory] = useState("general");
  const [showAddAllowDialog, setShowAddAllowDialog] = useState(false);
  
  // For block list
  const [newBlockTerm, setNewBlockTerm] = useState("");
  const [newBlockCategory, setNewBlockCategory] = useState("general");
  const [newBlockMatchType, setNewBlockMatchType] = useState("exact");
  const [newBlockSeverity, setNewBlockSeverity] = useState("medium");
  const [showAddBlockDialog, setShowAddBlockDialog] = useState(false);
  
  // For reports
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Content Flagging Tab - Real Data
  const { 
    data: flaggedContentResponse,
    isLoading: isLoadingFlaggedContent,
    isError: isErrorFlaggedContent,
    refetch: refetchFlaggedContent
  } = useQuery({
    queryKey: ["/api/admin/moderation/flagged-content", searchTerm, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const res = await fetch(`/api/admin/moderation/flagged-content?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch flagged content');
      }
      return await res.json();
    },
    enabled: activeTab === "content-flagging",
  });
  
  // Extract items from response
  const flaggedContent = flaggedContentResponse?.items || [];

  // Image Flagging Tab - Real Data
  const { 
    data: flaggedImagesResponse,
    isLoading: isLoadingFlaggedImages,
    isError: isErrorFlaggedImages,
    refetch: refetchFlaggedImages
  } = useQuery({
    queryKey: ["/api/admin/moderation/flagged-images", searchTerm, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const res = await fetch(`/api/admin/moderation/flagged-images?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch flagged images');
      }
      return await res.json();
    },
    enabled: activeTab === "image-flagging",
  });
  
  // Extract items from response
  const flaggedImages = flaggedImagesResponse?.items || [];

  // Allow List Tab - Real Data
  const { 
    data: allowList = [],
    isLoading: isLoadingAllowList,
    isError: isErrorAllowList,
    refetch: refetchAllowList
  } = useQuery({
    queryKey: ["/api/admin/moderation/allow-list", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await fetch(`/api/admin/moderation/allow-list?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch allow list');
      }
      return await res.json();
    },
    enabled: activeTab === "allow-list",
  });

  // Block List Tab - Real Data
  const { 
    data: blockList = [],
    isLoading: isLoadingBlockList,
    isError: isErrorBlockList,
    refetch: refetchBlockList
  } = useQuery({
    queryKey: ["/api/admin/moderation/block-list", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await fetch(`/api/admin/moderation/block-list?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch block list');
      }
      return await res.json();
    },
    enabled: activeTab === "block-list",
  });

  // Reports Tab - Real Data
  const { 
    data: reportsResponse,
    isLoading: isLoadingReports,
    isError: isErrorReports,
    refetch: refetchReports
  } = useQuery({
    queryKey: ["/api/admin/moderation/reports", searchTerm, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const res = await fetch(`/api/admin/moderation/reports?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch moderation reports');
      }
      return await res.json();
    },
    enabled: activeTab === "reports",
  });
  
  // Extract items from response
  const reports = reportsResponse?.items || [];
  
  // Content Analysis Tab - Data
  const { 
    data: contentAnalysisData,
    isLoading: isLoadingContentAnalysis,
    isError: isErrorContentAnalysis,
    refetch: refetchContentAnalysis
  } = useQuery({
    queryKey: ['/api/social/insights'],
    queryFn: async () => {
      // This will reuse the data from the AI Insights API
      const res = await fetch('/api/social/insights');
      if (!res.ok) {
        throw new Error('Failed to fetch content analysis data');
      }
      return res.json();
    },
    enabled: activeTab === "content-analysis",
  });

  // API mutations for content moderation actions

  // Approve flagged item
  const approveMutation = useMutation({
    mutationFn: async (item: FlaggedItem) => {
      const endpoint = item.imageUrl
        ? '/api/admin/moderation/flagged-images/approve'
        : '/api/admin/moderation/flagged-content/approve';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: item.id,
          note: modNote,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to approve item');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Item Approved",
        description: "The flagged item has been approved",
      });
      setShowViewDialog(false);
      setModNote("");
      refetchFlaggedContent();
      refetchFlaggedImages();
    },
  });

  // Reject flagged item
  const rejectMutation = useMutation({
    mutationFn: async (item: FlaggedItem) => {
      const endpoint = item.imageUrl
        ? '/api/admin/moderation/flagged-images/reject'
        : '/api/admin/moderation/flagged-content/reject';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: item.id,
          note: modNote,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to reject item');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Item Rejected",
        description: "The flagged item has been rejected and removed",
      });
      setShowViewDialog(false);
      setModNote("");
      refetchFlaggedContent();
      refetchFlaggedImages();
    },
  });

  // Add to allow list
  const addAllowTermMutation = useMutation({
    mutationFn: async (data: { term: string; category: string }) => {
      const res = await fetch('/api/admin/moderation/allow-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error('Failed to add term to allow list');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Term Added",
        description: "Term has been added to the allow list",
      });
      setShowAddAllowDialog(false);
      setNewAllowTerm("");
      refetchAllowList();
    },
  });

  // Remove from allow list
  const removeAllowTermMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/moderation/allow-list/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to remove term from allow list');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Term Removed",
        description: "Term has been removed from the allow list",
      });
      refetchAllowList();
    },
  });

  // Add to block list
  const addBlockTermMutation = useMutation({
    mutationFn: async (data: { 
      term: string; 
      category: string;
      matchType: string;
      severity: string;
    }) => {
      const res = await fetch('/api/admin/moderation/block-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error('Failed to add term to block list');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Term Added",
        description: "Term has been added to the block list",
      });
      setShowAddBlockDialog(false);
      setNewBlockTerm("");
      refetchBlockList();
    },
  });

  // Remove from block list
  const removeBlockTermMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/moderation/block-list/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to remove term from block list');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Term Removed",
        description: "Term has been removed from the block list",
      });
      refetchBlockList();
    },
  });

  // Handle report
  const handleReportMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; note: string }) => {
      const res = await fetch('/api/admin/moderation/reports/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update report status');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Handled",
        description: "The report has been processed",
      });
      setShowReportDialog(false);
      setModNote("");
      refetchReports();
    },
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "content-flagging") refetchFlaggedContent();
    if (activeTab === "image-flagging") refetchFlaggedImages();
    if (activeTab === "allow-list") refetchAllowList();
    if (activeTab === "block-list") refetchBlockList();
    if (activeTab === "reports") refetchReports();
  };

  // View flagged item
  const handleViewItem = (item: FlaggedItem) => {
    setSelectedItem(item);
    setShowViewDialog(true);
  };

  // View report
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportDialog(true);
  };

  // Add allow term
  const handleAddAllowTerm = () => {
    addAllowTermMutation.mutate({
      term: newAllowTerm,
      category: newAllowCategory,
    });
  };

  // Add block term
  const handleAddBlockTerm = () => {
    addBlockTermMutation.mutate({
      term: newBlockTerm,
      category: newBlockCategory,
      matchType: newBlockMatchType,
      severity: newBlockSeverity,
    });
  };

  // Handle report action
  const handleReportAction = (status: string) => {
    if (!selectedReport) return;
    
    handleReportMutation.mutate({
      id: selectedReport.id,
      status,
      note: modNote,
    });
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "in_review":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            In Review
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <Check className="h-3 w-3" />
            Resolved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <X className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  // Render loading state
  const renderLoading = () => (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // Render error state
  const renderError = (refetchFn: () => void) => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-xl font-bold">Error Loading Data</h3>
      <p className="text-muted-foreground mb-4">
        There was an error loading the data. Please try again.
      </p>
      <Button onClick={refetchFn}>Retry</Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Content Moderation Tools
        </CardTitle>
        <CardDescription>
          Comprehensive tools for content moderation, filtering, and management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="content-flagging" className="flex items-center gap-2">
              <FileWarning className="h-4 w-4" />
              <span className="hidden md:inline">Content Flagging</span>
            </TabsTrigger>
            <TabsTrigger value="image-flagging" className="flex items-center gap-2">
              <ImageOff className="h-4 w-4" />
              <span className="hidden md:inline">Image Flagging</span>
            </TabsTrigger>
            <TabsTrigger value="allow-list" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden md:inline">Allow List</span>
            </TabsTrigger>
            <TabsTrigger value="block-list" className="flex items-center gap-2">
              <BookX className="h-4 w-4" />
              <span className="hidden md:inline">Block List</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden md:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="content-analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Content Analysis</span>
            </TabsTrigger>
          </TabsList>

          {/* Content Flagging Tab */}
          <TabsContent value="content-flagging" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end justify-between">
              <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-sm">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="search-content" className="sr-only">
                    Search
                  </Label>
                  <Input
                    id="search-content"
                    placeholder="Search flagged content..."
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
                <Label htmlFor="content-status-filter" className="whitespace-nowrap">
                  Filter:
                </Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value)}
                >
                  <SelectTrigger id="content-status-filter" className="w-[150px]">
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingFlaggedContent ? (
              renderLoading()
            ) : isErrorFlaggedContent ? (
              renderError(refetchFlaggedContent)
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedContent.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p>No flagged content found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      flaggedContent.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell className="capitalize">{item.contentType}</TableCell>
                          <TableCell>{item.reason}</TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{renderStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewItem(item)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Image Flagging Tab */}
          <TabsContent value="image-flagging" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end justify-between">
              <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-sm">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="search-images" className="sr-only">
                    Search
                  </Label>
                  <Input
                    id="search-images"
                    placeholder="Search flagged images..."
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
                <Label htmlFor="image-status-filter" className="whitespace-nowrap">
                  Filter:
                </Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value)}
                >
                  <SelectTrigger id="image-status-filter" className="w-[150px]">
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingFlaggedImages ? (
              renderLoading()
            ) : isErrorFlaggedImages ? (
              renderError(refetchFlaggedImages)
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flaggedImages.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mb-2" />
                    <p>No flagged images found</p>
                  </div>
                ) : (
                  flaggedImages.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative">
                          <img
                            src={item.imageUrl}
                            alt="Flagged content"
                            className="w-full h-[200px] object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            {renderStatusBadge(item.status)}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium truncate capitalize">
                            {item.contentType} #{item.contentId}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            Reason: {item.reason}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewItem(item)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* Allow List Tab */}
          <TabsContent value="allow-list" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end justify-between">
              <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-sm">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="search-allow" className="sr-only">
                    Search
                  </Label>
                  <Input
                    id="search-allow"
                    placeholder="Search allowed terms..."
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

              <Button onClick={() => setShowAddAllowDialog(true)} className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Add Term
              </Button>
            </div>

            {isLoadingAllowList ? (
              renderLoading()
            ) : isErrorAllowList ? (
              renderError(refetchAllowList)
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allowList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p>No allowed terms found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allowList.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.term}</TableCell>
                          <TableCell className="capitalize">{item.category}</TableCell>
                          <TableCell>{item.addedBy}</TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAllowTermMutation.mutate(item.id)}
                              title="Remove from Allow List"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Add to Allow List Dialog */}
            <Dialog open={showAddAllowDialog} onOpenChange={setShowAddAllowDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add to Allow List</DialogTitle>
                  <DialogDescription>
                    Add a term to the allow list. Terms on the allow list will always be permitted
                    regardless of other content filters.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="allow-term">Term</Label>
                    <Input
                      id="allow-term"
                      value={newAllowTerm}
                      onChange={(e) => setNewAllowTerm(e.target.value)}
                      placeholder="Enter term to allow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allow-category">Category</Label>
                    <Select
                      value={newAllowCategory}
                      onValueChange={setNewAllowCategory}
                    >
                      <SelectTrigger id="allow-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddAllowDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddAllowTerm}
                    disabled={!newAllowTerm || addAllowTermMutation.isPending}
                  >
                    {addAllowTermMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-2" />
                    )}
                    Add to Allow List
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Block List Tab */}
          <TabsContent value="block-list" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end justify-between">
              <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-sm">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="search-block" className="sr-only">
                    Search
                  </Label>
                  <Input
                    id="search-block"
                    placeholder="Search blocked terms..."
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

              <Button onClick={() => setShowAddBlockDialog(true)} className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Add Term
              </Button>
            </div>

            {isLoadingBlockList ? (
              renderLoading()
            ) : isErrorBlockList ? (
              renderError(refetchBlockList)
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Match Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p>No blocked terms found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      blockList.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.term}</TableCell>
                          <TableCell className="capitalize">{item.category}</TableCell>
                          <TableCell className="capitalize">{item.matchType}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                item.severity === "high"
                                  ? "bg-red-500"
                                  : item.severity === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              }
                            >
                              {item.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.addedBy}</TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBlockTermMutation.mutate(item.id)}
                              title="Remove from Block List"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Add to Block List Dialog */}
            <Dialog open={showAddBlockDialog} onOpenChange={setShowAddBlockDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add to Block List</DialogTitle>
                  <DialogDescription>
                    Add a term to the block list. Content containing blocked terms will be flagged
                    or automatically removed based on severity.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="block-term">Term</Label>
                    <Input
                      id="block-term"
                      value={newBlockTerm}
                      onChange={(e) => setNewBlockTerm(e.target.value)}
                      placeholder="Enter term to block"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block-category">Category</Label>
                    <Select
                      value={newBlockCategory}
                      onValueChange={setNewBlockCategory}
                    >
                      <SelectTrigger id="block-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="profanity">Profanity</SelectItem>
                        <SelectItem value="hate_speech">Hate Speech</SelectItem>
                        <SelectItem value="harassment">Harassment</SelectItem>
                        <SelectItem value="adult">Adult Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block-match-type">Match Type</Label>
                    <Select
                      value={newBlockMatchType}
                      onValueChange={setNewBlockMatchType}
                    >
                      <SelectTrigger id="block-match-type">
                        <SelectValue placeholder="Select a match type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exact">Exact Match</SelectItem>
                        <SelectItem value="partial">Partial Match</SelectItem>
                        <SelectItem value="regex">Regex Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block-severity">Severity</Label>
                    <Select
                      value={newBlockSeverity}
                      onValueChange={setNewBlockSeverity}
                    >
                      <SelectTrigger id="block-severity">
                        <SelectValue placeholder="Select severity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Flag for Review)</SelectItem>
                        <SelectItem value="medium">Medium (Auto-Reject)</SelectItem>
                        <SelectItem value="high">High (Auto-Delete)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddBlockDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddBlockTerm}
                    disabled={!newBlockTerm || addBlockTermMutation.isPending}
                  >
                    {addBlockTermMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Ban className="h-4 w-4 mr-2" />
                    )}
                    Add to Block List
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end justify-between">
              <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-sm">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="search-reports" className="sr-only">
                    Search
                  </Label>
                  <Input
                    id="search-reports"
                    placeholder="Search reports..."
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
                <Label htmlFor="report-status-filter" className="whitespace-nowrap">
                  Filter:
                </Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value)}
                >
                  <SelectTrigger id="report-status-filter" className="w-[150px]">
                    <SelectValue placeholder="All Reports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingReports ? (
              renderLoading()
            ) : isErrorReports ? (
              renderError(refetchReports)
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Content Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p>No reports found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.id}</TableCell>
                          <TableCell className="capitalize">{report.contentType}</TableCell>
                          <TableCell>{report.reason}</TableCell>
                          <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{renderStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewReport(report)}
                              title="View Report"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          {/* Content Analysis Tab */}
          <TabsContent value="content-analysis" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Content Trend Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered insights to assist with content moderation
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => refetchContentAnalysis()}
                className="gap-1"
              >
                <Sparkles className="h-4 w-4" />
                Refresh Analysis
              </Button>
            </div>

            {isLoadingContentAnalysis ? (
              renderLoading()
            ) : isErrorContentAnalysis ? (
              renderError(refetchContentAnalysis)
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Topic Trends */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Topic Trends
                    </CardTitle>
                    <CardDescription>
                      Discover trending topics posted by users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contentAnalysisData?.topics?.length > 0 ? (
                        contentAnalysisData.topics.map((topic: Topic) => (
                          <div key={topic.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{topic.name}</span>
                              <span className="font-medium">{topic.percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${topic.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                          <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">No topic data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Sentiment Analysis */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquareText className="h-5 w-5 text-primary" />
                      Sentiment Analysis
                    </CardTitle>
                    <CardDescription>
                      Monitor overall user emotions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                            Positive
                          </span>
                          <span className="font-medium">{contentAnalysisData?.sentiment?.positive || 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${contentAnalysisData?.sentiment?.positive || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                            Neutral
                          </span>
                          <span className="font-medium">{contentAnalysisData?.sentiment?.neutral || 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${contentAnalysisData?.sentiment?.neutral || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                            Negative
                          </span>
                          <span className="font-medium">{contentAnalysisData?.sentiment?.negative || 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500" 
                            style={{ width: `${contentAnalysisData?.sentiment?.negative || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Insights */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Content Insights
                    </CardTitle>
                    <CardDescription>
                      Get tailored recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contentAnalysisData?.contentInsights?.length > 0 ? (
                        contentAnalysisData.contentInsights.map((insight: ContentInsight) => (
                          <div key={insight.type} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{insight.type}</span>
                              <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {insight.engagement}% engagement
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                          <Lightbulb className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">No insight data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Advanced Info Card */}
                <Card className="col-span-1 md:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="h-5 w-5 text-primary" />
                      Moderation Actions
                    </CardTitle>
                    <CardDescription>
                      Tailor moderation actions based on content analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">Trending Topics</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Monitor high-volume topics for potential policy violations. Consider creating custom allow/block lists
                          for trending topics.
                        </p>
                        <div className="pt-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <ListFilter className="h-4 w-4" />
                            Create Topic Filter
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <MessageSquareText className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">Sentiment Monitoring</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Analyze changes in sentiment to identify emerging issues. Set up alerts for significant negative 
                          sentiment shifts.
                        </p>
                        <div className="pt-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Configure Alerts
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">Recommendation Actions</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Apply insights to improve moderation efficiency. Create automated rules based on content 
                          engagement patterns.
                        </p>
                        <div className="pt-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Settings className="h-4 w-4" />
                            Configure Rules
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* View Flagged Item Dialog */}
      {selectedItem && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Reviewing Flagged Item #{selectedItem.id}</DialogTitle>
              <DialogDescription>
                This {selectedItem.contentType} was flagged for: {selectedItem.reason}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              {/* Content preview */}
              {selectedItem.content && (
                <div className="border rounded-md p-3 whitespace-pre-wrap">
                  {selectedItem.content}
                </div>
              )}

              {/* Image preview */}
              {selectedItem.imageUrl && (
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={selectedItem.imageUrl}
                    alt="Flagged content"
                    className="w-full h-auto max-h-[300px] object-cover"
                  />
                </div>
              )}

              {/* Moderation note field */}
              <div className="space-y-2">
                <Label htmlFor="flagged-moderation-note">Moderation Notes</Label>
                <Textarea
                  id="flagged-moderation-note"
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
                  variant="destructive"
                  type="button"
                  className="flex-1"
                  onClick={() => rejectMutation.mutate(selectedItem)}
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
                  onClick={() => approveMutation.mutate(selectedItem)}
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

      {/* View Report Dialog */}
      {selectedReport && (
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Report #{selectedReport.id}</DialogTitle>
              <DialogDescription>
                {selectedReport.contentType} #{selectedReport.contentId} was reported for {selectedReport.reason}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              {/* Report description */}
              <div className="space-y-2">
                <Label>Report Description</Label>
                <div className="border rounded-md p-3 whitespace-pre-wrap bg-muted/50">
                  {selectedReport.description}
                </div>
              </div>

              {/* Report metadata */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Reported by:</span>{" "}
                  <span className="font-medium">User #{selectedReport.reportedBy}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  <span className="font-medium">
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className="font-medium capitalize">{selectedReport.status}</span>
                </div>
              </div>

              {/* Moderation note field */}
              <div className="space-y-2">
                <Label htmlFor="report-moderation-note">Moderation Notes</Label>
                <Textarea
                  id="report-moderation-note"
                  placeholder="Add notes about handling this report..."
                  value={modNote}
                  onChange={(e) => setModNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  type="button"
                  className="flex-1"
                  onClick={() => handleReportAction("in_review")}
                  disabled={handleReportMutation.isPending || selectedReport.status === "in_review"}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Mark In Review
                </Button>
                <Button
                  variant="destructive"
                  type="button"
                  className="flex-1"
                  onClick={() => handleReportAction("rejected")}
                  disabled={handleReportMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Dismiss Report
                </Button>
                <Button
                  variant="default"
                  type="button"
                  className="flex-1"
                  onClick={() => handleReportAction("resolved")}
                  disabled={handleReportMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}