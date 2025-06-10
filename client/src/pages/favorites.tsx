import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Heart, Search, Filter, ArrowLeft } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  category?: string;
  organizer: {
    id: number;
    name: string;
    avatar?: string;
  };
  attendeeCount: number;
  maxAttendees?: number;
  tags?: string[];
  image?: string;
  price?: number;
  isFree?: boolean;
  isAttending?: boolean;
  createdAt: string;
}

export default function Favorites() {
  const { formatPrice } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Fetch user's liked events
  const { data: likedEvents = [], isLoading, error } = useQuery<Event[]>({
    queryKey: ['/api/events/liked'],
    queryFn: async () => {
      const response = await fetch('/api/events/liked', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch liked events');
      }
      return response.json();
    },
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'networking', label: 'Networking' },
    { value: 'tech', label: 'Technology' },
    { value: 'business', label: 'Business' },
    { value: 'social', label: 'Social' },
    { value: 'educational', label: 'Educational' },
    { value: 'sports', label: 'Sports' },
    { value: 'arts', label: 'Arts & Culture' },
    { value: 'music', label: 'Music' },
    { value: 'food', label: 'Food & Drink' },
    { value: 'other', label: 'Other' },
  ];

  // Filter and sort events
  const filteredAndSortedEvents = likedEvents
    .filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'dateDesc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'attendees':
          return b.attendeeCount - a.attendeeCount;
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Favorites</h2>
          <p className="text-gray-600 mb-4">We couldn't load your favorite events. Please try again later.</p>
          <Link href="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/events">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorite Events</h1>
            <p className="text-gray-600">
              {likedEvents.length} event{likedEvents.length !== 1 ? 's' : ''} saved to your favorites
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search your favorite events..."
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
          
          {/* Sort Options */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (Nearest)</SelectItem>
              <SelectItem value="dateDesc">Date (Latest)</SelectItem>
              <SelectItem value="newest">Recently Added</SelectItem>
              <SelectItem value="attendees">Most Popular</SelectItem>
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
      ) : filteredAndSortedEvents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {likedEvents.length === 0 ? 'No Favorite Events Yet' : 'No Events Match Your Search'}
            </h3>
            <p className="text-gray-600 mb-4">
              {likedEvents.length === 0 
                ? 'Start exploring events and save the ones you like by clicking the heart icon'
                : 'Try adjusting your search or filters to find your favorite events'
              }
            </p>
            <Link href="/events">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Browse Events
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedEvents.map((event) => (
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
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-red-500/90 text-white backdrop-blur-sm">
                      <Heart className="h-3 w-3 mr-1 fill-white" />
                      Favorite
                    </Badge>
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
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary">
                        {categories.find(c => c.value === event.category)?.label || event.category}
                      </Badge>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        <Heart className="h-3 w-3 mr-1 fill-red-500" />
                        Favorite
                      </Badge>
                    </div>
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
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 border-none">
                <Link href="/events" className="flex-1">
                  <Button variant="outline" className="w-full">
                    View All Events
                  </Button>
                </Link>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}