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
import { AlertTriangle, Search, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function OperationsFraud() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['/api/admin/operations/fraud-cases'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/operations/fraud-cases');
      return response.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/operations/fraud-cases/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/operations/fraud-cases/stats');
      return response.json();
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PATCH', `/api/admin/operations/fraud-cases/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/operations/fraud-cases'] });
      toast({ title: 'Success', description: 'Fraud case updated successfully' });
      setDialogOpen(false);
    },
  });

  const filteredCases = cases.filter((c: any) =>
    c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      false_positive: 'bg-gray-100 text-gray-800',
      confirmed_fraud: 'bg-red-100 text-red-800',
    };
    return <Badge className={variants[status] || ''}>{status.replace('_', ' ')}</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return <Badge className={variants[risk] || ''}>{risk}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-fraud-title">Fraud Detection</h1>
        <p className="text-gray-600">Monitor and manage fraud cases</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openCases || 0}</div>
            <p className="text-xs text-muted-foreground">Active investigations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.criticalCases || 0}</div>
            <p className="text-xs text-muted-foreground">Requires immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats?.resolvedCases || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fraud Cases</CardTitle>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by case number or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="input-search-fraud"
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
                  <TableHead>Case Number</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((fraudCase: any) => (
                  <TableRow key={fraudCase.id} data-testid={`row-fraud-${fraudCase.id}`}>
                    <TableCell className="font-mono text-sm">{fraudCase.caseNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{fraudCase.userName || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{fraudCase.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{fraudCase.type?.replace('_', ' ')}</TableCell>
                    <TableCell>{getRiskBadge(fraudCase.riskLevel)}</TableCell>
                    <TableCell>{getStatusBadge(fraudCase.status)}</TableCell>
                    <TableCell>{format(new Date(fraudCase.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Dialog open={dialogOpen && selectedCase?.id === fraudCase.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setSelectedCase(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCase(fraudCase)}
                            data-testid={`button-edit-fraud-${fraudCase.id}`}
                          >
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Fraud Case</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Status</Label>
                              <Select
                                defaultValue={fraudCase.status}
                                onValueChange={(value) => {
                                  updateCaseMutation.mutate({
                                    id: fraudCase.id,
                                    data: { status: value }
                                  });
                                }}
                              >
                                <SelectTrigger data-testid="select-fraud-status">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="investigating">Investigating</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="false_positive">False Positive</SelectItem>
                                  <SelectItem value="confirmed_fraud">Confirmed Fraud</SelectItem>
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
