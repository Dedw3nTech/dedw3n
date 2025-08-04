import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  BarChart3, 
  Calendar,
  DollarSign,
  Users,
  Target,
  TrendingUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

// Types
interface Advertisement {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl: string;
  placement: 'marketplace' | 'community' | 'dating' | 'all';
  type: 'banner' | 'sidebar' | 'popup' | 'native' | 'video';
  status: 'active' | 'paused' | 'expired' | 'pending' | 'rejected';
  advertiserName: string;
  advertiserEmail: string;
  advertiserPhone?: string;
  advertiserCompany?: string;
  advertiserAddress?: string;
  budget: string;
  spentAmount: string;
  costPerClick?: string;
  costPerImpression?: string;
  startDate: string;
  endDate: string;
  targetAudience?: any;
  keywords?: any;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface AdvertisementStats {
  total: number;
  active: number;
  pending: number;
  totalBudget: number;
  totalSpent: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { variant: any; className: string }> = {
    active: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
    paused: { variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600' },
    expired: { variant: 'destructive', className: 'bg-red-500 hover:bg-red-600' },
    pending: { variant: 'outline', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    rejected: { variant: 'destructive', className: 'bg-gray-500 hover:bg-gray-600' },
  };

  const config = variants[status] || variants.pending;
  return (
    <Badge variant={config.variant} className={config.className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const PlacementBadge = ({ placement }: { placement: string }) => {
  const colors: Record<string, string> = {
    marketplace: 'bg-blue-100 text-blue-800',
    community: 'bg-green-100 text-green-800',
    dating: 'bg-pink-100 text-pink-800',
    all: 'bg-purple-100 text-purple-800',
  };

  return (
    <Badge className={`${colors[placement] || colors.all} border-0`}>
      {placement.charAt(0).toUpperCase() + placement.slice(1)}
    </Badge>
  );
};

export default function AdvertisementManagement() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    placement: '',
    page: 1,
    limit: 10,
  });
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const queryClient = useQueryClient();

  // Fetch advertisements
  const { data: advertisementsData, isLoading } = useQuery({
    queryKey: ['/api/admin/advertisements', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      return apiRequest(`/api/admin/advertisements?${params.toString()}`);
    },
  });

  // Fetch stats
  const { data: stats } = useQuery<AdvertisementStats>({
    queryKey: ['/api/admin/advertisements/stats'],
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/admin/advertisements/${id}/status`, 'PATCH', { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements/stats'] });
      toast({
        title: 'Success',
        description: 'Advertisement status updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update advertisement status',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/advertisements/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements/stats'] });
      toast({
        title: 'Success',
        description: 'Advertisement deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete advertisement',
        variant: 'destructive',
      });
    },
  });

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this advertisement?')) {
      deleteMutation.mutate(id);
    }
  };

  const advertisements = advertisementsData?.advertisements || [];
  const pagination = advertisementsData?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advertisement Management</h1>
          <p className="text-muted-foreground">
            Manage platform advertisements across marketplace, community, and dating sections
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Advertisement
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Ads</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">£{stats.totalBudget.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">£{stats.totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search advertisements..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.placement}
              onValueChange={(value) => setFilters({ ...filters, placement: value, page: 1 })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Placement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Placements</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="dating">Dating</SelectItem>
                <SelectItem value="all">All Pages</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Advertisements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Advertisements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading advertisements...</div>
          ) : advertisements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No advertisements found
            </div>
          ) : (
            <div className="space-y-4">
              {advertisements.map((ad: Advertisement) => (
                <div key={ad.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{ad.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        by {ad.advertiserName} • {ad.advertiserCompany}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ad.status} />
                      <PlacementBadge placement={ad.placement} />
                    </div>
                  </div>
                  
                  {ad.description && (
                    <p className="text-sm text-muted-foreground">{ad.description}</p>
                  )}
                  
                  {ad.imageUrl && (
                    <img 
                      src={ad.imageUrl} 
                      alt={ad.title}
                      className="w-32 h-20 object-cover rounded border"
                    />
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Budget:</span>
                      <p className="font-medium">£{parseFloat(ad.budget).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Spent:</span>
                      <p className="font-medium">£{parseFloat(ad.spentAmount).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Impressions:</span>
                      <p className="font-medium">{ad.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Clicks:</span>
                      <p className="font-medium">{ad.clicks.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAd(ad);
                          setShowAnalytics(true);
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Analytics
                      </Button>
                      {ad.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(ad.id, 'paused')}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                      ) : ad.status === 'paused' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(ad.id, 'active')}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Activate
                        </Button>
                      ) : null}
                      {ad.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(ad.id, 'active')}
                            className="text-green-600 hover:text-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(ad.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(ad.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Advertisement Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Advertisement</DialogTitle>
            <DialogDescription>
              Create a new advertisement for the platform
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Advertisement creation form would go here
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advertisement Analytics</DialogTitle>
            <DialogDescription>
              Performance metrics for {selectedAd?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Analytics charts and data would go here
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}