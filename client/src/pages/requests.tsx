import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Plus, Search, Users, MessageCircle, Clock, CheckCircle, XCircle, UserPlus, Filter, RefreshCw } from 'lucide-react';

interface ProductRequest {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  maxPrice: number;
  currency: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'fulfilled' | 'expired' | 'cancelled';
  friendsOnly: boolean;
  localOnly: boolean;
  createdAt: string;
  expiresAt: string;
  user: {
    id: number;
    username: string;
    name: string;
    avatar?: string;
  };
  responseCount: number;
  isFriend?: boolean;
}

interface RequestResponse {
  id: number;
  requestId: number;
  userId: number;
  message: string;
  price?: number;
  productUrl?: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    name: string;
    avatar?: string;
  };
}

export default function RequestsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for request creation
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestCategory, setRequestCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const [showLocalOnly, setShowLocalOnly] = useState(false);

  // Define translatable texts
  const textsToTranslate = useMemo(() => [
    "Product Requests",
    "Create Request", 
    "Search requests...",
    "What are you looking for?",
    "Describe the product you need",
    "Category",
    "Maximum Price",
    "Urgency Level",
    "Friends Only",
    "Local Pickup Only",
    "Low",
    "Medium", 
    "High",
    "Submit Request",
    "Cancel",
    "Open",
    "Fulfilled",
    "Expired",
    "All Categories",
    "All Status",
    "All Urgency",
    "Filter",
    "Clear Filters",
    "Respond",
    "View Responses",
    "expires in",
    "responses",
    "Friend",
    "Local",
    "My Requests",
    "Browse Requests",
    "No requests found",
    "Create the first request to get started!"
  ], []);

  const { translations } = useMasterBatchTranslation(textsToTranslate);

  // Fetch product requests
  const { data: requests = [], isLoading, refetch } = useQuery<ProductRequest[]>({
    queryKey: ['/api/requests'],
    enabled: !!user,
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      category: string;
      maxPrice: number;
      urgency: string;
      friendsOnly: boolean;
      localOnly: boolean;
    }) => {
      const response = await apiRequest('POST', '/api/requests', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: translations[1] || "Create Request",
        description: "Your request has been created successfully!",
      });
      setShowCreateDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create request: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setRequestTitle('');
    setRequestDescription('');
    setRequestCategory('');
    setMaxPrice('');
    setUrgency('medium');
    setFriendsOnly(false);
    setLocalOnly(false);
  };

  const handleCreateRequest = () => {
    if (!requestTitle.trim() || !requestDescription.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: 'destructive',
      });
      return;
    }

    createRequestMutation.mutate({
      title: requestTitle,
      description: requestDescription,
      category: requestCategory || 'general',
      maxPrice: parseFloat(maxPrice) || 0,
      urgency,
      friendsOnly,
      localOnly,
    });
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      if (searchTerm && !request.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !request.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (categoryFilter && categoryFilter !== 'all' && request.category !== categoryFilter) return false;
      if (statusFilter && statusFilter !== 'all' && request.status !== statusFilter) return false;
      if (urgencyFilter && urgencyFilter !== 'all' && request.urgency !== urgencyFilter) return false;
      if (showFriendsOnly && !request.isFriend) return false;
      if (showLocalOnly && !request.localOnly) return false;
      return true;
    });
  }, [requests, searchTerm, categoryFilter, statusFilter, urgencyFilter, showFriendsOnly, showLocalOnly]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{translations[0] || "Product Requests"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please log in to view and create product requests.</p>
            <Button onClick={() => setLocation('/auth')} className="w-full">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{translations[0] || "Product Requests"}</h1>
            <p className="text-gray-600">Find products through community requests</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            {translations[1] || "Create Request"}
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={translations[2] || "Search requests..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={translations[18] || "All Categories"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations[18] || "All Categories"}</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="home">Home & Garden</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="automotive">Automotive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={translations[19] || "All Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations[19] || "All Status"}</SelectItem>
                  <SelectItem value="open">{translations[15] || "Open"}</SelectItem>
                  <SelectItem value="fulfilled">{translations[16] || "Fulfilled"}</SelectItem>
                  <SelectItem value="expired">{translations[17] || "Expired"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={translations[20] || "All Urgency"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations[20] || "All Urgency"}</SelectItem>
                  <SelectItem value="high">{translations[12] || "High"}</SelectItem>
                  <SelectItem value="medium">{translations[11] || "Medium"}</SelectItem>
                  <SelectItem value="low">{translations[10] || "Low"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="friends-filter"
                  checked={showFriendsOnly}
                  onCheckedChange={setShowFriendsOnly}
                />
                <Label htmlFor="friends-filter" className="text-sm">
                  {translations[8] || "Friends Only"}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="local-filter"
                  checked={showLocalOnly}
                  onCheckedChange={setShowLocalOnly}
                />
                <Label htmlFor="local-filter" className="text-sm">
                  {translations[9] || "Local Pickup Only"}
                </Label>
              </div>

              <Button variant="outline" size="sm" onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setUrgencyFilter('all');
                setShowFriendsOnly(false);
                setShowLocalOnly(false);
              }}>
                {translations[22] || "Clear Filters"}
              </Button>

              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requests Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">{translations[32] || "No requests found"}</h3>
              <p className="text-gray-600 mb-4">{translations[33] || "Create the first request to get started!"}</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {translations[1] || "Create Request"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {request.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{request.user.name}</p>
                        <p className="text-xs text-gray-500">@{request.user.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {request.isFriend && (
                        <Badge variant="secondary" className="text-xs">
                          {translations[27] || "Friend"}
                        </Badge>
                      )}
                      {request.localOnly && (
                        <Badge variant="secondary" className="text-xs">
                          {translations[28] || "Local"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold mb-2">{request.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {request.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {request.category}
                    </Badge>
                    <Badge className={`text-xs ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                      {request.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">
                      Max: £{request.maxPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {request.responseCount} {translations[26] || "responses"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                    <span>{translations[25] || "expires in"} {Math.ceil((new Date(request.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d</span>
                  </div>

                  <div className="flex gap-2">
                    {request.status === 'open' && request.userId !== user.id && (
                      <Button size="sm" className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {translations[23] || "Respond"}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1">
                      {translations[24] || "View Responses"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Request Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{translations[1] || "Create Request"}</DialogTitle>
              <DialogDescription>
                Describe what you're looking for and let the community help you find it.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  {translations[3] || "What are you looking for?"} *
                </Label>
                <Input
                  id="title"
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="e.g., iPhone 14 Pro Max"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  {translations[4] || "Describe the product you need"} *
                </Label>
                <Textarea
                  id="description"
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Provide details about condition, color, specific features, etc."
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    {translations[5] || "Category"}
                  </Label>
                  <Select value={requestCategory} onValueChange={setRequestCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxPrice" className="text-sm font-medium">
                    {translations[6] || "Maximum Price"} (£)
                  </Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    step="0.01"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="urgency" className="text-sm font-medium">
                  {translations[7] || "Urgency Level"}
                </Label>
                <Select value={urgency} onValueChange={(value: any) => setUrgency(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{translations[10] || "Low"}</SelectItem>
                    <SelectItem value="medium">{translations[11] || "Medium"}</SelectItem>
                    <SelectItem value="high">{translations[12] || "High"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="friends-only"
                    checked={friendsOnly}
                    onCheckedChange={setFriendsOnly}
                  />
                  <Label htmlFor="friends-only" className="text-sm">
                    {translations[8] || "Friends Only"}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="local-only"
                    checked={localOnly}
                    onCheckedChange={setLocalOnly}
                  />
                  <Label htmlFor="local-only" className="text-sm">
                    {translations[9] || "Local Pickup Only"}
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {translations[14] || "Cancel"}
              </Button>
              <Button 
                onClick={handleCreateRequest}
                disabled={createRequestMutation.isPending}
                className="bg-black text-white hover:bg-gray-800"
              >
                {createRequestMutation.isPending ? "Creating..." : (translations[13] || "Submit Request")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}