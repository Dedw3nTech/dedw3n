import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Calendar, CreditCard, Clock, Banknote, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useQuery } from '@tanstack/react-query';
import CommissionBillingPopup from './CommissionBillingPopup';

interface VendorBillingDashboardProps {
  vendorId: number;
}

interface BillingData {
  vendor: {
    id: number;
    storeName: string;
    accountStatus: string;
    paymentFailureCount: number;
  };
  pendingPayments: Array<{
    id: number;
    month: number;
    year: number;
    commissionAmount: string;
    dueDate: string;
    status: string;
  }>;
  recentPayments: Array<{
    id: number;
    month: number;
    year: number;
    commissionAmount: string;
    paidDate: string;
    paymentMethod: string;
  }>;
  totals: {
    totalPending: number;
    totalPaid: number;
    nextDueDate: string | null;
  };
}

export default function VendorBillingDashboard({ vendorId }: VendorBillingDashboardProps) {
  const [showBillingPopup, setShowBillingPopup] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  // Fetch billing dashboard data
  const { data: billingData, isLoading, error, refetch } = useQuery<BillingData>({
    queryKey: ['/api/vendors', vendorId, 'billing-dashboard'],
    enabled: !!vendorId,
  });

  // Check for pending payment notifications on 1st of month
  const { data: paymentNotification } = useQuery({
    queryKey: ['/api/vendors', vendorId, 'payment-notification'],
    enabled: !!vendorId,
    refetchInterval: 1000 * 60 * 30, // Check every 30 minutes
  });

  useEffect(() => {
    if (paymentNotification && paymentNotification.totalAmount > 0) {
      setPendingPaymentData(paymentNotification);
      setShowBillingPopup(true);
    }
  }, [paymentNotification]);

  const handlePaymentSuccess = () => {
    setShowBillingPopup(false);
    setPendingPaymentData(null);
    refetch();
    toast({
      title: "Payment Successful",
      description: "Your commission payment has been processed successfully!",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !billingData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load billing information</h3>
          <p className="text-gray-600 mb-4">There was an error loading your billing dashboard.</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Status and Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {billingData.vendor.accountStatus === 'active' ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Badge
                className={
                  billingData.vendor.accountStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {billingData.vendor.accountStatus}
              </Badge>
              {billingData.vendor.paymentFailureCount > 0 && (
                <p className="text-sm text-gray-600">
                  {billingData.vendor.paymentFailureCount} payment failure(s)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Banknote className="h-5 w-5 text-orange-500 mr-2" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{formatPrice(billingData.totals.totalPending)}</p>
              <p className="text-sm text-gray-600">
                {billingData.pendingPayments.length} payment(s) due
              </p>
              {billingData.totals.nextDueDate && (
                <p className="text-sm text-gray-500">
                  Next due: {formatDate(billingData.totals.nextDueDate)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Paid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{formatPrice(billingData.totals.totalPaid)}</p>
              <p className="text-sm text-gray-600">All-time payments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Table */}
      {billingData.pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Payments</CardTitle>
            <CardDescription>
              Commission payments that require your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingData.pendingPayments.map((payment) => {
                  const daysUntilDue = getDaysUntilDue(payment.dueDate);
                  const isOverdue = daysUntilDue < 0;
                  const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;

                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {new Date(2024, payment.month - 1).toLocaleDateString('en-GB', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(Number(payment.commissionAmount))}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatDate(payment.dueDate)}</div>
                          <div className={`text-sm ${
                            isOverdue ? 'text-red-600' : 
                            isUrgent ? 'text-orange-600' : 
                            'text-gray-500'
                          }`}>
                            {isOverdue ? 
                              `${Math.abs(daysUntilDue)} days overdue` :
                              daysUntilDue === 0 ? 'Due today' :
                              `${daysUntilDue} days remaining`
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="bg-black hover:bg-gray-800"
                          onClick={() => {
                            setPendingPaymentData({
                              totalAmount: Number(payment.commissionAmount),
                              paymentCount: 1,
                              dueDate: payment.dueDate,
                              payments: [payment],
                            });
                            setShowBillingPopup(true);
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Payments */}
      {billingData.recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              Your recent commission payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingData.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {new Date(2024, payment.month - 1).toLocaleDateString('en-GB', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(Number(payment.commissionAmount))}
                    </TableCell>
                    <TableCell>{formatDate(payment.paidDate)}</TableCell>
                    <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Pending Payments Message */}
      {billingData.pendingPayments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-gray-600">You have no outstanding commission payments at this time.</p>
          </CardContent>
        </Card>
      )}

      {/* Billing Popup */}
      <CommissionBillingPopup
        vendorId={vendorId}
        isOpen={showBillingPopup}
        onClose={() => setShowBillingPopup(false)}
        pendingPayments={pendingPaymentData}
      />
    </div>
  );
}