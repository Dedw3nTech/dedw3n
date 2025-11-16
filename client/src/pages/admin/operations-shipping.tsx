import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Truck, Search, Package, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function OperationsShipping() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['/api/admin/operations/shipping-returns'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/operations/shipping-returns');
      return response.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/operations/shipping-returns/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/operations/shipping-returns/stats');
      return response.json();
    },
  });

  const updateReturnMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PATCH', `/api/admin/operations/shipping-returns/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/operations/shipping-returns'] });
      toast({ title: 'Success', description: 'Return request updated successfully' });
      setDialogOpen(false);
    },
  });

  const filteredReturns = returns.filter((r: any) =>
    r.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      requested: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      in_transit: 'bg-purple-100 text-purple-800',
      received: 'bg-green-100 text-green-800',
      refunded: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
    };
    return <Badge className={variants[status] || ''}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-shipping-title">Shipping & Returns</h1>
        <p className="text-gray-600">Manage return requests and shipping logistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requested</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.requested || 0}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground">In process</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by return number or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="input-search-shipping"
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
                  <TableHead>Return Number</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Refund Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((returnRequest: any) => (
                  <TableRow key={returnRequest.id} data-testid={`row-return-${returnRequest.id}`}>
                    <TableCell className="font-mono text-sm">{returnRequest.returnNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{returnRequest.userName}</div>
                        <div className="text-sm text-muted-foreground">{returnRequest.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{returnRequest.reason?.replace('_', ' ')}</TableCell>
                    <TableCell className="font-semibold">
                      {returnRequest.refundAmount ? `${returnRequest.currency} ${returnRequest.refundAmount}` : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(returnRequest.status)}</TableCell>
                    <TableCell>{format(new Date(returnRequest.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Dialog open={dialogOpen && selectedReturn?.id === returnRequest.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setSelectedReturn(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReturn(returnRequest)}
                            data-testid={`button-edit-return-${returnRequest.id}`}
                          >
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Return Request</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Status</Label>
                              <Select
                                defaultValue={returnRequest.status}
                                onValueChange={(value) => {
                                  updateReturnMutation.mutate({
                                    id: returnRequest.id,
                                    data: { status: value }
                                  });
                                }}
                              >
                                <SelectTrigger data-testid="select-return-status">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="requested">Requested</SelectItem>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                  <SelectItem value="in_transit">In Transit</SelectItem>
                                  <SelectItem value="received">Received</SelectItem>
                                  <SelectItem value="refunded">Refunded</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
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
