import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Calendar,
  Users,
  Target,
  Gift,
  Percent,
  DollarSign,
  Tag,
  Mail,
  Share2,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Star,
  Award,
  Sparkles
} from 'lucide-react';

interface Campaign {
  id: number;
  name: string;
  type: 'discount' | 'promotion' | 'email' | 'social' | 'seasonal';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
  description: string;
  startDate: string;
  endDate: string;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  targetAudience: string[];
  createdAt: string;
  updatedAt: string;
}

interface DiscountCode {
  id: number;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrderValue?: number;
  maxUses?: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableProducts: string[];
  createdAt: string;
}

interface VendorMarketingToolsProps {
  vendorId: number;
}

export default function VendorMarketingTools({ vendorId }: VendorMarketingToolsProps) {
  const { toast } = useToast();
  const { formatPriceFromGBP } = useCurrency();
  const queryClient = useQueryClient();

  // State management
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'promotion' as const,
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    targetAudience: ''
  });

  // Discount form state
  const [discountForm, setDiscountForm] = useState({
    code: '',
    type: 'percentage' as const,
    value: '',
    minOrderValue: '',
    maxUses: '',
    startDate: '',
    endDate: '',
    applicableProducts: ''
  });

  // Fetch campaigns
  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['/api/vendors/campaigns', vendorId],
    queryFn: async () => {
      const response = await apiRequest(`/api/vendors/campaigns?vendorId=${vendorId}`);
      return response;
    },
    enabled: !!vendorId
  });

  // Fetch discount codes
  const { data: discountCodes, isLoading: loadingDiscounts } = useQuery({
    queryKey: ['/api/vendors/discounts', vendorId],
    queryFn: async () => {
      const response = await apiRequest(`/api/vendors/discounts?vendorId=${vendorId}`);
      return response;
    },
    enabled: !!vendorId
  });

  // Campaign mutation
  const campaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const url = editingCampaign 
        ? `/api/vendors/campaigns/${editingCampaign.id}`
        : '/api/vendors/campaigns';
      const method = editingCampaign ? 'PUT' : 'POST';
      
      return await apiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campaignData, vendorId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/campaigns'] });
      setShowCampaignDialog(false);
      resetCampaignForm();
      toast({
        title: "Success",
        description: editingCampaign ? "Campaign updated successfully" : "Campaign created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save campaign",
        variant: "destructive"
      });
    }
  });

  // Discount mutation
  const discountMutation = useMutation({
    mutationFn: async (discountData: any) => {
      const url = editingDiscount 
        ? `/api/vendors/discounts/${editingDiscount.id}`
        : '/api/vendors/discounts';
      const method = editingDiscount ? 'PUT' : 'POST';
      
      return await apiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...discountData, vendorId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/discounts'] });
      setShowDiscountDialog(false);
      resetDiscountForm();
      toast({
        title: "Success",
        description: editingDiscount ? "Discount code updated successfully" : "Discount code created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save discount code",
        variant: "destructive"
      });
    }
  });

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      type: 'promotion',
      description: '',
      startDate: '',
      endDate: '',
      budget: '',
      targetAudience: ''
    });
    setEditingCampaign(null);
  };

  const resetDiscountForm = () => {
    setDiscountForm({
      code: '',
      type: 'percentage',
      value: '',
      minOrderValue: '',
      maxUses: '',
      startDate: '',
      endDate: '',
      applicableProducts: ''
    });
    setEditingDiscount(null);
  };

  const openEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      type: campaign.type,
      description: campaign.description,
      startDate: campaign.startDate.split('T')[0],
      endDate: campaign.endDate.split('T')[0],
      budget: campaign.budget?.toString() || '',
      targetAudience: campaign.targetAudience.join(', ')
    });
    setShowCampaignDialog(true);
  };

  const openEditDiscount = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setDiscountForm({
      code: discount.code,
      type: discount.type,
      value: discount.value.toString(),
      minOrderValue: discount.minOrderValue?.toString() || '',
      maxUses: discount.maxUses?.toString() || '',
      startDate: discount.startDate.split('T')[0],
      endDate: discount.endDate.split('T')[0],
      applicableProducts: discount.applicableProducts.join(', ')
    });
    setShowDiscountDialog(true);
  };

  const handleCampaignSubmit = () => {
    const campaignData = {
      name: campaignForm.name,
      type: campaignForm.type,
      description: campaignForm.description,
      startDate: campaignForm.startDate,
      endDate: campaignForm.endDate,
      budget: campaignForm.budget ? parseFloat(campaignForm.budget) : undefined,
      targetAudience: campaignForm.targetAudience.split(',').map(item => item.trim()).filter(Boolean)
    };

    campaignMutation.mutate(campaignData);
  };

  const handleDiscountSubmit = () => {
    const discountData = {
      code: discountForm.code.toUpperCase(),
      type: discountForm.type,
      value: parseFloat(discountForm.value),
      minOrderValue: discountForm.minOrderValue ? parseFloat(discountForm.minOrderValue) : undefined,
      maxUses: discountForm.maxUses ? parseInt(discountForm.maxUses) : undefined,
      startDate: discountForm.startDate,
      endDate: discountForm.endDate,
      applicableProducts: discountForm.applicableProducts.split(',').map(item => item.trim()).filter(Boolean)
    };

    discountMutation.mutate(discountData);
  };

  const generateDiscountCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDiscountForm(prev => ({ ...prev, code: result }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      paused: { label: 'Paused', variant: 'outline' as const, icon: AlertTriangle },
      completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
      expired: { label: 'Expired', variant: 'destructive' as const, icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCampaignTypeIcon = (type: string) => {
    const typeIcons = {
      discount: Gift,
      promotion: Megaphone,
      email: Mail,
      social: Share2,
      seasonal: Star
    };

    const Icon = typeIcons[type as keyof typeof typeIcons] || Megaphone;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing Tools</h2>
          <p className="text-muted-foreground">
            Create and manage promotional campaigns and discount codes
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetDiscountForm}>
                <Percent className="mr-2 h-4 w-4" />
                Create Discount
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetCampaignForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Marketing Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.filter((c: Campaign) => c.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discountCodes?.filter((d: DiscountCode) => d.isActive).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.reduce((sum: number, c: Campaign) => sum + (c.impressions || 0), 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPriceFromGBP(campaigns?.reduce((sum: number, c: Campaign) => sum + (c.revenue || 0), 0) || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="discounts">Discount Codes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns?.map((campaign: Campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">{campaign.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCampaignTypeIcon(campaign.type)}
                          <span className="capitalize">{campaign.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(campaign.startDate).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            to {new Date(campaign.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{campaign.clicks?.toLocaleString() || 0} clicks</div>
                          <div className="text-muted-foreground">
                            {campaign.conversions || 0} conversions
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatPriceFromGBP(campaign.spent || 0)}</div>
                          <div className="text-muted-foreground">
                            of {formatPriceFromGBP(campaign.budget || 0)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditCampaign(campaign)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {(!campaigns || campaigns.length === 0) && (
                <div className="text-center py-8">
                  <Megaphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first marketing campaign to boost sales
                  </p>
                  <Button onClick={() => setShowCampaignDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discount Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountCodes?.map((discount: DiscountCode) => (
                    <TableRow key={discount.id}>
                      <TableCell>
                        <div className="font-mono font-medium">{discount.code}</div>
                      </TableCell>
                      <TableCell className="capitalize">{discount.type.replace('_', ' ')}</TableCell>
                      <TableCell>
                        {discount.type === 'percentage' 
                          ? `${discount.value}%`
                          : discount.type === 'fixed'
                          ? formatPriceFromGBP(discount.value)
                          : 'Free Shipping'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{discount.usedCount} used</div>
                          {discount.maxUses && (
                            <div className="text-muted-foreground">
                              of {discount.maxUses} max
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(discount.startDate).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            to {new Date(discount.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                          {discount.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDiscount(discount)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {(!discountCodes || discountCodes.length === 0) && (
                <div className="text-center py-8">
                  <Gift className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No discount codes yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create discount codes to attract customers and boost sales
                  </p>
                  <Button onClick={() => setShowDiscountDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Discount Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Marketing Analytics</h3>
                <p className="text-muted-foreground">
                  Detailed marketing performance analytics will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaignName">Campaign Name *</Label>
                <Input
                  id="campaignName"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="campaignType">Campaign Type</Label>
                <Select
                  value={campaignForm.type}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="campaignDescription">Description</Label>
              <Textarea
                id="campaignDescription"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your campaign"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={campaignForm.endDate}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="budget">Budget (GBP)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={campaignForm.budget}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="targetAudience">Target Audience (comma-separated)</Label>
              <Input
                id="targetAudience"
                value={campaignForm.targetAudience}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="new customers, returning customers, etc."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCampaignSubmit} disabled={campaignMutation.isPending}>
              {campaignMutation.isPending ? 'Saving...' : (editingCampaign ? 'Update' : 'Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDiscount ? 'Edit Discount Code' : 'Create New Discount Code'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountCode">Discount Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="discountCode"
                    value={discountForm.code}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="DISCOUNT10"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateDiscountCode}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={discountForm.type}
                  onValueChange={(value) => setDiscountForm(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="discountValue">
                  Value {discountForm.type === 'percentage' ? '(%)' : '(GBP)'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  step={discountForm.type === 'percentage' ? '1' : '0.01'}
                  value={discountForm.value}
                  onChange={(e) => setDiscountForm(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={discountForm.type === 'percentage' ? '10' : '5.00'}
                  disabled={discountForm.type === 'free_shipping'}
                />
              </div>
              <div>
                <Label htmlFor="minOrder">Min Order Value (GBP)</Label>
                <Input
                  id="minOrder"
                  type="number"
                  step="0.01"
                  value={discountForm.minOrderValue}
                  onChange={(e) => setDiscountForm(prev => ({ ...prev, minOrderValue: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={discountForm.maxUses}
                  onChange={(e) => setDiscountForm(prev => ({ ...prev, maxUses: e.target.value }))}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountStartDate">Start Date</Label>
                <Input
                  id="discountStartDate"
                  type="date"
                  value={discountForm.startDate}
                  onChange={(e) => setDiscountForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="discountEndDate">End Date</Label>
                <Input
                  id="discountEndDate"
                  type="date"
                  value={discountForm.endDate}
                  onChange={(e) => setDiscountForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="applicableProducts">Applicable Products (comma-separated SKUs)</Label>
              <Input
                id="applicableProducts"
                value={discountForm.applicableProducts}
                onChange={(e) => setDiscountForm(prev => ({ ...prev, applicableProducts: e.target.value }))}
                placeholder="Leave empty for all products, or enter SKUs: ABC123, DEF456"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDiscountSubmit} disabled={discountMutation.isPending}>
              {discountMutation.isPending ? 'Saving...' : (editingDiscount ? 'Update' : 'Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}