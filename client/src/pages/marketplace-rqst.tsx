import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useView } from "@/hooks/use-view";
import { useMarketType } from "@/hooks/use-market-type";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Search, MessageSquare, Clock, MapPin, Users, Plus, Filter, SortAsc } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";

interface RequestItem {
  id: number;
  title: string;
  description: string;
  category: string;
  budget: number;
  currency: string;
  location: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  userRequests?: number;
  user?: {
    id: number;
    name: string;
    avatar?: string;
  };
}

export default function MarketplaceRQST() {
  const { setView } = useView();
  const { user } = useAuth();
  const { setMarketType } = useMarketType();
  const { selectedCurrency, formatPrice } = useCurrency();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Set page title and market type
  usePageTitle({ title: 'RQST Marketplace - Request & Find Products' });

  useEffect(() => {
    setView("marketplace");
    setMarketType("rqst");
  }, [setView, setMarketType]);

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedUrgency, setSelectedUrgency] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showCreateRequest, setShowCreateRequest] = useState(false);

  // Create request form state
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    location: "",
    urgency: "medium" as 'low' | 'medium' | 'high'
  });

  // Translation texts
  const rqstTexts = [
    "RQST Marketplace",
    "Request & Find Products",
    "Post requests for products you need and let vendors find you",
    "Create Request",
    "Search requests...",
    "All Categories",
    "All Urgency Levels",
    "Newest First",
    "Budget (High to Low)",
    "Budget (Low to High)",
    "Most Popular",
    "Electronics",
    "Fashion",
    "Home & Garden",
    "Automotive",
    "Services",
    "Other",
    "Low Priority",
    "Medium Priority",
    "High Priority",
    "Open",
    "In Progress", 
    "Completed",
    "Cancelled",
    "Post Your Request",
    "What are you looking for?",
    "Request Title",
    "Describe what you need...",
    "Request Description",
    "Select Category",
    "Budget Amount",
    "Your Location",
    "Request Priority",
    "Cancel",
    "Post Request",
    "Respond to Request",
    "View Details",
    "Budget:",
    "Location:",
    "Priority:",
    "Posted:",
    "Responses:",
    "Status:",
    "No requests found",
    "Try adjusting your search or filters",
    "Be the first to post a request!",
    "Loading requests...",
    "Request posted successfully!",
    "Your request is now live and vendors can respond to it.",
    "Failed to post request",
    "Please try again later."
  ];

  const { translations } = useMasterBatchTranslation(rqstTexts);
  
  const t = (text: string): string => {
    if (Array.isArray(translations)) {
      const index = rqstTexts.indexOf(text);
      return index !== -1 ? translations[index] || text : text;
    }
    return text;
  };

  // Mock data for requests (in real app, this would come from API)
  const mockRequests: RequestItem[] = [
    {
      id: 1,
      title: "Looking for Gaming Laptop",
      description: "Need a high-performance gaming laptop with RTX 4070 or better. Budget flexible for the right specs.",
      category: "Electronics",
      budget: 1500,
      currency: "GBP",
      location: "London, UK",
      urgency: "medium",
      status: "open",
      createdAt: "2025-07-30T10:00:00Z",
      userRequests: 5,
      user: { id: 1, name: "John Smith" }
    },
    {
      id: 2,
      title: "Vintage Wedding Dress",
      description: "Searching for a vintage 1960s style wedding dress, size 10-12. Preferably lace details.",
      category: "Fashion",
      budget: 800,
      currency: "GBP",
      location: "Manchester, UK",
      urgency: "high",
      status: "open",
      createdAt: "2025-07-29T15:30:00Z",
      userRequests: 12,
      user: { id: 2, name: "Sarah Johnson" }
    },
    {
      id: 3,
      title: "Professional Photography Services",
      description: "Need photographer for corporate event on August 15th. Must have portfolio and professional equipment.",
      category: "Services",
      budget: 500,
      currency: "GBP",
      location: "Birmingham, UK",
      urgency: "high",
      status: "in_progress",
      createdAt: "2025-07-28T09:15:00Z",
      userRequests: 8,
      user: { id: 3, name: "Mike Wilson" }
    }
  ];

  // Fetch categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    staleTime: 300000, // 5 minutes
  });

  // Filter and sort requests
  const filteredRequests = mockRequests
    .filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || request.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesUrgency = selectedUrgency === "all" || request.urgency === selectedUrgency;
      return matchesSearch && matchesCategory && matchesUrgency;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "budget-high":
          return b.budget - a.budget;
        case "budget-low":
          return a.budget - b.budget;
        case "popular":
          return (b.userRequests || 0) - (a.userRequests || 0);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleCreateRequest = () => {
    if (!user) {
      toast({
        title: t("Authentication Required"),
        description: t("Please log in to create a request"),
        variant: "destructive"
      });
      setLocation('/auth');
      return;
    }

    if (!newRequest.title || !newRequest.description || !newRequest.category || !newRequest.budget) {
      toast({
        title: t("Missing Information"), 
        description: t("Please fill in all required fields"),
        variant: "destructive"
      });
      return;
    }

    // In real app, this would make API call
    toast({
      title: t("Request posted successfully!"),
      description: t("Your request is now live and vendors can respond to it.")
    });

    // Reset form
    setNewRequest({
      title: "",
      description: "",
      category: "",
      budget: "",
      location: "",
      urgency: "medium"
    });
    setShowCreateRequest(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">{t("RQST Marketplace")}</h1>
        <p className="text-xl text-gray-600 mb-6">{t("Request & Find Products")}</p>
        <p className="text-gray-500 mb-8">{t("Post requests for products you need and let vendors find you")}</p>
        
        <Dialog open={showCreateRequest} onOpenChange={setShowCreateRequest}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-black hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              {t("Create Request")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("Post Your Request")}</DialogTitle>
              <DialogDescription>{t("What are you looking for?")}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t("Request Title")}</label>
                <Input
                  placeholder={t("What are you looking for?")}
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({...prev, title: e.target.value}))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">{t("Request Description")}</label>
                <Textarea
                  placeholder={t("Describe what you need...")}
                  value={newRequest.description}
                  onChange={(e) => setNewRequest(prev => ({...prev, description: e.target.value}))}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("Select Category")}</label>
                  <Select 
                    value={newRequest.category} 
                    onValueChange={(value) => setNewRequest(prev => ({...prev, category: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select Category")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">{t("Electronics")}</SelectItem>
                      <SelectItem value="fashion">{t("Fashion")}</SelectItem>
                      <SelectItem value="home-garden">{t("Home & Garden")}</SelectItem>
                      <SelectItem value="automotive">{t("Automotive")}</SelectItem>
                      <SelectItem value="services">{t("Services")}</SelectItem>
                      <SelectItem value="other">{t("Other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("Budget Amount")} (£)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newRequest.budget}
                    onChange={(e) => setNewRequest(prev => ({...prev, budget: e.target.value}))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("Your Location")}</label>
                  <Input
                    placeholder="City, Country"
                    value={newRequest.location}
                    onChange={(e) => setNewRequest(prev => ({...prev, location: e.target.value}))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("Request Priority")}</label>
                  <Select 
                    value={newRequest.urgency} 
                    onValueChange={(value: 'low' | 'medium' | 'high') => setNewRequest(prev => ({...prev, urgency: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("Low Priority")}</SelectItem>
                      <SelectItem value="medium">{t("Medium Priority")}</SelectItem>
                      <SelectItem value="high">{t("High Priority")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateRequest(false)}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleCreateRequest} className="bg-black hover:bg-gray-800">
                {t("Post Request")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("Search requests...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("All Categories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Categories")}</SelectItem>
            <SelectItem value="electronics">{t("Electronics")}</SelectItem>
            <SelectItem value="fashion">{t("Fashion")}</SelectItem>
            <SelectItem value="home & garden">{t("Home & Garden")}</SelectItem>
            <SelectItem value="automotive">{t("Automotive")}</SelectItem>
            <SelectItem value="services">{t("Services")}</SelectItem>
            <SelectItem value="other">{t("Other")}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("All Urgency Levels")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Urgency Levels")}</SelectItem>
            <SelectItem value="high">{t("High Priority")}</SelectItem>
            <SelectItem value="medium">{t("Medium Priority")}</SelectItem>
            <SelectItem value="low">{t("Low Priority")}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("Newest First")}</SelectItem>
            <SelectItem value="budget-high">{t("Budget (High to Low)")}</SelectItem>
            <SelectItem value="budget-low">{t("Budget (Low to High)")}</SelectItem>
            <SelectItem value="popular">{t("Most Popular")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg line-clamp-2">{request.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={`${getUrgencyColor(request.urgency)} text-white text-xs`}>
                    {t(`${request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)} Priority`)}
                  </Badge>
                  <Badge className={`${getStatusColor(request.status)} text-white text-xs`}>
                    {t(request.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-600 mb-4 line-clamp-3">{request.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("Budget:")} £{request.budget.toLocaleString()}</span>
                  <Badge variant="outline">{request.category}</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{request.location}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>{t("Posted:")} {formatTimeAgo(request.createdAt)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <span>{t("Responses:")} {request.userRequests}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                {t("View Details")}
              </Button>
              <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                <MessageSquare className="h-3 w-3 mr-1" />
                Sell
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <MessageSquare className="h-16 w-16 mx-auto text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t("No requests found")}</h3>
          <p className="text-gray-500 mb-6">{t("Try adjusting your search or filters")}</p>
          <Button onClick={() => setShowCreateRequest(true)} className="bg-black hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            {t("Be the first to post a request!")}
          </Button>
        </div>
      )}
    </div>
  );
}