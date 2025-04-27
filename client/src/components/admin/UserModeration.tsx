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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CalendarClock,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Flag,
  Globe,
  Loader2,
  LockKeyhole,
  LogOut,
  MailWarning,
  MessageSquare,
  MoreHorizontal,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus,
  UserX,
  Users,
  VolumeX,
  X,
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Define types
interface UserReport {
  id: number;
  userId: number;
  reporterId: number;
  reason: string;
  details: string;
  status: "pending" | "in_review" | "dismissed" | "action_taken";
  createdAt: string;
  reporterName: string;
  reportedUserName: string;
}

interface UserViolation {
  id: number;
  userId: number;
  type: "content" | "behavior" | "spam" | "harassment" | "other";
  description: string;
  severity: "low" | "medium" | "high";
  status: "active" | "archived";
  createdAt: string;
  actionTaken: string;
  moderatorId: number;
  moderatorName: string;
}

interface UserModerationAction {
  id: number;
  userId: number;
  username: string;
  action: "flag" | "mute" | "ban" | "global_ban" | "warning" | "note" | "unban" | "unmute";
  reason: string;
  duration?: string;
  createdAt: string;
  expiresAt?: string;
  moderatorId: number;
  moderatorName: string;
  status: "active" | "expired" | "revoked";
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "user" | "vendor" | "moderator" | "admin";
  status: "active" | "muted" | "banned" | "global_banned";
  dateJoined: string;
  lastActive: string;
  isVerified: boolean;
  reportCount: number;
  violationCount: number;
  trustScore: number;
  muteExpiresAt?: string;
  banExpiresAt?: string;
  activeWarnings: number;
  notes?: string;
  ipAddresses?: string[];
  verificationLevel?: "none" | "email" | "phone" | "government_id" | "biometric";
  accountLockReason?: string;
  loginAttempts?: number;
  suspiciousActivityFlags?: string[];
  deviceHistory?: UserDevice[];
  locationData?: UserLocation[];
  riskScore?: number;
  accountAgeInDays?: number;
  region?: string;
  preferredLanguage?: string;
  contentSettings?: UserContentSettings;
}

interface UserDevice {
  id: number;
  deviceId: string;
  deviceName: string;
  browser: string;
  operatingSystem: string;
  lastUsed: string;
  ipAddress: string;
  isTrusted: boolean;
  isCurrentDevice?: boolean;
}

interface UserLocation {
  id: number;
  country: string;
  city?: string;
  region?: string;
  lastSeen: string;
  ipAddress: string;
  frequency: "rare" | "occasional" | "frequent";
  isSuspicious: boolean;
}

interface UserContentSettings {
  contentFilters: ("none" | "low" | "medium" | "high")[];
  languagePreferences: string[];
  allowAdultContent: boolean;
  allowDataCollection: boolean;
  visibilitySettings: "public" | "friends" | "private";
}

interface ModeratorNote {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  moderatorId: number;
  moderatorName: string;
}

interface SecurityLog {
  id: number;
  userId: number;
  eventType: "login" | "logout" | "password_change" | "email_change" | "2fa_enabled" | "2fa_disabled" | "account_locked" | "account_unlocked" | "password_reset" | "suspicious_activity";
  timestamp: string;
  ipAddress: string;
  deviceInfo: string;
  location?: string;
  success: boolean;
  details?: string;
}

export default function UserModeration() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetailDialog, setShowUserDetailDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<UserModerationAction["action"]>("flag");
  const [actionReason, setActionReason] = useState("");
  const [actionDuration, setActionDuration] = useState("24h");
  const [actionNote, setActionNote] = useState("");
  const [isBatchAction, setIsBatchAction] = useState(false);
  const [activeUserTab, setActiveUserTab] = useState("overview");
  const [activeTab, setActiveTab] = useState("users");
  
  // Security-related state management is handled through useQuery hooks below
  
  const itemsPerPage = 10;

  // Fetch users
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users/moderation", searchTerm, filterStatus, filterRole, currentPage],
    queryFn: async () => {
      // Mock data for UI development
      return generateMockUsers();
    },
  });

  // Fetch reports
  const {
    data: reports = [],
    isLoading: isLoadingReports,
    isError: isErrorReports,
    refetch: refetchReports,
  } = useQuery<UserReport[]>({
    queryKey: ["/api/admin/users/reports"],
    queryFn: async () => {
      // Mock data for UI development
      return generateMockReports();
    },
    enabled: activeTab === "reports",
  });

  // Fetch violations for the selected user
  const {
    data: userViolations = [],
    isLoading: isLoadingViolations,
  } = useQuery<UserViolation[]>({
    queryKey: ["/api/admin/users/violations", selectedUser?.id],
    queryFn: async () => {
      // Mock data for UI development
      return generateMockViolations(selectedUser?.id || 0);
    },
    enabled: !!selectedUser && showUserDetailDialog,
  });

  // Fetch moderation actions for the selected user
  const {
    data: userActions = [],
    isLoading: isLoadingActions,
  } = useQuery<UserModerationAction[]>({
    queryKey: ["/api/admin/users/actions", selectedUser?.id],
    queryFn: async () => {
      // Mock data for UI development
      return generateMockActions(selectedUser?.id || 0);
    },
    enabled: !!selectedUser && showUserDetailDialog,
  });

  // Fetch moderator notes for the selected user
  const {
    data: moderatorNotes = [],
    isLoading: isLoadingNotes,
  } = useQuery<ModeratorNote[]>({
    queryKey: ["/api/admin/users/notes", selectedUser?.id],
    queryFn: async () => {
      // Mock data for UI development
      return generateMockNotes(selectedUser?.id || 0);
    },
    enabled: !!selectedUser && showUserDetailDialog,
  });
  
  // Fetch security logs for the selected user
  const {
    data: securityLogs = [],
    isLoading: isLoadingSecurityLogs,
  } = useQuery<SecurityLog[]>({
    queryKey: ["/api/admin/users/security-logs", selectedUser?.id],
    queryFn: async () => {
      // Mock data for UI development
      return generateMockSecurityLogs(selectedUser?.id || 0);
    },
    enabled: !!selectedUser && showUserDetailDialog && activeUserTab === "security",
  });
  
  // Fetch devices for the selected user
  const {
    data: userDevices = [],
    isLoading: isLoadingDevices,
  } = useQuery<UserDevice[]>({
    queryKey: ["/api/admin/users/devices", selectedUser?.id],
    queryFn: async () => {
      // Mock data for UI development
      return generateMockDevices(selectedUser?.id || 0);
    },
    enabled: !!selectedUser && showUserDetailDialog && activeUserTab === "security",
  });
  
  // Fetch user locations for the selected user
  const {
    data: userLocations = [],
    isLoading: isLoadingLocations,
  } = useQuery<UserLocation[]>({
    queryKey: ["/api/admin/users/locations", selectedUser?.id],
    queryFn: async () => {
      // Mock data for UI development
      return generateMockLocations(selectedUser?.id || 0);
    },
    enabled: !!selectedUser && showUserDetailDialog && activeUserTab === "security",
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ userId, content }: { userId: number; content: string }) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Note Added",
        description: "Moderator note has been added to the user profile",
      });
      setActionNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/notes"] });
    },
  });

  // Apply moderation action mutation
  const applyActionMutation = useMutation({
    mutationFn: async (data: {
      userIds: number[];
      action: string;
      reason: string;
      duration?: string;
      note?: string;
    }) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Action Applied",
        description: isBatchAction
          ? `Action applied to ${selectedUsers.length} users`
          : "Action applied successfully",
      });
      setShowActionDialog(false);
      setActionReason("");
      setActionNote("");
      setSelectedUsers([]);
      setIsBatchAction(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/actions"] });
    },
  });

  // Handle report resolution mutation
  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, resolution, note }: { reportId: number; resolution: string; note?: string }) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Report Resolved",
        description: "User report has been resolved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/reports"] });
    },
  });

  // Toggle select all users
  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  // Toggle select individual user
  const toggleSelectUser = (id: number) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  // View user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetailDialog(true);
  };

  // Open action dialog for single user
  const handleActionForUser = (user: User, action: UserModerationAction["action"]) => {
    setSelectedUser(user);
    setSelectedUsers([user.id]);
    setActionType(action);
    setIsBatchAction(false);
    setShowActionDialog(true);
  };

  // Open action dialog for batch users
  const handleBatchAction = (action: UserModerationAction["action"]) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select one or more users to perform this action",
        variant: "destructive",
      });
      return;
    }
    
    setActionType(action);
    setIsBatchAction(true);
    setShowActionDialog(true);
  };

  // Apply action to user(s)
  const confirmAction = () => {
    if (actionType === "note") {
      // Add note instead of applying an action
      if (selectedUser) {
        addNoteMutation.mutate({
          userId: selectedUser.id,
          content: actionNote,
        });
        setShowActionDialog(false);
      }
      return;
    }

    applyActionMutation.mutate({
      userIds: selectedUsers,
      action: actionType,
      reason: actionReason,
      duration: ["mute", "ban"].includes(actionType) ? actionDuration : undefined,
      note: actionNote || undefined,
    });
  };

  // Add a moderator note
  const addModeratorNote = () => {
    if (!actionNote.trim() || !selectedUser) return;
    
    addNoteMutation.mutate({
      userId: selectedUser.id,
      content: actionNote,
    });
  };

  // Resolve a report
  const resolveReport = (reportId: number, resolution: string, note?: string) => {
    resolveReportMutation.mutate({
      reportId,
      resolution,
      note,
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  // Get relative time
  const getRelativeTime = (dateString: string) => {
    if (!dateString) return "N/A";
    
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

  // Check if a restriction has expired
  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Render user status badge
  const renderUserStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            Active
          </Badge>
        );
      case "muted":
        return (
          <Badge className="bg-amber-500 text-white flex items-center gap-1">
            <VolumeX className="h-3 w-3" />
            Muted
          </Badge>
        );
      case "banned":
        return (
          <Badge className="bg-red-500 text-white flex items-center gap-1">
            <Ban className="h-3 w-3" />
            Banned
          </Badge>
        );
      case "global_banned":
        return (
          <Badge className="bg-black text-white flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Global Ban
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Render trust score badge
  const renderTrustScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <Badge className="bg-green-500 text-white">
          High Trust
        </Badge>
      );
    } else if (score >= 50) {
      return (
        <Badge className="bg-amber-500 text-white">
          Medium Trust
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-500 text-white">
          Low Trust
        </Badge>
      );
    }
  };
  


  // Render action badge
  const renderActionBadge = (action: UserModerationAction["action"]) => {
    switch (action) {
      case "flag":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500 flex items-center gap-1">
            <Flag className="h-3 w-3" />
            Flagged
          </Badge>
        );
      case "mute":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500 flex items-center gap-1">
            <VolumeX className="h-3 w-3" />
            Muted
          </Badge>
        );
      case "unmute":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Unmuted
          </Badge>
        );
      case "ban":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500 flex items-center gap-1">
            <Ban className="h-3 w-3" />
            Banned
          </Badge>
        );
      case "unban":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500 flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            Unbanned
          </Badge>
        );
      case "global_ban":
        return (
          <Badge variant="outline" className="border-black text-black flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Global Ban
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Badge>
        );
      case "note":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Copy className="h-3 w-3" />
            Note
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

  // Render violation severity badge
  const renderSeverityBadge = (severity: UserViolation["severity"]) => {
    switch (severity) {
      case "low":
        return (
          <Badge className="bg-blue-500 text-white">
            Low
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-amber-500 text-white">
            Medium
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-red-500 text-white">
            High
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {severity}
          </Badge>
        );
    }
  };

  // Render report status badge
  const renderReportStatusBadge = (status: UserReport["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "in_review":
        return (
          <Badge className="bg-blue-500 text-white flex items-center gap-1">
            <Eye className="h-3 w-3" />
            In Review
          </Badge>
        );
      case "dismissed":
        return (
          <Badge className="bg-gray-500 text-white flex items-center gap-1">
            <X className="h-3 w-3" />
            Dismissed
          </Badge>
        );
      case "action_taken":
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <Check className="h-3 w-3" />
            Action Taken
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Filter users based on search term and filters
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by status
      const matchesStatus = filterStatus === "all" || user.status === filterStatus;
      
      // Filter by role
      const matchesRole = filterRole === "all" || user.role === filterRole;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, filterStatus, filterRole]);

  // Filter reports based on search term
  const filteredReports = React.useMemo(() => {
    return reports.filter(report => {
      // Basic filtering for demonstration
      return !searchTerm || 
        report.reportedUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reason.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [reports, searchTerm]);

  // Calculate pagination for users list
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Loading states for the main areas
  if (activeTab === "users" && isLoadingUsers) {
    return <LoadingState />;
  }

  if (activeTab === "reports" && isLoadingReports) {
    return <LoadingState />;
  }

  // Error states for the main areas
  if (activeTab === "users" && isErrorUsers) {
    return <ErrorState onRetry={refetchUsers} message="Error loading users" />;
  }

  if (activeTab === "reports" && isErrorReports) {
    return <ErrorState onRetry={refetchReports} message="Error loading reports" />;
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            User Reports
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                User Moderation
              </CardTitle>
              <CardDescription>
                Flag, mute, ban, or manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex items-center space-x-2 max-w-sm">
                  <div className="grid flex-1 gap-2">
                    <Label htmlFor="search-users" className="sr-only">
                      Search
                    </Label>
                    <Input
                      id="search-users"
                      placeholder="Search usernames, names, or emails..."
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="muted">Muted</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                      <SelectItem value="global_banned">Global Banned</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterRole}
                    onValueChange={setFilterRole}
                  >
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Batch Actions */}
              <div className="bg-muted/50 rounded-md p-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all users"
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    {selectedUsers.length > 0
                      ? `${selectedUsers.length} selected`
                      : "Select all"}
                  </Label>
                </div>
                <div className="flex-1" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchAction("flag")}
                    disabled={selectedUsers.length === 0}
                    className="h-8"
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    Flag
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchAction("mute")}
                    disabled={selectedUsers.length === 0}
                    className="h-8"
                  >
                    <VolumeX className="h-4 w-4 mr-1" />
                    Mute
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchAction("ban")}
                    disabled={selectedUsers.length === 0}
                    className="h-8"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Ban
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchAction("global_ban")}
                    disabled={selectedUsers.length === 0}
                    className="h-8 text-black hover:text-black"
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Global Ban
                  </Button>
                </div>
              </div>

              {/* Users Table */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <User className="h-8 w-8 mb-2" />
                            <p>No users match the current filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleUsers.map((user) => (
                        <TableRow key={user.id} className={selectedUsers.includes(user.id) ? "bg-muted/50" : undefined}>
                          <TableCell className="px-2">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => toggleSelectUser(user.id)}
                              aria-label={`Select user ${user.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={user.avatarUrl} alt={user.username} />
                                <AvatarFallback>
                                  {user.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-muted-foreground">@{user.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{renderUserStatusBadge(user.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Progress 
                                value={user.trustScore} 
                                max={100} 
                                className="h-1.5 w-12 mr-2"
                                // Apply different colors based on trust score
                                style={{ 
                                  backgroundColor: user.trustScore < 50 ? 'rgb(239 68 68 / 0.2)' :
                                                  user.trustScore < 80 ? 'rgb(245 158 11 / 0.2)' :
                                                  'rgb(34 197 94 / 0.2)',
                                }}
                              />
                              <HoverCard>
                                <HoverCardTrigger>
                                  <span>{user.trustScore}%</span>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-60">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Trust Score Details</h4>
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                      <div>Violations:</div>
                                      <div>{user.violationCount}</div>
                                      <div>Reports:</div>
                                      <div>{user.reportCount}</div>
                                      <div>Active Warnings:</div>
                                      <div>{user.activeWarnings}</div>
                                      <div>Account Age:</div>
                                      <div>{getRelativeTime(user.dateJoined)}</div>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              {getRelativeTime(user.lastActive)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleActionForUser(user, "flag")}>
                                  <Flag className="h-4 w-4 mr-2" />
                                  Flag User
                                </DropdownMenuItem>
                                {user.status === "muted" ? (
                                  <DropdownMenuItem onClick={() => handleActionForUser(user, "unmute")}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Unmute User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleActionForUser(user, "mute")}>
                                    <VolumeX className="h-4 w-4 mr-2" />
                                    Mute User
                                  </DropdownMenuItem>
                                )}
                                {user.status === "banned" || user.status === "global_banned" ? (
                                  <DropdownMenuItem onClick={() => handleActionForUser(user, "unban")}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Unban User
                                  </DropdownMenuItem>
                                ) : (
                                  <>
                                    <DropdownMenuItem onClick={() => handleActionForUser(user, "ban")}>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Ban User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleActionForUser(user, "global_ban")}>
                                      <Globe className="h-4 w-4 mr-2" />
                                      Global Ban
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleActionForUser(user, "warning")}>
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Issue Warning
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleActionForUser(user, "note")}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Add Note
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
          </Card>
        </TabsContent>

        {/* User Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                User Reports
              </CardTitle>
              <CardDescription>
                Review and manage reports submitted by users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search for Reports */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex items-center space-x-2 max-w-sm">
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
                  <Button type="button" size="sm" className="h-9 px-3">
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search</span>
                  </Button>
                </div>

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
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                      <SelectItem value="action_taken">Action Taken</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reports Table */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Reported User</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p>No reports match the current filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-3 w-3" />
                              </div>
                              <span>@{report.reportedUserName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {report.reason}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-3 w-3" />
                              </div>
                              <span>@{report.reporterName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              {getRelativeTime(report.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>{renderReportStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Report Actions</DropdownMenuLabel>
                                {report.status === "pending" && (
                                  <DropdownMenuItem onClick={() => resolveReport(report.id, "in_review")}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Mark In Review
                                  </DropdownMenuItem>
                                )}
                                {report.status !== "dismissed" && report.status !== "action_taken" && (
                                  <>
                                    <DropdownMenuItem onClick={() => resolveReport(report.id, "dismissed")}>
                                      <X className="h-4 w-4 mr-2" />
                                      Dismiss Report
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => resolveReport(report.id, "action_taken")}>
                                      <Check className="h-4 w-4 mr-2" />
                                      Mark Action Taken
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  // Find the user by ID and handle action
                                  const user = users.find(u => u.id === report.userId);
                                  if (user) {
                                    handleViewUser(user);
                                  }
                                }}>
                                  <UserCog className="h-4 w-4 mr-2" />
                                  View User Profile
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
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Detail Dialog */}
      {selectedUser && (
        <Dialog open={showUserDetailDialog} onOpenChange={setShowUserDetailDialog}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                User Profile
              </DialogTitle>
              <DialogDescription>
                Detailed information and moderation history for this user
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col md:flex-row gap-6 pt-4">
              {/* User Info Column */}
              <div className="flex-1 space-y-4">
                {/* Basic User Info */}
                <div className="flex flex-col items-center text-center gap-2">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.username} />
                    <AvatarFallback>
                      {selectedUser.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                  </div>
                  <div className="flex gap-2">
                    {renderUserStatusBadge(selectedUser.status)}
                    <Badge variant="outline" className="capitalize">
                      {selectedUser.role}
                    </Badge>
                    {selectedUser.isVerified && (
                      <Badge className="bg-blue-500 text-white">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {/* User Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted p-2 rounded-md">
                    <div className="text-muted-foreground text-xs">Joined</div>
                    <div>{formatDate(selectedUser.dateJoined)}</div>
                  </div>
                  <div className="bg-muted p-2 rounded-md">
                    <div className="text-muted-foreground text-xs">Last Active</div>
                    <div>{getRelativeTime(selectedUser.lastActive)}</div>
                  </div>
                  <div className="bg-muted p-2 rounded-md">
                    <div className="text-muted-foreground text-xs">Reports</div>
                    <div>{selectedUser.reportCount}</div>
                  </div>
                  <div className="bg-muted p-2 rounded-md">
                    <div className="text-muted-foreground text-xs">Violations</div>
                    <div>{selectedUser.violationCount}</div>
                  </div>
                </div>

                {/* Trust Score */}
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">Trust Score</div>
                    {renderTrustScoreBadge(selectedUser.trustScore)}
                  </div>
                  <Progress
                    value={selectedUser.trustScore}
                    max={100}
                    className="h-2"
                    // Apply different colors based on trust score
                    style={{
                      backgroundColor: selectedUser.trustScore < 50 ? 'rgb(239 68 68 / 0.2)' :
                        selectedUser.trustScore < 80 ? 'rgb(245 158 11 / 0.2)' :
                          'rgb(34 197 94 / 0.2)',
                    }}
                  />
                </div>

                {/* Active Restrictions */}
                {(selectedUser.status === "muted" || selectedUser.status === "banned") && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <h4 className="font-medium mb-1 text-red-800">Active Restrictions</h4>
                    <div className="space-y-1">
                      {selectedUser.status === "muted" && (
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <VolumeX className="h-3 w-3" />
                            Muted
                          </span>
                          <span>
                            {selectedUser.muteExpiresAt
                              ? `Until ${formatDate(selectedUser.muteExpiresAt)}`
                              : "Permanent"}
                          </span>
                        </div>
                      )}
                      {selectedUser.status === "banned" && (
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Ban className="h-3 w-3" />
                            Banned
                          </span>
                          <span>
                            {selectedUser.banExpiresAt
                              ? `Until ${formatDate(selectedUser.banExpiresAt)}`
                              : "Permanent"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActionForUser(selectedUser, "flag")}
                    className="h-8"
                  >
                    <Flag className="h-3.5 w-3.5 mr-1" />
                    Flag
                  </Button>
                  {selectedUser.status === "muted" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionForUser(selectedUser, "unmute")}
                      className="h-8"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      Unmute
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionForUser(selectedUser, "mute")}
                      className="h-8"
                    >
                      <VolumeX className="h-3.5 w-3.5 mr-1" />
                      Mute
                    </Button>
                  )}
                  {selectedUser.status === "banned" || selectedUser.status === "global_banned" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionForUser(selectedUser, "unban")}
                      className="h-8"
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                      Unban
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionForUser(selectedUser, "ban")}
                      className="h-8"
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      Ban
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActionForUser(selectedUser, "warning")}
                    className="h-8"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Warn
                  </Button>
                </div>
              </div>

              {/* User History Column */}
              <div className="flex-1">
                <Tabs value={activeUserTab} onValueChange={setActiveUserTab}>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="violations">Violations</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {/* Notes Section */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm">Moderator Notes</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs"
                          onClick={() => handleActionForUser(selectedUser, "note")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Add Note
                        </Button>
                      </div>
                      
                      {isLoadingNotes ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : moderatorNotes.length === 0 ? (
                        <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground text-center">
                          No moderator notes for this user
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm max-h-[200px] overflow-y-auto pr-1">
                          {moderatorNotes.map((note) => (
                            <div key={note.id} className="bg-muted p-2 rounded-md">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">{note.moderatorName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {getRelativeTime(note.createdAt)}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-muted-foreground text-xs">
                                {note.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Account Summary */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Account Summary</h3>
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Email:</span>
                          <span>{selectedUser.email}</span>
                        </div>
                        <Separator className="my-2" />
                        {selectedUser.activeWarnings > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span>Active Warnings:</span>
                              <Badge variant="outline" className="border-amber-500 text-amber-500">
                                {selectedUser.activeWarnings}
                              </Badge>
                            </div>
                            <Separator className="my-2" />
                          </>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>Verification:</span>
                          <span>{selectedUser.isVerified ? "Verified Account" : "Not Verified"}</span>
                        </div>
                        {selectedUser.ipAddresses && selectedUser.ipAddresses.length > 0 && (
                          <>
                            <Separator className="my-2" />
                            <div className="text-muted-foreground">
                              <div>IP Addresses:</div>
                              <div className="space-y-1 mt-1">
                                {selectedUser.ipAddresses.map((ip, i) => (
                                  <div key={i} className="flex justify-between bg-background p-1 rounded-sm">
                                    <span className="text-xs font-mono">{ip}</span>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground/50">
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Violations Tab */}
                  <TabsContent value="violations" className="space-y-4 mt-4">
                    {isLoadingViolations ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : userViolations.length === 0 ? (
                      <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>No violations recorded for this user</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {userViolations.map((violation) => (
                          <div key={violation.id} className="bg-muted p-3 rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className="capitalize"
                                >
                                  {violation.type}
                                </Badge>
                                {renderSeverityBadge(violation.severity)}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(violation.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{violation.description}</p>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Action: {violation.actionTaken}</span>
                              <span>Moderator: {violation.moderatorName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Actions Tab */}
                  <TabsContent value="actions" className="space-y-4 mt-4">
                    {isLoadingActions ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : userActions.length === 0 ? (
                      <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>No moderation actions taken on this user</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {userActions.map((action) => (
                          <div 
                            key={action.id} 
                            className={`bg-muted p-3 rounded-md ${
                              action.status === "expired" || action.status === "revoked" 
                                ? "opacity-70" 
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                {renderActionBadge(action.action)}
                                {action.status === "expired" && (
                                  <Badge variant="outline" className="text-xs">
                                    Expired
                                  </Badge>
                                )}
                                {action.status === "revoked" && (
                                  <Badge variant="outline" className="text-xs">
                                    Revoked
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(action.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{action.reason}</p>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              {action.duration && (
                                <span>Duration: {action.duration}</span>
                              )}
                              {action.expiresAt && (
                                <span>Expires: {formatDate(action.expiresAt)}</span>
                              )}
                              <span>Moderator: {action.moderatorName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="space-y-4 mt-4">
                    {/* Risk Assessment */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm">Risk Assessment</h3>
                        {selectedUser.riskScore !== undefined && (
                          <Badge 
                            variant="outline" 
                            className={
                              selectedUser.riskScore > 70 ? "border-red-500 text-red-500" :
                              selectedUser.riskScore > 40 ? "border-amber-500 text-amber-500" :
                              "border-green-500 text-green-500"
                            }
                          >
                            {selectedUser.riskScore > 70 ? "High Risk" :
                             selectedUser.riskScore > 40 ? "Medium Risk" :
                             "Low Risk"}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="bg-muted p-3 rounded-md text-sm">
                        {selectedUser.riskScore !== undefined && (
                          <div className="mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-muted-foreground">Risk Score:</span>
                              <span>{selectedUser.riskScore}/100</span>
                            </div>
                            <Progress
                              value={selectedUser.riskScore}
                              max={100}
                              className="h-1.5"
                              style={{
                                backgroundColor: 
                                  selectedUser.riskScore > 70 ? 'rgb(239 68 68 / 0.2)' :
                                  selectedUser.riskScore > 40 ? 'rgb(245 158 11 / 0.2)' :
                                  'rgb(34 197 94 / 0.2)',
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Verification Level:</span>
                            <span className="capitalize">
                              {selectedUser.verificationLevel || "None"}
                            </span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between text-muted-foreground">
                            <span>Login Attempts:</span>
                            <span>
                              {selectedUser.loginAttempts || 0}
                              {selectedUser.loginAttempts && selectedUser.loginAttempts > 15 && (
                                <Badge variant="outline" className="ml-2 text-xs border-red-500 text-red-500">
                                  Suspicious
                                </Badge>
                              )}
                            </span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between text-muted-foreground">
                            <span>Account Age:</span>
                            <span>{selectedUser.accountAgeInDays || 0} days</span>
                          </div>
                          
                          {selectedUser.accountLockReason && (
                            <>
                              <Separator className="my-1" />
                              <div className="flex justify-between text-red-500">
                                <span>Account Lock Reason:</span>
                                <span>{selectedUser.accountLockReason}</span>
                              </div>
                            </>
                          )}

                          {selectedUser.suspiciousActivityFlags && selectedUser.suspiciousActivityFlags.length > 0 && (
                            <>
                              <Separator className="my-1" />
                              <div className="text-muted-foreground">
                                <div>Suspicious Activity Flags:</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedUser.suspiciousActivityFlags.map((flag, i) => (
                                    <Badge key={i} variant="outline" className="text-xs border-red-500 text-red-500">
                                      {flag.replace(/_/g, ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Devices */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Device History</h3>
                      {isLoadingDevices ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : !userDevices || userDevices.length === 0 ? (
                        <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground text-center">
                          No device history available
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                          {userDevices.map((device) => (
                            <div key={device.id} className="bg-muted p-2 rounded-md text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium flex items-center">
                                    {device.deviceName}
                                    {device.isCurrentDevice && (
                                      <Badge className="ml-2 bg-green-500 text-white text-xs">Current</Badge>
                                    )}
                                    {!device.isTrusted && (
                                      <Badge variant="outline" className="ml-2 text-xs border-red-500 text-red-500">Untrusted</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {device.operatingSystem} / {device.browser}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {getRelativeTime(device.lastUsed)}
                                </div>
                              </div>
                              <div className="mt-1 flex justify-between text-xs">
                                <div className="font-mono text-muted-foreground">{device.ipAddress}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Locations */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Location History</h3>
                      {isLoadingLocations ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : !userLocations || userLocations.length === 0 ? (
                        <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground text-center">
                          No location history available
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                          {userLocations.map((location) => (
                            <div key={location.id} className="bg-muted p-2 rounded-md text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium flex items-center">
                                    {location.city}, {location.country}
                                    {location.isSuspicious && (
                                      <Badge variant="outline" className="ml-2 text-xs border-red-500 text-red-500">Suspicious</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Frequency: <span className="capitalize">{location.frequency}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {getRelativeTime(location.lastSeen)}
                                </div>
                              </div>
                              <div className="mt-1 flex justify-between text-xs">
                                <div className="font-mono text-muted-foreground">{location.ipAddress}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Security Logs */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Security Logs</h3>
                      {isLoadingSecurityLogs ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : !securityLogs || securityLogs.length === 0 ? (
                        <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground text-center">
                          No security logs available
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {securityLogs.map((log) => (
                            <div key={log.id} className="bg-muted p-2 rounded-md text-sm">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <Badge 
                                    className={log.success ? "bg-green-500 text-white" : "bg-red-500 text-white"}
                                  >
                                    {log.eventType.replace(/_/g, ' ')}
                                  </Badge>
                                  {log.eventType === "suspicious_activity" && (
                                    <Badge variant="outline" className="ml-2 text-xs border-red-500 text-red-500">
                                      Alert
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {getRelativeTime(log.timestamp)}
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground grid gap-1">
                                {log.details && (
                                  <div className="mb-1">{log.details}</div>
                                )}
                                <div className="flex justify-between">
                                  <span>Device:</span>
                                  <span>{log.deviceInfo}</span>
                                </div>
                                {log.location && (
                                  <div className="flex justify-between">
                                    <span>Location:</span>
                                    <span>{log.location}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>IP Address:</span>
                                  <span className="font-mono">{log.ipAddress}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Moderation Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionType.replace("_", " ")} {isBatchAction ? "Users" : "User"}
            </DialogTitle>
            <DialogDescription>
              {isBatchAction
                ? `Apply this action to ${selectedUsers.length} selected users`
                : `Apply this action to ${selectedUser?.username || "user"}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Reason Field */}
            {actionType !== "note" && (
              <div className="space-y-2">
                <Label htmlFor="action-reason" className="text-sm font-medium">
                  Reason
                </Label>
                <Textarea
                  id="action-reason"
                  placeholder={`Reason for ${actionType.replace("_", " ")}`}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="min-h-20"
                />
              </div>
            )}

            {/* Duration Field for mute/ban */}
            {(actionType === "mute" || actionType === "ban") && (
              <div className="space-y-2">
                <Label htmlFor="action-duration" className="text-sm font-medium">
                  Duration
                </Label>
                <Select
                  value={actionDuration}
                  onValueChange={setActionDuration}
                >
                  <SelectTrigger id="action-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="6h">6 hours</SelectItem>
                    <SelectItem value="12h">12 hours</SelectItem>
                    <SelectItem value="24h">24 hours</SelectItem>
                    <SelectItem value="3d">3 days</SelectItem>
                    <SelectItem value="7d">7 days</SelectItem>
                    <SelectItem value="14d">14 days</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Note Field */}
            <div className="space-y-2">
              <Label htmlFor="action-note" className="text-sm font-medium">
                {actionType === "note" ? "Note Content" : "Additional Notes (Optional)"}
              </Label>
              <Textarea
                id="action-note"
                placeholder={actionType === "note" 
                  ? "Enter the note to be added to the user's record" 
                  : "Additional information (internal only)"}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="min-h-20"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
              disabled={applyActionMutation.isPending || addNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={(actionType !== "note" && !actionReason) || 
                      (actionType === "note" && !actionNote) ||
                      applyActionMutation.isPending || 
                      addNoteMutation.isPending}
            >
              {applyActionMutation.isPending || addNoteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === "note" ? "Add Note" : "Apply Action"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper components
const LoadingState = () => (
  <div className="flex justify-center items-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const ErrorState = ({ onRetry, message }: { onRetry: () => void; message: string }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-xl font-bold">Error</h3>
    <p className="text-muted-foreground mb-4">
      {message} Please try again.
    </p>
    <Button onClick={onRetry}>Retry</Button>
  </div>
);

// Generate mock data for demonstration
function generateMockUsers(): User[] {
  const statuses: User["status"][] = ["active", "muted", "banned", "global_banned"];
  const roles: User["role"][] = ["user", "vendor", "moderator", "admin"];
  const verificationLevels: NonNullable<User["verificationLevel"]>[] = ["none", "email", "phone", "government_id", "biometric"];
  const languages = ["en", "fr", "es", "de", "it", "ja", "zh"];
  const regions = ["UK", "US", "EU", "APAC", "LATAM", "MENA", "AFR"];
  
  return Array.from({ length: 30 }).map((_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isVerified = Math.random() > 0.3;
    const reportCount = Math.floor(Math.random() * 5);
    const violationCount = Math.floor(Math.random() * 3);
    const activeWarnings = Math.floor(Math.random() * 2);
    const loginAttempts = Math.floor(Math.random() * 20);
    
    // Calculate trust score based on violations, reports, etc.
    let trustScore = 100;
    trustScore -= violationCount * 15;
    trustScore -= reportCount * 5;
    trustScore -= activeWarnings * 10;
    if (!isVerified) trustScore -= 10;
    if (status !== "active") trustScore -= 30;
    trustScore = Math.max(0, Math.min(100, trustScore));
    
    // Calculate risk score (separate from trust score - security risk)
    let riskScore = 0;
    if (loginAttempts > 10) {
      riskScore = Math.floor(Math.random() * 30) + 70; // High risk (70-100)
    } else if (reportCount > 3 || violationCount > 2) {
      riskScore = Math.floor(Math.random() * 20) + 50; // Medium-high risk (50-70)
    } else if (Math.random() < 0.7) {
      riskScore = Math.floor(Math.random() * 20) + 10; // Low risk (10-30)
    } else {
      riskScore = Math.floor(Math.random() * 20) + 30; // Medium risk (30-50)
    }
    
    const dateJoined = new Date(Date.now() - Math.random() * 365 * 86400000).toISOString();
    const lastActive = new Date(Date.now() - Math.random() * 30 * 86400000).toISOString();
    const accountAgeInDays = Math.floor((Date.now() - new Date(dateJoined).getTime()) / (1000 * 60 * 60 * 24));
    
    let muteExpiresAt, banExpiresAt;
    if (status === "muted") {
      muteExpiresAt = new Date(Date.now() + Math.random() * 7 * 86400000).toISOString();
    }
    if (status === "banned") {
      banExpiresAt = new Date(Date.now() + Math.random() * 30 * 86400000).toISOString();
    }
    
    // Account lock reason if applicable
    let accountLockReason: string | undefined;
    if (loginAttempts > 15) {
      accountLockReason = "Too many failed login attempts";
    } else if (status === "banned" || status === "global_banned") {
      accountLockReason = "Account banned due to policy violations";
    }
    
    // Suspicious activity flags
    const suspiciousFlags = [
      "multiple_failed_logins",
      "unusual_location_activity",
      "rapid_region_changes",
      "suspicious_ip_activity",
      "unusual_device_activity"
    ];
    
    const suspiciousActivityFlags = Math.random() < 0.2 ? 
      suspiciousFlags.filter(() => Math.random() < 0.5) : undefined;
    
    const ipAddresses = Math.random() > 0.7 ? [
      `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    ] : undefined;
    
    // Language and region preferences
    const preferredLanguage = languages[Math.floor(Math.random() * languages.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    
    // Content settings
    const contentFilters: NonNullable<User["contentSettings"]>["contentFilters"] = 
      Math.random() < 0.25 ? ["none"] :
      Math.random() < 0.5 ? ["low"] :
      Math.random() < 0.75 ? ["medium"] : ["high"];
    
    const contentSettings: UserContentSettings = {
      contentFilters,
      languagePreferences: [preferredLanguage, languages[Math.floor(Math.random() * languages.length)]],
      allowAdultContent: Math.random() > 0.5,
      allowDataCollection: Math.random() > 0.3,
      visibilitySettings: Math.random() < 0.33 ? "private" : Math.random() < 0.66 ? "friends" : "public"
    };
    
    return {
      id: i + 1,
      username: `user${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      avatarUrl: Math.random() > 0.3 ? `https://i.pravatar.cc/150?u=${i + 1}` : undefined,
      role: i === 0 ? "admin" : roles[Math.floor(Math.random() * roles.length)],
      status: i < 3 ? "active" : status,
      dateJoined,
      lastActive,
      isVerified,
      reportCount,
      violationCount,
      trustScore,
      activeWarnings,
      muteExpiresAt,
      banExpiresAt,
      ipAddresses,
      // Enhanced user management fields
      verificationLevel: verificationLevels[Math.floor(Math.random() * verificationLevels.length)],
      accountLockReason,
      loginAttempts,
      suspiciousActivityFlags,
      riskScore,
      accountAgeInDays,
      region,
      preferredLanguage,
      contentSettings: Math.random() > 0.3 ? contentSettings : undefined
    };
  });
}

function generateMockReports(): UserReport[] {
  const statuses: UserReport["status"][] = ["pending", "in_review", "dismissed", "action_taken"];
  const reasons = [
    "Inappropriate behavior",
    "Harassment",
    "Spam",
    "Offensive language",
    "Impersonation",
    "Scam attempt",
    "Hate speech",
    "Threatening messages"
  ];
  
  return Array.from({ length: 10 }).map((_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const details = `Detailed report about the ${reason.toLowerCase()}. User sent multiple messages that violate our community guidelines.`;
    
    return {
      id: i + 1,
      userId: Math.floor(Math.random() * 10) + 1,
      reporterId: Math.floor(Math.random() * 10) + 1,
      reason,
      details,
      status,
      createdAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
      reporterName: `reporter${Math.floor(Math.random() * 10) + 1}`,
      reportedUserName: `user${Math.floor(Math.random() * 10) + 1}`
    };
  });
}

function generateMockViolations(userId: number): UserViolation[] {
  if (userId % 5 === 0) return []; // Some users have no violations
  
  const types: UserViolation["type"][] = ["content", "behavior", "spam", "harassment", "other"];
  const severities: UserViolation["severity"][] = ["low", "medium", "high"];
  const actions = [
    "Warning issued",
    "Content removed",
    "Temporarily muted",
    "Banned for 24 hours",
    "Permanent ban"
  ];
  
  return Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const actionTaken = actions[Math.floor(Math.random() * actions.length)];
    
    return {
      id: i + 1,
      userId,
      type,
      description: `Violation of community guidelines: ${type}. Multiple reports received.`,
      severity,
      status: Math.random() > 0.3 ? "active" : "archived",
      createdAt: new Date(Date.now() - Math.random() * 180 * 86400000).toISOString(),
      actionTaken,
      moderatorId: Math.floor(Math.random() * 3) + 1,
      moderatorName: `moderator${Math.floor(Math.random() * 3) + 1}`
    };
  });
}

function generateMockActions(userId: number): UserModerationAction[] {
  // Actions correspond to the number of violations
  const actionCount = userId % 5 === 0 ? 0 : Math.floor(Math.random() * 4) + 1;
  if (actionCount === 0) return [];
  
  const actionTypes: UserModerationAction["action"][] = [
    "flag", "mute", "unmute", "ban", "unban", "global_ban", "warning", "note"
  ];
  const reasons = [
    "Violation of community guidelines",
    "Spam activity detected",
    "Harassment of other users",
    "Inappropriate content",
    "Multiple violations",
    "User requested behavior review"
  ];
  const durations = ["24h", "3d", "7d", "30d", "permanent"];
  
  return Array.from({ length: actionCount }).map((_, i) => {
    const action = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const createdAt = new Date(Date.now() - Math.random() * 180 * 86400000).toISOString();
    
    let duration, expiresAt, status: UserModerationAction["status"] = "active";
    
    if (action === "mute" || action === "ban") {
      duration = durations[Math.floor(Math.random() * durations.length)];
      
      if (duration !== "permanent") {
        const durationMs = duration === "24h" ? 86400000 :
                         duration === "3d" ? 3 * 86400000 :
                         duration === "7d" ? 7 * 86400000 :
                         30 * 86400000;
        
        const expiryDate = new Date(new Date(createdAt).getTime() + durationMs);
        expiresAt = expiryDate.toISOString();
        
        // Determine if expired
        if (expiryDate < new Date()) {
          status = "expired";
        }
      }
    } else if (["unmute", "unban"].includes(action)) {
      status = "revoked";
    }
    
    return {
      id: i + 1,
      userId,
      username: `user${userId}`,
      action,
      reason,
      duration,
      createdAt,
      expiresAt,
      moderatorId: Math.floor(Math.random() * 3) + 1,
      moderatorName: `moderator${Math.floor(Math.random() * 3) + 1}`,
      status
    };
  });
}

function generateMockNotes(userId: number): ModeratorNote[] {
  // Some users have no notes
  if (userId % 4 === 0) return [];
  
  const noteCount = Math.floor(Math.random() * 3) + 1;
  
  return Array.from({ length: noteCount }).map((_, i) => {
    const createdAt = new Date(Date.now() - Math.random() * 180 * 86400000).toISOString();
    let content = "";
    
    // Generate some realistic moderator notes
    switch (Math.floor(Math.random() * 5)) {
      case 0:
        content = "User contacted support about account issues. Verified identity and provided assistance.";
        break;
      case 1:
        content = "Multiple reports against this user were reviewed and found to be without merit. Keeping an eye on the situation.";
        break;
      case 2:
        content = "User has a history of borderline content that doesn't quite violate guidelines but has been warned about community standards.";
        break;
      case 3:
        content = "Previous violations were discussed with the user, who promised to adhere to guidelines going forward.";
        break;
      case 4:
        content = "User has requested verification of their account. Documentation has been submitted and is pending review.";
        break;
    }
    
    return {
      id: i + 1,
      userId,
      content,
      createdAt,
      moderatorId: Math.floor(Math.random() * 3) + 1,
      moderatorName: `moderator${Math.floor(Math.random() * 3) + 1}`
    };
  });
}

function generateMockSecurityLogs(userId: number): SecurityLog[] {
  // Generate a random number of security logs
  const logCount = Math.floor(Math.random() * 10) + 3;
  
  const eventTypes: SecurityLog["eventType"][] = [
    "login", "logout", "password_change", "email_change", 
    "2fa_enabled", "2fa_disabled", "account_locked", 
    "account_unlocked", "password_reset", "suspicious_activity"
  ];
  
  const devices = [
    "Windows 11 / Chrome 121.0.1234",
    "macOS 14.3 / Safari 17.3",
    "iOS 17.4 / Mobile Safari",
    "Android 14 / Chrome Mobile 121.0.1234",
    "Ubuntu 22.04 / Firefox 123.0"
  ];
  
  const locations = [
    "London, United Kingdom",
    "New York, United States",
    "Paris, France",
    "Tokyo, Japan",
    "Sydney, Australia",
    "Unknown Location"
  ];
  
  return Array.from({ length: logCount }).map((_, i) => {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const timestamp = new Date(Date.now() - Math.random() * 90 * 86400000).toISOString();
    const success = Math.random() > 0.2;
    const ipAddress = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    const deviceInfo = devices[Math.floor(Math.random() * devices.length)];
    const location = Math.random() > 0.2 ? locations[Math.floor(Math.random() * (locations.length - 1))] : locations[locations.length - 1];
    
    // Generate details based on event type
    let details = "";
    if (!success) {
      details = eventType === "login" ? "Incorrect password entered" : "Failed authentication";
    } else if (eventType === "suspicious_activity") {
      details = "Login from unusual location";
    } else if (eventType === "account_locked") {
      details = "Too many failed login attempts";
    }
    
    return {
      id: i + 1,
      userId,
      eventType,
      timestamp,
      ipAddress,
      deviceInfo,
      location,
      success,
      details: details || undefined
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateMockDevices(userId: number): UserDevice[] {
  // Generate a random number of devices (1-5)
  const deviceCount = Math.floor(Math.random() * 4) + 1;
  
  const deviceNames = [
    "iPhone 14 Pro",
    "iPhone 15",
    "MacBook Pro",
    "iPad Air",
    "Windows PC",
    "Surface Pro",
    "Google Pixel 7",
    "Samsung Galaxy S23",
    "Dell XPS Laptop",
    "Lenovo ThinkPad"
  ];
  
  const browsers = [
    "Chrome 121.0.1234",
    "Safari 17.3",
    "Firefox 123.0",
    "Edge 121.0.2345",
    "Chrome Mobile 121.0.1234",
    "Mobile Safari"
  ];
  
  const operatingSystems = [
    "Windows 11",
    "macOS 14.3",
    "iOS 17.4",
    "Android 14",
    "iPadOS 17.4",
    "Ubuntu 22.04"
  ];
  
  return Array.from({ length: deviceCount }).map((_, i) => {
    const deviceName = deviceNames[Math.floor(Math.random() * deviceNames.length)];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const operatingSystem = operatingSystems[Math.floor(Math.random() * operatingSystems.length)];
    const lastUsed = new Date(Date.now() - Math.random() * 30 * 86400000).toISOString();
    const ipAddress = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    const isTrusted = Math.random() > 0.2;
    const isCurrentDevice = i === 0; // Make the first device the current one
    
    return {
      id: i + 1,
      deviceId: `device_${Math.random().toString(36).substring(2, 15)}`,
      deviceName,
      browser,
      operatingSystem,
      lastUsed,
      ipAddress,
      isTrusted,
      isCurrentDevice
    };
  }).sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
}

function generateMockLocations(userId: number): UserLocation[] {
  // Generate a random number of locations (1-4)
  const locationCount = Math.floor(Math.random() * 3) + 1;
  
  const countries = [
    "United Kingdom",
    "United States",
    "France",
    "Germany",
    "Japan",
    "Australia",
    "Canada",
    "Italy",
    "Spain",
    "Brazil"
  ];
  
  const cities: Record<string, string[]> = {
    "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh"],
    "United States": ["New York", "Los Angeles", "Chicago", "San Francisco"],
    "France": ["Paris", "Lyon", "Marseille", "Nice"],
    "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt"],
    "Japan": ["Tokyo", "Osaka", "Kyoto", "Fukuoka"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth"],
    "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary"],
    "Italy": ["Rome", "Milan", "Florence", "Venice"],
    "Spain": ["Madrid", "Barcelona", "Valencia", "Seville"],
    "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"]
  };
  
  const frequencies: UserLocation["frequency"][] = ["rare", "occasional", "frequent"];
  
  return Array.from({ length: locationCount }).map((_, i) => {
    const country = countries[Math.floor(Math.random() * countries.length)];
    const city = cities[country][Math.floor(Math.random() * cities[country].length)];
    const lastSeen = new Date(Date.now() - Math.random() * 90 * 86400000).toISOString();
    const ipAddress = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
    const isSuspicious = Math.random() < 0.2;
    
    return {
      id: i + 1,
      country,
      city,
      region: city, // Use city as region for simplicity
      lastSeen,
      ipAddress,
      frequency,
      isSuspicious
    };
  }).sort((a, b) => {
    // Sort by frequency first (frequent > occasional > rare)
    const freqOrder = { frequent: 3, occasional: 2, rare: 1 };
    if (freqOrder[a.frequency] !== freqOrder[b.frequency]) {
      return freqOrder[b.frequency] - freqOrder[a.frequency];
    }
    // Then by last seen date
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });
}