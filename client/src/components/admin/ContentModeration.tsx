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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Check, 
  Flag, 
  Loader2, 
  MessageSquare, 
  MoreHorizontal,
  ShieldAlert, 
  ThumbsDown, 
  User, 
  X 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ContentModeration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("reports");
  const [showReportDetailsDialog, setShowReportDetailsDialog] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [moderationNote, setModerationNote] = useState("");

  // Fetch reported content
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ["/api/admin/moderation/reports"],
    queryFn: async () => {
      const res = await fetch('/api/admin/moderation/reports');
      return res.json();
    },
  });

  // Fetch posts pending review
  const { data: pendingPosts, isLoading: isLoadingPendingPosts } = useQuery({
    queryKey: ["/api/admin/moderation/pending"],
    queryFn: async () => {
      const res = await fetch('/api/admin/moderation/pending');
      return res.json();
    },
  });

  // Handle report resolution mutation
  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, action, note }: { reportId: number, action: string, note: string }) => {
      const res = await apiRequest("POST", `/api/admin/moderation/reports/${reportId}/resolve`, { action, note });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Resolved",
        description: "The report has been processed successfully.",
      });
      setShowReportDetailsDialog(false);
      setModerationNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/reports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process the report.",
        variant: "destructive",
      });
    },
  });

  // Handle content review mutation
  const reviewContentMutation = useMutation({
    mutationFn: async ({ contentId, contentType, approve }: { contentId: number, contentType: string, approve: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/moderation/review`, { contentId, contentType, approve });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Reviewed",
        description: "The content has been reviewed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to review the content.",
        variant: "destructive",
      });
    },
  });

  const handleViewReport = (report: any) => {
    setCurrentReport(report);
    setShowReportDetailsDialog(true);
  };

  const handleResolveReport = (action: string) => {
    if (currentReport) {
      resolveReportMutation.mutate({
        reportId: currentReport.id,
        action,
        note: moderationNote,
      });
    }
  };

  const handleReviewContent = (contentId: number, contentType: string, approve: boolean) => {
    reviewContentMutation.mutate({ contentId, contentType, approve });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm");
  };

  const getReportTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'harassment':
        return { class: 'bg-red-100 text-red-800', icon: <ThumbsDown className="h-3 w-3 mr-1" /> };
      case 'spam':
        return { class: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-3 w-3 mr-1" /> };
      case 'inappropriate':
        return { class: 'bg-purple-100 text-purple-800', icon: <Flag className="h-3 w-3 mr-1" /> };
      case 'misinformation':
        return { class: 'bg-blue-100 text-blue-800', icon: <ShieldAlert className="h-3 w-3 mr-1" /> };
      default:
        return { class: 'bg-gray-100 text-gray-800', icon: <AlertTriangle className="h-3 w-3 mr-1" /> };
    }
  };

  const getContentTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'post':
        return { class: 'bg-blue-100 text-blue-800', icon: <MessageSquare className="h-3 w-3 mr-1" /> };
      case 'comment':
        return { class: 'bg-green-100 text-green-800', icon: <MessageSquare className="h-3 w-3 mr-1" /> };
      case 'user':
        return { class: 'bg-purple-100 text-purple-800', icon: <User className="h-3 w-3 mr-1" /> };
      case 'community':
        return { class: 'bg-orange-100 text-orange-800', icon: <User className="h-3 w-3 mr-1" /> };
      default:
        return { class: 'bg-gray-100 text-gray-800', icon: <MessageSquare className="h-3 w-3 mr-1" /> };
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span>Reported Content</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Pending Review</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Reported Content</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReports ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Content Type</TableHead>
                        <TableHead>Reported by</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports && reports.length > 0 ? (
                        reports.map((report: any) => {
                          const reportTypeBadge = getReportTypeBadge(report.reportType);
                          const contentTypeBadge = getContentTypeBadge(report.contentType);
                          
                          return (
                            <TableRow key={report.id}>
                              <TableCell className="font-medium">#{report.id}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reportTypeBadge.class}`}>
                                  {reportTypeBadge.icon}
                                  {report.reportType}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contentTypeBadge.class}`}>
                                  {contentTypeBadge.icon}
                                  {report.contentType}
                                </span>
                              </TableCell>
                              <TableCell>{report.reportedBy}</TableCell>
                              <TableCell>{formatDate(report.createdAt)}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  report.status === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : report.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {report.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewReport(report)}
                                >
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No reports found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Content Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPendingPosts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Preview</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPosts && pendingPosts.length > 0 ? (
                        pendingPosts.map((post: any) => {
                          const contentTypeBadge = getContentTypeBadge(post.contentType);
                          
                          return (
                            <TableRow key={post.id}>
                              <TableCell className="font-medium">#{post.id}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contentTypeBadge.class}`}>
                                  {contentTypeBadge.icon}
                                  {post.contentType}
                                </span>
                              </TableCell>
                              <TableCell>{post.createdBy}</TableCell>
                              <TableCell>{formatDate(post.createdAt)}</TableCell>
                              <TableCell>
                                <div className="max-w-[200px] truncate">
                                  {post.contentPreview}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                    onClick={() => handleReviewContent(post.id, post.contentType, true)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => handleReviewContent(post.id, post.contentType, false)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No content pending review.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Details Dialog */}
      <Dialog open={showReportDetailsDialog} onOpenChange={setShowReportDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review this reported content and take appropriate action.
            </DialogDescription>
          </DialogHeader>
          
          {currentReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Report ID</label>
                  <p>#{currentReport.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Date Reported</label>
                  <p>{formatDate(currentReport.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Report Type</label>
                  <div>
                    {getReportTypeBadge(currentReport.reportType).icon}
                    <span className="font-medium">{currentReport.reportType}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Content Type</label>
                  <div>
                    {getContentTypeBadge(currentReport.contentType).icon}
                    <span className="font-medium">{currentReport.contentType}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Reported by</label>
                  <p>{currentReport.reportedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Content Owner</label>
                  <p>{currentReport.contentOwner}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Report Reason</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-md">{currentReport.reason}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Content Preview</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  {currentReport.contentPreview}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Moderation Note</label>
                <Textarea
                  className="mt-1"
                  placeholder="Add notes about this moderation decision..."
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                />
              </div>
              
              <DialogFooter>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowReportDetailsDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => handleResolveReport('approve')}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    No Action Needed
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleResolveReport('remove')}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove Content
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}