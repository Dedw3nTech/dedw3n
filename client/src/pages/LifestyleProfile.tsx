import { useState, useEffect, Suspense } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Calendar, 
  Utensils, 
  MapPin,
  ChevronRight,
  User,
  Clock,
  Star
} from 'lucide-react';

const LifestyleProfilePage = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [activeSection, setActiveSection] = useState<string>('personal-info');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/auth');
    }
  }, [isAuthenticated, setLocation]);

  // Texts for translation
  const profileTexts = [
    "Lifestyle Profile",
    "Liked Services",
    "My Bookings",
    "Reservations",
    "Service Provider",
    "Personal Information",
    "Email Address",
    "Phone Number",
    "Location",
    "Edit Profile",
    "Save Changes",
    "Cancel",
    "Full Name",
    "Username",
    "Region",
    "Country",
    "City",
    "Active Bookings",
    "Liked Count",
    "Provider Status",
    "Loading...",
    "Favorite Restaurants",
    "Upcoming Reservations",
    "Service Requests",
    "Reviews & Ratings"
  ];

  const { translations } = useMasterBatchTranslation(profileTexts);
  const t = (index: number) => translations[index] || profileTexts[index];

  // Fetch lifestyle-specific data
  const { data: likedServices = [] } = useQuery<any[]>({
    queryKey: ['/api/lifestyle/liked-services'],
    enabled: isAuthenticated,
  });

  const { data: bookingsData = [] } = useQuery<any[]>({
    queryKey: ['/api/lifestyle/bookings'],
    enabled: isAuthenticated,
  });

  const { data: reservationsData = [] } = useQuery<any[]>({
    queryKey: ['/api/lifestyle/reservations'],
    enabled: isAuthenticated,
  });

  const { data: providerData } = useQuery<any>({
    queryKey: ['/api/lifestyle/provider/me'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !user) {
    return null;
  }

  const likedCount = Array.isArray(likedServices) ? likedServices.length : 0;
  const bookingsCount = Array.isArray(bookingsData) ? bookingsData.length : 0;
  const reservationsCount = Array.isArray(reservationsData) ? reservationsData.length : 0;

  const sidebarItems = [
    {
      id: 'liked-services',
      title: t(1),
      icon: Heart,
      count: likedCount,
      color: 'text-red-500',
      onClick: () => setActiveSection('liked-services')
    },
    {
      id: 'bookings',
      title: t(2),
      icon: Clock,
      count: bookingsCount,
      color: 'text-blue-500',
      onClick: () => setActiveSection('bookings')
    },
    {
      id: 'reservations',
      title: t(3),
      icon: Calendar,
      count: reservationsCount,
      color: 'text-green-500',
      onClick: () => setActiveSection('reservations')
    },
    {
      id: 'favorites',
      title: t(21),
      icon: Star,
      color: 'text-yellow-500',
      onClick: () => setActiveSection('favorites')
    },
    {
      id: 'provider',
      title: t(4),
      icon: Utensils,
      color: 'text-purple-500',
      onClick: () => setLocation('/lifestyle/provider-dashboard')
    }
  ];

  // Function to render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'liked-services':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              {likedCount > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {likedServices.map((service: any) => (
                    <div 
                      key={service.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setLocation(`/lifestyle/service/${service.id}`)}
                      data-testid={`liked-service-${service.id}`}
                    >
                      <h3 className="font-semibold text-sm">{service.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{service.category}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No liked services yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'bookings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsCount > 0 ? (
                <div className="space-y-3">
                  {bookingsData.map((booking: any) => (
                    <div 
                      key={booking.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`booking-${booking.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-sm">{booking.serviceName}</h3>
                          <p className="text-xs text-gray-600 mt-1">{booking.date} at {booking.time}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No bookings yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'reservations':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t(3)}</CardTitle>
            </CardHeader>
            <CardContent>
              {reservationsCount > 0 ? (
                <div className="space-y-3">
                  {reservationsData.map((reservation: any) => (
                    <div 
                      key={reservation.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`reservation-${reservation.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-sm">{reservation.venueName}</h3>
                          <p className="text-xs text-gray-600 mt-1">
                            {reservation.date} • {reservation.partySize} guests
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {reservation.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No reservations yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'favorites':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t(21)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Your favorite places will appear here</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'personal-info':
      default:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t(5)}</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/profile-settings')}
                  data-testid="button-edit-profile"
                >
                  {t(9)}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <UserAvatar 
                    userId={user.id} 
                    username={user.username} 
                    size="xl"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.name || user.username}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  {providerData && (
                    <Badge variant="outline" className="mt-1">
                      Verified Service Provider
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t(12)}</Label>
                  <Input 
                    id="name"
                    value={user.name || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{t(13)}</Label>
                  <Input 
                    id="username"
                    value={user.username || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t(6)}</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t(7)}</Label>
                  <Input 
                    id="phone"
                    value={(user as any)?.phone || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">{t(14)}</Label>
                  <Input 
                    id="region"
                    value={(user as any)?.region || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{t(15)}</Label>
                  <Input 
                    id="country"
                    value={(user as any)?.country || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t(16)}</Label>
                  <Input 
                    id="city"
                    value={(user as any)?.city || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>
              </div>

              {/* Lifestyle Statistics */}
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{likedCount}</div>
                  <div className="text-sm text-gray-600">{t(18)}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{bookingsCount}</div>
                  <div className="text-sm text-gray-600">{t(17)}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{reservationsCount}</div>
                  <div className="text-sm text-gray-600">{t(22)}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{providerData ? '1' : '0'}</div>
                  <div className="text-sm text-gray-600">{t(19)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden mb-4">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto gap-1 bg-gray-100 p-1">
              <TabsTrigger 
                value="liked-services" 
                className="flex flex-col items-center py-2 px-1 data-[state=active]:bg-black data-[state=active]:text-white text-xs"
                data-testid="tab-liked-services-mobile"
              >
                <Heart className="h-4 w-4 mb-1" />
                <span className="truncate">{t(1)}</span>
                {likedCount > 0 && (
                  <Badge variant="secondary" className="mt-1 bg-red-500 text-white text-[10px] h-4 px-1">
                    {likedCount > 99 ? '99+' : likedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="bookings" 
                className="flex flex-col items-center py-2 px-1 data-[state=active]:bg-black data-[state=active]:text-white text-xs"
                data-testid="tab-bookings-mobile"
              >
                <Clock className="h-4 w-4 mb-1" />
                <span className="truncate">{t(2)}</span>
                {bookingsCount > 0 && (
                  <Badge variant="secondary" className="mt-1 bg-blue-500 text-white text-[10px] h-4 px-1">
                    {bookingsCount > 99 ? '99+' : bookingsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="personal-info" 
                className="flex flex-col items-center py-2 px-1 data-[state=active]:bg-black data-[state=active]:text-white text-xs"
                data-testid="tab-profile-mobile"
              >
                <User className="h-4 w-4 mb-1" />
                <span className="truncate">{t(5)}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Secondary mobile actions */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap text-xs h-9"
              onClick={() => setActiveSection('reservations')}
              data-testid="button-reservations-mobile"
            >
              <Calendar className="h-3.5 w-3.5" />
              {t(3)}
              {reservationsCount > 0 && (
                <Badge variant="secondary" className="bg-green-500 text-white text-[10px] h-4 px-1.5">
                  {reservationsCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap text-xs h-9"
              onClick={() => setActiveSection('favorites')}
              data-testid="button-favorites-mobile"
            >
              <Star className="h-3.5 w-3.5" />
              {t(21)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap text-xs h-9"
              onClick={() => setLocation('/lifestyle/provider-dashboard')}
              data-testid="button-provider-mobile"
            >
              <Utensils className="h-3.5 w-3.5" />
              {t(4)}
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Desktop Left Sidebar - Hidden on Mobile */}
          <div className="hidden lg:block w-full lg:w-80">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>
                  {t(0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Profile Summary */}
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg mb-4">
                  <UserAvatar 
                    userId={user.id} 
                    username={user.username} 
                    size="md"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{user.name || user.username}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>

                {/* Navigation Menu */}
                {sidebarItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    className={`w-full justify-between h-12 px-4 ${
                      activeSection === item.id ? 'bg-black text-white hover:bg-gray-800' : ''
                    }`}
                    onClick={item.onClick}
                    data-testid={`button-${item.id}-desktop`}
                  >
                    <div className="flex items-center">
                      <span>{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.count !== undefined && item.count > 0 && (
                        <Badge variant="secondary" className="bg-black text-white text-xs">
                          {item.count > 99 ? '99+' : item.count}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Button>
                ))}

                {/* Personal Information Button */}
                <Button
                  variant={activeSection === 'personal-info' ? "default" : "ghost"}
                  className={`w-full justify-between h-12 px-4 ${
                    activeSection === 'personal-info' ? 'bg-black text-white hover:bg-gray-800' : ''
                  }`}
                  onClick={() => setActiveSection('personal-info')}
                  data-testid="button-personal-info-desktop"
                >
                  <div className="flex items-center">
                    <span>{t(5)}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-black rounded-full mx-auto mb-4"></div>
                  <p>{t(20)}</p>
                </CardContent>
              </Card>
            }>
              {renderContent()}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifestyleProfilePage;
