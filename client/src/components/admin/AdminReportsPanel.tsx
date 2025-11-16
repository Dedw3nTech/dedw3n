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
import { AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
}

interface Report {
  id: number;
  reporterUserId: number;
  reportedUserId?: number;
  contentType: string;
  contentId: number;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  reporterUser?: User;
  reportedUser?: User;
}

export default function AdminReportsPanel() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['/api/admin/reports'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/reports');
      return response.json();
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/reports/${reportId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Report Updated",
        description: "Report status has been updated.",
      });
      setReportDialogOpen(false);
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
            <AlertTriangle className="h-5 w-5" />
            Content Reports
          </CardTitle>
          <CardDescription>
            Review and moderate reported content and users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Content Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading reports...
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                      <TableCell>
                        <div className="font-medium">
                          {report.reporterUser?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{report.reporterUser?.username || 'unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {report.contentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {report.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setReportDialogOpen(true);
                            }}
                            data-testid={`button-review-report-${report.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                          
                          {report.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  updateReportMutation.mutate({
                                    reportId: report.id,
                                    status: 'approved'
                                  });
                                }}
                                data-testid={`button-approve-report-${report.id}`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  updateReportMutation.mutate({
                                    reportId: report.id,
                                    status: 'rejected'
                                  });
                                }}
                                data-testid={`button-reject-report-${report.id}`}
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

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Review reported content and take appropriate action
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reporter</Label>
                  <p className="text-sm">{selectedReport.reporterUser?.name}</p>
                  <p className="text-xs text-gray-500">@{selectedReport.reporterUser?.username}</p>
                </div>
                
                <div>
                  <Label>Content Type</Label>
                  <Badge variant="outline">{selectedReport.contentType}</Badge>
                </div>
              </div>
              
              <div>
                <Label>Reason</Label>
                <p className="text-sm">{selectedReport.reason}</p>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {selectedReport.description || 'No additional description provided'}
                </p>
              </div>
              
              <div>
                <Label>Current Status</Label>
                <Badge className={getStatusColor(selectedReport.status)}>
                  {selectedReport.status}
                </Badge>
              </div>
              
              {selectedReport.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      updateReportMutation.mutate({
                        reportId: selectedReport.id,
                        status: 'approved'
                      });
                    }}
                    className="flex-1"
                    data-testid="button-approve-report-dialog"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve Report
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      updateReportMutation.mutate({
                        reportId: selectedReport.id,
                        status: 'rejected'
                      });
                    }}
                    className="flex-1"
                    data-testid="button-reject-report-dialog"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject Report
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
