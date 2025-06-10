import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  PremiumContentPlacement 
} from '@/components/video/PremiumContentPlacement';
import { 
  TimelineAdPlacement 
} from '@/components/social/TimelineAdPlacement';
import { 
  AreaChart, 
  BarChart, 
  Bar, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { 
  Loader2, 
  LayoutDashboard, 
  TrendingUp, 
  Percent, 
  Users, 
  BarChart2, 
  PieChart as PieChartIcon, 
  Settings, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Pause, 
  Play, 
  Plus
} from 'lucide-react';

// Campaign status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { label: string, variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success' }> = {
    active: { label: 'Active', variant: 'success' },
    scheduled: { label: 'Scheduled', variant: 'secondary' },
    completed: { label: 'Completed', variant: 'outline' },
    paused: { label: 'Paused', variant: 'default' },
  };
  
  const config = statusMap[status] || { label: status, variant: 'default' };
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

// Sample chart data - in a real app, this would come from the API
const performanceData = [
  { date: 'Apr 20', views: 321, clicks: 120, conversions: 12 },
  { date: 'Apr 21', views: 420, clicks: 145, conversions: 15 },
  { date: 'Apr 22', views: 492, clicks: 189, conversions: 22 },
  { date: 'Apr 23', views: 562, clicks: 205, conversions: 28 },
  { date: 'Apr 24', views: 590, clicks: 215, conversions: 31 },
  { date: 'Apr 25', views: 623, clicks: 230, conversions: 35 },
  { date: 'Apr 26', views: 710, clicks: 279, conversions: 42 },
];

const audienceData = [
  { name: '18-24', value: 25 },
  { name: '25-34', value: 40 },
  { name: '35-44', value: 20 },
  { name: '45+', value: 15 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface Campaign {
  id: number;
  title: string;
  type: string;
  status: string;
  spend: number;
  budget: number;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface SocialConsoleProps {
  initialTab?: string;
}

export function SocialConsole({ initialTab = 'dashboard' }: SocialConsoleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [placementType, setPlacementType] = useState<'premium' | 'timeline'>('premium');
  
  // Fetch campaigns data
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['/api/ads/campaigns'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/ads/campaigns');
      return res.json();
    },
    // This is just for demonstration - in a real app, we would handle error states properly
    enabled: !!user && user.isVendor,
  });
  
  // Mutation to update campaign status
  const updateCampaignStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest('PATCH', `/api/ads/campaigns/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign updated",
        description: "The campaign status has been updated successfully",
      });
      
      // Invalidate campaigns query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/ads/campaigns'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating the campaign",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to delete a campaign
  const deleteCampaign = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/ads/campaigns/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign deleted",
        description: "The campaign has been deleted successfully",
      });
      
      // Invalidate campaigns query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/ads/campaigns'] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting the campaign",
        variant: "destructive"
      });
    }
  });
  
  // Check if we have campaigns data to display
  const hasCampaigns = !isLoading && campaigns && campaigns.length > 0;
  
  // Handle campaign status change
  const handleStatusChange = (id: number, status: string) => {
    updateCampaignStatus.mutate({ id, status });
  };
  
  // Handle campaign deletion
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      deleteCampaign.mutate(id);
    }
  };
  
  // Calculate summary metrics
  const getSummaryMetrics = () => {
    if (!hasCampaigns) {
      return {
        totalSpend: 0,
        totalBudget: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        activeCampaigns: 0
      };
    }
    
    return campaigns.reduce(
      (acc, campaign) => {
        acc.totalSpend += campaign.spend;
        acc.totalBudget += campaign.budget;
        acc.impressions += campaign.impressions;
        acc.clicks += campaign.clicks;
        acc.conversions += campaign.conversions;
        if (campaign.status === 'active') {
          acc.activeCampaigns += 1;
        }
        return acc;
      },
      {
        totalSpend: 0,
        totalBudget: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        activeCampaigns: 0
      }
    );
  };
  
  // Get campaign metrics for summaries
  const metrics = getSummaryMetrics();
  
  // Format large numbers with k/m suffix
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Calculate CTR
  const calculateCTR = () => {
    if (metrics.impressions === 0) return '0.0%';
    return ((metrics.clicks / metrics.impressions) * 100).toFixed(1) + '%';
  };
  
  // Calculate Conversion Rate
  const calculateConversionRate = () => {
    if (metrics.clicks === 0) return '0.0%';
    return ((metrics.conversions / metrics.clicks) * 100).toFixed(1) + '%';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Social+ Console</h2>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Configure how your premium content appears across the platform
              </DialogDescription>
            </DialogHeader>
            
            <Tabs 
              defaultValue="premium" 
              value={placementType} 
              onValueChange={(value) => setPlacementType(value as 'premium' | 'timeline')}
              className="mt-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="premium">Premium Content Placement</TabsTrigger>
                <TabsTrigger value="timeline">Timeline Ad Placement</TabsTrigger>
              </TabsList>
              
              <TabsContent value="premium" className="mt-4">
                <PremiumContentPlacement 
                  onComplete={() => setShowCreateDialog(false)} 
                />
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-4">
                <TimelineAdPlacement 
                  onComplete={() => setShowCreateDialog(false)} 
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <TrendingUp className="mr-2 h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart2 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="audience">
            <Users className="mr-2 h-4 w-4" />
            Audience
          </TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">
                    {metrics.activeCampaigns}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <PieChartIcon className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">
                    £{metrics.totalSpend.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Percent className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">{calculateCTR()}</div>
                  <p className="text-sm text-muted-foreground">Click-Through Rate</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">
                    {formatNumber(metrics.impressions)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Impressions</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>
                  Views, clicks and conversions over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={performanceData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="views" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="clicks" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                      <Area type="monotone" dataKey="conversions" stackId="3" stroke="#ffc658" fill="#ffc658" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>
                  Budget utilization for current campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : hasCampaigns ? (
                  <div className="space-y-4">
                    {campaigns
                      .filter(campaign => campaign.status === 'active')
                      .slice(0, 3)
                      .map(campaign => (
                        <div key={campaign.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{campaign.title}</span>
                            <span>
                              £{campaign.spend.toFixed(2)} / £{campaign.budget.toFixed(2)}
                            </span>
                          </div>
                          <Progress 
                            value={(campaign.spend / campaign.budget) * 100} 
                            className="h-2" 
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{((campaign.spend / campaign.budget) * 100).toFixed(0)}% spent</span>
                            <span>{campaign.type}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No active campaigns</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(true)} 
                      className="mt-4"
                    >
                      Create Your First Campaign
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Campaigns</CardTitle>
              <CardDescription>
                Manage your premium content and timeline ad placements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : hasCampaigns ? (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Spent</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.title}</TableCell>
                          <TableCell>{campaign.type}</TableCell>
                          <TableCell>
                            <StatusBadge status={campaign.status} />
                          </TableCell>
                          <TableCell>£{campaign.budget.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span>£{campaign.spend.toFixed(2)}</span>
                              <Progress 
                                value={(campaign.spend / campaign.budget) * 100} 
                                className="h-1.5" 
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>Start: {new Date(campaign.startDate).toLocaleDateString()}</div>
                              <div>End: {new Date(campaign.endDate).toLocaleDateString()}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {/* Edit functionality */}}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {campaign.status === 'active' ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, 'paused')}>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </DropdownMenuItem>
                                ) : campaign.status === 'paused' ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, 'active')}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Resume
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(campaign.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Campaigns Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first campaign to promote your premium content
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key metrics for all campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" name="Views" fill="#8884d8" />
                      <Bar dataKey="clicks" name="Clicks" fill="#82ca9d" />
                      <Bar dataKey="conversions" name="Conversions" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>
                  From impressions to conversions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Impressions</span>
                      <span>{formatNumber(metrics.impressions)}</span>
                    </div>
                    <Progress value={100} className="h-3 bg-blue-100" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Clicks</span>
                      <span>{formatNumber(metrics.clicks)} ({calculateCTR()} CTR)</span>
                    </div>
                    <Progress 
                      value={(metrics.clicks / Math.max(1, metrics.impressions)) * 100} 
                      className="h-3 bg-green-100" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Conversions</span>
                      <span>
                        {formatNumber(metrics.conversions)} ({calculateConversionRate()} CR)
                      </span>
                    </div>
                    <Progress 
                      value={(metrics.conversions / Math.max(1, metrics.clicks)) * 100} 
                      className="h-3 bg-amber-100" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Audience Tab */}
        <TabsContent value="audience" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>
                  Audience breakdown by age group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={audienceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {audienceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Audience Insights</CardTitle>
                <CardDescription>
                  Engagement metrics by audience segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead>Impressions</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>Conv. Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>New Users</TableCell>
                      <TableCell>12.5K</TableCell>
                      <TableCell>2.8%</TableCell>
                      <TableCell>0.9%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Returning Users</TableCell>
                      <TableCell>31.2K</TableCell>
                      <TableCell>4.2%</TableCell>
                      <TableCell>1.5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Content Creators</TableCell>
                      <TableCell>5.7K</TableCell>
                      <TableCell>5.3%</TableCell>
                      <TableCell>2.1%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Active Shoppers</TableCell>
                      <TableCell>8.9K</TableCell>
                      <TableCell>6.1%</TableCell>
                      <TableCell>3.4%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SocialConsole;