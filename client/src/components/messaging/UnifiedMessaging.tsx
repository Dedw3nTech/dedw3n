import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingCart, 
  Users, 
  Heart, 
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { MarketplaceMessaging } from './MarketplaceMessaging';
import { CommunityMessaging } from './CommunityMessaging';
import { DatingMessaging } from './DatingMessaging';

interface UnifiedMessagingProps {
  initialTab?: 'marketplace' | 'community' | 'dating';
  embedded?: boolean;
}

export function UnifiedMessaging({ initialTab = 'marketplace', embedded = false }: UnifiedMessagingProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Fetch unread counts for all categories
  const { data: marketplaceUnread } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread/marketplace'],
    enabled: user !== null,
  });

  const { data: communityUnread } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread/community'],
    enabled: user !== null,
  });

  const { data: datingUnread } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread/dating'],
    enabled: user !== null,
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Please log in to access messaging</p>
        </div>
      </div>
    );
  }

  const totalUnread = (marketplaceUnread?.count || 0) + (communityUnread?.count || 0) + (datingUnread?.count || 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header with overview */}
      {!embedded && (
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600">Manage conversations across all services</p>
            </div>
            {totalUnread > 0 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <Badge className="bg-blue-600 text-white">
                  {totalUnread} unread
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick stats overview */}
      {!embedded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Marketplace</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">Active</p>
                    {marketplaceUnread?.count > 0 && (
                      <Badge className="bg-blue-600 text-white text-xs">
                        {marketplaceUnread.count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Community</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">Active</p>
                    {communityUnread?.count > 0 && (
                      <Badge className="bg-green-600 text-white text-xs">
                        {communityUnread.count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-pink-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">Active</p>
                    {datingUnread?.count > 0 && (
                      <Badge className="bg-pink-600 text-white text-xs">
                        {datingUnread.count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main messaging interface */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
          <div className="px-4 py-2 border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="marketplace" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Marketplace</span>
                {marketplaceUnread?.count > 0 && (
                  <Badge className="bg-blue-600 text-white text-xs ml-1">
                    {marketplaceUnread.count}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Community</span>
                {communityUnread?.count > 0 && (
                  <Badge className="bg-green-600 text-white text-xs ml-1">
                    {communityUnread.count}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="dating" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>Dating</span>
                {datingUnread?.count > 0 && (
                  <Badge className="bg-pink-600 text-white text-xs ml-1">
                    {datingUnread.count}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="marketplace" className="h-full">
              <MarketplaceMessaging embedded={true} />
            </TabsContent>
            <TabsContent value="community" className="h-full">
              <CommunityMessaging embedded={true} />
            </TabsContent>
            <TabsContent value="dating" className="h-full">
              <DatingMessaging embedded={true} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}