import { useState, useEffect, lazy, Suspense } from 'react';
import LikedProductsContent from '@/components/profile/LikedProductsContent';
import ShoppingCartContent from '@/components/profile/ShoppingCartContent';
import OrdersReturnsContent from '@/components/profile/OrdersReturnsContent';
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
import { 
  Heart, 
  ShoppingCart, 
  Package, 
  Store, 
  ChevronDown, 
  ChevronRight,
  Edit3,
  MessageSquare
} from 'lucide-react';

const ProfilePage = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('personal-info');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/auth');
    }
  }, [isAuthenticated, setLocation]);

  // Texts for translation
  const profileTexts = [
    "Profile & Settings",
    "Liked Products",
    "Shopping Cart", 
    "Orders & Returns",
    "Vendor Account",
    "Account Settings",
    "Personal Information",
    "Email Address",
    "Phone Number",
    "Location",
    "Edit Profile",
    "Save Changes",
    "Cancel",
    "Notification Preferences",
    "Privacy Settings",
    "Security",
    "Language",
    "Currency",
    "Messages",
    "Cart Items",
    "Pending Orders",
    "Vendor Status",
    "Marketplace",
    "Loading...",
    "Full Name",
    "Username",
    "Region",
    "Country",
    "City"
  ];

  const { translations } = useMasterBatchTranslation(profileTexts);
  const t = (index: number) => translations[index] || profileTexts[index];

  // Fetch notification counts for badges
  const { data: likedProducts = [] } = useQuery<any[]>({
    queryKey: ['/api/liked-products'],
    enabled: isAuthenticated,
  });

  const { data: cartData = [] } = useQuery<any[]>({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated,
  });

  const { data: ordersNotifications } = useQuery<{ count: number }>({
    queryKey: ['/api/orders/notifications/count'],
    enabled: isAuthenticated,
  });

  const { data: vendorData } = useQuery<any>({
    queryKey: ['/api/vendors/me'],
    enabled: isAuthenticated,
  });

  const { data: unreadMessagesData } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread/count'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !user) {
    return null;
  }

  const likedCount = Array.isArray(likedProducts) ? likedProducts.length : 0;
  const cartCount = Array.isArray(cartData) ? cartData.length : 0;
  const ordersCount = ordersNotifications?.count || 0;
  const messagesCount = unreadMessagesData?.count || 0;

  const sidebarItems = [
    {
      id: 'liked',
      title: t(1),
      icon: Heart,
      count: likedCount,
      color: 'text-red-500',
      onClick: () => setActiveSection('liked')
    },
    {
      id: 'cart',
      title: t(2),
      icon: ShoppingCart,
      count: cartCount,
      color: 'text-blue-500',
      onClick: () => setLocation('/cart')
    },
    {
      id: 'orders',
      title: t(3),
      icon: Package,
      count: ordersCount,
      color: 'text-green-500',
      onClick: () => setActiveSection('orders')
    },
    {
      id: 'messages',
      title: t(18),
      icon: MessageSquare,
      count: messagesCount,
      color: 'text-blue-500',
      onClick: () => setLocation('/messages')
    },
    {
      id: 'vendor',
      title: t(4),
      icon: Store,
      color: 'text-purple-500',
      onClick: () => setLocation('/vendor-dashboard')
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  // Function to render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'liked':
        return <LikedProductsContent />;
      case 'cart':
        return <ShoppingCartContent />;
      case 'orders':
        return <OrdersReturnsContent />;
      case 'personal-info':
      default:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t(6)}</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/profile-settings')}
                >
                  {t(10)}
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
                  {vendorData && (
                    <Badge variant="outline" className="mt-1">
                      Verified Vendor
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t(24)}</Label>
                  <Input 
                    id="name"
                    value={user.name || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{t(25)}</Label>
                  <Input 
                    id="username"
                    value={user.username || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t(7)}</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t(8)}</Label>
                  <Input 
                    id="phone"
                    value={(user as any)?.phone || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">{t(26)}</Label>
                  <Input 
                    id="region"
                    value={(user as any)?.region || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{t(27)}</Label>
                  <Input 
                    id="country"
                    value={(user as any)?.country || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t(28)}</Label>
                  <Input 
                    id="city"
                    value={(user as any)?.city || ''}
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>
              </div>


              {/* Account Statistics */}
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{likedCount}</div>
                  <div className="text-sm text-gray-600">{t(1)}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{cartCount}</div>
                  <div className="text-sm text-gray-600">{t(19)}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{ordersCount}</div>
                  <div className="text-sm text-gray-600">{t(20)}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{vendorData ? '1' : '0'}</div>
                  <div className="text-sm text-gray-600">{t(21)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-80">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>
                  {t(22)}
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
                >
                  <div className="flex items-center">
                    <span>{t(6)}</span>
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
                  <p>{t(23)}</p>
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

export default ProfilePage;