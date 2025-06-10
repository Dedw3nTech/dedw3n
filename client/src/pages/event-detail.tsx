import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock, ArrowLeft } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  isFree: boolean;
  category: string;
  attendeeCount: number;
  maxAttendees?: number;
  organizer: {
    id: number;
    name: string;
  };
  tags?: string[];
  isAttending?: boolean;
}

export default function EventDetail() {
  const { id } = useParams();
  const { formatPrice } = useCurrency();

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: [`/api/events/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/events">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Event not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/events">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{event.category}</Badge>
                  {event.isFree ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Free
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      {formatPrice(event.price)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3 text-blue-500" />
                  <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-3 text-blue-500" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-3 text-blue-500" />
                  <span>
                    {event.attendeeCount} attending
                    {event.maxAttendees && ` (${event.maxAttendees} max)`}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Organizer</h3>
                  <Link href="/wall">
                    <div className="flex items-center text-gray-600 hover:text-blue-600 cursor-pointer">
                      <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                        {event.organizer.name.charAt(0)}
                      </div>
                      <span>{event.organizer.name}</span>
                    </div>
                  </Link>
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">About this event</h3>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                {event.isAttending 
                  ? 'Attending' 
                  : (event.price === 0 || event.price === null || event.price === undefined) 
                    ? 'Join Event' 
                    : 'Buy Ticket'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}