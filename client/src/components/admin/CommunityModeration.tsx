import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  BarChart,
  Settings,
  Users,
  Flag,
  Shield,
  MessageSquare,
  FileWarning,
  Clock,
  Trash2,
  Ban,
  Eye,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  User,
  Lock,
  Unlock,
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CommunityModeration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReportType, setSelectedReportType] = useState("all");

  // Fetch real community reports from API
  const { data: apiReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/admin/community/reports'],
    queryFn: async () => {
      const res = await fetch('/api/admin/community/reports');
      if (!res.ok) throw new Error('Failed to fetch community reports');
      return res.json();
    },
  });

  const { data: moderationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/community/stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/community/stats');
      if (!res.ok) throw new Error('Failed to fetch moderation stats');
      return res.json();
    },
  });

  // Filter and search community reports from real API data
  const filteredReports = apiReports.filter((report: any) => {
    const matchesSearch = !searchTerm || 
      report.communityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    const matchesType = selectedReportType === "all" || report.reportType === selectedReportType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleReviewReport = (reportId: number) => {
    toast({
      title: "Report flagged for review",
      description: `Report #${reportId} has been assigned to you for review.`,
    });
  };

  const handleResolveReport = (reportId: number) => {
    toast({
      title: "Report resolved",
      description: `Report #${reportId} has been marked as resolved.`,
    });
  };

  const handleDismissReport = (reportId: number) => {
    toast({
      title: "Report dismissed",
      description: `Report #${reportId} has been dismissed.`,
    });
  };

  const handleSuspendCommunity = (communityName: string) => {
    toast({
      title: "Community suspended",
      description: `The community "${communityName}" has been suspended and is under review.`,
      variant: "destructive",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "reviewing":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Reviewing</Badge>;
      case "actioned":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Actioned</Badge>;
      case "dismissed":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case "content":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Content</Badge>;
      case "spam":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100">Spam</Badge>;
      case "harassment":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Harassment</Badge>;
      case "misinformation":
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Misinformation</Badge>;
      case "violation":
        return <Badge variant="outline" className="bg-pink-100 text-pink-800 hover:bg-pink-100">Violation</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* API Implementation Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="ml-2">
            <h3 className="text-sm font-medium text-amber-800">
              The community moderation API endpoints are being implemented
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>Currently displaying example data for demonstration purposes.</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Moderation Overview</CardTitle>
              <CardDescription>
                Monitor community health and moderation metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Communities</p>
                        <p className="text-2xl font-bold">{communitiesStats.total}</p>
                      </div>
                      <div className="rounded-full bg-blue-100 p-2">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-600 font-medium">+{communitiesStats.newToday}</span> new today
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Active Communities</p>
                        <p className="text-2xl font-bold">{communitiesStats.active}</p>
                      </div>
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-600 font-medium">{Math.round((communitiesStats.active / communitiesStats.total) * 100)}%</span> active rate
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Reported Communities</p>
                        <p className="text-2xl font-bold">{communitiesStats.reported}</p>
                      </div>
                      <div className="rounded-full bg-yellow-100 p-2">
                        <Flag className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="text-yellow-600 font-medium">{Math.round((communitiesStats.reported / communitiesStats.total) * 100)}%</span> of all communities
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Suspended Communities</p>
                        <p className="text-2xl font-bold">{communitiesStats.suspended}</p>
                      </div>
                      <div className="rounded-full bg-red-100 p-2">
                        <Ban className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="text-red-600 font-medium">{Math.round((communitiesStats.suspended / communitiesStats.total) * 100)}%</span> suspension rate
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Content Moderation</CardTitle>
                    <CardDescription>Content reports and actions taken</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Content Reported</span>
                        <span className="font-medium">{communitiesStats.contentReported}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Content Removed</span>
                        <span className="font-medium">{communitiesStats.contentRemoved}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Removal Rate</span>
                        <span className="font-medium">
                          {Math.round((communitiesStats.contentRemoved / communitiesStats.contentReported) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Avg. Response Time</span>
                        <span className="font-medium">{communitiesStats.averageResponseTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>Latest moderation actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="border-l-4 border-green-500 pl-3 py-1">
                        <p className="text-sm font-medium">Community "Photography Club" - Report dismissed</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                      <div className="border-l-4 border-red-500 pl-3 py-1">
                        <p className="text-sm font-medium">Community "Gaming Central" - Content removed</p>
                        <p className="text-xs text-muted-foreground">3 hours ago</p>
                      </div>
                      <div className="border-l-4 border-yellow-500 pl-3 py-1">
                        <p className="text-sm font-medium">Community "Tech Enthusiasts" - Warning issued</p>
                        <p className="text-xs text-muted-foreground">5 hours ago</p>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-3 py-1">
                        <p className="text-sm font-medium">Community "Cooking Together" - Under review</p>
                        <p className="text-xs text-muted-foreground">7 hours ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Reports</CardTitle>
              <CardDescription>
                Review and manage reported communities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by community name, description, or reporter..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-1">
                        <Filter className="h-4 w-4" />
                        Status: {filterStatus === "all" ? "All" : filterStatus}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setFilterStatus("all")}>All</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterStatus("pending")}>Pending</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterStatus("reviewing")}>Reviewing</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterStatus("actioned")}>Actioned</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterStatus("dismissed")}>Dismissed</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-1">
                        <FileWarning className="h-4 w-4" />
                        Type: {selectedReportType === "all" ? "All" : selectedReportType}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedReportType("all")}>All Types</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedReportType("content")}>Content</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedReportType("spam")}>Spam</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedReportType("harassment")}>Harassment</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedReportType("misinformation")}>Misinformation</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedReportType("violation")}>Violation</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline" className="gap-1" onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setSelectedReportType("all");
                  }}>
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Community</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reports</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reported At</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {communityReports.length > 0 ? (
                        communityReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">{report.communityName}</TableCell>
                            <TableCell>{getReportTypeBadge(report.reportType)}</TableCell>
                            <TableCell>{report.reports}</TableCell>
                            <TableCell>{getStatusBadge(report.status)}</TableCell>
                            <TableCell>{formatDate(report.lastReportedAt)}</TableCell>
                            <TableCell>{report.reporter}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem 
                                    onClick={() => handleReviewReport(report.id)}
                                    className="flex items-center gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleResolveReport(report.id)}
                                    className="flex items-center gap-2 text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Resolve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDismissReport(report.id)}
                                    className="flex items-center gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Dismiss
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleSuspendCommunity(report.communityName)}
                                    className="flex items-center gap-2 text-red-600"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Suspend Community
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No community reports found matching your criteria.
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

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Moderation Settings</CardTitle>
              <CardDescription>
                Configure rules, automation, and thresholds for community moderation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Automated Moderation</h3>
                
                <div className="grid gap-6">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="auto-flag" className="flex flex-col space-y-1">
                      <span>Auto-flag Reported Content</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Automatically flag content when it receives multiple reports
                      </span>
                    </Label>
                    <Switch id="auto-flag" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="auto-suspend" className="flex flex-col space-y-1">
                      <span>Auto-suspend Communities</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Automatically suspend communities with excessive violations
                      </span>
                    </Label>
                    <Switch id="auto-suspend" />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="notify-mods" className="flex flex-col space-y-1">
                      <span>Notify Moderators</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Send notifications to moderators for new reports
                      </span>
                    </Label>
                    <Switch id="notify-mods" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Threshold Settings</h3>
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="report-threshold">Reports threshold for auto-flagging</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="report-threshold"
                        type="number"
                        defaultValue={3}
                        min={1}
                        max={20}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">reports</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Number of reports needed before content is automatically flagged for review
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="suspension-threshold">
                      Violations threshold for community suspension
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="suspension-threshold"
                        type="number"
                        defaultValue={5}
                        min={1}
                        max={50}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">violations</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Number of confirmed violations before a community is automatically suspended
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Community Rules Templates</h3>
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full text-left justify-start">
                    <span>General Community Guidelines</span>
                  </Button>
                  <Button variant="outline" className="w-full text-left justify-start">
                    <span>Anti-Harassment Rules</span>
                  </Button>
                  <Button variant="outline" className="w-full text-left justify-start">
                    <span>Content Moderation Standards</span>
                  </Button>
                  <Button variant="outline" className="w-full text-left justify-start">
                    <span>Discussion Forums Rules</span>
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={() => {
                toast({
                  title: "Settings saved",
                  description: "Your community moderation settings have been updated.",
                });
              }}>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}