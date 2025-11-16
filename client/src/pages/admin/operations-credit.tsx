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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Search, Plus, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function OperationsCredit() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['/api/admin/operations/credit-collections'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/operations/credit-collections');
      return response.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/operations/credit-collections/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/operations/credit-collections/stats');
      return response.json();
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PATCH', `/api/admin/operations/credit-collections/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/operations/credit-collections'] });
      toast({ title: 'Success', description: 'Credit collection case updated successfully' });
      setDialogOpen(false);
    },
  });

  const filteredCollections = collections.filter((c: any) =>
    c.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      written_off: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-credit-title">Credit & Collection</h1>
          <p className="text-gray-600">Manage overdue payments and collection cases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOverdue || 0}</div>
            <p className="text-xs text-muted-foreground">Active cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPending || 0}</div>
            <p className="text-xs text-muted-foreground">Pending cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalAmount || 0}</div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Cases</CardTitle>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="input-search-credit"
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
                  <TableHead>User</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollections.map((collection: any) => (
                  <TableRow key={collection.id} data-testid={`row-credit-${collection.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{collection.userName}</div>
                        <div className="text-sm text-muted-foreground">{collection.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {collection.currency} {collection.amountDue}
                    </TableCell>
                    <TableCell>
                      {collection.dueDate ? format(new Date(collection.dueDate), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(collection.status)}</TableCell>
                    <TableCell>
                      <Dialog open={dialogOpen && selectedCase?.id === collection.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setSelectedCase(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCase(collection)}
                            data-testid={`button-edit-credit-${collection.id}`}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Collection Case</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Status</Label>
                              <Select
                                defaultValue={collection.status}
                                onValueChange={(value) => {
                                  updateCaseMutation.mutate({
                                    id: collection.id,
                                    data: { status: value }
                                  });
                                }}
                              >
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                  <SelectItem value="partial">Partial</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="written_off">Written Off</SelectItem>
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
