import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Clock, Plus, Search, Filter, Heart, Share2, MessageCircle, Repeat2, Mail, Link as LinkIcon, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  attendeeCount: number;
  maxAttendees?: number;
  organizer: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  isAttending?: boolean;
  tags?: string[];
  image?: string;
  price?: number;
  isFree?: boolean;
}

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: '',
    maxAttendees: '',
    tags: '',
    isFree: true,
    price: ''
  });

  // Social interaction states
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [repostText, setRepostText] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [likedEvents, setLikedEvents] = useState<Set<number>>(new Set());

  // Fetch users for sharing
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: isShareModalOpen
  });

  // Fetch events
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', searchTerm, selectedCategory, sortBy, filterBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (sortBy) params.append('sortBy', sortBy);
      if (filterBy !== 'all') params.append('filterBy', filterBy);
      
      const response = await fetch(`/api/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return apiRequest('POST', '/api/events', eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsCreateDialogOpen(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: '',
        maxAttendees: '',
        tags: '',
        isFree: true,
        price: ''
      });
      toast({
        title: 'Event Created',
        description: 'Your event has been successfully created.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create event',
        variant: 'destructive',
      });
    },
  });

  // Attend event mutation
  const attendEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest('POST', `/api/events/${eventId}/attend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Event Joined',
        description: 'You have successfully joined the event.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join event',
        variant: 'destructive',
      });
    },
  });

  // Buy ticket mutation
  const buyTicketMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest('POST', `/api/events/${eventId}/buy-ticket`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Ticket Purchased',
        description: 'Your ticket has been purchased successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to purchase ticket',
        variant: 'destructive',
      });
    },
  });

  // Social interaction mutations
  const likeMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest('POST', `/api/events/${eventId}/like`);
    },
    onSuccess: (_, eventId) => {
      setLikedEvents(prev => new Set(prev).add(eventId));
      toast({
        title: 'Event Liked',
        description: 'Event added to your favorites.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to like event',
        variant: 'destructive',
      });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest('DELETE', `/api/events/${eventId}/like`);
    },
    onSuccess: (_, eventId) => {
      setLikedEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
      toast({
        title: 'Event Unliked',
        description: 'Event removed from your favorites.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unlike event',
        variant: 'destructive',
      });
    },
  });

  const repostMutation = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      return apiRequest('POST', '/api/posts', {
        content: message,
        type: 'text'
      });
    },
    onSuccess: () => {
      setIsRepostModalOpen(false);
      setRepostText('');
      toast({
        title: 'Event Shared',
        description: 'Event has been shared to your feed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to share event',
        variant: 'destructive',
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      return apiRequest('POST', '/api/messages', {
        recipientId: parseInt(userId),
        content: message
      });
    },
    onSuccess: () => {
      setIsShareModalOpen(false);
      setShareMessage('');
      setSelectedUser('');
      toast({
        title: 'Message Sent',
        description: 'Event has been shared via message.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  // Helper functions for social interactions
  const isEventLiked = (eventId: number) => likedEvents.has(eventId);

  const handleLikeToggle = (eventId: number) => {
    if (isEventLiked(eventId)) {
      unlikeMutation.mutate(eventId);
    } else {
      likeMutation.mutate(eventId);
    }
  };

  const shareEventByEmail = (event: Event) => {
    const subject = encodeURIComponent(`Check out this event: ${event.title}`);
    const body = encodeURIComponent(`I thought you might be interested in this event:\n\n${event.title}\n\nDate: ${formatDate(event.date)}\nTime: ${event.time}\nLocation: ${event.location}\n\nOrganized by: ${event.organizer.name}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const copyEventLinkToClipboard = async (event: Event) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
      toast({
        title: 'Link Copied',
        description: 'Event link has been copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const shareEventOnFeed = (event: Event) => {
    const message = `Check out this amazing event: ${event.title}\n\nDate: ${formatDate(event.date)} at ${event.time}\nLocation: ${event.location}\n\nOrganized by ${event.organizer.name}`;
    repostMutation.mutate({ message });
  };

  const shareEventViaMessage = (event: Event) => {
    setSelectedEvent(event);
    setShareMessage(`Check out this event: ${event.title}\n\nDate: ${formatDate(event.date)} at ${event.time}\nLocation: ${event.location}`);
    setIsShareModalOpen(true);
  };

  const handleCreateEvent = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create events.',
        variant: 'destructive',
      });
      return;
    }

    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Check if paid event requires vendor account
    if (!newEvent.isFree && !user.isVendor) {
      toast({
        title: 'Vendor Account Required',
        description: 'Creating paid events requires a vendor account. Please upgrade to continue.',
        variant: 'destructive',
      });
      return;
    }

    // Validate price for paid events
    if (!newEvent.isFree && (!newEvent.price || parseFloat(newEvent.price) <= 0)) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid price for paid events.',
        variant: 'destructive',
      });
      return;
    }

    const eventData = {
      ...newEvent,
      maxAttendees: newEvent.maxAttendees ? parseInt(newEvent.maxAttendees) : null,
      tags: newEvent.tags ? newEvent.tags.split(',').map(tag => tag.trim()) : [],
      price: newEvent.isFree ? 0 : parseFloat(newEvent.price || '0')
    };

    createEventMutation.mutate(eventData);
  };

  const handleAttendEvent = (eventId: number) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to join events.',
        variant: 'destructive',
      });
      return;
    }
    attendEventMutation.mutate(eventId);
  };

  const handleBuyTicket = (eventId: number) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to purchase tickets.',
        variant: 'destructive',
      });
      return;
    }
    buyTicketMutation.mutate(eventId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'networking', label: 'Networking' },
    { value: 'social', label: 'Social' },
    { value: 'business', label: 'Business' },
    { value: 'tech', label: 'Technology' },
    { value: 'sports', label: 'Sports' },
    { value: 'arts', label: 'Arts & Culture' },
    { value: 'education', label: 'Education' },
    { value: 'health', label: 'Health & Wellness' },
    { value: 'food', label: 'Food & Drink' },
    { value: 'dating', label: 'Dating' },
    { value: 'community', label: 'Community' }
  ];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Events & Meetups</h1>
          <p className="text-gray-600">Discover and join local events in your community</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Describe your event"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newEvent.category}
                  onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="maxAttendees">Max Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  value={newEvent.maxAttendees}
                  onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={newEvent.tags}
                  onChange={(e) => setNewEvent({ ...newEvent, tags: e.target.value })}
                  placeholder="e.g. networking, startup, tech"
                />
              </div>
              
              {/* Pricing Options */}
              <div>
                <Label className="text-base font-medium">Event Pricing</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="free"
                      name="pricing"
                      checked={newEvent.isFree}
                      onChange={() => setNewEvent({ ...newEvent, isFree: true, price: '' })}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Label htmlFor="free" className="text-sm font-normal">
                      Free Event
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="paid"
                      name="pricing"
                      checked={!newEvent.isFree}
                      onChange={() => setNewEvent({ ...newEvent, isFree: false })}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Label htmlFor="paid" className="text-sm font-normal">
                      Paid Event
                    </Label>
                  </div>
                  
                  {!newEvent.isFree && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium">$</span>
                        <Input
                          type="number"
                          value={newEvent.price}
                          onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                          placeholder="0.00"
                          className="w-24"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {!user?.isVendor && (
                        <p className="text-sm text-black">
                          Note: Creating paid events requires a vendor account. 
                          <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">
                            Upgrade to vendor
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateEvent}
                  disabled={createEventMutation.isPending}
                  className="flex-1"
                >
                  {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Filter */}
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="upcoming">Upcoming Only</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Sort Options */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (Nearest)</SelectItem>
              <SelectItem value="dateDesc">Date (Latest)</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="attendees">Most Attendees</SelectItem>
              <SelectItem value="title">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Be the first to create an event in your community'
              }
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {event.image && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    {event.category && (
                      <Badge variant="secondary" className="bg-white/90 text-gray-800 backdrop-blur-sm">
                        {categories.find(c => c.value === event.category)?.label || event.category}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {event.title}
                    </CardTitle>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span>by {event.organizer.name}</span>
                    </div>
                  </div>
                  {event.category && !event.image && (
                    <Badge variant="secondary" className="ml-2">
                      {categories.find(c => c.value === event.category)?.label || event.category}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-green-600" />
                      <span>{event.time}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-red-600" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-purple-600" />
                      <span>
                        {event.attendeeCount} attending
                        {event.maxAttendees && ` (${event.maxAttendees} max)`}
                      </span>
                    </div>
                  </div>
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {event.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {event.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{event.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Price Information */}
                  {event.price !== undefined && (
                    <div className="pt-2 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="font-semibold text-lg">
                          {event.isFree || event.price === 0 ? (
                            <span className="text-green-600">Free</span>
                          ) : (
                            <span className="text-blue-600">{formatPrice(event.price || 0)}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2 space-y-2">
                    {/* Show different buttons based on event type */}
                    {event.isFree || event.price === 0 ? (
                      <Button
                        onClick={() => handleAttendEvent(event.id)}
                        disabled={attendEventMutation.isPending || event.isAttending}
                        className={`w-full ${
                          event.isAttending 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {event.isAttending ? 'Attending' : 'Join Event'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleBuyTicket(event.id)}
                        disabled={buyTicketMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {buyTicketMutation.isPending ? 'Processing...' : `Buy Ticket ${formatPrice(event.price || 0)}`}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 border-none">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareEventOnFeed(event)}
                      className="text-black hover:bg-transparent hover:text-gray-700 font-normal"
                      title="Share this event on your community feed"
                    >
                      Repost
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsRepostModalOpen(true);
                      }}
                      className="text-black hover:bg-transparent hover:text-gray-700 font-normal"
                      title="Repost this event with your own commentary"
                    >
                      <Repeat2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 w-full">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9"
                    title="Comment on this event"
                  >
                    <MessageCircle className="h-5 w-5 text-gray-600" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => handleLikeToggle(event.id)}
                    disabled={likeMutation.isPending || unlikeMutation.isPending}
                    title={isEventLiked(event.id) ? 'Remove from your favorites' : 'Add to your favorites'}
                  >
                    <Heart 
                      className={`h-5 w-5 ${isEventLiked(event.id) ? 'fill-red-500 text-red-500' : 'fill-black text-black'}`} 
                    />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9"
                        title="Share this event via email, message, or social media"
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Share Event</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => shareEventByEmail(event)}>
                        <Mail className="h-4 w-4 mr-2 text-gray-600" />
                        Share via Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyEventLinkToClipboard(event)}>
                        <LinkIcon className="h-4 w-4 mr-2 text-gray-600" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareEventOnFeed(event)}>
                        <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                        Share on Feed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareEventViaMessage(event)}>
                        <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                        Send via Message
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Event</DialogTitle>
            <DialogDescription>
              Send this event to a user via message
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="select-user" className="text-right font-medium">Send to</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} (@{user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="share-message" className="text-right font-medium pt-2">
                Message
              </label>
              <Textarea
                id="share-message"
                placeholder="Add a message..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="col-span-3 min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsShareModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedUser && shareMessage) {
                  sendMessageMutation.mutate({ userId: selectedUser, message: shareMessage });
                }
              }}
              disabled={sendMessageMutation.isPending || !selectedUser || !shareMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Repost Modal */}
      <Dialog open={isRepostModalOpen} onOpenChange={setIsRepostModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Repost Event</DialogTitle>
            <DialogDescription>
              Do you want to add text to your repost?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setIsRepostModalOpen(false);
                  setRepostText("");
                  if (selectedEvent) {
                    const message = `Check out this amazing event: ${selectedEvent.title}\n\nDate: ${formatDate(selectedEvent.date)} at ${selectedEvent.time}\nLocation: ${selectedEvent.location}\n\nOrganized by ${selectedEvent.organizer.name}`;
                    repostMutation.mutate({ message });
                  }
                }}
                disabled={repostMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {repostMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reposting...
                  </>
                ) : (
                  "Repost without text"
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Textarea
                  placeholder="Add your thoughts about this event..."
                  value={repostText}
                  onChange={(e) => setRepostText(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={() => {
                    setIsRepostModalOpen(false);
                    if (selectedEvent) {
                      const eventDetails = `Check out this amazing event: ${selectedEvent.title}\n\nDate: ${formatDate(selectedEvent.date)} at ${selectedEvent.time}\nLocation: ${selectedEvent.location}\n\nOrganized by ${selectedEvent.organizer.name}`;
                      const message = repostText.trim() 
                        ? `${repostText}\n\n${eventDetails}` 
                        : eventDetails;
                      repostMutation.mutate({ message });
                      setRepostText("");
                    }
                  }}
                  disabled={repostMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {repostMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reposting...
                    </>
                  ) : (
                    "Repost with text"
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRepostModalOpen(false);
                setRepostText("");
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}