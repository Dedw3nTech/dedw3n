import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertTriangle,
  Ban,
  Check,
  Flag,
  Info,
  Loader2,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  XCircle,
  User,
  Clock,
  Calendar,
  FileText,
  MoreHorizontal,
  ImageOff,
  BookX,
  BookOpen,
  FilterX,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type ModerationLog = {
  id: number;
  action: string;
  contentType: string;
  contentId: number;
  reason: string;
  moderatorId: number;
  moderatorName: string;
  timestamp: string;
  note?: string;
  previousStatus?: string;
};

export default function ModerationLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterContentType, setFilterContentType] = useState<string>("all");
  const [filterModerator, setFilterModerator] = useState<string>("all");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const itemsPerPage = 10;

  // Fetch moderation logs
  const {
    data: logs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ModerationLog[]>({
    queryKey: [
      "/api/admin/moderation/logs",
      searchTerm,
      filterAction,
      filterContentType,
      filterModerator,
      date ? format(date, "yyyy-MM-dd") : null,
      currentPage,
    ],
    queryFn: async () => {
      // In a real implementation, this would call the API
      // For now, return mock data for UI development
      const mockLogs: ModerationLog[] = Array.from({ length: 50 }).map((_, i) => {
        const actionTypes = ["approve", "reject", "flag", "delete", "edit", "batch_approve", "batch_reject"];
        const action = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        const contentTypes = ["post", "comment", "image", "product", "user", "community"];
        const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
        const moderators = ["admin", "moderator1", "moderator2", "senior_mod"];
        const moderator = moderators[Math.floor(Math.random() * moderators.length)];
        const days = Math.floor(Math.random() * 30);
        const timestamp = new Date(Date.now() - days * 86400000 - Math.random() * 86400000);
        
        let reason = "";
        switch (action) {
          case "approve":
            reason = "Content meets community guidelines";
            break;
          case "reject":
            reason = ["Hate speech", "Violence", "Adult content", "Misinformation"][Math.floor(Math.random() * 4)];
            break;
          case "flag":
            reason = "Requires further review";
            break;
          case "delete":
            reason = "Violates multiple community guidelines";
            break;
          case "edit":
            reason = "Content edited to remove problematic elements";
            break;
          case "batch_approve":
            reason = "Bulk approval of safe content";
            break;
          case "batch_reject":
            reason = "Bulk rejection of violating content";
            break;
        }
        
        return {
          id: i + 1,
          action,
          contentType,
          contentId: Math.floor(Math.random() * 1000) + 1,
          reason,
          moderatorId: Math.floor(Math.random() * 10) + 1,
          moderatorName: moderator,
          timestamp: timestamp.toISOString(),
          note: Math.random() > 0.7 ? "Additional notes about this moderation action..." : undefined,
          previousStatus: action === "edit" ? "flagged" : undefined,
        };
      });
      
      // Filter by search term (in a real app this would be done on the server)
      const filtered = mockLogs
        .filter(log => {
          // Filter by date
          if (date) {
            const logDate = new Date(log.timestamp);
            const filterDate = new Date(date);
            
            if (logDate.getFullYear() !== filterDate.getFullYear() ||
                logDate.getMonth() !== filterDate.getMonth() ||
                logDate.getDate() !== filterDate.getDate()) {
              return false;
            }
          }
          
          // Filter by action
          if (filterAction !== "all" && log.action !== filterAction) {
            return false;
          }
          
          // Filter by content type
          if (filterContentType !== "all" && log.contentType !== filterContentType) {
            return false;
          }
          
          // Filter by moderator
          if (filterModerator !== "all" && log.moderatorName !== filterModerator) {
            return false;
          }
          
          // Filter by search term
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
              log.reason.toLowerCase().includes(term) ||
              log.moderatorName.toLowerCase().includes(term) ||
              log.contentType.toLowerCase().includes(term) ||
              log.action.toLowerCase().includes(term) ||
              log.contentId.toString().includes(term)
            );
          }
          
          return true;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return filtered;
    },
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  // Get relative time for display
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
    
    return formatDate(dateString);
  };

  // Render action badge
  const renderActionBadge = (action: string) => {
    switch (action) {
      case "approve":
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <Check className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "batch_approve":
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <Check className="h-3 w-3" />
            Batch Approved
          </Badge>
        );
      case "reject":
        return (
          <Badge className="bg-red-500 text-white flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "batch_reject":
        return (
          <Badge className="bg-red-500 text-white flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Batch Rejected
          </Badge>
        );
      case "flag":
        return (
          <Badge className="bg-yellow-500 text-white flex items-center gap-1">
            <Flag className="h-3 w-3" />
            Flagged
          </Badge>
        );
      case "delete":
        return (
          <Badge className="bg-destructive text-white flex items-center gap-1">
            <Trash2 className="h-3 w-3" />
            Deleted
          </Badge>
        );
      case "edit":
        return (
          <Badge className="bg-blue-500 text-white flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Edited
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {action}
          </Badge>
        );
    }
  };

  // Render content type icon
  const renderContentTypeIcon = (type: string) => {
    switch (type) {
      case "post":
        return <FileText className="h-4 w-4 text-primary" />;
      case "comment":
        return <MessageSquare width={16} height={16} className="text-primary" />;
      case "image":
        return <ImageOff className="h-4 w-4 text-primary" />;
      case "product":
        return <ShoppingBag width={16} height={16} className="text-primary" />;
      case "user":
        return <User className="h-4 w-4 text-primary" />;
      case "community":
        return <Users width={16} height={16} className="text-primary" />;
      case "allow_list":
        return <BookOpen className="h-4 w-4 text-primary" />;
      case "block_list":
        return <BookX className="h-4 w-4 text-primary" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  // Handle view log details
  const handleViewDetails = (log: ModerationLog) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };

  // Calculate pagination
  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleLogs = logs.slice(startIndex, startIndex + itemsPerPage);

  // Get unique moderators for filter
  const moderators = React.useMemo(() => {
    const uniqueModerators = new Set(logs.map(log => log.moderatorName));
    return Array.from(uniqueModerators);
  }, [logs]);

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
        <h3 className="text-xl font-bold">Error Loading Logs</h3>
        <p className="text-muted-foreground mb-4">
          There was an error loading moderation logs. Please try again.
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Moderation Activity Logs
        </CardTitle>
        <CardDescription>
          Detailed history of all moderation activities and decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="bg-muted/50 rounded-md p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <Label htmlFor="log-search" className="text-sm text-muted-foreground mb-2 block">
              Search
            </Label>
            <div className="flex gap-2">
              <Input
                id="log-search"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" onClick={() => setSearchTerm("")} className="px-3">
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <Label htmlFor="action-filter" className="text-sm text-muted-foreground mb-2 block">
              Action
            </Label>
            <Select
              value={filterAction}
              onValueChange={setFilterAction}
            >
              <SelectTrigger id="action-filter">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
                <SelectItem value="flag">Flag</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="batch_approve">Batch Approve</SelectItem>
                <SelectItem value="batch_reject">Batch Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Type Filter */}
          <div>
            <Label htmlFor="content-type-filter" className="text-sm text-muted-foreground mb-2 block">
              Content Type
            </Label>
            <Select
              value={filterContentType}
              onValueChange={setFilterContentType}
            >
              <SelectTrigger id="content-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="community">Communities</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Moderator Filter */}
          <div>
            <Label htmlFor="moderator-filter" className="text-sm text-muted-foreground mb-2 block">
              Moderator
            </Label>
            <Select
              value={filterModerator}
              onValueChange={setFilterModerator}
            >
              <SelectTrigger id="moderator-filter">
                <SelectValue placeholder="All Moderators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Moderators</SelectItem>
                {moderators.map((mod) => (
                  <SelectItem key={mod} value={mod}>
                    {mod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="lg:col-span-5 flex items-end justify-end">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={date ? "text-primary" : ""}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Date Filter"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {date && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDate(undefined)}
                  className="h-9 w-9"
                >
                  <X width={16} height={16} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Moderator</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Info className="h-8 w-8 mb-2" />
                      <p>No logs match the current filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visibleLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{renderActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderContentTypeIcon(log.contentType)}
                        <span className="capitalize">{log.contentType}</span>
                        <span className="text-muted-foreground">#{log.contentId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {log.reason}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-3 w-3" />
                        </div>
                        <span>{log.moderatorName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {getRelativeTime(log.timestamp)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDetails(log)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                // Show first, last, and pages around current
                if (
                  i === 0 ||
                  i === totalPages - 1 ||
                  (i >= currentPage - 2 && i <= currentPage + 2)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // Show ellipsis for skipped pages
                if (
                  (i === 1 && currentPage > 3) ||
                  (i === totalPages - 2 && currentPage < totalPages - 3)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>

      {/* Log Detail Dialog */}
      {selectedLog && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Moderation Log Details</DialogTitle>
              <DialogDescription>
                Detailed information about this moderation action
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Action and Timestamp */}
              <div className="flex items-center justify-between">
                <div>
                  {renderActionBadge(selectedLog.action)}
                </div>
                <time className="text-sm text-muted-foreground">
                  {formatDate(selectedLog.timestamp)}
                </time>
              </div>
              
              {/* Content Details */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Content</h3>
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    {renderContentTypeIcon(selectedLog.contentType)}
                    <span className="font-medium capitalize">{selectedLog.contentType}</span>
                    <span className="text-muted-foreground">#{selectedLog.contentId}</span>
                  </div>
                </div>
              </div>
              
              {/* Reason */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Reason</h3>
                <div className="bg-muted p-3 rounded-md">
                  {selectedLog.reason}
                </div>
              </div>
              
              {/* Note (if any) */}
              {selectedLog.note && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Additional Notes</h3>
                  <div className="bg-muted p-3 rounded-md whitespace-pre-wrap text-sm">
                    {selectedLog.note}
                  </div>
                </div>
              )}
              
              {/* Previous Status (if edit) */}
              {selectedLog.previousStatus && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Previous Status</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <Badge variant="outline" className="capitalize">
                      {selectedLog.previousStatus}
                    </Badge>
                  </div>
                </div>
              )}
              
              {/* Moderator */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Moderator</h3>
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedLog.moderatorName}</p>
                      <p className="text-xs text-muted-foreground">ID: {selectedLog.moderatorId}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

// Icons
const MessageSquare = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ShoppingBag = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const Users = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const X = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);