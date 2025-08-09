import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, ShoppingBag, MessageCircle, Heart, Users, Calendar, 
  TrendingUp, Star, MapPin, Filter, User, Home, Bell, 
  Plus, Play, ChevronRight, Grid3X3, Image as ImageIcon,
  Camera, Video, Mic, Send, ThumbsUp, Share2, Bookmark,
  ShoppingCart, Package, CreditCard, Clock, Gift
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/hooks/use-currency';
import { useMasterTranslation } from '@/hooks/use-master-translation';
import { useMessaging } from '@/hooks/use-messaging';
import { SEOHead } from '@/components/seo/SEOHead';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Simple currency formatter
const formatCurrency = (amount: number, currencyCode: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || 'USD'
  }).format(amount);
};

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  vendorId: number;
  vendorName: string;
  category: string;
  rating: number;
  reviewCount: number;
  isLiked: boolean;
}

interface Post {
  id: number;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  category: 'social' | 'community' | 'dating' | 'marketplace';
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
  attendeeCount: number;
  category: string;
  isAttending: boolean;
}

interface User {
  id: number;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  location?: string;
  age?: number;
  interests: string[];
  isFollowing: boolean;
}

export default function MobileLanding() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { currency } = useCurrency();
  const { translateText: t } = useMasterTranslation();
  const { unreadCount } = useMessaging();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchTerm, setSearchTerm] = useState('');

  // API Queries with real backend connectivity
  const { data: featuredProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['/api/products/featured'],
    enabled: activeTab === 'marketplace'
  });

  const { data: trendingPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['/api/posts/trending'],
    enabled: activeTab === 'social'
  });

  const { data: communityPosts = [], isLoading: loadingCommunity } = useQuery({
    queryKey: ['/api/community/posts'],
    enabled: activeTab === 'community'
  });

  const { data: datingProfiles = [], isLoading: loadingDating } = useQuery({
    queryKey: ['/api/dating/featured-profiles'],
    enabled: activeTab === 'dating'
  });

  const { data: upcomingEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['/api/events/upcoming'],
    enabled: activeTab === 'events'
  });

  const { data: marketplaceStats } = useQuery({
    queryKey: ['/api/marketplace/stats']
  });

  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    enabled: isAuthenticated
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications/unread'],
    enabled: isAuthenticated
  });

  // Quick actions with API integration
  const likeMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'product' | 'post'; id: number }) => {
      return apiRequest(`/api/${type}s/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({ title: t('Liked successfully!') });
    }
  });

  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({ title: t('Following user') });
    }
  });

  const attendEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest(`/api/events/${eventId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({ title: t('Event added to calendar') });
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest('/api/cart/add', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      });
    },
    onSuccess: () => {
      toast({ title: t('Added to cart') });
    }
  });

  // Quick actions handlers
  const handleLike = (type: 'product' | 'post', id: number) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }
    likeMutation.mutate({ type, id });
  };

  const handleFollow = (userId: number) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }
    followMutation.mutate(userId);
  };

  const handleAttendEvent = (eventId: number) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }
    attendEventMutation.mutate(eventId);
  };

  const handleAddToCart = (productId: number) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }
    addToCartMutation.mutate(productId);
  };

  // Search functionality
  const handleSearch = () => {
    if (searchTerm.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchTerm)}&type=${activeTab}`);
    }
  };

  return (
    <>
      <SEOHead 
        title={t("Dedw3n - Mobile Marketplace & Social Platform")}
        description={t("Discover, connect, and shop on Dedw3n's mobile platform. Marketplace, social networking, dating, and events all in one place.")}
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/">
              <img 
                src="/attached_assets/hero-image-mobile.png" 
                alt="Dedw3n" 
                className="h-8 w-auto"
              />
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/notifications">
                    <Bell className="h-5 w-5" />
                    {Array.isArray(notifications) && notifications.length > 0 && (
                      <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                        {notifications.length}
                      </Badge>
                    )}
                  </Link>
                </Button>
                
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/messages">
                    <MessageCircle className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
                
                <Link href="/profile">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/auth">{t('Login')}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth">{t('Sign Up')}</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t(`Search ${activeTab}...`) || 'Search...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section with Background Image */}
        <section className="relative h-64 overflow-hidden">
          <img 
            src="/attached_assets/hero-image-mobile.png"
            alt="Spend more time enjoying life - Dedw3n"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-2xl font-bold mb-2">{t('Welcome to Dedw3n')}</h1>
              <p className="text-lg opacity-90">{t('Spend more time enjoying life.')}</p>
            </div>
          </div>
        </section>

        {/* Platform Stats */}
        {marketplaceStats && (
          <section className="bg-white py-4">
            <div className="px-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">{(marketplaceStats as any)?.totalProducts?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">{t('Products')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{(marketplaceStats as any)?.totalVendors?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">{t('Vendors')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">{(marketplaceStats as any)?.totalUsers?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">{t('Users')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">{(marketplaceStats as any)?.totalOrders?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">{t('Orders')}</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Content Tabs */}
        <section className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white border-b">
              <TabsTrigger value="marketplace" className="flex flex-col items-center py-2">
                <ShoppingBag className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('Shop')}</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex flex-col items-center py-2">
                <Users className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('Social')}</span>
              </TabsTrigger>
              <TabsTrigger value="community" className="flex flex-col items-center py-2">
                <MessageCircle className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('Community')}</span>
              </TabsTrigger>
              <TabsTrigger value="dating" className="flex flex-col items-center py-2">
                <Heart className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('Dating')}</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex flex-col items-center py-2">
                <Calendar className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('Events')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('Featured Products')}</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/products">{t('View All')} <ChevronRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                      <div className="bg-gray-200 h-4 rounded mb-1"></div>
                      <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(featuredProducts as Product[]).slice(0, 6).map((product: Product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="relative aspect-square">
                        <img 
                          src={product.imageUrl || '/placeholder-product.jpg'} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm"
                          onClick={() => handleLike('product', product.id)}
                        >
                          <Heart className={`h-4 w-4 ${product.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-1">{product.title}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(product.price, product.currency || currency)}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                            {product.rating}
                          </div>
                        </div>
                        <div className="flex space-x-1 mt-2">
                          <Button size="sm" className="flex-1" onClick={() => handleAddToCart(product.id)}>
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {t('Add')}
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/product/${product.id}`}>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button variant="outline" className="h-16 flex flex-col items-center" asChild>
                  <Link href="/add-product">
                    <Plus className="h-6 w-6 mb-1" />
                    {t('Sell Item')}
                  </Link>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center" asChild>
                  <Link href="/cart">
                    <ShoppingCart className="h-6 w-6 mb-1" />
                    {t('My Cart')}
                  </Link>
                </Button>
              </div>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('Trending Posts')}</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/social">{t('View All')} <ChevronRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>

              {loadingPosts ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white p-4 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-gray-200 h-10 w-10 rounded-full"></div>
                        <div className="flex-1">
                          <div className="bg-gray-200 h-4 rounded w-1/3 mb-1"></div>
                          <div className="bg-gray-200 h-3 rounded w-1/4"></div>
                        </div>
                      </div>
                      <div className="bg-gray-200 h-32 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {(trendingPosts as Post[]).slice(0, 5).map((post: Post) => (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar>
                            <AvatarImage src={post.authorAvatar} />
                            <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{post.authorName}</h4>
                            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-3">{post.content}</p>
                        
                        {post.imageUrl && (
                          <img 
                            src={post.imageUrl} 
                            alt="Post image"
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-4">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleLike('post', post.id)}
                            >
                              <ThumbsUp className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-blue-500 text-blue-500' : ''}`} />
                              {post.likesCount}
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/post/${post.id}`}>
                                <MessageCircle className="h-4 w-4 mr-1" />
                                {post.commentsCount}
                              </Link>
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <Button variant="outline" className="h-16 flex flex-col items-center" asChild>
                  <Link href="/social?action=post">
                    <Camera className="h-6 w-6 mb-1" />
                    {t('Photo')}
                  </Link>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center" asChild>
                  <Link href="/social?action=video">
                    <Video className="h-6 w-6 mb-1" />
                    {t('Video')}
                  </Link>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center" asChild>
                  <Link href="/social?action=text">
                    <Send className="h-6 w-6 mb-1" />
                    {t('Post')}
                  </Link>
                </Button>
              </div>
            </TabsContent>

            {/* Community Tab */}
            <TabsContent value="community" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('Community Discussions')}</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/community">{t('View All')} <ChevronRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>

              {loadingCommunity ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-200 h-8 w-8 rounded-full"></div>
                        <div className="flex-1">
                          <div className="bg-gray-200 h-4 rounded w-2/3 mb-1"></div>
                          <div className="bg-gray-200 h-3 rounded w-1/3"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(communityPosts as Post[]).slice(0, 6).map((post: Post) => (
                    <Card key={post.id} className="cursor-pointer">
                      <Link href={`/community/post/${post.id}`} className="block">
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={post.authorAvatar} />
                              <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{post.content}</h4>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{post.authorName}</span>
                                <span>•</span>
                                <span>{post.likesCount} {t('likes')}</span>
                                <span>•</span>
                                <span>{post.commentsCount} {t('replies')}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Dating Tab */}
            <TabsContent value="dating" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('Featured Profiles')}</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dating">{t('View All')} <ChevronRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>

              {loadingDating ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-2"></div>
                      <div className="bg-gray-200 h-4 rounded mb-1"></div>
                      <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(datingProfiles as User[]).slice(0, 4).map((profile: User) => (
                    <Card key={profile.id} className="overflow-hidden">
                      <div className="relative aspect-[3/4]">
                        <img 
                          src={profile.avatar || '/placeholder-avatar.jpg'} 
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <h3 className="text-white font-medium">{profile.name}</h3>
                          <p className="text-white/80 text-sm">{profile.age && `${profile.age} • `}{profile.location}</p>
                        </div>
                        <div className="absolute top-2 right-2">
                          <div className={`w-3 h-3 rounded-full ${profile.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleFollow(profile.id)}
                          >
                            <Heart className="h-3 w-3 mr-1" />
                            {profile.isFollowing ? t('Following') : t('Follow')}
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dating/profile/${profile.id}`}>
                              <MessageCircle className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('Upcoming Events')}</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/events">{t('View All')} <ChevronRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>

              {loadingEvents ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white p-3 rounded-lg">
                      <div className="flex space-x-3">
                        <div className="bg-gray-200 h-16 w-16 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="bg-gray-200 h-4 rounded w-2/3 mb-2"></div>
                          <div className="bg-gray-200 h-3 rounded w-1/2 mb-1"></div>
                          <div className="bg-gray-200 h-3 rounded w-1/3"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(upcomingEvents as Event[]).slice(0, 5).map((event: Event) => (
                    <Card key={event.id}>
                      <CardContent className="p-3">
                        <div className="flex space-x-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {event.imageUrl ? (
                              <img 
                                src={event.imageUrl} 
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-1">{event.title}</h3>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {event.attendeeCount} {t('attending')}
                              </span>
                              <Button 
                                size="sm" 
                                variant={event.isAttending ? "outline" : "default"}
                                onClick={() => handleAttendEvent(event.id)}
                              >
                                {event.isAttending ? t('Going') : t('Attend')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Bottom Navigation */}
        <nav className="sticky bottom-0 bg-white border-t border-gray-200 p-2">
          <div className="grid grid-cols-5 gap-1">
            <Button variant="ghost" size="sm" className="flex flex-col items-center py-2" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('Home')}</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center py-2" asChild>
              <Link href="/explore">
                <Search className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('Explore')}</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center py-2" asChild>
              <Link href="/add-product">
                <Plus className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('Create')}</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center py-2" asChild>
              <Link href="/favorites">
                <Heart className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('Liked')}</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center py-2" asChild>
              <Link href="/profile">
                <User className="h-4 w-4 mb-1" />
                <span className="text-xs">{t('Profile')}</span>
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}