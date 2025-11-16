import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Store, Eye, CheckCircle, XCircle } from 'lucide-react';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
}

interface VendorRequest {
  id: number;
  userId: number;
  vendorType: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  description?: string;
  status: string;
  createdAt: string;
  user?: User;
}

export default function AdminVendorsPanel() {
  const queryClient = useQueryClient();
  const [selectedVendorRequest, setSelectedVendorRequest] = useState<VendorRequest | null>(null);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);

  const { data: vendorRequests = [], isLoading: vendorRequestsLoading } = useQuery<VendorRequest[]>({
    queryKey: ['/api/admin/vendor-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/vendor-requests');
      return response.json();
    },
  });

  const updateVendorRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/vendor-requests/${requestId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Vendor Request Updated",
        description: "Vendor request has been processed.",
      });
      setVendorDialogOpen(false);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Vendor Account Requests
          </CardTitle>
          <CardDescription>
            Review and approve vendor applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Business Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorRequestsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading vendor requests...
                    </TableCell>
                  </TableRow>
                ) : vendorRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No vendor requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  vendorRequests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-vendor-request-${request.id}`}>
                      <TableCell>
                        <div className="font-medium">
                          {request.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{request.user?.username || 'unknown'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {request.user?.email || 'No email'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium">
                            {request.businessName || 'No business name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.businessEmail || 'No business email'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {request.businessPhone || 'No phone'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {request.vendorType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVendorRequest(request);
                              setVendorDialogOpen(true);
                            }}
                            data-testid={`button-review-vendor-${request.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                          
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  updateVendorRequestMutation.mutate({
                                    requestId: request.id,
                                    status: 'approved'
                                  });
                                }}
                                data-testid={`button-approve-vendor-${request.id}`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  updateVendorRequestMutation.mutate({
                                    requestId: request.id,
                                    status: 'rejected'
                                  });
                                }}
                                data-testid={`button-reject-vendor-${request.id}`}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Vendor Application</DialogTitle>
            <DialogDescription>
              Review vendor application details and approve or reject
            </DialogDescription>
          </DialogHeader>
          
          {selectedVendorRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Applicant</Label>
                  <p className="text-sm">{selectedVendorRequest.user?.name}</p>
                  <p className="text-xs text-gray-500">@{selectedVendorRequest.user?.username}</p>
                  <p className="text-xs text-gray-500">{selectedVendorRequest.user?.email}</p>
                </div>
                
                <div>
                  <Label>Vendor Type</Label>
                  <Badge variant="outline">{selectedVendorRequest.vendorType}</Badge>
                </div>
              </div>
              
              <div>
                <Label>Business Name</Label>
                <p className="text-sm">{selectedVendorRequest.businessName || 'Not provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Business Email</Label>
                  <p className="text-sm">{selectedVendorRequest.businessEmail || 'Not provided'}</p>
                </div>
                
                <div>
                  <Label>Business Phone</Label>
                  <p className="text-sm">{selectedVendorRequest.businessPhone || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <Label>Business Address</Label>
                <p className="text-sm">{selectedVendorRequest.businessAddress || 'Not provided'}</p>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {selectedVendorRequest.description || 'No description provided'}
                </p>
              </div>
              
              <div>
                <Label>Current Status</Label>
                <Badge className={getStatusColor(selectedVendorRequest.status)}>
                  {selectedVendorRequest.status}
                </Badge>
              </div>
              
              {selectedVendorRequest.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      updateVendorRequestMutation.mutate({
                        requestId: selectedVendorRequest.id,
                        status: 'approved'
                      });
                    }}
                    className="flex-1"
                    data-testid="button-approve-vendor-dialog"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve Application
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      updateVendorRequestMutation.mutate({
                        requestId: selectedVendorRequest.id,
                        status: 'rejected'
                      });
                    }}
                    className="flex-1"
                    data-testid="button-reject-vendor-dialog"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
