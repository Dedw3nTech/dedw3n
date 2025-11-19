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
  Briefcase, 
  Clock, 
  CheckCircle,
  Users,
  ChevronRight,
  User,
  Star,
  FileText
} from 'lucide-react';

const ServicesProfilePage = () => {
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
    "Services Profile",
    "My Listings",
    "Active Projects",
    "Client Requests",
    "Completed Jobs",
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
    "Active Count",
    "Listings Count",
    "Provider Status",
    "Loading...",
    "Service Provider",
    "Reviews & Ratings",
    "Service Requests",
    "Job Applications"
  ];

  const { translations } = useMasterBatchTranslation(profileTexts);
  const t = (index: number) => translations[index] || profileTexts[index];

  // Fetch services-specific data
  const { data: myListings = [] } = useQuery<any[]>({
    queryKey: ['/api/services/my-listings'],
    enabled: isAuthenticated,
  });

  const { data: activeProjects = [] } = useQuery<any[]>({
    queryKey: ['/api/services/active-projects'],
    enabled: isAuthenticated,
  });

  const { data: clientRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/services/client-requests'],
    enabled: isAuthenticated,
  });

  const { data: completedJobs = [] } = useQuery<any[]>({
    queryKey: ['/api/services/completed-jobs'],
    enabled: isAuthenticated,
  });

  const { data: providerData } = useQuery<any>({
    queryKey: ['/api/services/provider/me'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !user) {
    return null;
  }

  const listingsCount = Array.isArray(myListings) ? myListings.length : 0;
  const activeCount = Array.isArray(activeProjects) ? activeProjects.length : 0;
  const requestsCount = Array.isArray(clientRequests) ? clientRequests.length : 0;
  const completedCount = Array.isArray(completedJobs) ? completedJobs.length : 0;

  const sidebarItems = [
    {
      id: 'listings',
      title: t(1),
      icon: Briefcase,
      count: listingsCount,
      color: 'text-blue-500',
      onClick: () => setActiveSection('listings')
    },
    {
      id: 'active-projects',
      title: t(2),
      icon: Clock,
      count: activeCount,
      color: 'text-orange-500',
      onClick: () => setActiveSection('active-projects')
    },
    {
      id: 'requests',
      title: t(3),
      icon: FileText,
      count: requestsCount,
      color: 'text-purple-500',
      onClick: () => setActiveSection('requests')
    },
    {
      id: 'completed',
      title: t(4),
      icon: CheckCircle,
      count: completedCount,
      color: 'text-green-500',
      onClick: () => setActiveSection('completed')
    },
    {
      id: 'reviews',
      title: t(21),
      icon: Star,
      color: 'text-yellow-500',
      onClick: () => setActiveSection('reviews')
    }
  ];

  // Function to render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'listings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              {listingsCount > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myListings.map((listing: any) => (
                    <div 
                      key={listing.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setLocation(`/services/listing/${listing.id}`)}
                      data-testid={`listing-${listing.id}`}
                    >
                      <h3 className="font-semibold text-sm">{listing.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{listing.category}</p>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline" className="text-xs">
                          {listing.status}
                        </Badge>
                        {listing.price && (
                          <span className="text-sm font-semibold">${listing.price}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No service listings yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setLocation('/add-product?type=service')}
                  >
                    Create a Listing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'active-projects':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeCount > 0 ? (
                <div className="space-y-3">
                  {activeProjects.map((project: any) => (
                    <div 
                      key={project.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`project-${project.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-sm">{project.title}</h3>
                          <p className="text-xs text-gray-600 mt-1">Client: {project.clientName}</p>
                          <p className="text-xs text-gray-600">Started: {project.startDate}</p>
                        </div>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                          In Progress
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No active projects</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'requests':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t(3)}</CardTitle>
            </CardHeader>
            <CardContent>
              {requestsCount > 0 ? (
                <div className="space-y-3">
                  {clientRequests.map((request: any) => (
                    <div 
                      key={request.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`request-${request.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-sm">{request.serviceTitle}</h3>
                          <p className="text-xs text-gray-600 mt-1">From: {request.clientName}</p>
                          <p className="text-xs text-gray-600">Received: {request.receivedDate}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No client requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'completed':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t(4)}</CardTitle>
            </CardHeader>
            <CardContent>
              {completedCount > 0 ? (
                <div className="space-y-3">
                  {completedJobs.map((job: any) => (
                    <div 
                      key={job.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`completed-job-${job.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-sm">{job.title}</h3>
                          <p className="text-xs text-gray-600 mt-1">Client: {job.clientName}</p>
                          <p className="text-xs text-gray-600">Completed: {job.completedDate}</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No completed jobs yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'reviews':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t(21)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Your reviews and ratings will appear here</p>
                {providerData?.rating && (
                  <div className="mt-4">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      ⭐ {providerData.rating} / 5
                    </Badge>
                  </div>
                )}
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

              {/* Services Statistics */}
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{listingsCount}</div>
                  <div className="text-sm text-gray-600">{t(18)}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{activeCount}</div>
                  <div className="text-sm text-gray-600">{t(17)}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{completedCount}</div>
                  <div className="text-sm text-gray-600">{t(4)}</div>
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
                value="listings" 
                className="flex flex-col items-center py-2 px-1 data-[state=active]:bg-black data-[state=active]:text-white text-xs"
                data-testid="tab-listings-mobile"
              >
                <Briefcase className="h-4 w-4 mb-1" />
                <span className="truncate">{t(1)}</span>
                {listingsCount > 0 && (
                  <Badge variant="secondary" className="mt-1 bg-blue-500 text-white text-[10px] h-4 px-1">
                    {listingsCount > 99 ? '99+' : listingsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="active-projects" 
                className="flex flex-col items-center py-2 px-1 data-[state=active]:bg-black data-[state=active]:text-white text-xs"
                data-testid="tab-active-mobile"
              >
                <Clock className="h-4 w-4 mb-1" />
                <span className="truncate">{t(2)}</span>
                {activeCount > 0 && (
                  <Badge variant="secondary" className="mt-1 bg-orange-500 text-white text-[10px] h-4 px-1">
                    {activeCount > 99 ? '99+' : activeCount}
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
              onClick={() => setActiveSection('requests')}
              data-testid="button-requests-mobile"
            >
              <FileText className="h-3.5 w-3.5" />
              {t(3)}
              {requestsCount > 0 && (
                <Badge variant="secondary" className="bg-purple-500 text-white text-[10px] h-4 px-1.5">
                  {requestsCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap text-xs h-9"
              onClick={() => setActiveSection('completed')}
              data-testid="button-completed-mobile"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {t(4)}
              {completedCount > 0 && (
                <Badge variant="secondary" className="bg-green-500 text-white text-[10px] h-4 px-1.5">
                  {completedCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap text-xs h-9"
              onClick={() => setActiveSection('reviews')}
              data-testid="button-reviews-mobile"
            >
              <Star className="h-3.5 w-3.5" />
              {t(21)}
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

export default ServicesProfilePage;
