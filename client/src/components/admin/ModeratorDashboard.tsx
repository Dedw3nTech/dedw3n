import React from "react";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileWarning,
  ImageOff,
  BookOpen,
  BookX,
  Flag,
  Activity,
  Zap,
  Bot,
  Lock,
  User,
  Filter,
  Calendar,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Mock data for the dashboard
const COLORS = ["#0088FE", "#00C49F", "#FF8042", "#FF0000", "#8884D8"];

const activityData = [
  { name: "Mon", content: 12, images: 5, reports: 8 },
  { name: "Tue", content: 19, images: 7, reports: 12 },
  { name: "Wed", content: 15, images: 4, reports: 9 },
  { name: "Thu", content: 18, images: 8, reports: 11 },
  { name: "Fri", content: 22, images: 10, reports: 14 },
  { name: "Sat", content: 14, images: 6, reports: 7 },
  { name: "Sun", content: 9, images: 3, reports: 5 },
];

const contentTypeData = [
  { name: "Posts", value: 45 },
  { name: "Comments", value: 35 },
  { name: "Images", value: 15 },
  { name: "Products", value: 10 },
  { name: "Profiles", value: 5 },
];

const flagReasonData = [
  { name: "Inappropriate", value: 30 },
  { name: "Spam", value: 25 },
  { name: "Harassment", value: 20 },
  { name: "Violence", value: 15 },
  { name: "Scam", value: 10 },
];

const recentActions = [
  {
    id: 1,
    action: "Rejected",
    contentType: "Post",
    reason: "Hate speech",
    moderator: "Admin",
    timestamp: "10 min ago",
  },
  {
    id: 2,
    action: "Approved",
    contentType: "Image",
    reason: "False report",
    moderator: "Admin",
    timestamp: "25 min ago",
  },
  {
    id: 3,
    action: "Added Term",
    contentType: "Block List",
    reason: "Profanity",
    moderator: "Admin",
    timestamp: "1 hour ago",
  },
  {
    id: 4,
    action: "Resolved",
    contentType: "Report",
    reason: "User harassment",
    moderator: "Admin",
    timestamp: "2 hours ago",
  },
];

type ModeratorDashboardProps = {
  timeRange?: string;
};

export default function ModeratorDashboard({ timeRange = "week" }: ModeratorDashboardProps) {
  // In a real implementation, this would fetch actual statistics from the API
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/moderation/stats", timeRange],
    queryFn: async () => {
      // Mock API response for UI development
      return {
        totalFlagged: 87,
        pendingReview: 32,
        resolvedToday: 24,
        autoModerated: 31,
        activityData,
        contentTypeData,
        flagReasonData,
        recentActions,
        aiAssistAccuracy: 87,
        averageResponseTime: 18, // minutes
      };
    },
  });

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Total Flagged</p>
                <h3 className="text-3xl font-bold">{stats.totalFlagged}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Flag className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Pending Review</p>
                <h3 className="text-3xl font-bold">{stats.pendingReview}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Resolved Today</p>
                <h3 className="text-3xl font-bold">{stats.resolvedToday}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Auto-Moderated</p>
                <h3 className="text-3xl font-bold">{stats.autoModerated}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Moderation Activity
            </CardTitle>
            <CardDescription>
              7-day moderation activity breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.activityData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="content" name="Flagged Content" fill="#8884d8" />
                  <Bar dataKey="images" name="Flagged Images" fill="#82ca9d" />
                  <Bar dataKey="reports" name="User Reports" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stats Charts */}
        <div className="col-span-1 grid grid-cols-1 gap-6">
          {/* Content Type Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-primary" />
                Flagged Content by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.contentTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.contentTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Flag Reasons Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Top Flag Reasons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.flagReasonData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.flagReasonData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistance Stats & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Assistance Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Moderation Assistant
            </CardTitle>
            <CardDescription>
              Performance metrics for automated content moderation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Accuracy */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">AI Suggestion Accuracy</span>
                <span className="text-sm font-medium">{stats.aiAssistAccuracy}%</span>
              </div>
              <Progress value={stats.aiAssistAccuracy} className="h-2" />
            </div>

            {/* Response Time */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Avg. Response Time</span>
                <span className="text-sm font-medium">{stats.averageResponseTime} min</span>
              </div>
              <Progress value={100 - (stats.averageResponseTime / 60) * 100} className="h-2" max={100} />
            </div>

            {/* AI Capability Breakdown */}
            <div className="space-y-3 pt-4">
              <h4 className="text-sm font-medium">AI Capabilities</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted rounded-md p-2 text-center">
                  <div className="flex justify-center mb-1">
                    <FileWarning className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className="text-xs font-medium">Text Analysis</span>
                </div>
                <div className="bg-muted rounded-md p-2 text-center">
                  <div className="flex justify-center mb-1">
                    <ImageOff className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className="text-xs font-medium">Image Analysis</span>
                </div>
                <div className="bg-muted rounded-md p-2 text-center">
                  <div className="flex justify-center mb-1">
                    <Filter className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className="text-xs font-medium">Content Filtering</span>
                </div>
                <div className="bg-muted rounded-md p-2 text-center">
                  <div className="flex justify-center mb-1">
                    <User className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className="text-xs font-medium">User Analysis</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Moderation Activity
            </CardTitle>
            <CardDescription>
              Latest actions taken by the moderation team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActions.map((action) => (
                <div key={action.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex-shrink-0">
                    {action.action === "Approved" ? (
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    ) : action.action === "Rejected" ? (
                      <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                    ) : action.action === "Added Term" ? (
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookX className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-amber-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{action.action}</span>
                        <Badge variant="outline" className="font-normal">
                          {action.contentType}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{action.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.reason} - by {action.moderator}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="text-sm text-muted-foreground w-full text-center">
              <a href="#" className="text-primary hover:underline">
                View all moderation activity
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}