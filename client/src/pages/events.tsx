import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Clock, Plus, Search, Filter, Heart, Share2, MessageCircle, Repeat2, Mail, Link as LinkIcon, MessageSquare, Loader2, Gift } from 'lucide-react';
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
  isLiked?: boolean;
  friendsAttending?: string[];
}

export default function EventsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedCurrency, formatPrice } = useCurrency();
  
  // Event creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: '',
    maxAttendees: '',
    tags: '',
    price: '',
    isFree: true
  });

  // Share modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEventId, setShareEventId] = useState<number | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  
  // Repost modal states
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [repostEventId, setRepostEventId] = useState<number | null>(null);
  const [repostText, setRepostText] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Gift modal states
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftEventId, setGiftEventId] = useState<number | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedGiftUser, setSelectedGiftUser] = useState<any>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Event likes mutations
  const likeEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest(`/api/events/${eventId}/like`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: "Event liked!", description: "Added to your favorites" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to like event", variant: "destructive" });
    }
  });

  const unlikeEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest(`/api/events/${eventId}/like`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: "Event unliked", description: "Removed from favorites" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to unlike event", variant: "destructive" });
    }
  });

  const handleLikeEvent = async (eventId: number, isLiked: boolean) => {
    if (isLiked) {
      unlikeEventMutation.mutate(eventId);
    } else {
      likeEventMutation.mutate(eventId);
    }
  };

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events'],
    enabled: !!user
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
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
        price: '',
        isFree: true
      });
      toast({ title: "Event created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    }
  });

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const eventData = {
      ...newEvent,
      maxAttendees: newEvent.maxAttendees ? parseInt(newEvent.maxAttendees) : null,
      price: newEvent.isFree ? 0 : parseFloat(newEvent.price) || 0,
      tags: newEvent.tags ? newEvent.tags.split(',').map(tag => tag.trim()) : []
    };

    createEventMutation.mutate(eventData);
  };

  // Filter and sort events
  const filteredAndSortedEvents = events
    .filter((event: Event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a: Event, b: Event) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'attendees':
          return b.attendeeCount - a.attendeeCount;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const shareEventByEmail = (event: Event) => {
    const subject = encodeURIComponent(`Check out this event: ${event.title}`);
    const body = encodeURIComponent(`I thought you might be interested in this event:\n\n${event.title}\n${event.description}\n\nDate: ${event.date} at ${event.time}\nLocation: ${event.location}\n\nCheck it out!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const copyEventLinkToClipboard = async (event: Event) => {
    const eventUrl = `${window.location.origin}/events/${event.id}`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast({ title: "Link copied!", description: "Event link copied to clipboard" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  const shareEventOnFeed = (event: Event) => {
    setShareEventId(event.id);
    setShareMessage(`Check out this amazing event: ${event.title}! 🎉`);
    setIsShareModalOpen(true);
  };

  const shareEventViaMessage = (event: Event) => {
    setShareEventId(event.id);
    setShareMessage(`Hey! I found this cool event: ${event.title}. Want to join me?`);
    setIsShareModalOpen(true);
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'technology', label: 'Technology' },
    { value: 'business', label: 'Business' },
    { value: 'arts', label: 'Arts & Culture' },
    { value: 'sports', label: 'Sports & Fitness' },
    { value: 'food', label: 'Food & Drink' },
    { value: 'music', label: 'Music' },
    { value: 'networking', label: 'Networking' },
    { value: 'education', label: 'Education' },
    { value: 'health', label: 'Health & Wellness' },
    { value: 'travel', label: 'Travel' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'photography', label: 'Photography' },
    { value: 'literature', label: 'Literature' },
    { value: 'film', label: 'Film & Media' },
    { value: 'charity', label: 'Charity & Causes' },
    { value: 'family', label: 'Family' },
    { value: 'outdoors', label: 'Outdoors & Adventure' },
    { value: 'science', label: 'Science & Tech' },
    { value: 'hobbies', label: 'Hobbies & Crafts' },
    { value: 'religion', label: 'Religion & Spirituality' },
    { value: 'government', label: 'Government & Politics' },
    { value: 'community', label: 'Community' },
    { value: 'dating', label: 'Dating' }
  ];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Events & Meetups</h1>
            <p className="text-gray-600">Discover and join local events in your community</p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <Link href="/favorites">
              <Button variant="outline" className="bg-white border-gray-300 hover:bg-gray-50">
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </Button>
            </Link>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
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
                      placeholder="Enter event location"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newEvent.category} onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}>
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
                    <Label htmlFor="maxAttendees">Max Attendees (Optional)</Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      value={newEvent.maxAttendees}
                      onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: e.target.value })}
                      placeholder="No limit"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">Tags (Optional)</Label>
                    <Input
                      id="tags"
                      value={newEvent.tags}
                      onChange={(e) => setNewEvent({ ...newEvent, tags: e.target.value })}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  
                  {/* Pricing Options */}
                  <div className="space-y-3">
                    <Label>Event Pricing</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="free"
                        name="pricing"
                        checked={newEvent.isFree}
                        onChange={() => setNewEvent({ ...newEvent, isFree: true, price: '' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Label htmlFor="free" className="text-sm font-normal">Free Event</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="paid"
                        name="pricing"
                        checked={!newEvent.isFree}
                        onChange={() => setNewEvent({ ...newEvent, isFree: false })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Label htmlFor="paid" className="text-sm font-normal">Paid Event</Label>
                    </div>
                    {!newEvent.isFree && (
                      <div className="ml-6">
                        <Label htmlFor="price">Price ({selectedCurrency.code})</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newEvent.price}
                          onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {!newEvent.isFree && !user?.isVendor && (
                          <p className="text-sm text-amber-600 mt-1">
                            Note: Vendor account required for paid events
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateEvent}
                    disabled={createEventMutation.isPending || (!newEvent.isFree && !user?.isVendor)}
                  >
                    {createEventMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Event
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="attendees">Sort by Popularity</SelectItem>
              <SelectItem value="title">Sort by Title</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-none shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">Try adjusting your search or filters to find events.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedEvents.map((event: Event) => (
              <Card key={event.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
                {event.image && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white shadow-sm"
                        onClick={() => handleLikeEvent(event.id, event.isLiked || false)}
                      >
                        <Heart 
                          className={`h-4 w-4 ${event.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                        />
                      </Button>
                    </div>
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg text-gray-900 mb-1 ${
                        event.title.length > 50 ? 'line-clamp-3' : 'line-clamp-2'
                      }`}>
                        {event.title}
                      </h3>
                      <div className="text-sm text-gray-600">
                        <p className="line-clamp-3">
                          {event.description}
                        </p>
                        {event.description && event.description.length > 150 && (
                          <Link href={`/event/${event.id}`} className="text-blue-600 hover:text-blue-800 text-xs mt-1 inline-block">
                            Read more...
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      {event.attendeeCount} attending
                      {event.maxAttendees && ` (${event.maxAttendees} max)`}
                      {event.friendsAttending && event.friendsAttending.length > 0 && (
                        <div className="ml-2 text-xs text-blue-600">
                          • {event.friendsAttending.slice(0, 2).join(', ')}
                          {event.friendsAttending.length > 2 && ` +${event.friendsAttending.length - 2} more friends`}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {event.category}
                      </Badge>
                    </div>
                    <Link href={`/wall`}>
                      <div className="flex items-center text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                        <div className="h-6 w-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-xs">
                          {event.organizer.name.charAt(0)}
                        </div>
                        <span className="text-xs">{event.organizer.name}</span>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="mb-4">
                    {event.isFree ? (
                      <Badge variant="outline" className="text-sm font-semibold text-green-600 border-green-200 px-3 py-1">
                        Free Event
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-sm font-semibold text-blue-600 border-blue-200 px-3 py-1">
                        {formatPrice(event.price || 0)}
                      </Badge>
                    )}
                  </div>
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                          #{tag}
                        </Badge>
                      ))}
                      {event.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          +{event.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="px-6 pb-6 pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          // Add event to Dating Profile as desired gift
                          toast({ title: "Event added to your Dating Profile gifts!" });
                        }}
                        title="Add to Dating Profile"
                      >
                        <Plus className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedEvent(event);
                          setGiftEventId(event.id);
                          setIsGiftModalOpen(true);
                        }}
                      >
                        <Gift className="h-4 w-4 mr-1 text-gray-600" />
                        <span className="text-xs">Gift</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Share2 className="h-4 w-4 mr-1 text-gray-600" />
                            <span className="text-xs">Share</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Share Event</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => shareEventOnFeed(event)}>
                            <Repeat2 className="h-4 w-4 mr-2" />
                            Share on Feed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareEventViaMessage(event)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareEventByEmail(event)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Share via Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyEventLinkToClipboard(event)}>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button 
                        size="sm" 
                        className="bg-black hover:bg-gray-800 text-white"
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsRepostModalOpen(true);
                        }}
                      >
                        <Repeat2 className="h-4 w-4 mr-1" />
                        <span className="text-xs">Repost</span>
                      </Button>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      {event.isAttending 
                        ? 'Attending' 
                        : (event.price === 0 || event.price === null || event.price === undefined) 
                          ? 'Join Event' 
                          : 'Buy Ticket'
                      }
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Share Event Modal */}
        <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share Event</DialogTitle>
              <DialogDescription>
                Share this event with your followers or send it directly to someone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="shareMessage">Message</Label>
                <Textarea
                  id="shareMessage"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a message..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShareModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle share logic here
                setIsShareModalOpen(false);
                setShareMessage('');
                toast({ title: "Event shared successfully!" });
              }}>
                Share
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Repost Event Modal */}
        <Dialog open={isRepostModalOpen} onOpenChange={setIsRepostModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Repost Event</DialogTitle>
              <DialogDescription>
                Add your thoughts and repost this event to your followers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="repostText">Your Comment</Label>
                <Textarea
                  id="repostText"
                  value={repostText}
                  onChange={(e) => setRepostText(e.target.value)}
                  placeholder="What do you think about this event?"
                  rows={3}
                />
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
              <Button 
                className="bg-black hover:bg-gray-800 text-white"
                onClick={() => {
                  // Handle repost logic here
                  setIsRepostModalOpen(false);
                  setRepostText("");
                  toast({ title: "Event reposted successfully!" });
                }}
              >
                Repost
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Gift Event Modal */}
        <Dialog open={isGiftModalOpen} onOpenChange={setIsGiftModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gift Event</DialogTitle>
              <DialogDescription>
                Send this event as a gift to a friend.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="userSearch">Search Users</Label>
                <Input
                  id="userSearch"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search for users..."
                  className="w-full"
                />
              </div>
              {userSearchQuery && (
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  <div className="p-2 space-y-1">
                    {/* Mock user list - in real app, this would fetch from API */}
                    {[
                      { id: 1, name: "John Doe", username: "@johndoe", avatar: "" },
                      { id: 2, name: "Jane Smith", username: "@janesmith", avatar: "" },
                      { id: 3, name: "Mike Johnson", username: "@mikej", avatar: "" }
                    ]
                      .filter(user => 
                        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        user.username.toLowerCase().includes(userSearchQuery.toLowerCase())
                      )
                      .map(user => (
                        <div
                          key={user.id}
                          className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                            selectedGiftUser?.id === user.id ? 'bg-blue-100' : ''
                          }`}
                          onClick={() => setSelectedGiftUser(user)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.username}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {selectedGiftUser && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium">Selected: {selectedGiftUser.name}</p>
                  <p className="text-xs text-gray-600">{selectedGiftUser.username}</p>
                </div>
              )}
              <div>
                <Label htmlFor="giftMessage">Gift Message</Label>
                <Textarea
                  id="giftMessage"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsGiftModalOpen(false);
                  setGiftMessage("");
                  setUserSearchQuery("");
                  setSelectedGiftUser(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                disabled={!selectedGiftUser}
                onClick={() => {
                  // Handle gift sending logic here
                  setIsGiftModalOpen(false);
                  setGiftMessage("");
                  setUserSearchQuery("");
                  setSelectedGiftUser(null);
                  toast({ title: "Event sent as gift successfully!" });
                }}
              >
                Send Gift
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}