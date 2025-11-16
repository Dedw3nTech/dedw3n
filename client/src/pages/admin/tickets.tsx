import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Ticket, MessageSquare, Clock, CheckCircle, XCircle, Send, User, Mail, AlertCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface TicketData {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department: 'operations' | 'tech' | 'legal' | 'marketing' | 'sales' | 'finance' | 'hr';
  email: string;
  senderName?: string;
  userId?: number;
  assignedTo?: number;
  createdAt: string;
  updatedAt: string;
  user?: any;
  assignedUser?: any;
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: number;
  ticketId: number;
  userId?: number;
  message: string;
  isInternal: boolean;
  isEmailReply: boolean;
  senderEmail?: string;
  senderName?: string;
  createdAt: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byDepartment: {
    operations: number;
    tech: number;
    legal: number;
    marketing: number;
    sales: number;
    finance: number;
    hr: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const { data: stats } = useQuery<TicketStats>({
    queryKey: ['/api/tickets/stats'],
  });

  const { data: tickets = [], isLoading } = useQuery<TicketData[]>({
    queryKey: ['/api/tickets', filterStatus, filterDepartment, filterPriority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      if (filterDepartment && filterDepartment !== 'all') params.append('department', filterDepartment);
      if (filterPriority && filterPriority !== 'all') params.append('priority', filterPriority);
      
      const url = `/api/tickets${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest('GET', url);
      return response.json();
    },
  });

  const assignTicketMutation = useMutation({
    mutationFn: async ({ ticketId, assignedTo }: { ticketId: number; assignedTo: number }) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/assign`, { assignedTo });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/stats'] });
      toast({
        title: 'Ticket Assigned',
        description: 'Ticket has been assigned successfully.',
      });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: number; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/tickets/${ticketId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/stats'] });
      toast({
        title: 'Ticket Updated',
        description: 'Ticket has been updated successfully.',
      });
    },
  });

  const resolveTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/resolve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/stats'] });
      toast({
        title: 'Ticket Resolved',
        description: 'Ticket has been marked as resolved.',
      });
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/close`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/stats'] });
      toast({
        title: 'Ticket Closed',
        description: 'Ticket has been closed.',
      });
      setTicketDialogOpen(false);
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, message, isInternal }: { ticketId: number; message: string; isInternal: boolean }) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/messages`, {
        message,
        isInternal,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setReplyMessage('');
      setIsInternalNote(false);
      toast({
        title: 'Reply Sent',
        description: isInternalNote ? 'Internal note added successfully.' : 'Reply sent successfully.',
      });
      
      if (selectedTicket) {
        loadTicketDetails(selectedTicket.id);
      }
    },
  });

  const loadTicketDetails = async (ticketId: number) => {
    try {
      const response = await apiRequest('GET', `/api/tickets/${ticketId}`);
      const ticketData = await response.json();
      setSelectedTicket(ticketData);
    } catch (error) {
      console.error('Error loading ticket details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket details.',
        variant: 'destructive',
      });
    }
  };

  const handleViewTicket = async (ticket: TicketData) => {
    await loadTicketDetails(ticket.id);
    setTicketDialogOpen(true);
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    replyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyMessage,
      isInternal: isInternalNote,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: 'default', icon: AlertCircle, label: 'Open' },
      in_progress: { variant: 'secondary', icon: Clock, label: 'In Progress' },
      waiting_customer: { variant: 'outline', icon: MessageSquare, label: 'Waiting Customer' },
      resolved: { variant: 'default', icon: CheckCircle, label: 'Resolved', className: 'bg-green-500' },
      closed: { variant: 'default', icon: XCircle, label: 'Closed', className: 'bg-gray-500' },
    };
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.className} data-testid={`badge-status-${status}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: { className: 'bg-blue-500', label: 'Low' },
      medium: { className: 'bg-yellow-500', label: 'Medium' },
      high: { className: 'bg-orange-500', label: 'High' },
      urgent: { className: 'bg-red-500', label: 'Urgent' },
    };
    const config = variants[priority] || variants.medium;
    
    return (
      <Badge className={config.className} data-testid={`badge-priority-${priority}`}>
        {config.label}
      </Badge>
    );
  };

  const getDepartmentBadge = (department: string) => {
    const labels: Record<string, string> = {
      operations: 'Operations',
      tech: 'Tech',
      legal: 'Legal',
      marketing: 'Marketing',
      sales: 'Sales',
      finance: 'Finance',
      hr: 'HR',
    };
    
    return (
      <Badge variant="outline" data-testid={`badge-department-${department}`}>
        {labels[department] || department}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Ticket Management</h1>
          <p className="text-gray-600">Manage support tickets across all departments</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-tickets">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-open-tickets">{stats.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600" data-testid="text-inprogress-tickets">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-resolved-tickets">{stats.resolved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600" data-testid="text-closed-tickets">{stats.closed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tickets</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40" data-testid="select-filter-status">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-40" data-testid="select-filter-department">
                  <SelectValue placeholder="Filter by Dept" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40" data-testid="select-filter-priority">
                  <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tickets found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} data-testid={`row-ticket-${ticket.id}`}>
                    <TableCell className="font-mono text-sm">{ticket.ticketNumber}</TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{ticket.senderName || 'Unknown'}</span>
                        <span className="text-sm text-gray-500">{ticket.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getDepartmentBadge(ticket.department)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewTicket(ticket)}
                        data-testid={`button-view-ticket-${ticket.id}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  {selectedTicket.ticketNumber}: {selectedTicket.subject}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                  {getDepartmentBadge(selectedTicket.department)}
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm text-gray-600">From</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{selectedTicket.senderName || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{selectedTicket.email}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Created</Label>
                    <div className="mt-1">{format(new Date(selectedTicket.createdAt), 'PPpp')}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Description</Label>
                  <div className="mt-2 p-4 bg-white border rounded-lg">
                    {selectedTicket.description}
                  </div>
                </div>

                {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                  <div>
                    <Label className="text-sm text-gray-600 mb-2 block">Conversation</Label>
                    <div className="space-y-3">
                      {selectedTicket.messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`p-4 rounded-lg ${
                            message.isInternal 
                              ? 'bg-yellow-50 border-l-4 border-yellow-500' 
                              : 'bg-gray-50'
                          }`}
                          data-testid={`message-${message.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">
                                {message.senderName || message.senderEmail || 'Admin'}
                              </span>
                              {message.isInternal && (
                                <Badge variant="outline" className="text-xs">Internal Note</Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {format(new Date(message.createdAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          <div className="text-sm">{message.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Reply</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="internalNote"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded"
                        data-testid="checkbox-internal-note"
                      />
                      <Label htmlFor="internalNote" className="text-sm cursor-pointer">
                        Internal Note (not sent to customer)
                      </Label>
                    </div>
                  </div>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                    className="mb-2"
                    data-testid="textarea-reply"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSendReply} 
                      disabled={!replyMessage.trim() || replyMutation.isPending}
                      data-testid="button-send-reply"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isInternalNote ? 'Add Note' : 'Send Reply'}
                    </Button>
                    {selectedTicket.status !== 'resolved' && (
                      <Button 
                        variant="outline" 
                        onClick={() => resolveTicketMutation.mutate(selectedTicket.id)}
                        disabled={resolveTicketMutation.isPending}
                        data-testid="button-resolve-ticket"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Resolved
                      </Button>
                    )}
                    {selectedTicket.status !== 'closed' && (
                      <Button 
                        variant="outline" 
                        onClick={() => closeTicketMutation.mutate(selectedTicket.id)}
                        disabled={closeTicketMutation.isPending}
                        data-testid="button-close-ticket"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Close Ticket
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
