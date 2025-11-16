import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function OperationsFinance() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['/api/admin/operations/finance-payouts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/operations/finance-payouts');
      return response.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/operations/finance-payouts/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/operations/finance-payouts/stats');
      return response.json();
    },
  });

  const filteredPayouts = payouts.filter((p: any) =>
    p.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.payoutNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-finance-title">Finance Dashboard</h1>
        <p className="text-gray-600">Manage vendor payouts and financial reconciliation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalAmount || 0}</div>
            <p className="text-xs text-muted-foreground">Completed payouts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Payouts</CardTitle>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vendor or payout number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="input-search-finance"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((payout: any) => (
                  <TableRow key={payout.id} data-testid={`row-payout-${payout.id}`}>
                    <TableCell className="font-mono text-sm">{payout.payoutNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payout.vendorName || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{payout.vendorEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {payout.currency} {payout.amount}
                    </TableCell>
                    <TableCell>{payout.period}</TableCell>
                    <TableCell className="capitalize">{payout.paymentMethod || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
