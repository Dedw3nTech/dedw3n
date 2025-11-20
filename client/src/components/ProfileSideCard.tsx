import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bell, Settings, Users, Heart, Star, Plus, PlusCircle, ShoppingCart, Store, Calendar, Bookmark, FileText } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useCallback } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";

interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  datingEnabled?: boolean;
}

export function ProfileSideCard() {
  const { data: user, isLoading} = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - rely on cache invalidation for updates
    refetchOnMount: false, // Don't refetch on mount - use cache invalidation instead
    refetchOnWindowFocus: false, // Don't refetch on focus - rely on cache invalidation
  });

  // Fetch unread message count
  const { data: unreadMessagesData } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread/count'],
    retry: false,
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch unread notifications count (includes comments and reactions)
  const { data: unreadNotificationsData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread/count'],
    retry: false,
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch pending friend requests count
  const { data: pendingFriendRequestsData } = useQuery<{ count: number }>({
    queryKey: ['/api/friends/pending/count'],
    retry: false,
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Calculate total count
  const totalCount = 
    (unreadMessagesData?.count || 0) + 
    (unreadNotificationsData?.count || 0) + 
    (pendingFriendRequestsData?.count || 0);

  // Profile card texts for translation
  const profileTexts = [
    "Open to Date", "Notifications", "Messages", "Friend Requests", "Saved", "Drafts", "Events", "Settings", 
    "Vendor Panel", "Dating Panel", "View Full Profile", 
    "Sell Product/Service", "Trending Events", "Tech Startup Meetup",
    "London • Tonight 7 PM", "Free", "attending", "Coffee & Code",
    "Manchester • Tomorrow 10 AM", "Art Gallery Opening", "Birmingham • This Weekend",
    "View All Events", "Quick Links", "About Us", "Careers", "Contact", 
    "FAQ", "Tips & Tricks", "Terms of Service", "Privacy Policy", "Cookie Policy",
    "Download App", "Download on the", "App Store", "Get it on", "Google Play",
    "© 2025 Dedw3n. All rights reserved.", "View Profile"
  ];

  const { translations: profileTranslations } = useMasterBatchTranslation(profileTexts, 'normal');

  // Helper function to get translation safely
  const getTranslation = useCallback((text: string, fallback?: string) => {
    if (profileTranslations && Array.isArray(profileTranslations)) {
      const textIndex = profileTexts.indexOf(text);
      if (textIndex !== -1 && profileTranslations[textIndex]) {
        return profileTranslations[textIndex];
      }
    }
    return fallback || text;
  }, [profileTranslations, profileTexts]);

  if (isLoading) {
    return (
      <Card className="w-full bg-white">
        <CardContent className="p-4 bg-white">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : user.username.substring(0, 2).toUpperCase();

  // Utility function to truncate long text
  const truncateText = (text: string, maxLength: number = 20): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-full">
      <Card className="w-full bg-white">
        <CardHeader className="pb-3 bg-white">
          <Link href={`/profile/${user.username}`} className="block">
            <div className="flex flex-col items-center text-center cursor-pointer rounded-lg p-2">
              <div className="relative mb-3">
                <UserAvatar 
                  userId={user.id} 
                  username={user.username} 
                  size="xl"
                />
                {totalCount > 0 && (
                  <div 
                    className="absolute -top-1 -right-1 bg-black text-white rounded-full min-w-[36px] h-9 px-2 flex items-center justify-center text-sm font-semibold border-2 border-white"
                    data-testid="badge-total-count"
                    title={`${unreadMessagesData?.count || 0} messages, ${unreadNotificationsData?.count || 0} notifications, ${pendingFriendRequestsData?.count || 0} friend requests`}
                  >
                    {totalCount > 99 ? '99+' : totalCount}
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-lg text-black break-words w-full overflow-hidden text-ellipsis line-clamp-2" title={user.name || user.username}>
                {user.name || user.username}
              </h3>
              
              <p className="text-sm text-black mb-3 break-words w-full overflow-hidden text-ellipsis" title={`@${user.username}`}>
                @{truncateText(user.username, 18)}
              </p>
              
              {user.datingEnabled && (
                <Badge variant="secondary" className="bg-pink-100 text-pink-700 border-pink-200">
                  <Heart className="h-3 w-3 mr-1" />
                  {getTranslation("Open to Date")}
                </Badge>
              )}
            </div>
          </Link>
        </CardHeader>
        
        <CardContent className="px-0 py-3 bg-white">
          {/* Quick Actions */}
          <div className="space-y-2">
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-auto min-h-10 text-left text-black px-6"
            >
              <Link href={`/profile/${user.username}`}>
                <span className="break-words flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={getTranslation('View Profile')}>{getTranslation('View Profile')}</span>
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-auto min-h-10 text-left text-black px-6"
            >
              <Link href="/notifications">
                <span className="break-words flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={getTranslation('Notifications')}>{getTranslation('Notifications')}</span>
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-auto min-h-10 text-left text-black px-6"
            >
              <Link href="/messages">
                <span className="break-words flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={getTranslation('Messages')}>{getTranslation('Messages')}</span>
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-auto min-h-10 text-left text-black px-6"
            >
              <Link href="/friend-requests">
                <span className="break-words flex-1 overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-between" title={getTranslation('Friend Requests')}>
                  {getTranslation('Friend Requests')}
                  {pendingFriendRequestsData && pendingFriendRequestsData.count > 0 && (
                    <span 
                      className="bg-black text-white rounded-full min-w-[20px] h-5 px-1.5 text-xs flex items-center justify-center ml-2"
                      data-testid="badge-friend-requests-count"
                    >
                      {pendingFriendRequestsData.count > 99 ? '99+' : pendingFriendRequestsData.count}
                    </span>
                  )}
                </span>
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-auto min-h-10 text-left text-black px-6"
            >
              <Link href="/saved-posts">
                <span className="break-words flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={getTranslation('Saved')}>{getTranslation('Saved')}</span>
              </Link>
            </Button>

            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-auto min-h-10 text-left text-black px-6"
            >
              <Link href="/drafts">
                <span className="break-words flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={getTranslation('Drafts')}>{getTranslation('Drafts')}</span>
              </Link>
            </Button>

            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-auto min-h-10 text-left text-black px-6"
            >
              <Link href="/settings">
                <span className="break-words flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={getTranslation('Settings')}>{getTranslation('Settings')}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Information Card */}
      <div className="bg-white rounded-lg shadow-sm border py-8 px-0 mt-8">
        <div className="space-y-6 px-6">
          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-black mb-4 overflow-hidden text-ellipsis whitespace-nowrap">{getTranslation('Quick Links')}</h4>
            <div className="flex flex-col gap-2 text-xs">
              <Link href="/about" className="block text-black py-2 hover:underline overflow-hidden text-ellipsis whitespace-nowrap" data-testid="link-about-us" title={getTranslation('About Us')}>{getTranslation('About Us')}</Link>
              <Link href="/careers" className="block text-black py-2 hover:underline overflow-hidden text-ellipsis whitespace-nowrap" data-testid="link-careers" title={getTranslation('Careers')}>{getTranslation('Careers')}</Link>
              <Link href="/contact" className="block text-black py-2 hover:underline overflow-hidden text-ellipsis whitespace-nowrap" data-testid="link-contact-us" title={getTranslation('Contact')}>{getTranslation('Contact')}</Link>
              <Link href="/faq" className="block text-black py-2 hover:underline overflow-hidden text-ellipsis whitespace-nowrap" data-testid="link-faq" title={getTranslation('FAQ')}>{getTranslation('FAQ')}</Link>
              <Link href="/tips-tricks" className="block text-black py-2 hover:underline overflow-hidden text-ellipsis whitespace-nowrap" data-testid="link-tips-tricks" title={getTranslation('Tips & Tricks')}>{getTranslation('Tips & Tricks')}</Link>
              <Link href="/terms" className="block text-black py-2 hover:underline overflow-hidden text-ellipsis whitespace-nowrap" data-testid="link-terms" title={getTranslation('Terms of Service')}>{getTranslation('Terms of Service')}</Link>
              <Link href="/privacy" className="block text-black py-2 hover:underline overflow-hidden text-ellipsis whitespace-nowrap" data-testid="link-privacy" title={getTranslation('Privacy Policy')}>{getTranslation('Privacy Policy')}</Link>
              <Link href="/cookies" className="block text-black py-2 hover:underline overflow-hidden text-ellipsis whitespace-nowrap" data-testid="link-cookies" title={getTranslation('Cookie Policy')}>{getTranslation('Cookie Policy')}</Link>
            </div>
          </div>

          {/* App Downloads */}
          <div>
            <h4 className="text-xs font-semibold text-black mb-4">{getTranslation('Download App')}</h4>
            <div className="space-y-4">
              <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
                 className="block hover:opacity-80 transition-opacity">
                <svg width="240" height="70" viewBox="0 0 120 35" className="w-full h-auto">
                  <rect width="120" height="35" rx="6" fill="#000000"/>
                  <text x="70" y="12" textAnchor="middle" fill="white" fontSize="8" fontWeight="300">{getTranslation('Download on the')}</text>
                  <text x="70" y="25" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">{getTranslation('App Store')}</text>
                  {/* Apple Logo */}
                  <g transform="translate(15, 10)">
                    <path d="M12.5 2.5c0.8-1 1.3-2.4 1.2-3.8-1.2 0.1-2.6 0.8-3.5 1.8-0.7 0.9-1.4 2.3-1.2 3.7 1.3 0.1 2.6-0.7 3.5-1.7zm1.2 1.9c-1.9-0.1-3.6 1.1-4.5 1.1-0.9 0-2.3-1-3.8-1-1.9 0-3.7 1.1-4.7 2.8-2 3.5-0.5 8.7 1.4 11.5 0.9 1.4 2 2.9 3.4 2.8 1.4-0.1 1.9-0.9 3.6-0.9s2.1 0.9 3.6 0.9c1.5 0 2.4-1.3 3.3-2.7 1-1.6 1.4-3.1 1.4-3.2-0.1 0-2.7-1-2.7-4.2 0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.3-2.1-4-2.1z" fill="white"/>
                  </g>
                </svg>
              </a>
              <a href="https://play.google.com" target="_blank" rel="noopener noreferrer"
                 className="block hover:opacity-80 transition-opacity">
                <svg width="240" height="70" viewBox="0 0 120 35" className="w-full h-auto">
                  <rect width="120" height="35" rx="6" fill="#000000"/>
                  <text x="70" y="12" textAnchor="middle" fill="white" fontSize="8" fontWeight="300">{getTranslation('Get it on')}</text>
                  <text x="70" y="25" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">{getTranslation('Google Play')}</text>
                  {/* Google Play Logo */}
                  <g transform="translate(15, 8)">
                    <defs>
                      <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#4285F4"}}/>
                        <stop offset="100%" style={{stopColor:"#286EF1"}}/>
                      </linearGradient>
                      <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#34A853"}}/>
                        <stop offset="100%" style={{stopColor:"#137333"}}/>
                      </linearGradient>
                      <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#FBBC04"}}/>
                        <stop offset="100%" style={{stopColor:"#F29900"}}/>
                      </linearGradient>
                      <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#EA4335"}}/>
                        <stop offset="100%" style={{stopColor:"#D33B2C"}}/>
                      </linearGradient>
                    </defs>
                    <path d="M2 2 L10 10 L2 18 Z" fill="url(#blueGradient)"/>
                    <path d="M10 10 L18 2 L14 2 L10 6 Z" fill="url(#yellowGradient)"/>
                    <path d="M10 10 L18 18 L14 18 L10 14 Z" fill="url(#greenGradient)"/>
                    <path d="M2 18 L10 10 L6 10 L2 14 Z" fill="url(#redGradient)"/>
                  </g>
                </svg>
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-left text-black">
              {getTranslation('© 2025 Dedw3n. All rights reserved.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}