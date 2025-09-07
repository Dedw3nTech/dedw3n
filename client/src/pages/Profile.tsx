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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  ShoppingCart, 
  Package, 
  Store, 
  User, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Edit3,
  Camera
} from 'lucide-react';

const ProfilePage = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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
    "Currency"
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

  const { data: vendorData } = useQuery({
    queryKey: ['/api/vendors/me'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !user) {
    return null;
  }

  const likedCount = Array.isArray(likedProducts) ? likedProducts.length : 0;
  const cartCount = Array.isArray(cartData) ? cartData.length : 0;
  const ordersCount = ordersNotifications?.count || 0;

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
      onClick: () => setActiveSection('cart')
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
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isEditing ? t(12) : t(10)}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatar || ''} alt={user.name || user.username} />
                    <AvatarFallback className="text-2xl">
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button 
                      size="sm" 
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
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
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name"
                    value={user.name || ''}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username"
                    value={user.username || ''}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t(7)}</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t(8)}</Label>
                  <Input 
                    id="phone"
                    value={(user as any)?.phone || ''}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">{t(9)}</Label>
                  <Input 
                    id="location"
                    value={(user as any)?.location || ''}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-4">
                  <Button>
                    {t(11)}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    {t(12)}
                  </Button>
                </div>
              )}

              {/* Account Statistics */}
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{likedCount}</div>
                  <div className="text-sm text-gray-600">{t(1)}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{cartCount}</div>
                  <div className="text-sm text-gray-600">Cart Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{ordersCount}</div>
                  <div className="text-sm text-gray-600">Pending Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{vendorData ? '1' : '0'}</div>
                  <div className="text-sm text-gray-600">Vendor Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-80">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t(0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Profile Summary */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || ''} alt={user.name || user.username} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
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
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                      <span>{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.count !== undefined && item.count > 0 && (
                        <Badge variant="secondary" className="bg-red-100 text-red-600 text-xs">
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
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-500" />
                    <span>{t(6)}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>

                <Separator className="my-4" />

                {/* Settings Sections */}
                <Button
                  variant="ghost"
                  className="w-full justify-between h-12 px-4"
                  onClick={() => toggleSection('settings')}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <span>{t(5)}</span>
                  </div>
                  {expandedSection === 'settings' ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </Button>

                {expandedSection === 'settings' && (
                  <div className="ml-8 space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                      {t(13)}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                      {t(14)}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                      {t(15)}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-black rounded-full mx-auto mb-4"></div>
                  <p>Loading...</p>
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