import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Globe, 
  Building, 
  Phone, 
  Mail, 
  UserPlus,
  Activity,
  Award,
  CheckCircle,
  Clock,
  AlertCircle,
  PoundSterling
} from "lucide-react";

interface AffiliatePartner {
  id: number;
  userId: number;
  affiliateCode: string;
  partnerName: string;
  businessName?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  status: 'active' | 'pending' | 'suspended' | 'terminated';
  commissionRate: number;
  totalReferrals: number;
  totalEarnings: number;
  totalPaid: number;
  pendingEarnings: number;
  lastPaymentDate?: string;
  approvedAt?: string;
  createdAt: string;
}

interface AffiliateReferral {
  id: number;
  affiliateId: number;
  referredUserId: number;
  referralCode: string;
  status: string;
  firstPurchaseAmount?: number;
  totalPurchaseAmount: number;
  totalCommissionEarned: number;
  createdAt: string;
  referredUser: {
    username: string;
    name: string;
    email: string;
  };
}

interface AffiliateEarning {
  id: number;
  earningType: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
}

export default function AffiliatePartnership() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Translatable texts
  const texts = useMemo(() => [
    "Affiliate Partnership Dashboard",
    "Apply to Become Partner",
    "Partner Details",
    "Performance Metrics",
    "Commission Tracking",
    "Referral Management",
    "Payment History",
    "Overview",
    "Applications",
    "Referrals",
    "Earnings",
    "Payments",
    "Partner Name",
    "Business Name",
    "Contact Email",
    "Contact Phone",
    "Website",
    "Description",
    "Specialization",
    "Submit Application",
    "Total Referrals",
    "Total Earnings",
    "Pending Earnings",
    "Total Paid",
    "Commission Rate",
    "Partner Status",
    "Member Since",
    "Last Payment",
    "Generate Referral Link",
    "Share Partnership",
    "Active",
    "Pending",
    "Suspended",
    "Terminated",
    "Bronze",
    "Silver", 
    "Gold",
    "Platinum",
    "Diamond"
  ], []);

  const { translations } = useMasterBatchTranslation(texts, 'high');

  const t = useMemo(() => ({
    title: translations[0] || "Affiliate Partnership Dashboard",
    applyToBecome: translations[1] || "Apply to Become Partner",
    partnerDetails: translations[2] || "Partner Details",
    performanceMetrics: translations[3] || "Performance Metrics",
    commissionTracking: translations[4] || "Commission Tracking",
    referralManagement: translations[5] || "Referral Management",
    paymentHistory: translations[6] || "Payment History",
    overview: translations[7] || "Overview",
    applications: translations[8] || "Applications",
    referrals: translations[9] || "Referrals",
    earnings: translations[10] || "Earnings",
    payments: translations[11] || "Payments",
    partnerName: translations[12] || "Partner Name",
    businessName: translations[13] || "Business Name",
    contactEmail: translations[14] || "Contact Email",
    contactPhone: translations[15] || "Contact Phone",
    website: translations[16] || "Website",
    description: translations[17] || "Description",
    specialization: translations[18] || "Specialization",
    submitApplication: translations[19] || "Submit Application",
    totalReferrals: translations[20] || "Total Referrals",
    totalEarnings: translations[21] || "Total Earnings",
    pendingEarnings: translations[22] || "Pending Earnings",
    totalPaid: translations[23] || "Total Paid",
    commissionRate: translations[24] || "Commission Rate",
    partnerStatus: translations[25] || "Partner Status",
    memberSince: translations[26] || "Member Since",
    lastPayment: translations[27] || "Last Payment",
    generateLink: translations[28] || "Generate Referral Link",
    sharePartnership: translations[29] || "Share Partnership",
    active: translations[30] || "Active",
    pending: translations[31] || "Pending",
    suspended: translations[32] || "Suspended",
    terminated: translations[33] || "Terminated",
    bronze: translations[34] || "Bronze",
    silver: translations[35] || "Silver",
    gold: translations[36] || "Gold",
    platinum: translations[37] || "Platinum",
    diamond: translations[38] || "Diamond"
  }), [translations]);

  // Form states
  const [formData, setFormData] = useState({
    partnerName: '',
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
    specialization: ''
  });

  // Auto-populate form data from user profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        partnerName: user.name || user.username || '',
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        website: user.website || '',
        businessName: user.businessName || user.company || ''
      }));
    }
  }, [user]);

  // Fetch affiliate partner data
  const { data: affiliatePartner, isLoading: partnerLoading } = useQuery<AffiliatePartner>({
    queryKey: ['/api/affiliate-partnership/profile'],
    enabled: !!user,
  });

  // Fetch referrals data
  const { data: referrals = [], isLoading: referralsLoading } = useQuery<AffiliateReferral[]>({
    queryKey: ['/api/affiliate-partnership/referrals'],
    enabled: !!affiliatePartner,
  });

  // Fetch earnings data
  const { data: earnings = [], isLoading: earningsLoading } = useQuery<AffiliateEarning[]>({
    queryKey: ['/api/affiliate-partnership/earnings'],
    enabled: !!affiliatePartner,
  });

  // Create affiliate partner application
  const createPartnerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('/api/affiliate-partnership/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your affiliate partnership application has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate-partnership/profile'] });
      setFormData({
        partnerName: '',
        businessName: '',
        contactEmail: user?.email || '',
        contactPhone: '',
        website: '',
        description: '',
        specialization: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate referral link
  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/affiliate/generate-link', {
        method: 'POST',
      });
    },
    onSuccess: (data: { referralLink: string }) => {
      navigator.clipboard.writeText(data.referralLink);
      toast({
        title: "Referral Link Generated",
        description: "Your referral link has been copied to clipboard.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPartnerMutation.mutate(formData);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'suspended': return 'destructive';  
      case 'terminated': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-amber-600 bg-amber-50';
      case 'silver': return 'text-gray-600 bg-gray-50';
      case 'gold': return 'text-yellow-600 bg-yellow-50';
      case 'platinum': return 'text-blue-600 bg-blue-50';
      case 'diamond': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the affiliate partnership program.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted-foreground">
          Join our affiliate program to earn commissions by referring new users and vendors to our platform.
        </p>
      </div>

      {!affiliatePartner ? (
        // Application Form
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t.applyToBecome}
            </CardTitle>
            <CardDescription>
              Fill out the form below to apply for our affiliate partnership program.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="partnerName">{t.partnerName} *</Label>
                  <Input
                    id="partnerName"
                    value={formData.partnerName}
                    onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    disabled={!!formData.partnerName && (user?.name || user?.username)}
                    className={!!formData.partnerName && (user?.name || user?.username) ? "bg-gray-100 text-gray-600" : ""}
                    required
                  />
                  {!!formData.partnerName && (user?.name || user?.username) && (
                    <p className="text-xs text-muted-foreground mt-1">Auto-filled from your profile</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="businessName">{t.businessName}</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    disabled={!!formData.businessName && (user?.businessName || user?.company)}
                    className={!!formData.businessName && (user?.businessName || user?.company) ? "bg-gray-100 text-gray-600" : ""}
                  />
                  {!!formData.businessName && (user?.businessName || user?.company) && (
                    <p className="text-xs text-muted-foreground mt-1">Auto-filled from your profile</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contactEmail">{t.contactEmail} *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    disabled={!!formData.contactEmail && user?.email}
                    className={!!formData.contactEmail && user?.email ? "bg-gray-100 text-gray-600" : ""}
                    required
                  />
                  {!!formData.contactEmail && user?.email && (
                    <p className="text-xs text-muted-foreground mt-1">Auto-filled from your profile</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contactPhone">{t.contactPhone}</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    disabled={!!formData.contactPhone && user?.phone}
                    className={!!formData.contactPhone && user?.phone ? "bg-gray-100 text-gray-600" : ""}
                  />
                  {!!formData.contactPhone && user?.phone && (
                    <p className="text-xs text-muted-foreground mt-1">Auto-filled from your profile</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="website">{t.website}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={!!formData.website && user?.website}
                    className={!!formData.website && user?.website ? "bg-gray-100 text-gray-600" : ""}
                  />
                  {!!formData.website && user?.website && (
                    <p className="text-xs text-muted-foreground mt-1">Auto-filled from your profile</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="specialization">{t.specialization}</Label>
                  <Select value={formData.specialization} onValueChange={(value) => setFormData({ ...formData, specialization: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="logistics">Logistics</SelectItem>
                      <SelectItem value="content">Content Creation</SelectItem>
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">{t.description}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Tell us about your background and why you'd be a great affiliate partner..."
                />
              </div>
              <Button 
                type="submit" 
                disabled={createPartnerMutation.isPending}
                className="w-full md:w-auto"
              >
                {createPartnerMutation.isPending ? "Submitting..." : t.submitApplication}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        // Partner Dashboard
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t.overview}</TabsTrigger>
            <TabsTrigger value="referrals">{t.referrals}</TabsTrigger>
            <TabsTrigger value="earnings">{t.earnings}</TabsTrigger>
            <TabsTrigger value="payments">{t.payments}</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Status and Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t.partnerStatus}</p>
                      <Badge variant={getStatusBadgeVariant(affiliatePartner.status)} className="mt-1">
                        {t[affiliatePartner.status as keyof typeof t] || affiliatePartner.status}
                      </Badge>
                    </div>
                    <div className={`p-2 rounded-full ${getTierColor(affiliatePartner.tier)}`}>
                      <Award className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t[affiliatePartner.tier as keyof typeof t]} Tier
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t.totalReferrals}</p>
                      <p className="text-2xl font-bold">{affiliatePartner.totalReferrals}</p>
                    </div>
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t.totalEarnings}</p>
                      <p className="text-2xl font-bold">£{affiliatePartner.totalEarnings.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t.pendingEarnings}</p>
                      <p className="text-2xl font-bold">£{affiliatePartner.pendingEarnings.toFixed(2)}</p>
                    </div>
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Partner Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {t.partnerDetails}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Partner Code</p>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">{affiliatePartner.affiliateCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.commissionRate}</p>
                    <p className="text-lg font-semibold">{affiliatePartner.commissionRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.memberSince}</p>
                    <p>{formatDistanceToNow(new Date(affiliatePartner.createdAt), { addSuffix: true })}</p>
                  </div>
                  {affiliatePartner.lastPaymentDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t.lastPayment}</p>
                      <p>{formatDistanceToNow(new Date(affiliatePartner.lastPaymentDate), { addSuffix: true })}</p>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => generateLinkMutation.mutate()}
                    disabled={generateLinkMutation.isPending}
                    className="mr-3"
                  >
                    {generateLinkMutation.isPending ? "Generating..." : t.generateLink}
                  </Button>
                  <Button variant="outline">
                    {t.sharePartnership}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.referralManagement}</CardTitle>
                <CardDescription>Track your referred users and their activity</CardDescription>
              </CardHeader>
              <CardContent>
                {referralsLoading ? (
                  <div className="text-center py-8">Loading referrals...</div>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No referrals yet. Start sharing your referral link to earn commissions!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-50 rounded-full">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{referral.referredUser.name}</p>
                            <p className="text-sm text-muted-foreground">@{referral.referredUser.username}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">£{referral.totalCommissionEarned.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {referral.totalPurchaseAmount > 0 
                              ? `£${referral.totalPurchaseAmount.toFixed(2)} spent`
                              : 'No purchases yet'
                            }
                          </p>
                          <Badge variant={referral.status === 'active' ? 'default' : 'secondary'}>
                            {referral.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.commissionTracking}</CardTitle>
                <CardDescription>View your commission earnings and transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                {earningsLoading ? (
                  <div className="text-center py-8">Loading earnings...</div>
                ) : earnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No earnings yet. Start referring users to begin earning commissions!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {earnings.map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-50 rounded-full">
                            <PoundSterling className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{earning.earningType.replace('_', ' ')}</p>
                            {earning.description && (
                              <p className="text-sm text-muted-foreground">{earning.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(earning.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">+£{earning.amount.toFixed(2)}</p>
                          <Badge variant={
                            earning.status === 'paid' ? 'default' : 
                            earning.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {earning.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.paymentHistory}</CardTitle>
                <CardDescription>View your payment history and upcoming payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Payment history will be available once you start earning commissions.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Partner Information</CardTitle>
                <CardDescription>Your affiliate partnership details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t.partnerName}</Label>
                    <p className="text-sm mt-1">{affiliatePartner.partnerName}</p>
                  </div>
                  {affiliatePartner.businessName && (
                    <div>
                      <Label>{t.businessName}</Label>
                      <p className="text-sm mt-1">{affiliatePartner.businessName}</p>
                    </div>
                  )}
                  <div>
                    <Label>{t.contactEmail}</Label>
                    <p className="text-sm mt-1">{affiliatePartner.contactEmail}</p>
                  </div>
                  {affiliatePartner.contactPhone && (
                    <div>
                      <Label>{t.contactPhone}</Label>
                      <p className="text-sm mt-1">{affiliatePartner.contactPhone}</p>
                    </div>
                  )}
                  {affiliatePartner.website && (
                    <div>
                      <Label>{t.website}</Label>
                      <p className="text-sm mt-1">
                        <a href={affiliatePartner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {affiliatePartner.website}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
                {affiliatePartner.description && (
                  <div>
                    <Label>{t.description}</Label>
                    <p className="text-sm mt-1">{affiliatePartner.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}