import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';

interface CommissionPeriod {
  id: number;
  month: number;
  year: number;
  totalSales: string;
  totalTransactions: number;
  commissionTier: 'standard' | 'premium' | 'enterprise';
  commissionRate: string;
  commissionAmount: string;
  status: 'pending' | 'overdue' | 'paid';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

interface VendorCommissionData {
  vendor: {
    id: number;
    storeName: string;
    accountStatus: string;
    paymentFailureCount: number;
    hasSalesManager: boolean;
    salesManagerName?: string;
    salesManagerId?: string;
  };
  commissionPeriods: CommissionPeriod[];
  pendingPayments: CommissionPeriod[];
  paymentMethods: any[];
  recentActions: any[];
  totals: {
    totalCommissionOwed: number;
    totalCommissionPaid: number;
  };
}

interface VendorCommissionDashboardProps {
  vendorId: number;
}

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'enterprise':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'premium':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'standard':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTierDescription = (tier: string) => {
  switch (tier) {
    case 'enterprise':
      return '£50,000+ monthly sales - 12.5% commission';
    case 'premium':
      return '£10,000+ monthly sales - 10% commission';
    case 'standard':
      return 'Under £10,000 monthly sales - 10% commission';
    default:
      return 'Commission rate varies based on sales volume';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-4 w-4" />;
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'overdue':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export default function VendorCommissionDashboard({ vendorId }: VendorCommissionDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Commission Tier System texts
  const commissionTexts = [
    "Commission Tier System",
    "Your commission rate is determined by your monthly sales volume",
    "Standard Tier",
    "Basic commission rate", 
    "Sales Manager",
    "Sales Manager Fee",
    "Account",
    "Failed to load commission dashboard. Please try again later.",
    "Payment Link Created",
    "Redirecting to payment page...",
    "Error",
    "Failed to create payment link",
    "Total Owed",
    "Total Paid",
    "Total Commission",
    "Commission Overview",
    "Recent Periods",
    "Pending Payments",
    "Payment History",
    "Account Status",
    "Payment Methods",
    "Due Date",
    "Amount",
    "Status",
    "Actions",
    "Pay Now",
    "View Details"
  ];
  
  const { translations } = useUnifiedTranslation(commissionTexts);

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/commission-dashboard`],
    enabled: !!vendorId,
  });

  const createPaymentLinkMutation = useMutation({
    mutationFn: async (periodId: number) => {
      const response = await apiRequest('POST', `/api/commission-periods/${periodId}/payment-link`);
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe payment page
      if (data.clientSecret) {
        toast({
          title: translations?.["Payment Link Created"] || "Payment Link Created",
          description: translations?.["Redirecting to payment page..."] || "Redirecting to payment page...",
        });
        // In a real implementation, you would redirect to Stripe Checkout
        console.log('Payment Intent created:', data);
      }
    },
    onError: (error: any) => {
      toast({
        title: translations?.["Error"] || "Error",
        description: translations?.["Failed to create payment link"] || "Failed to create payment link",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {translations?.["Failed to load commission dashboard. Please try again later."] || "Failed to load commission dashboard. Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }

  const commissionData = data as VendorCommissionData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        </div>
        {commissionData.vendor.accountStatus !== 'active' && (
          <Badge variant="destructive">
            Account {commissionData.vendor.accountStatus}
          </Badge>
        )}
      </div>

      {/* Commission Tier Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {translations?.["Commission Tier System"] || "Commission Tier System"}
          </CardTitle>
          <CardDescription className="text-xs">
            {translations?.["Your commission rate is determined by your monthly sales volume"] || "Your commission rate is determined by your monthly sales volume"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {!commissionData.vendor.hasSalesManager ? (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{translations?.["Standard Tier"] || "Standard Tier"}</h4>
                  <Badge className="bg-gray-100 text-gray-800">10%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {translations?.["Basic commission rate"] || "Basic commission rate"}
                </p>
              </div>
            ) : (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{translations?.["Sales Manager"] || "Sales Manager"}</h4>
                  <Badge className="bg-blue-100 text-blue-800">10% + 2.5%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {translations?.["10% commission + 2.5% Sales Manager Fee"] || "10% commission + 2.5% Sales Manager Fee"}
                </p>
                {commissionData.vendor.salesManagerName && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>{translations?.["Sales Manager"] || "Sales Manager"}:</strong> {commissionData.vendor.salesManagerName}
                    </p>
                    {commissionData.vendor.salesManagerId && (
                      <p className="text-xs text-muted-foreground">
                        <strong>{translations?.["ID"] || "ID"}:</strong> {commissionData.vendor.salesManagerId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations?.["Total Owed"] || "Total Owed"}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{commissionData.totals.totalCommissionOwed.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissionData.pendingPayments.length} {translations?.["pending payment(s)"] || "pending payment(s)"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations?.["Total Paid"] || "Total Paid"}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{commissionData.totals.totalCommissionPaid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {translations?.["All-time commission payments"] || "All-time commission payments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translations?.["Account Status"] || "Account Status"}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {commissionData.vendor.accountStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissionData.vendor.paymentFailureCount} {translations?.["payment failure(s)"] || "payment failure(s)"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments */}
      {commissionData.pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {translations?.["Pending Payments"] || "Pending Payments"}
            </CardTitle>
            <CardDescription>
              {translations?.["Commission payments that require your attention"] || "Commission payments that require your attention"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commissionData.pendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {format(new Date(payment.year, payment.month - 1), 'MMMM yyyy')}
                      </h4>
                      <Badge className={getTierColor(payment.commissionTier)}>
                        {payment.commissionTier} ({(parseFloat(payment.commissionRate) * 100).toFixed(1)}%)
                      </Badge>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sales: £{parseFloat(payment.totalSales).toFixed(2)} • 
                      Commission: £{parseFloat(payment.commissionAmount).toFixed(2)} • 
                      Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Button
                    onClick={() => createPaymentLinkMutation.mutate(payment.id)}
                    disabled={createPaymentLinkMutation.isPending}
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Commission History
          </CardTitle>
          <CardDescription>
            Your last 12 months of commission calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commissionData.commissionPeriods.map((period) => (
              <div key={period.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {format(new Date(period.year, period.month - 1), 'MMMM yyyy')}
                    </h4>
                    <Badge className={getTierColor(period.commissionTier)}>
                      {period.commissionTier}
                    </Badge>
                    <Badge className={getStatusColor(period.status)}>
                      {getStatusIcon(period.status)}
                      {period.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      Sales: £{parseFloat(period.totalSales).toFixed(2)} • 
                      Transactions: {period.totalTransactions} • 
                      Rate: {(parseFloat(period.commissionRate) * 100).toFixed(1)}%
                    </p>
                    <p>
                      Commission: £{parseFloat(period.commissionAmount).toFixed(2)} • 
                      Due: {format(new Date(period.dueDate), 'MMM dd, yyyy')}
                      {period.paidDate && ` • Paid: ${format(new Date(period.paidDate), 'MMM dd, yyyy')}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    £{parseFloat(period.commissionAmount).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(parseFloat(period.commissionRate) * 100).toFixed(1)}% rate
                  </div>
                </div>
              </div>
            ))}

            {commissionData.commissionPeriods.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No commission history available yet</p>
                <p className="text-sm">Commission calculations will appear here after your first sales</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}